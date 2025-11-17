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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTrackerStore } from '@/store/useTrackerStore';
import { ChevronLeft, Save } from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { mqttConfig, settings, updateMQTTConfig, updateSettings } = useTrackerStore();
  
  const [broker, setBroker] = useState(mqttConfig.broker);
  const [port, setPort] = useState(mqttConfig.port.toString());
  const [topicRoot, setTopicRoot] = useState(mqttConfig.topicRoot);
  const [trailLength, setTrailLength] = useState(settings.trailLength.toString());
  
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
      topicRoot !== mqttConfig.topicRoot;
    
    updateMQTTConfig({ broker, port: portNum, topicRoot });
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
});