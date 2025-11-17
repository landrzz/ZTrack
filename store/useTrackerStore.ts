import { create } from 'zustand';

export interface Position {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

export interface MQTTConfig {
  broker: string;
  port: number;
  topicRoot: string;
}

export interface AppSettings {
  trailLength: number;
  mapStyle: 'standard' | 'satellite' | 'hybrid';
  showTrail: boolean;
}

interface TrackerState {
  positions: Position[];
  lastPosition: Position | null;
  deviceName: string;
  isConnected: boolean;
  mqttConfig: MQTTConfig;
  settings: AppSettings;
  distanceTraveled: number;
  
  addPosition: (position: Position) => void;
  setConnected: (connected: boolean) => void;
  updateMQTTConfig: (config: Partial<MQTTConfig>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  clearTrail: () => void;
  setDeviceName: (name: string) => void;
}

export const useTrackerStore = create<TrackerState>((set) => ({
  positions: [],
  lastPosition: null,
  deviceName: 'Z Tracker',
  isConnected: false,
  mqttConfig: {
    broker: 'mqtt.meshtastic.org',
    port: 1883,
    topicRoot: 'msh/US/NC/bennett/#',
  },
  settings: {
    trailLength: 100,
    mapStyle: 'standard',
    showTrail: true,
  },
  distanceTraveled: 0,
  
  addPosition: (position) => set((state) => {
    const newPositions = [...state.positions, position];
    const trimmedPositions = newPositions.slice(-state.settings.trailLength);
    
    // Calculate distance traveled
    let newDistance = state.distanceTraveled;
    if (state.lastPosition) {
      newDistance += calculateDistance(
        state.lastPosition.latitude,
        state.lastPosition.longitude,
        position.latitude,
        position.longitude
      );
    }
    
    return {
      positions: trimmedPositions,
      lastPosition: position,
      distanceTraveled: newDistance,
    };
  }),
  
  setConnected: (connected) => set({ isConnected: connected }),
  
  updateMQTTConfig: (config) => set((state) => ({
    mqttConfig: { ...state.mqttConfig, ...config },
  })),
  
  updateSettings: (settings) => set((state) => ({
    settings: { ...state.settings, ...settings },
  })),
  
  clearTrail: () => set({ positions: [], distanceTraveled: 0 }),
  
  setDeviceName: (name) => set({ deviceName: name }),
}));

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
