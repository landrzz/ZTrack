import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTrackerStore } from '@/store/useTrackerStore';
import { formatDistance, formatTimestamp } from '@/utils/format';
import { MapPin, Clock, Activity, Navigation } from 'lucide-react-native';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

export default function InfoPanel() {
  const { units } = useTrackerStore();
  
  // Get the first enabled unit
  const enabledUnit = units.find(u => u.enabled);
  const deviceId = enabledUnit?.nodeId;
  const deviceName = enabledUnit?.name || 'Tracker';
  
  // Fetch real-time position data from Convex
  const lastPosition = useQuery(
    api.positions.getLatestPosition,
    deviceId ? { deviceId } : 'skip'
  );
  
  // Connection status - consider connected if we have recent data
  const isConnected = lastPosition ? (Date.now() - lastPosition.timestamp < 300000) : false; // 5 minutes
  
  // Calculate distance traveled (we'll need to implement this if needed)
  const distanceTraveled = enabledUnit?.distanceTraveled || 0;
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MapPin size={20} color="#3b82f6" />
          <Text style={styles.deviceName}>{deviceName}</Text>
        </View>
        <View style={[styles.statusBadge, isConnected ? styles.connected : styles.disconnected]}>
          <View style={[styles.statusDot, isConnected ? styles.connectedDot : styles.disconnectedDot]} />
          <Text style={styles.statusText}>{isConnected ? 'Connected' : 'Disconnected'}</Text>
        </View>
      </View>
      
      {lastPosition ? (
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Clock size={16} color="#6b7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Last Update</Text>
              <Text style={styles.infoValue}>{formatTimestamp(lastPosition.timestamp)}</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Navigation size={16} color="#6b7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Distance</Text>
              <Text style={styles.infoValue}>{formatDistance(distanceTraveled)}</Text>
            </View>
          </View>
          
          {lastPosition.accuracy && (
            <View style={styles.infoItem}>
              <Activity size={16} color="#6b7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Accuracy</Text>
                <Text style={styles.infoValue}>PDOP: {lastPosition.accuracy.toFixed(2)}</Text>
              </View>
            </View>
          )}
          
          <View style={styles.coordinates}>
            <Text style={styles.coordLabel}>Coordinates</Text>
            <Text style={styles.coordValue}>
              {lastPosition.latitude.toFixed(6)}, {lastPosition.longitude.toFixed(6)}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingText}>Waiting for position data...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 35,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connected: {
    backgroundColor: '#dcfce7',
  },
  disconnected: {
    backgroundColor: '#fee2e2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  connectedDot: {
    backgroundColor: '#16a34a',
  },
  disconnectedDot: {
    backgroundColor: '#dc2626',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    marginTop: 2,
  },
  coordinates: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  coordLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  coordValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  waitingContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});