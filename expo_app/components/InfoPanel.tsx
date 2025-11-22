import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useTrackerStore } from '@/store/useTrackerStore';
import { formatDistance, formatTimestamp, formatAbsoluteTimestamp } from '@/utils/format';
import { MapPin, Clock, Activity, Navigation, ChevronRight } from 'lucide-react-native';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useRouter } from 'expo-router';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';

export default function InfoPanel() {
  const { units } = useTrackerStore();
  const router = useRouter();
  const [showAbsoluteTime, setShowAbsoluteTime] = useState(false);
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%', '55%', '85%'], []);

  // Get the first enabled unit
  const enabledUnit = units.find(u => u.enabled);
  const deviceId = enabledUnit?.nodeId;
  const deviceName = enabledUnit?.name || 'Tracker';

  // Fetch real-time position data from Convex
  const lastPosition = useQuery(
    api.positions.getLatestPosition,
    deviceId ? { deviceId } : 'skip'
  );
  
  // Fetch 10 most recent positions for the list
  const recentPositions = useQuery(
    api.positions.getHistory,
    deviceId ? { deviceId, limit: 10 } : 'skip'
  );

  // Connection status - consider connected if we have recent data
  // Handle both seconds and milliseconds timestamps from Convex
  const lastTimestampMs = lastPosition
    ? (lastPosition.timestamp < 10000000000
        ? lastPosition.timestamp * 1000
        : lastPosition.timestamp)
    : null;

  const isConnected = lastTimestampMs !== null
    ? (Date.now() - lastTimestampMs < 300000) // 5 minutes
    : false;

  // Calculate distance traveled (we'll need to implement this if needed)
  const distanceTraveled = enabledUnit?.distanceTraveled || 0;

  return (
    <BottomSheet
      ref={sheetRef}
      index={1}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.sheetBackground}
    >
      <View style={styles.contentContainer}>
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

        <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
          {lastPosition ? (
            <View style={styles.infoGrid}>
              <TouchableOpacity
                style={styles.infoItem}
                onPress={() => setShowAbsoluteTime(!showAbsoluteTime)}
                activeOpacity={0.7}
              >
                <Clock size={16} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Last Update</Text>
                  <Text style={styles.infoValue}>
                    {showAbsoluteTime
                      ? formatAbsoluteTimestamp(lastPosition.timestamp)
                      : formatTimestamp(lastPosition.timestamp)
                    }
                  </Text>
                </View>
              </TouchableOpacity>

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
                <View style={styles.coordHeader}>
                  <Text style={styles.coordLabel}>Recent Positions</Text>
                  <TouchableOpacity
                    style={styles.historyButton}
                    onPress={() => router.push('/position-history')}
                    activeOpacity={0.7}
                  >
                    <ChevronRight size={18} color="#3b82f6" />
                  </TouchableOpacity>
                </View>
                
                {recentPositions && recentPositions.length > 0 ? (
                  <View style={styles.positionsList}>
                    {recentPositions.map((pos, idx) => (
                      <View key={`${pos.timestamp}-${idx}`} style={styles.positionItem}>
                        <View style={styles.positionIndex}>
                          <Text style={styles.positionIndexText}>{idx + 1}</Text>
                        </View>
                        <View style={styles.positionDetails}>
                          <Text style={styles.positionCoords}>
                            {pos.latitude.toFixed(6)}, {pos.longitude.toFixed(6)}
                          </Text>
                          <Text style={styles.positionTime}>
                            {formatTimestamp(pos.timestamp)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.coordValue}>
                    {lastPosition.latitude.toFixed(6)}, {lastPosition.longitude.toFixed(6)}
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.waitingContainer}>
              <Text style={styles.waitingText}>Waiting for position data...</Text>
            </View>
          )}
        </BottomSheetScrollView>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  handle: {
    backgroundColor: '#d1d5db',
    width: 44,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
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
  scrollContent: {
    paddingBottom: 40,
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
  coordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  coordLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  historyButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
  },
  coordValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  positionsList: {
    gap: 8,
    marginTop: 8,
  },
  positionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  positionIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  positionDetails: {
    flex: 1,
  },
  positionCoords: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  positionTime: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
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