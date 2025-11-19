import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTrackerStore } from '@/store/useTrackerStore';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { ChevronLeft, MapPin, Clock } from 'lucide-react-native';
import { formatTimestamp } from '@/utils/format';

export default function PositionHistoryScreen() {
  const router = useRouter();
  const { units, settings } = useTrackerStore();
  
  // Get the first enabled unit
  const enabledUnit = units.find(u => u.enabled);
  const deviceId = enabledUnit?.nodeId;
  
  // Fetch historical positions based on mode
  const positionsByCount = useQuery(
    api.positions.getHistory,
    deviceId && settings?.historyMode === 'positions' 
      ? { deviceId, limit: settings.historyPositionCount || 50 } 
      : 'skip'
  );
  
  const positionsByTime = useQuery(
    api.positions.getHistoryByTime,
    deviceId && settings?.historyMode === 'time'
      ? { deviceId, minutesAgo: settings.historyTimeMinutes || 60 }
      : 'skip'
  );
  
  // Use the appropriate data source based on mode
  const positionsData = settings?.historyMode === 'time' ? positionsByTime : positionsByCount;
  const positions = positionsData || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Position History</Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          {enabledUnit?.name || 'Tracker'} • {positions.length} positions
        </Text>
        <Text style={styles.infoSubtext}>
          {settings?.historyMode === 'time' 
            ? `Last ${settings.historyTimeMinutes} minutes`
            : `Last ${settings.historyPositionCount} positions`}
        </Text>
      </View>
      
      <ScrollView style={styles.content}>
        {positions.length === 0 ? (
          <View style={styles.emptyState}>
            <MapPin size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Position Data</Text>
            <Text style={styles.emptySubtitle}>
              Waiting for position updates from the tracker
            </Text>
          </View>
        ) : (
          positions.map((position, index) => (
            <View key={`${position.timestamp}-${index}`} style={styles.positionCard}>
              <View style={styles.positionHeader}>
                <View style={styles.indexBadge}>
                  <Text style={styles.indexText}>#{positions.length - index}</Text>
                </View>
                <View style={styles.positionMeta}>
                  <View style={styles.metaRow}>
                    <Clock size={14} color="#6b7280" />
                    <Text style={styles.timestampText}>
                      {formatTimestamp(position.timestamp)}
                    </Text>
                  </View>
                  <Text style={styles.absoluteTime}>
                    {new Date(position.timestamp < 10000000000 ? position.timestamp * 1000 : position.timestamp).toLocaleString()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.coordinateRow}>
                <MapPin size={16} color="#3b82f6" />
                <View style={styles.coordinateDetails}>
                  <View style={styles.coordPair}>
                    <Text style={styles.coordLabel}>Lat:</Text>
                    <Text style={styles.coordValue}>{position.latitude.toFixed(6)}</Text>
                  </View>
                  <View style={styles.coordPair}>
                    <Text style={styles.coordLabel}>Lng:</Text>
                    <Text style={styles.coordValue}>{position.longitude.toFixed(6)}</Text>
                  </View>
                </View>
              </View>
              
              {position.altitude !== undefined && (
                <View style={styles.additionalInfo}>
                  <Text style={styles.additionalLabel}>Altitude:</Text>
                  <Text style={styles.additionalValue}>{position.altitude}m</Text>
                </View>
              )}
              
              {position.accuracy !== undefined && (
                <View style={styles.additionalInfo}>
                  <Text style={styles.additionalLabel}>Accuracy:</Text>
                  <Text style={styles.additionalValue}>PDOP {position.accuracy.toFixed(2)}</Text>
                </View>
              )}
            </View>
          ))
        )}
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
  infoBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  positionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  positionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  indexBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  indexText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3b82f6',
  },
  positionMeta: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  timestampText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  absoluteTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  coordinateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  coordinateDetails: {
    flex: 1,
    gap: 6,
  },
  coordPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coordLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
    width: 30,
  },
  coordValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'monospace',
  },
  additionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  additionalLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  additionalValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
});
