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
import { ChevronLeft, Save, Map as MapIcon, Server, ChevronRight, Dog } from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useTrackerStore();

  console.log('⚙️ Current settings on load:', settings);

  const [trailLength, setTrailLength] = useState(settings.trailLength.toString());
  const [mapStyle, setMapStyle] = useState<'standard' | 'satellite' | 'hybrid'>(settings.mapStyle);
  const [showTrail, setShowTrail] = useState(settings.showTrail);
  const [autoCenter, setAutoCenter] = useState(settings.autoCenter);
  const [historyMode, setHistoryMode] = useState<'positions' | 'time'>(settings.historyMode || 'positions');
  const [historyPositionCount, setHistoryPositionCount] = useState((settings.historyPositionCount || 50).toString());
  const [historyTimeMinutes, setHistoryTimeMinutes] = useState((settings.historyTimeMinutes || 60).toString());

  const handleSave = () => {
    const trailNum = parseInt(trailLength);
    const posCount = parseInt(historyPositionCount);
    const timeMin = parseInt(historyTimeMinutes);

    if (isNaN(trailNum) || trailNum < 5 || trailNum > 50) {
      Alert.alert('Invalid Trail Length', 'Please enter a trail length between 5 and 50');
      return;
    }

    if (isNaN(posCount) || posCount < 5 || posCount > 200) {
      Alert.alert('Invalid Position Count', 'Please enter a position count between 5 and 200');
      return;
    }

    if (isNaN(timeMin) || timeMin < 5 || timeMin > 1440) {
      Alert.alert('Invalid Time Range', 'Please enter a time range between 5 and 1440 minutes (24 hours)');
      return;
    }

    const newSettings = {
      trailLength: trailNum,
      mapStyle,
      showTrail,
      autoCenter,
      historyMode,
      historyPositionCount: posCount,
      historyTimeMinutes: timeMin,
    };

    console.log('💾 Saving settings:', newSettings);
    updateSettings(newSettings);

    Alert.alert('Settings Saved', 'Your settings have been updated.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={1}
        >
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
            activeOpacity={1}
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

          <TouchableOpacity
            style={styles.navigationButton}
            onPress={() => router.push('/trackers')}
            activeOpacity={1}
          >
            <View style={styles.navigationButtonContent}>
              <Dog size={20} color="#3b82f6" />
              <View style={styles.navigationButtonText}>
                <Text style={styles.navigationButtonTitle}>Trackers</Text>
                <Text style={styles.navigationButtonSubtitle}>Manage tracker configurations</Text>
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
              placeholder="50"
              keyboardType="number-pad"
            />
            <Text style={styles.hint}>Positions shown in map trail (5-50)</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>History Mode</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.styleButton,
                  historyMode === 'positions' && styles.styleButtonActive,
                ]}
                onPress={() => setHistoryMode('positions')}
                activeOpacity={1}
              >
                <Text
                  style={[
                    styles.styleButtonText,
                    historyMode === 'positions' && styles.styleButtonTextActive,
                  ]}
                >
                  By Count
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.styleButton,
                  historyMode === 'time' && styles.styleButtonActive,
                ]}
                onPress={() => setHistoryMode('time')}
                activeOpacity={1}
              >
                <Text
                  style={[
                    styles.styleButtonText,
                    historyMode === 'time' && styles.styleButtonTextActive,
                  ]}
                >
                  By Time
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Choose how to load position history</Text>
          </View>

          {historyMode === 'positions' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Position Count</Text>
              <TextInput
                style={styles.input}
                value={historyPositionCount}
                onChangeText={setHistoryPositionCount}
                placeholder="50"
                keyboardType="number-pad"
              />
              <Text style={styles.hint}>Positions pulled from server for list (5-200)</Text>
            </View>
          )}

          {historyMode === 'time' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Time Range (minutes)</Text>
              <TextInput
                style={styles.input}
                value={historyTimeMinutes}
                onChangeText={setHistoryTimeMinutes}
                placeholder="60"
                keyboardType="number-pad"
              />
              <Text style={styles.hint}>Load positions from last N minutes (5-1440)</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Map Style</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.styleButton,
                  mapStyle === 'standard' && styles.styleButtonActive,
                ]}
                onPress={() => setMapStyle('standard')}
                activeOpacity={1}
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
                activeOpacity={1}
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
                activeOpacity={1}
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

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={1}
        >
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
