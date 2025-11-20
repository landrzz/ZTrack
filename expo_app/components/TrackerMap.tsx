import React, { useMemo, useImperativeHandle, forwardRef, useState } from 'react';
import { StyleSheet, View, Platform, Text } from 'react-native';
import { AppleMaps, GoogleMaps, type CameraPosition } from 'expo-maps';
import { useTrackerStore } from '@/store/useTrackerStore';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { formatTimestamp } from '@/utils/format';

type Coordinate = {
  latitude: number;
  longitude: number;
};

export interface TrackerMapRef {
  centerOnLastPosition: () => void;
}

const TrackerMap = forwardRef<TrackerMapRef, {}>((props, ref) => {
  const { units, settings } = useTrackerStore();
  const [cameraKey, setCameraKey] = useState(0);
  
  // Get the first enabled unit's nodeId to track
  const enabledUnit = units.find(u => u.enabled);
  const deviceId = enabledUnit?.nodeId;
  
  // Fetch real-time position data from Convex
  const lastPosition = useQuery(
    api.positions.getLatestPosition,
    deviceId ? { deviceId } : 'skip'
  );
  
  // Fetch historical positions based on mode (cap at 50 for iOS stability)
  const positionsByCount = useQuery(
    api.positions.getHistory,
    deviceId && settings?.historyMode === 'positions' 
      ? { deviceId, limit: Math.min(settings.historyPositionCount || 50, 50) } 
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
  
  console.log('🔍 Trail Debug - positionsData:', {
    historyMode: settings?.historyMode,
    positionsDataLength: positionsData?.length || 0,
    showTrail: settings?.showTrail,
    deviceId: deviceId
  });
  
  // Convert Convex positions to the format expected by the map
  const positions: Coordinate[] = positionsData?.map(p => ({
    latitude: p.latitude,
    longitude: p.longitude,
  })).reverse() || []; // Reverse to get oldest first
  
  console.log('🔍 Trail Debug - mapped positions:', {
    positionsLength: positions.length,
    firstPosition: positions[0],
    lastPosition: positions[positions.length - 1]
  });
  
  // Prepare camera position - use lastPosition or first position from history
  const centerPosition = lastPosition || (positions.length > 0 ? positions[positions.length - 1] : null);
  
  const initialCamera: CameraPosition = useMemo(
    () => ({
      center: centerPosition
        ? { latitude: centerPosition.latitude, longitude: centerPosition.longitude }
        : { latitude: 35.9132, longitude: -79.0558 },
      zoom: 16,
      bearing: 0,
      tilt: 0
    }),
    [centerPosition?.latitude, centerPosition?.longitude, cameraKey]
  );
  
  // Expose method to parent component to center map
  useImperativeHandle(ref, () => ({
    centerOnLastPosition: () => {
      // Force camera to recalculate by updating key
      setCameraKey(prev => prev + 1);
    }
  }));
  
  // Show loading state if we have a deviceId but no position yet
  if (deviceId && !lastPosition) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading position data...</Text>
      </View>
    );
  }
  
  // Show message if no unit is enabled
  if (!deviceId) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>No tracker enabled. Please configure a tracker in settings.</Text>
      </View>
    );
  }
  
  // Prepare polylines and markers
  const shouldShowTrail = settings?.showTrail && positions.length > 1;
  const polylines = shouldShowTrail ? [{
    id: 'tracker-trail',
    coordinates: positions,
    color: '#3b82f6',
    ...(Platform.OS === 'ios' ? { lineWidth: 4 } : { width: 4 })
  }] : [];
  
  const markers = lastPosition ? [{
    id: 'tracker-current',
    coordinates: { latitude: lastPosition.latitude, longitude: lastPosition.longitude },
    title: enabledUnit?.name || "Tracker",
    subtitle: `Last updated: ${formatTimestamp(lastPosition.timestamp)}`
  }] : [];
  
  console.log('🔍 Trail Debug - Rendering:', {
    shouldShowTrail,
    polylineCount: polylines.length,
    coordinatesCount: positions.length,
    platform: Platform.OS
  });
  
  // iOS - Use Apple Maps
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <AppleMaps.View
          style={styles.map}
          cameraPosition={initialCamera}
          polylines={polylines}
          markers={markers}
        />
      </View>
    );
  }
  
  // Android - Use Google Maps
  if (Platform.OS === 'android') {
    return (
      <View style={styles.container}>
        <GoogleMaps.View
          style={styles.map}
          cameraPosition={initialCamera}
          polylines={polylines}
          markers={markers}
        />
      </View>
    );
  }
  
  // Web fallback - expo-maps is mobile only
  return (
    <View style={styles.webFallback}>
      <Text>Map view is only available on iOS and Android.</Text>
    </View>
  );
});

export default TrackerMap;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  webFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});