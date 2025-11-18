import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Position {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

// MQTT configuration is now handled server-side in sync_service

export type MarkerIcon = 'dog' | 'person' | 'car' | 'bike' | 'pin' | 'star';

export interface TrackedUnit {
  id: string;
  name: string;
  alias: string;
  icon: MarkerIcon;
  nodeId: string; // The specific node ID to track (e.g., !Z001NODEID)
  positions: Position[];
  lastPosition: Position | null;
  distanceTraveled: number;
  color: string;
  enabled: boolean;
}

export interface AppSettings {
  trailLength: number;
  mapStyle: 'standard' | 'satellite' | 'hybrid';
  showTrail: boolean;
  autoCenter: boolean;
}

interface TrackerState {
  units: TrackedUnit[];
  settings: AppSettings;
  hasCompletedOnboarding: boolean;
  
  addPosition: (unitId: string, position: Position) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  clearTrail: (unitId: string) => void;
  addUnit: (unit: Omit<TrackedUnit, 'positions' | 'lastPosition' | 'distanceTraveled'>) => void;
  updateUnit: (unitId: string, updates: Partial<TrackedUnit>) => void;
  removeUnit: (unitId: string) => void;
  toggleUnitEnabled: (unitId: string) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set) => ({
      units: [],
      settings: {
        trailLength: 100,
        mapStyle: 'standard',
        showTrail: true,
        autoCenter: true,
      },
      hasCompletedOnboarding: false,
      
      addPosition: (unitId, position) => set((state) => {
        const unitIndex = state.units.findIndex(u => u.id === unitId);
        if (unitIndex === -1) return state;
        
        const unit = state.units[unitIndex];
        const newPositions = [...unit.positions, position];
        const trimmedPositions = newPositions.slice(-state.settings.trailLength);
        
        let newDistance = unit.distanceTraveled;
        if (unit.lastPosition) {
          newDistance += calculateDistance(
            unit.lastPosition.latitude,
            unit.lastPosition.longitude,
            position.latitude,
            position.longitude
          );
        }
        
        const updatedUnits = [...state.units];
        updatedUnits[unitIndex] = {
          ...unit,
          positions: trimmedPositions,
          lastPosition: position,
          distanceTraveled: newDistance,
        };
        
        return { units: updatedUnits };
      }),
      
      updateSettings: (settings) => set((state) => ({
        settings: { ...state.settings, ...settings },
      })),
      
      clearTrail: (unitId) => set((state) => {
        const unitIndex = state.units.findIndex(u => u.id === unitId);
        if (unitIndex === -1) return state;
        
        const updatedUnits = [...state.units];
        updatedUnits[unitIndex] = {
          ...updatedUnits[unitIndex],
          positions: [],
          distanceTraveled: 0,
        };
        
        return { units: updatedUnits };
      }),
      
      addUnit: (unit) => set((state) => ({
        units: [
          ...state.units,
          {
            ...unit,
            positions: [],
            lastPosition: null,
            distanceTraveled: 0,
          },
        ],
      })),
      
      updateUnit: (unitId, updates) => set((state) => ({
        units: state.units.map(u => 
          u.id === unitId ? { ...u, ...updates } : u
        ),
      })),
      
      removeUnit: (unitId) => set((state) => ({
        units: state.units.filter(u => u.id !== unitId),
      })),
      
      toggleUnitEnabled: (unitId) => set((state) => ({
        units: state.units.map(u =>
          u.id === unitId ? { ...u, enabled: !u.enabled } : u
        ),
      })),
      
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      
      resetOnboarding: () => set({ hasCompletedOnboarding: false }),
    }),
    {
      name: 'tracker-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

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