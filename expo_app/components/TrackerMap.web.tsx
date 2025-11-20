import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTrackerStore } from '@/store/useTrackerStore';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { formatTimestamp } from '@/utils/format';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function TrackerMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  const { units, settings } = useTrackerStore();

  // Get the first enabled unit's nodeId to track
  const enabledUnit = units.find(u => u.enabled);
  const deviceId = enabledUnit?.nodeId;

  // Fetch real-time position data from Convex
  const lastPosition = useQuery(
    api.positions.getLatestPosition,
    deviceId ? { deviceId } : 'skip'
  );

  // Fetch historical trail based on mode
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

  // Convert Convex positions to the format expected by Google Maps
  const allPositions = positionsData?.map(p => ({
    latitude: p.latitude,
    longitude: p.longitude,
    timestamp: p.timestamp,
  })).reverse() || [];

  useEffect(() => {
    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (mapRef.current && window.google) {
        // Initialize map
        googleMapRef.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: 35.9132, lng: -79.0558 },
          zoom: 13,
          mapTypeId: settings.mapStyle === 'satellite' ? 'satellite' :
            settings.mapStyle === 'hybrid' ? 'hybrid' : 'roadmap',
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Update map type when settings change
  useEffect(() => {
    if (googleMapRef.current) {
      const mapType = settings.mapStyle === 'satellite' ? 'satellite' :
        settings.mapStyle === 'hybrid' ? 'hybrid' : 'roadmap';
      googleMapRef.current.setMapTypeId(mapType);
    }
  }, [settings.mapStyle]);

  // Update marker and polyline
  useEffect(() => {
    if (!googleMapRef.current || !window.google) return;

    // Update marker
    if (lastPosition) {
      const position = { lat: lastPosition.latitude, lng: lastPosition.longitude };

      if (markerRef.current) {
        markerRef.current.setPosition(position);
      } else {
        markerRef.current = new window.google.maps.Marker({
          position,
          map: googleMapRef.current,
          title: enabledUnit?.name || 'Tracker',
        });
      }

      // Center map on marker
      googleMapRef.current.panTo(position);
    }

    // Update polyline (trail)
    if (settings?.showTrail && allPositions.length > 1) {
      const path = allPositions.map(p => ({ lat: p.latitude, lng: p.longitude }));

      if (polylineRef.current) {
        polylineRef.current.setPath(path);
      } else {
        polylineRef.current = new window.google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: '#3b82f6',
          strokeOpacity: 1.0,
          strokeWeight: 3,
          map: googleMapRef.current,
        });
      }
    } else if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
  }, [lastPosition, allPositions, settings?.showTrail]);

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

  return (
    <View style={styles.container}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
