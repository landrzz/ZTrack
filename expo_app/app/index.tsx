import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import TrackerMap from '@/components/TrackerMap';
import InfoPanel from '@/components/InfoPanel';
import MapControls from '@/components/MapControls';
import { useTrackerStore } from '@/store/useTrackerStore';

export default function HomeScreen() {
  const router = useRouter();
  const { hasCompletedOnboarding } = useTrackerStore();
  
  useEffect(() => {
    if (!hasCompletedOnboarding) {
      router.replace('/onboarding');
    }
  }, [hasCompletedOnboarding]);
  
  if (!hasCompletedOnboarding) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      <TrackerMap />
      <MapControls />
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