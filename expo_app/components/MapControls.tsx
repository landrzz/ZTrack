import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Settings, Route, RotateCcw } from 'lucide-react-native';
import { useTrackerStore } from '@/store/useTrackerStore';
import { useRouter } from 'expo-router';

export default function MapControls() {
  const { units, settings, updateSettings, clearTrail } = useTrackerStore();
  const router = useRouter();
  
  // Get the first enabled unit
  const enabledUnit = units.find(u => u.enabled);
  
  const handleClearTrail = () => {
    if (enabledUnit) {
      clearTrail(enabledUnit.id);
    }
  };
  
  const handleToggleTrail = () => {
    try {
      updateSettings({ showTrail: !settings.showTrail });
    } catch (error) {
      console.error('Error toggling trail:', error);
    }
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={handleToggleTrail}
      >
        <Route size={24} color={settings.showTrail ? '#3b82f6' : '#6b7280'} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.button}
        onPress={handleClearTrail}
        disabled={!enabledUnit}
      >
        <RotateCcw size={24} color={enabledUnit ? '#6b7280' : '#d1d5db'} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/settings')}
      >
        <Settings size={24} color="#6b7280" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 16,
    gap: 12,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});