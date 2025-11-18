import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Platform, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTrackerStore } from '@/store/useTrackerStore';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

export default function TrackerMap() {
  const mapRef = useRef<MapView>(null);
  const { units, settings } = useTrackerStore();
  
  // Get the first enabled unit's nodeId to track
  const enabledUnit = units.find(u => u.enabled);
  const deviceId = enabledUnit?.nodeId;
  
  // Fetch real-time position data from Convex
  const lastPosition = useQuery(
    api.positions.getLatestPosition,
    deviceId ? { deviceId } : 'skip'
  );
  
  // Fetch historical trail (last 100 points)
  const positionsData = useQuery(
    api.positions.getHistory,
    deviceId ? { deviceId, limit: settings.trailLength || 100 } : 'skip'
  );
  
  // Convert Convex positions to the format expected by the map
  const positions = positionsData?.map(p => ({
    latitude: p.latitude,
    longitude: p.longitude,
    timestamp: p.timestamp,
  })).reverse() || []; // Reverse to get oldest first
  
  // Use Apple Maps on iOS, Google Maps on Android
  const mapProvider = Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE;
  
  useEffect(() => {
    if (lastPosition && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: lastPosition.latitude,
        longitude: lastPosition.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [lastPosition]);
  
  const mapType = settings.mapStyle === 'satellite' ? 'satellite' : 
                  settings.mapStyle === 'hybrid' ? 'hybrid' : 'standard';
  
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
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={mapProvider}
        mapType={mapType}
        initialRegion={{
          latitude: lastPosition?.latitude || 35.9132,
          longitude: lastPosition?.longitude || -79.0558,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {settings?.showTrail && positions.length > 1 && (
          <Polyline
            coordinates={positions.map(p => ({
              latitude: p.latitude,
              longitude: p.longitude,
            }))}
            strokeColor="#3b82f6"
            strokeWidth={3}
            lineCap="round"
            lineJoin="round"
          />
        )}
        
        {lastPosition && (
          <Marker
            coordinate={{
              latitude: lastPosition.latitude,
              longitude: lastPosition.longitude,
            }}
            title={enabledUnit?.name || "Tracker"}
            description={`Last updated: ${new Date(lastPosition.timestamp).toLocaleTimeString()}`}
            pinColor="#3b82f6"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});