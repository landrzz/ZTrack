import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import mqtt, { MqttClient } from 'mqtt';
import { useTrackerStore } from '@/store/useTrackerStore';
import { parseMQTTMessage, extractPosition } from '@/utils/mqtt';

export function useMQTTConnection() {
  const clientRef = useRef<MqttClient | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { mqttConfig, addPosition, setConnected, isConnected } = useTrackerStore();
  
  const connect = () => {
    if (clientRef.current?.connected || isConnecting) {
      return;
    }
    
    setIsConnecting(true);
    
    try {
      const client = mqtt.connect(`mqtt://${mqttConfig.broker}:${mqttConfig.port}`, {
        reconnectPeriod: 5000,
        connectTimeout: 30000,
      });
      
      client.on('connect', () => {
        console.log('Connected to MQTT broker');
        setConnected(true);
        setIsConnecting(false);
        
        client.subscribe(mqttConfig.topicRoot, (err) => {
          if (err) {
            console.error('Subscription error:', err);
            Alert.alert('Subscription Error', 'Failed to subscribe to topic');
          } else {
            console.log(`Subscribed to ${mqttConfig.topicRoot}`);
          }
        });
      });
      
      client.on('message', (topic, message) => {
        const payload = parseMQTTMessage(message.toString());
        if (payload) {
          const position = extractPosition(payload);
          if (position) {
            addPosition(position);
          }
        }
      });
      
      client.on('error', (error) => {
        console.error('MQTT Error:', error);
        setConnected(false);
        setIsConnecting(false);
      });
      
      client.on('close', () => {
        console.log('MQTT connection closed');
        setConnected(false);
        setIsConnecting(false);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 5000);
      });
      
      client.on('offline', () => {
        console.log('MQTT client offline');
        setConnected(false);
        Alert.alert('Connection Lost', 'MQTT connection lost. Attempting to reconnect...');
      });
      
      clientRef.current = client;
    } catch (error) {
      console.error('Connection error:', error);
      setIsConnecting(false);
      Alert.alert('Connection Error', 'Failed to connect to MQTT broker');
    }
  };
  
  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (clientRef.current) {
      clientRef.current.end(true);
      clientRef.current = null;
    }
    
    setConnected(false);
  };
  
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [mqttConfig.broker, mqttConfig.port, mqttConfig.topicRoot]);
  
  return {
    isConnected,
    isConnecting,
    reconnect: connect,
    disconnect,
  };
}