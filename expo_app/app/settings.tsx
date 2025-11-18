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
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTrackerStore } from '@/store/useTrackerStore';
import { ChevronLeft, Save, Map as MapIcon, Server, ChevronRight } from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useTrackerStore();
  
  const [trailLength, setTrailLength] = useState(settings.trailLength.toString());
  const [mapStyle, setMapStyle] = useState<'standard' | 'satellite' | 'hybrid'>(settings.mapStyle);
  const [showTrail, setShowTrail] = useState(settings.showTrail);
  const [autoCenter, setAutoCenter] = useState(settings.autoCenter);
  
  const handleSave = () => {
    const trailNum = parseInt(trailLength);
    
    if (isNaN(trailNum) || trailNum < 10 || trailNum > 1000) {
      Alert.alert('Invalid Trail Length', 'Please enter a trail length between 10 and 1000');
      return;
    }
    
    updateSettings({
      trailLength: trailNum,
      mapStyle,
      showTrail,
      autoCenter,
    });
    
    Alert.alert('Settings Saved', 'Your settings have been updated.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
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
          <Text style={styles.sectionTitle}>Server Configuration</Text>
          <Text style={styles.sectionSubtitle}>
            Manage MQTT broker connections for tracking devices
          </Text>
          
          <TouchableOpacity
            style={styles.navigationButton}
            onPress={() => router.push('/brokers')}
          >
            <View style={styles.navigationButtonContent}>
              <Server size={20} color="#3b82f6" />
              <View style={styles.navigationButtonText}>
                <Text style={styles.navigationButtonTitle}>MQTT Brokers</Text>
                <Text style={styles.navigationButtonSubtitle}>Configure broker connections</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
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
                  mapStyle === 'standard' && styles.styleButtonActive,
                ]}
                onPress={() => setMapStyle('standard')}
              >
                <Text
                  style={[
                    styles.styleButtonText,
                    mapStyle === 'standard' && styles.styleButtonTextActive,
                  ]}
                >
                  Standard
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.styleButton,
                  mapStyle === 'satellite' && styles.styleButtonActive,
                ]}
                onPress={() => setMapStyle('satellite')}
              >
                <Text
                  style={[
                    styles.styleButtonText,
                    mapStyle === 'satellite' && styles.styleButtonTextActive,
                  ]}
                >
                  Satellite
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.styleButton,
                  mapStyle === 'hybrid' && styles.styleButtonActive,
                ]}
                onPress={() => setMapStyle('hybrid')}
              >
                <Text
                  style={[
                    styles.styleButtonText,
                    mapStyle === 'hybrid' && styles.styleButtonTextActive,
                  ]}
                >
                  Hybrid
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Trail</Text>
              <Text style={styles.settingHint}>Display historical path on map</Text>
            </View>
            <Switch
              value={showTrail}
              onValueChange={setShowTrail}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={showTrail ? '#3b82f6' : '#f3f4f6'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto Center</Text>
              <Text style={styles.settingHint}>Follow tracker position on map</Text>
            </View>
            <Switch
              value={autoCenter}
              onValueChange={setAutoCenter}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={autoCenter ? '#3b82f6' : '#f3f4f6'}
            />
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
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 18,
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  settingHint: {
    fontSize: 12,
    color: '#6b7280',
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
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  navigationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  navigationButtonText: {
    flex: 1,
  },
  navigationButtonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  navigationButtonSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
});
