import React, { useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import TrackerMap from '@/components/TrackerMap';
import InfoPanel from '@/components/InfoPanel';
import MapControls from '@/components/MapControls';
import { useMQTTConnection } from '@/hooks/useMQTTConnection';
import { useTrackerStore } from '@/store/useTrackerStore';

export default function HomeScreen() {
  const router = useRouter();
  const { hasCompletedOnboarding } = useTrackerStore();
  useMQTTConnection();
  
  useEffect(() => {
    if (!hasCompletedOnboarding) {
      router.replace('/onboarding');
    }
  }, [hasCompletedOnboarding]);
  
  if (!hasCompletedOnboarding) {
    return null;
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TrackerMap />
        <MapControls />
        <InfoPanel />
      </View>
    </SafeAreaView>
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