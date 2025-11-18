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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import { ChevronLeft, Plus, Trash2, Edit3, Server, Eye, EyeOff, Save, X } from 'lucide-react-native';

export default function BrokersScreen() {
  const router = useRouter();
  const brokers = useQuery(api.brokers.listBrokers);
  const [editingBroker, setEditingBroker] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const handleAddBroker = () => {
    setEditingBroker(null);
    setShowForm(true);
  };

  const handleEditBroker = (broker: any) => {
    setEditingBroker(broker);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBroker(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MQTT Brokers</Text>
        <TouchableOpacity onPress={handleAddBroker} style={styles.addButton}>
          <Plus size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {!brokers || brokers.length === 0 ? (
          <View style={styles.emptyState}>
            <Server size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No Brokers Configured</Text>
            <Text style={styles.emptyDescription}>
              Add an MQTT broker to start tracking devices
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddBroker}>
              <Plus size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Add First Broker</Text>
            </TouchableOpacity>
          </View>
        ) : (
          brokers.map((broker) => (
            <BrokerCard
              key={broker._id}
              broker={broker}
              onEdit={() => handleEditBroker(broker)}
            />
          ))
        )}
      </ScrollView>

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseForm}
      >
        <BrokerForm
          broker={editingBroker}
          onClose={handleCloseForm}
        />
      </Modal>
    </SafeAreaView>
  );
}

function BrokerCard({ broker, onEdit }: { broker: any; onEdit: () => void }) {
  const deleteBroker = useMutation(api.brokers.deleteBroker);
  const updateBroker = useMutation(api.brokers.updateBroker);

  const handleToggleEnabled = async () => {
    try {
      await updateBroker({
        id: broker._id,
        enabled: !broker.enabled,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update broker');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Broker',
      `Are you sure you want to delete "${broker.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBroker({ id: broker._id });
            } catch (error) {
              Alert.alert('Error', 'Failed to delete broker');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{broker.name}</Text>
          <View style={[styles.statusBadge, broker.enabled && styles.statusBadgeActive]}>
            <Text style={[styles.statusText, broker.enabled && styles.statusTextActive]}>
              {broker.enabled ? 'Active' : 'Disabled'}
            </Text>
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={onEdit} style={styles.iconButton}>
            <Edit3 size={18} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Broker:</Text>
          <Text style={styles.infoValue}>{broker.broker}:{broker.port}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Topic:</Text>
          <Text style={styles.infoValue}>{broker.topic}</Text>
        </View>
        {broker.nodeIds && broker.nodeIds.length > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tracking:</Text>
            <Text style={styles.infoValue}>{broker.nodeIds.join(', ')}</Text>
          </View>
        )}
        {broker.username && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username:</Text>
            <Text style={styles.infoValue}>{broker.username}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.toggleLabel}>Enable Broker</Text>
        <Switch
          value={broker.enabled}
          onValueChange={handleToggleEnabled}
          trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
          thumbColor={broker.enabled ? '#3b82f6' : '#f3f4f6'}
        />
      </View>
    </View>
  );
}

function BrokerForm({ broker, onClose }: { broker: any | null; onClose: () => void }) {
  const createBroker = useMutation(api.brokers.createBroker);
  const updateBroker = useMutation(api.brokers.updateBroker);

  const [name, setName] = useState(broker?.name || '');
  const [brokerAddress, setBrokerAddress] = useState(broker?.broker || 'mqtt.meshtastic.org');
  const [port, setPort] = useState(broker?.port?.toString() || '1883');
  const [topic, setTopic] = useState(broker?.topic || 'msh/US/#');
  const [username, setUsername] = useState(broker?.username || '');
  const [password, setPassword] = useState(broker?.password || '');
  const [nodeIds, setNodeIds] = useState(broker?.nodeIds?.join(', ') || '');
  const [enabled, setEnabled] = useState(broker?.enabled ?? true);
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter a broker name');
      return;
    }

    if (!brokerAddress.trim()) {
      Alert.alert('Required Field', 'Please enter a broker address');
      return;
    }

    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      Alert.alert('Invalid Port', 'Please enter a valid port number (1-65535)');
      return;
    }

    if (!topic.trim()) {
      Alert.alert('Required Field', 'Please enter a topic pattern');
      return;
    }

    try {
      const nodeIdArray = nodeIds
        .split(',')
        .map((id: string) => id.trim())
        .filter((id: string) => id.length > 0);

      if (broker) {
        // Update existing
        await updateBroker({
          id: broker._id,
          name: name.trim(),
          broker: brokerAddress.trim(),
          port: portNum,
          topic: topic.trim(),
          username: username.trim() || undefined,
          password: password.trim() || undefined,
          nodeIds: nodeIdArray.length > 0 ? nodeIdArray : undefined,
          enabled,
        });
      } else {
        // Create new
        await createBroker({
          name: name.trim(),
          broker: brokerAddress.trim(),
          port: portNum,
          topic: topic.trim(),
          username: username.trim() || undefined,
          password: password.trim() || undefined,
          nodeIds: nodeIdArray.length > 0 ? nodeIdArray : undefined,
          enabled,
        });
      }

      Alert.alert('Success', broker ? 'Broker updated successfully' : 'Broker created successfully');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save broker configuration');
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.formContainer}>
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.formTitle}>{broker ? 'Edit Broker' : 'Add Broker'}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.formContent} contentContainerStyle={styles.formContentContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Broker Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="My MQTT Broker"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Broker Address *</Text>
          <TextInput
            style={styles.input}
            value={brokerAddress}
            onChangeText={setBrokerAddress}
            placeholder="mqtt.meshtastic.org"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Port *</Text>
          <TextInput
            style={styles.input}
            value={port}
            onChangeText={setPort}
            placeholder="1883"
            keyboardType="number-pad"
          />
          <Text style={styles.hint}>
            1883 (mqtt://), 8883 (mqtts://), 8083 (ws://), 8084 (wss://)
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Topic Pattern *</Text>
          <TextInput
            style={styles.input}
            value={topic}
            onChangeText={setTopic}
            placeholder="msh/US/#"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>Use # as wildcard for all subtopics</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Node IDs to Track (optional)</Text>
          <TextInput
            style={styles.input}
            value={nodeIds}
            onChangeText={setNodeIds}
            placeholder="!9e75c710, !abc12345"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>Comma-separated list. Leave empty to track all nodes.</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username (optional)</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Leave empty if not required"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password (optional)</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Leave empty if not required"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color="#6b7280" />
              ) : (
                <Eye size={20} color="#6b7280" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Enable Broker</Text>
            <Text style={styles.settingHint}>Start tracking when saved</Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
            thumbColor={enabled ? '#3b82f6' : '#f3f4f6'}
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Save size={20} color="#fff" />
          <Text style={styles.saveButtonText}>
            {broker ? 'Update Broker' : 'Create Broker'}
          </Text>
        </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
  },
  statusBadgeActive: {
    backgroundColor: '#dbeafe',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  statusTextActive: {
    color: '#2563eb',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    width: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  formContent: {
    flex: 1,
  },
  formContentContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  eyeButton: {
    padding: 10,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  settingHint: {
    fontSize: 12,
    color: '#6b7280',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
