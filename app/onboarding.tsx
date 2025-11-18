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
import { useTrackerStore, MarkerIcon } from '@/store/useTrackerStore';
import { Dog, User, Car, Bike, MapPin, Star, Plus, Trash2, Check, Wifi, Eye, EyeOff } from 'lucide-react-native';
import { Buffer } from 'buffer';

// Polyfill Buffer for mqtt.js
global.Buffer = Buffer;

// Import mqtt - handle both default and named exports
const mqttModule = require('mqtt');
const mqtt = mqttModule.default || mqttModule;

const ICON_OPTIONS: { value: MarkerIcon; label: string; Icon: any }[] = [
  { value: 'dog', label: 'Dog', Icon: Dog },
  { value: 'person', label: 'Person', Icon: User },
  { value: 'car', label: 'Car', Icon: Car },
  { value: 'bike', label: 'Bike', Icon: Bike },
  { value: 'pin', label: 'Pin', Icon: MapPin },
  { value: 'star', label: 'Star', Icon: Star },
];

const COLOR_OPTIONS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { mqttConfig, updateMQTTConfig, addUnit, completeOnboarding } = useTrackerStore();
  
  const [step, setStep] = useState(1);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showPassword, setShowPassword] = useState(false);
  
  // MQTT Config
  const [broker, setBroker] = useState(mqttConfig.broker);
  const [port, setPort] = useState(mqttConfig.port.toString());
  const [topicRoot, setTopicRoot] = useState(mqttConfig.topicRoot);
  const [username, setUsername] = useState(mqttConfig.username || '');
  const [password, setPassword] = useState(mqttConfig.password || '');
  
  // Unit Config
  const [unitName, setUnitName] = useState('');
  const [unitAlias, setUnitAlias] = useState('');
  const [unitNodeId, setUnitNodeId] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<MarkerIcon>('dog');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  
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
      const protocol = portNum === 8083 ? 'ws' : 'wss';
      const url = `${protocol}://${broker}:${portNum}/mqtt`;
      
      const client = mqtt.connect(url, {
        clientId: 'test-' + Math.random().toString(16).slice(2),
        username: username.trim() || undefined,
        password: password.trim() || undefined,
        connectTimeout: 10000,
        reconnectPeriod: 0, // Don't auto-reconnect for test
      });
      
      const timeout = setTimeout(() => {
        client.end(true);
        setIsTestingConnection(false);
        setConnectionStatus('error');
        Alert.alert('Connection Timeout', 'Could not connect to the MQTT broker. Please check your settings.');
      }, 10000);
      
      client.on('connect', () => {
        clearTimeout(timeout);
        setIsTestingConnection(false);
        setConnectionStatus('success');
        Alert.alert('Success!', 'Successfully connected to the MQTT broker.');
        client.end(true);
      });
      
      client.on('error', (error: Error) => {
        clearTimeout(timeout);
        setIsTestingConnection(false);
        setConnectionStatus('error');
        Alert.alert('Connection Error', `Failed to connect: ${error.message}`);
        client.end(true);
      });
    } catch (error) {
      setIsTestingConnection(false);
      setConnectionStatus('error');
      Alert.alert('Error', 'An unexpected error occurred while testing the connection.');
    }
  };
  
  const handleMQTTNext = () => {
    const portNum = parseInt(port);
    
    if (!broker.trim()) {
      Alert.alert('Required Field', 'Please enter a broker address');
      return;
    }
    
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      Alert.alert('Invalid Port', 'Please enter a valid port number (1-65535)');
      return;
    }
    
    if (!topicRoot.trim()) {
      Alert.alert('Required Field', 'Please enter a topic root');
      return;
    }
    
    updateMQTTConfig({ 
      broker, 
      port: portNum, 
      topicRoot,
      username: username.trim() || undefined,
      password: password.trim() || undefined,
    });
    
    setStep(2);
  };
  
  const handleUnitComplete = () => {
    if (!unitName.trim()) {
      Alert.alert('Required Field', 'Please enter a unit name');
      return;
    }
    
    if (!unitAlias.trim()) {
      Alert.alert('Required Field', 'Please enter a unit alias');
      return;
    }
    
    if (!unitNodeId.trim()) {
      Alert.alert('Required Field', 'Please enter a node ID');
      return;
    }
    
    addUnit({
      id: Date.now().toString(),
      name: unitName.trim(),
      alias: unitAlias.trim(),
      nodeId: unitNodeId.trim(),
      icon: selectedIcon,
      color: selectedColor,
      enabled: true,
    });
    
    completeOnboarding();
    router.replace('/');
  };
  
  if (step === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to LoRa Tracker</Text>
            <Text style={styles.subtitle}>Let's set up your MQTT connection</Text>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>MQTT Broker Configuration</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Broker Address *</Text>
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
              <Text style={styles.label}>Port *</Text>
              <TextInput
                style={styles.input}
                value={port}
                onChangeText={setPort}
                placeholder="1883"
                keyboardType="number-pad"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Topic Root *</Text>
              <TextInput
                style={styles.input}
                value={topicRoot}
                onChangeText={setTopicRoot}
                placeholder="msh/US/2/json/#"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.hint}>
                Example: msh/US/2/json/!Z001NODEID/# or msh/US/2/json/#
              </Text>
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
          
          <TouchableOpacity style={styles.primaryButton} onPress={handleMQTTNext}>
            <Text style={styles.primaryButtonText}>Next</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Your First Tracker</Text>
          <Text style={styles.subtitle}>Configure the device you want to track</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tracker Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Device Name *</Text>
            <TextInput
              style={styles.input}
              value={unitName}
              onChangeText={setUnitName}
              placeholder="e.g., Z Tracker"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Alias *</Text>
            <TextInput
              style={styles.input}
              value={unitAlias}
              onChangeText={setUnitAlias}
              placeholder="e.g., Max's Collar"
            />
            <Text style={styles.hint}>This name will appear on the map</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Node ID *</Text>
            <TextInput
              style={styles.input}
              value={unitNodeId}
              onChangeText={setUnitNodeId}
              placeholder="e.g., !Z001NODEID"
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Text style={styles.hint}>The Meshtastic node ID for this device</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Map Icon</Text>
            <View style={styles.iconGrid}>
              {ICON_OPTIONS.map(({ value, label, Icon }) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.iconOption,
                    selectedIcon === value && styles.iconOptionActive,
                  ]}
                  onPress={() => setSelectedIcon(value)}
                >
                  <Icon 
                    size={24} 
                    color={selectedIcon === value ? '#fff' : '#6b7280'} 
                  />
                  <Text
                    style={[
                      styles.iconLabel,
                      selectedIcon === value && styles.iconLabelActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Trail Color</Text>
            <View style={styles.colorGrid}>
              {COLOR_OPTIONS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorOption, { backgroundColor: color }]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <Check size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => setStep(1)}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.primaryButton, styles.flexButton]} 
            onPress={handleUnitComplete}
          >
            <Text style={styles.primaryButtonText}>Complete Setup</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
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
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconOption: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  iconOptionActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  iconLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 4,
  },
  iconLabelActive: {
    color: '#fff',
  },
  colorGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  flexButton: {
    flex: 2,
  },
  testButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  eyeButton: {
    padding: 12,
  },
});
