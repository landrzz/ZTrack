import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTrackerStore } from '@/store/useTrackerStore';
import { ChevronLeft, Save, Wifi, Eye, EyeOff } from 'lucide-react-native';
import { Buffer } from 'buffer';

// Polyfill Buffer for mqtt.js
global.Buffer = Buffer;

// Import mqtt - handle both default and named exports
const mqttModule = require('mqtt');
const mqtt = mqttModule.default || mqttModule;

export default function SettingsScreen() {
  const router = useRouter();
  const { mqttConfig, settings, updateMQTTConfig, updateSettings } = useTrackerStore();
  
  const [broker, setBroker] = useState(mqttConfig.broker);
  const [port, setPort] = useState(mqttConfig.port.toString());
  const [topicRoot, setTopicRoot] = useState(mqttConfig.topicRoot);
  const [username, setUsername] = useState(mqttConfig.username || '');
  const [password, setPassword] = useState(mqttConfig.password || '');
  const [trailLength, setTrailLength] = useState(settings.trailLength.toString());
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showPassword, setShowPassword] = useState(false);
  
  const testConnection = async () => {
    const portNum = parseInt(port);
    
    if (!broker.trim()) {
      Alert.alert('Required Field', 'Please enter a broker address');
      return;
    }
    
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      Alert.alert('Invalid Port', 'Please enter a valid port number (1-65535)');
      return;
    }
    
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    
    try {
      // Determine protocol based on port
      let url: string;
      if (portNum === 8083) {
        url = `ws://${broker}:${portNum}/mqtt`;
      } else if (portNum === 8084) {
        url = `wss://${broker}:${portNum}/mqtt`;
      } else if (portNum === 8883) {
        url = `mqtts://${broker}:${portNum}`;
      } else {
        url = `mqtt://${broker}:${portNum}`;
      }
      
      const client = mqtt.connect(url, {
        clientId: 'test-' + Math.random().toString(16).slice(2),
        username: username.trim() || undefined,
        password: password.trim() || undefined,
        connectTimeout: 10000,
        reconnectPeriod: 0,
      });
      
      const timeout = setTimeout(() => {
        client.end(true);
        setIsTestingConnection(false);
        setConnectionStatus('error');
        console.log('❌ Connection timeout');
      }, 10000);
      
      client.on('connect', () => {
        clearTimeout(timeout);
        setIsTestingConnection(false);
        setConnectionStatus('success');
        console.log('✅ Test connection successful');
        client.end(true);
      });
      
      client.on('error', (error: Error) => {
        clearTimeout(timeout);
        setIsTestingConnection(false);
        setConnectionStatus('error');
        console.log('❌ Test connection error:', error.message);
        client.end(true);
      });
    } catch (error) {
      setIsTestingConnection(false);
      setConnectionStatus('error');
      console.log('❌ Test connection exception:', error);
    }
  };
  
  const handleSave = () => {
    const portNum = parseInt(port);
    const trailNum = parseInt(trailLength);
    
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      Alert.alert('Invalid Port', 'Please enter a valid port number (1-65535)');
      return;
    }
    
    if (isNaN(trailNum) || trailNum < 10 || trailNum > 1000) {
      Alert.alert('Invalid Trail Length', 'Please enter a trail length between 10 and 1000');
      return;
    }
    
    const configChanged = 
      broker !== mqttConfig.broker ||
      portNum !== mqttConfig.port ||
      topicRoot !== mqttConfig.topicRoot ||
      username !== (mqttConfig.username || '') ||
      password !== (mqttConfig.password || '');
    
    updateMQTTConfig({ 
      broker, 
      port: portNum, 
      topicRoot,
      username: username.trim() || undefined,
      password: password.trim() || undefined,
    });
    updateSettings({ trailLength: trailNum });
    
    if (configChanged) {
      Alert.alert(
        'Settings Saved',
        'MQTT configuration changed. The connection will be restarted.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      Alert.alert('Settings Saved', 'Your settings have been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MQTT Configuration</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Broker Address</Text>
            <TextInput
              style={styles.input}
              value={broker}
              onChangeText={setBroker}
              placeholder="mqtt.meshtastic.org"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Port</Text>
            <TextInput
              style={styles.input}
              value={port}
              onChangeText={setPort}
              placeholder="1883"
              keyboardType="number-pad"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Topic Root</Text>
            <TextInput
              style={styles.input}
              value={topicRoot}
              onChangeText={setTopicRoot}
              placeholder="msh/US/NC/bennett/#"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>Use # as wildcard for all subtopics</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username (optional)</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Leave empty if not required"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password (optional)</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Leave empty if not required"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#6b7280" />
                ) : (
                  <Eye size={20} color="#6b7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.testButton,
              connectionStatus === 'success' && styles.testButtonSuccess,
              connectionStatus === 'error' && styles.testButtonError,
            ]} 
            onPress={testConnection}
            disabled={isTestingConnection}
          >
            {isTestingConnection ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Wifi size={20} color="#fff" />
                <Text style={styles.testButtonText}>
                  {connectionStatus === 'success' ? 'Connection Successful!' :
                   connectionStatus === 'error' ? 'Connection Failed - Retry' :
                   'Test Connection'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Map Settings</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Trail Length (positions)</Text>
            <TextInput
              style={styles.input}
              value={trailLength}
              onChangeText={setTrailLength}
              placeholder="100"
              keyboardType="number-pad"
            />
            <Text style={styles.hint}>Number of positions to keep in trail (10-1000)</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Map Style</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.styleButton,
                  settings.mapStyle === 'standard' && styles.styleButtonActive,
                ]}
                onPress={() => updateSettings({ mapStyle: 'standard' })}
              >
                <Text
                  style={[
                    styles.styleButtonText,
                    settings.mapStyle === 'standard' && styles.styleButtonTextActive,
                  ]}
                >
                  Standard
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.styleButton,
                  settings.mapStyle === 'satellite' && styles.styleButtonActive,
                ]}
                onPress={() => updateSettings({ mapStyle: 'satellite' })}
              >
                <Text
                  style={[
                    styles.styleButtonText,
                    settings.mapStyle === 'satellite' && styles.styleButtonTextActive,
                  ]}
                >
                  Satellite
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.styleButton,
                  settings.mapStyle === 'hybrid' && styles.styleButtonActive,
                ]}
                onPress={() => updateSettings({ mapStyle: 'hybrid' })}
              >
                <Text
                  style={[
                    styles.styleButtonText,
                    settings.mapStyle === 'hybrid' && styles.styleButtonTextActive,
                  ]}
                >
                  Hybrid
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Save size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  styleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  styleButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  styleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  styleButtonTextActive: {
    color: '#fff',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  testButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  testButtonSuccess: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  testButtonError: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  eyeButton: {
    padding: 10,
  },
});