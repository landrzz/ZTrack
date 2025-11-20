import React, { useMemo, useImperativeHandle, forwardRef, useState, useEffect, useRef } from 'react';
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

// Helper functions to convert settings string values to expo-maps enum string values
// Apple Maps uses: STANDARD, HYBRID, IMAGERY
// Google Maps uses: NORMAL, HYBRID, SATELLITE
const getAppleMapType = (mapStyle?: 'standard' | 'satellite' | 'hybrid'): 'STANDARD' | 'HYBRID' | 'IMAGERY' => {
  switch (mapStyle) {
    case 'hybrid':
      return 'HYBRID';
    case 'satellite':
      return 'IMAGERY'; // Apple uses IMAGERY for satellite view
    case 'standard':
    default:
      return 'STANDARD';
  }
};

const getGoogleMapType = (mapStyle?: 'standard' | 'satellite' | 'hybrid'): 'NORMAL' | 'HYBRID' | 'SATELLITE' => {
  switch (mapStyle) {
    case 'hybrid':
      return 'HYBRID';
    case 'satellite':
      return 'SATELLITE';
    case 'standard':
    default:
      return 'NORMAL'; // Google uses NORMAL for standard view
  }
};

const TrackerMap = forwardRef<TrackerMapRef, {}>((props, ref) => {
  const { units, settings } = useTrackerStore();
  const [cameraKey, setCameraKey] = useState(0);
  const hasInitiallycentered = useRef(false);

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

  // Fallback query when historyMode is undefined - get recent positions for centering
  const fallbackPositions = useQuery(
    api.positions.getHistory,
    deviceId && !settings?.historyMode
      ? { deviceId, limit: 10 }
      : 'skip'
  );

  // Use the appropriate data source based on mode
  const positionsData = settings?.historyMode === 'time'
    ? positionsByTime
    : (settings?.historyMode === 'positions' ? positionsByCount : fallbackPositions);

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
    lastPosition: positions[positions.length - 1],
    allPositions: positions.slice(0, 3) // Show first 3 for debugging
  });

  // Prepare camera position - use lastPosition or first position from history
  const centerPosition = lastPosition || (positions.length > 0 ? positions[positions.length - 1] : null);

  console.log('🗺️ Camera Debug:', {
    hasLastPosition: !!lastPosition,
    lastPosition: lastPosition ? { lat: lastPosition.latitude, lng: lastPosition.longitude } : null,
    centerPosition: centerPosition ? { lat: centerPosition.latitude, lng: centerPosition.longitude } : null,
    cameraKey,
    hasInitiallyCentered: hasInitiallycentered.current
  });

  const initialCamera: CameraPosition = useMemo(
    () => {
      const camera = {
        coordinates: centerPosition
          ? { latitude: centerPosition.latitude, longitude: centerPosition.longitude }
          : { latitude: 35.9132, longitude: -79.0558 },
        zoom: 16,
        heading: 0,
        pitch: 0
      };
      console.log('📍 Initial Camera:', camera);
      return camera;
    },
    [centerPosition?.latitude, centerPosition?.longitude, cameraKey]
  );

  // Expose method to parent component to center map
  useImperativeHandle(ref, () => ({
    centerOnLastPosition: () => {
      // Force camera to recalculate by updating key
      setCameraKey(prev => prev + 1);
    }
  }));

  // Auto-center when we first get a position
  useEffect(() => {
    if (lastPosition && !hasInitiallycentered.current) {
      hasInitiallycentered.current = true;
      setCameraKey(prev => prev + 1);
    }
  }, [lastPosition]);

  // Force re-render when map style changes
  useEffect(() => {
    console.log('🗺️ Map style changed to:', settings?.mapStyle);
    setCameraKey(prev => prev + 1);
  }, [settings?.mapStyle]);

  // Show message if no unit is enabled
  if (!deviceId) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>No tracker enabled. Please configure a tracker in settings.</Text>
      </View>
    );
  }

  // Prepare polylines and markers
  // Use only the last N positions for the trail based on trailLength setting
  const trailLength = settings?.trailLength || 50;
  const trailPositions = positions.slice(-trailLength); // Get last N positions

  const shouldShowTrail = settings?.showTrail && trailPositions.length > 1;
  const polylines = shouldShowTrail ? [{
    id: 'tracker-trail',
    coordinates: trailPositions,
    color: '#3b82f6',
    ...(Platform.OS === 'ios' ? { lineWidth: 4 } : { width: 4 })
  }] : [];

  console.log('🔍 Trail Debug - Trail rendering:', {
    totalPositions: positions.length,
    trailLengthSetting: trailLength,
    trailPositionsUsed: trailPositions.length,
    shouldShowTrail
  });

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

  console.log('🗺️ RENDERING MAP with:', {
    cameraKey,
    cameraCoordinates: initialCamera.coordinates,
    cameraZoom: initialCamera.zoom,
    hasMarkers: markers.length > 0,
    markerCoords: markers[0]?.coordinates,
    mapStyle: settings?.mapStyle
  });

  // iOS - Use Apple Maps
  if (Platform.OS === 'ios') {
    const mapTypeValue = getAppleMapType(settings?.mapStyle);
    console.log('🍎 iOS Map - Using mapType:', mapTypeValue, 'from setting:', settings?.mapStyle);
    const AppleMapsComponent = AppleMaps.View as any;
    return (
      <View style={styles.container}>
        <AppleMapsComponent
          key={cameraKey}
          style={styles.map}
          mapType={mapTypeValue}
          cameraPosition={initialCamera}
          polylines={polylines}
          markers={markers}
        />
      </View>
    );
  }

  // Android - Use Google Maps
  if (Platform.OS === 'android') {
    const mapTypeValue = getGoogleMapType(settings?.mapStyle);
    console.log('🤖 Android Map - Using mapType:', mapTypeValue, 'from setting:', settings?.mapStyle);
    const GoogleMapsComponent = GoogleMaps.View as any;
    return (
      <View style={styles.container}>
        <GoogleMapsComponent
          key={cameraKey}
          style={styles.map}
          mapType={mapTypeValue}
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