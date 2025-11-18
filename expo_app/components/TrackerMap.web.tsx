import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTrackerStore } from '@/store/useTrackerStore';

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
  
  // Get all positions from all enabled units
  const allPositions = units
    .filter(u => u.enabled)
    .flatMap(u => u.positions);
  
  const lastPosition = units
    .filter(u => u.enabled && u.lastPosition)
    .map(u => u.lastPosition)[0];

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
          title: 'Tracker',
        });
      }
      
      // Center map on marker
      googleMapRef.current.panTo(position);
    }

    // Update polyline (trail)
    if (settings.showTrail && allPositions.length > 1) {
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
  }, [lastPosition, allPositions, settings.showTrail]);

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
