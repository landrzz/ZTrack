import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Platform, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTrackerStore } from '@/store/useTrackerStore';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { formatTimestamp } from '@/utils/format';

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
  const positions = positionsData?.map(p => ({
    latitude: p.latitude,
    longitude: p.longitude,
    timestamp: p.timestamp,
  })).reverse() || []; // Reverse to get oldest first
  
  console.log('🔍 Trail Debug - mapped positions:', {
    positionsLength: positions.length,
    firstPosition: positions[0],
    lastPosition: positions[positions.length - 1]
  });
  
  // Use Google Maps on both iOS and Android for better Polyline support
  const mapProvider = PROVIDER_GOOGLE;
  
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
        {(() => {
          try {
            const shouldRender = settings?.showTrail && positions.length > 1;
            const coordinates = shouldRender ? positions.map(p => ({
              latitude: p.latitude,
              longitude: p.longitude,
            })) : [];
            
            console.log('🔍 Trail Debug - Polyline render check:', {
              shouldRender,
              showTrail: settings?.showTrail,
              positionsLength: positions.length,
              coordinatesCount: coordinates.length,
              platform: Platform.OS
            });
            
            if (!shouldRender) return null;
            
            // iOS Polyline is crashing - temporarily disable
            if (Platform.OS === 'ios') {
              console.log('🔍 iOS Trail - Polyline disabled on iOS due to crashes');
              console.log('🔍 iOS Trail - Would render', coordinates.length, 'points');
              // TODO: Fix iOS Polyline rendering issue
              return null;
            } else {
              return (
                <Polyline
                  coordinates={coordinates}
                  strokeColor="#3b82f6"
                  strokeWidth={3}
                />
              );
            }
          } catch (error) {
            console.error('🔍 Trail Debug - Polyline crash:', error);
            return null;
          }
        })()}
        
        {lastPosition && (
          <Marker
            coordinate={{
              latitude: lastPosition.latitude,
              longitude: lastPosition.longitude,
            }}
            title={enabledUnit?.name || "Tracker"}
            description={`Last updated: ${formatTimestamp(lastPosition.timestamp)}`}
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