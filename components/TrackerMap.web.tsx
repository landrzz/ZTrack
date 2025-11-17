import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTrackerStore } from '@/store/useTrackerStore';

export default function TrackerMap() {
  const { lastPosition } = useTrackerStore();
  
  return (
    <View style={styles.container}>
      <View style={styles.webFallback}>
        <Text style={styles.webFallbackText}>
          📱 Map view is only available on mobile devices
        </Text>
        {lastPosition && (
          <View style={styles.webInfo}>
            <Text style={styles.webInfoText}>
              Current Position:
            </Text>
            <Text style={styles.webCoords}>
              {lastPosition.latitude.toFixed(6)}, {lastPosition.longitude.toFixed(6)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 20,
  },
  webFallbackText: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  webInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  webInfoText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  webCoords: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'monospace',
  },
});
