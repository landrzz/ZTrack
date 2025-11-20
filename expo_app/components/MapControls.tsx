import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Settings, Route, RotateCcw } from 'lucide-react-native';
import { useTrackerStore } from '@/store/useTrackerStore';
import { useRouter } from 'expo-router';

interface MapControlsProps {
  onCenterMap?: () => void;
}

export default function MapControls({ onCenterMap }: MapControlsProps) {
  const { units, settings, updateSettings, clearTrail } = useTrackerStore();
  const router = useRouter();
  
  // Get the first enabled unit
  const enabledUnit = units.find(u => u.enabled);
  
  const handleRefresh = () => {
    // Clear trail if unit exists (optional - won't block centering)
    if (enabledUnit) {
      clearTrail(enabledUnit.id);
    }
    // Always center map on last position, regardless of refresh success
    if (onCenterMap) {
      // Small delay to ensure trail is cleared first if it was cleared
      setTimeout(() => {
        onCenterMap();
      }, 100);
    }
  };
  
  const handleToggleTrail = () => {
    try {
      const newShowTrail = !settings.showTrail;
      console.log('🔍 Trail Toggle - Before:', settings.showTrail, 'After:', newShowTrail);
      updateSettings({ showTrail: newShowTrail });
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
        onPress={handleRefresh}
      >
        <RotateCcw size={24} color="#6b7280" />
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
    left: 16,
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