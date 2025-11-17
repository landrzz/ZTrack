import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Settings, Route, RotateCcw } from 'lucide-react-native';
import { useTrackerStore } from '@/store/useTrackerStore';
import { useRouter } from 'expo-router';

export default function MapControls() {
  const { settings, updateSettings, clearTrail } = useTrackerStore();
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => updateSettings({ showTrail: !settings.showTrail })}
      >
        <Route size={24} color={settings.showTrail ? '#3b82f6' : '#6b7280'} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.button}
        onPress={clearTrail}
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