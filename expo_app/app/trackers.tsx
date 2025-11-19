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
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTrackerStore, MarkerIcon, TrackedUnit } from '@/store/useTrackerStore';
import { 
  ChevronLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Dog, 
  User, 
  Car, 
  Bike, 
  MapPin, 
  Star, 
  Check,
  Save,
  X
} from 'lucide-react-native';

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

interface TrackerFormData {
  name: string;
  alias: string;
  nodeId: string;
  icon: MarkerIcon;
  color: string;
}

export default function TrackersScreen() {
  const router = useRouter();
  const { units, addUnit, updateUnit, removeUnit, toggleUnitEnabled } = useTrackerStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingUnit, setEditingUnit] = useState<TrackedUnit | null>(null);
  const [formData, setFormData] = useState<TrackerFormData>({
    name: '',
    alias: '',
    nodeId: '',
    icon: 'dog',
    color: COLOR_OPTIONS[0],
  });

  const handleAddTracker = () => {
    setFormData({
      name: '',
      alias: '',
      nodeId: '',
      icon: 'dog',
      color: COLOR_OPTIONS[0],
    });
    setIsEditing(true);
    setEditingUnit(null);
  };

  const handleEditTracker = (unit: TrackedUnit) => {
    setFormData({
      name: unit.name,
      alias: unit.alias,
      nodeId: unit.nodeId,
      icon: unit.icon,
      color: unit.color,
    });
    setIsEditing(true);
    setEditingUnit(unit);
  };

  const handleSaveTracker = () => {
    if (!formData.name.trim()) {
      Alert.alert('Required Field', 'Please enter a tracker name');
      return;
    }
    
    if (!formData.nodeId.trim()) {
      Alert.alert('Required Field', 'Please enter a node ID');
      return;
    }

    const trackerData = {
      name: formData.name.trim(),
      alias: formData.alias.trim() || formData.name.trim(),
      nodeId: formData.nodeId.trim(),
      icon: formData.icon,
      color: formData.color,
    };

    if (editingUnit) {
      updateUnit(editingUnit.id, trackerData);
    } else {
      addUnit({
        id: Date.now().toString(),
        ...trackerData,
        enabled: true,
      });
    }

    setIsEditing(false);
    setEditingUnit(null);
  };

  const handleDeleteTracker = (unit: TrackedUnit) => {
    Alert.alert(
      'Delete Tracker',
      `Are you sure you want to delete "${unit.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeUnit(unit.id),
        },
      ]
    );
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingUnit(null);
  };

  if (isEditing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancelEdit} style={styles.backButton}>
            <X size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {editingUnit ? 'Edit Tracker' : 'Add Tracker'}
          </Text>
          <TouchableOpacity onPress={handleSaveTracker} style={styles.saveButton}>
            <Save size={24} color="#3b82f6" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tracker Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="e.g., Zeke's Collar"
                autoCapitalize="words"
              />
              <Text style={styles.hint}>A friendly name for this tracker</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Short Name (optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.alias}
                onChangeText={(text) => setFormData({ ...formData, alias: text })}
                placeholder="e.g., Zeke"
                autoCapitalize="words"
              />
              <Text style={styles.hint}>Used for quick identification</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Node ID *</Text>
              <TextInput
                style={styles.input}
                value={formData.nodeId}
                onChangeText={(text) => setFormData({ ...formData, nodeId: text })}
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
                      formData.icon === option.value && styles.iconButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, icon: option.value })}
                  >
                    <option.Icon
                      size={24}
                      color={formData.icon === option.value ? '#fff' : '#6b7280'}
                    />
                    <Text
                      style={[
                        styles.iconLabel,
                        formData.icon === option.value && styles.iconLabelActive,
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
              <View style={styles.colorGrid}>
                {COLOR_OPTIONS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      formData.color === color && styles.colorButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, color })}
                  >
                    {formData.color === color && (
                      <Check size={20} color="#fff" strokeWidth={3} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trackers</Text>
        <TouchableOpacity onPress={handleAddTracker} style={styles.addButton}>
          <Plus size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {units.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Trackers</Text>
            <Text style={styles.emptySubtitle}>
              Add your first tracker to start tracking positions
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddTracker}>
              <Plus size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Add Tracker</Text>
            </TouchableOpacity>
          </View>
        ) : (
          units.map((unit) => (
            <View key={unit.id} style={styles.trackerCard}>
              <View style={styles.trackerHeader}>
                <View style={styles.trackerInfo}>
                  <View style={[styles.iconContainer, { backgroundColor: unit.color }]}>
                    {(() => {
                      const iconOption = ICON_OPTIONS.find(opt => opt.value === unit.icon);
                      return iconOption ? <iconOption.Icon size={20} color="#fff" /> : null;
                    })()}
                  </View>
                  <View style={styles.trackerDetails}>
                    <Text style={styles.trackerName}>{unit.name}</Text>
                    <Text style={styles.trackerNodeId}>{unit.nodeId}</Text>
                    {unit.alias !== unit.name && (
                      <Text style={styles.trackerAlias}>Alias: {unit.alias}</Text>
                    )}
                  </View>
                </View>
                <Switch
                  value={unit.enabled}
                  onValueChange={() => toggleUnitEnabled(unit.id)}
                  trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                  thumbColor={unit.enabled ? '#3b82f6' : '#f3f4f6'}
                />
              </View>
              
              <View style={styles.trackerActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditTracker(unit)}
                >
                  <Edit2 size={18} color="#3b82f6" />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteTracker(unit)}
                >
                  <Trash2 size={18} color="#ef4444" />
                  <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    padding: 8,
  },
  saveButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  },
  iconButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  trackerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  trackerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  trackerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  trackerDetails: {
    flex: 1,
  },
  trackerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  trackerNodeId: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  trackerAlias: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  trackerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3b82f6',
  },
});
