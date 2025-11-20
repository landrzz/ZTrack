import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import TrackerMap, { TrackerMapRef } from '@/components/TrackerMap';
import InfoPanel from '@/components/InfoPanel';
import MapControls from '@/components/MapControls';
import { useTrackerStore } from '@/store/useTrackerStore';

export default function HomeScreen() {
  const router = useRouter();
  const { hasCompletedOnboarding } = useTrackerStore();
  const mapRef = useRef<TrackerMapRef>(null);
  
  useEffect(() => {
    if (!hasCompletedOnboarding) {
      router.replace('/onboarding');
    }
  }, [hasCompletedOnboarding]);
  
  if (!hasCompletedOnboarding) {
    return null;
  }
  
  const handleCenterMap = () => {
    mapRef.current?.centerOnLastPosition();
  };
  
  return (
    <View style={styles.container}>
      <TrackerMap ref={mapRef} />
      <MapControls onCenterMap={handleCenterMap} />
      <InfoPanel />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    flex: 1,
    position: 'relative',
  },
});