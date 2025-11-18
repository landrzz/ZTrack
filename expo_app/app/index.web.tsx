import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import TrackerMap from '@/components/TrackerMap';
import InfoPanel from '@/components/InfoPanel';
import MapControls from '@/components/MapControls';

export default function HomeScreen() {
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
