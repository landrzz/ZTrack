import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTrackerStore } from '@/store/useTrackerStore';

export default function TrackerMap() {
  const mapRef = useRef<MapView>(null);
  const { positions, lastPosition, settings } = useTrackerStore();
  
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
  
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={mapProvider}
        mapType={mapType}
        initialRegion={{
          latitude: 35.9132,
          longitude: -79.0558,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {settings.showTrail && positions.length > 1 && (
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
            title="Z Tracker"
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