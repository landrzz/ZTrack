import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTrackerStore, MarkerIcon } from '@/store/useTrackerStore';
import { Dog, User, Car, Bike, MapPin, Star, Check } from 'lucide-react-native';

const ICON_OPTIONS: { value: MarkerIcon; label: string; Icon: any }[] = [
  { value: 'dog', label: 'Dog', Icon: Dog },
  { value: 'person', label: 'Person', Icon: User },
  { value: 'car', label: 'Car', Icon: Car },
  { value: 'bike', label: 'Bike', Icon: Bike },
  { value: 'pin', label: 'Pin', Icon: MapPin },
  { value: 'star', label: 'Star', Icon: Star },
];

const COLOR_OPTIONS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { addUnit, completeOnboarding } = useTrackerStore();
  
  const [unitName, setUnitName] = useState('');
  const [unitAlias, setUnitAlias] = useState('');
  const [unitNodeId, setUnitNodeId] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<MarkerIcon>('dog');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  
  const handleComplete = () => {
    if (!unitName.trim()) {
      Alert.alert('Required Field', 'Please enter a tracker name');
      return;
    }
    
    if (!unitNodeId.trim()) {
      Alert.alert('Required Field', 'Please enter a node ID');
      return;
    }
    
    // Add the first unit
    addUnit({
      id: Date.now().toString(),
      name: unitName.trim(),
      alias: unitAlias.trim() || unitName.trim(),
      icon: selectedIcon,
      nodeId: unitNodeId.trim(),
      color: selectedColor,
      enabled: true,
    });
    
    completeOnboarding();
    router.replace('/');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to ZTrack</Text>
          <Text style={styles.subtitle}>Let's set up your first tracker</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tracker Configuration</Text>
          <Text style={styles.cardDescription}>
            MQTT broker configuration is managed server-side. Make sure your sync_service is running and configured.
          </Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tracker Name *</Text>
            <TextInput
              style={styles.input}
              value={unitName}
              onChangeText={setUnitName}
              placeholder="e.g., Zeke's Collar"
              autoCapitalize="words"
            />
            <Text style={styles.hint}>A friendly name for this tracker</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Short Name (optional)</Text>
            <TextInput
              style={styles.input}
              value={unitAlias}
              onChangeText={setUnitAlias}
              placeholder="e.g., Zeke"
              autoCapitalize="words"
            />
            <Text style={styles.hint}>Used for quick identification</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Node ID *</Text>
            <TextInput
              style={styles.input}
              value={unitNodeId}
              onChangeText={setUnitNodeId}
              placeholder="e.g., !9e75c710"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>The Meshtastic node ID to track (found in device settings)</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Icon</Text>
            <View style={styles.iconGrid}>
              {ICON_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.iconButton,
                    selectedIcon === option.value && styles.iconButtonActive,
                  ]}
                  onPress={() => setSelectedIcon(option.value)}
                >
                  <option.Icon
                    size={24}
                    color={selectedIcon === option.value ? '#fff' : '#6b7280'}
                  />
                  <Text
                    style={[
                      styles.iconLabel,
                      selectedIcon === option.value && styles.iconLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Color</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.colorScrollContainer}
            >
              <View style={styles.colorGrid}>
                {COLOR_OPTIONS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorButtonActive,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <Check size={20} color="#fff" strokeWidth={3} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
        
        <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
          <Text style={styles.completeButtonText}>Complete Setup</Text>
        </TouchableOpacity>
        
        <Text style={styles.footerNote}>
          You can add more trackers and change settings later
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconButton: {
    width: 80,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  iconLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  iconLabelActive: {
    color: '#fff',
  },
  colorGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  colorScrollContainer: {
    paddingRight: 20,
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonActive: {
    borderColor: '#111827',
    borderWidth: 3,
  },
  completeButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 16,
  },
});
