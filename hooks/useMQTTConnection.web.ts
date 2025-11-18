import { useEffect, useRef, useState } from 'react';
import { Buffer } from 'buffer';
import type { MqttClient } from 'mqtt';
import { useTrackerStore } from '@/store/useTrackerStore';
import { parseMQTTMessage, extractPosition } from '@/utils/mqtt';

// Polyfill Buffer for mqtt.js
global.Buffer = Buffer;

// Import mqtt - handle both default and named exports
const mqttModule = require('mqtt');
const mqtt = mqttModule.default || mqttModule;

export function useMQTTConnection() {
  const clientRef = useRef<MqttClient | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  
  const { mqttConfig, units, addPosition, setConnected, isConnected } = useTrackerStore();
  
  const connect = () => {
    if (clientRef.current?.connected || isConnecting) {
      return;
    }
    
    setIsConnecting(true);
    
    try {
      // Use WebSocket connection
      const protocol = mqttConfig.port === 8083 ? 'ws' : 'wss';
      const url = `${protocol}://${mqttConfig.broker}:${mqttConfig.port}/mqtt`;
      
      const client = mqtt.connect(url, {
        clientId: 'web-' + Math.random().toString(16).slice(2),
        username: mqttConfig.username,
        password: mqttConfig.password,
        reconnectPeriod: 2000,
        connectTimeout: 30000,
      });
      
      client.on('connect', () => {
        console.log('Connected to MQTT broker');
        setConnected(true);
        setIsConnecting(false);
        
        client.subscribe(mqttConfig.topicRoot, (err: Error | null) => {
          if (err) {
            console.error('Subscription error:', err);
            alert('Failed to subscribe to topic');
          } else {
            console.log(`Subscribed to ${mqttConfig.topicRoot}`);
          }
        });
      });
      
      client.on('message', (topic: string, message: Buffer) => {
        const payload = parseMQTTMessage(message.toString());
        if (payload) {
          const position = extractPosition(payload);
          if (position && position.nodeId) {
            // Find the unit that matches this nodeId
            const unit = units.find(u => u.nodeId === position.nodeId && u.enabled);
            if (unit) {
              addPosition(unit.id, position);
            }
          }
        }
      });
      
      client.on('error', (error: Error) => {
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
        alert('MQTT connection lost. Attempting to reconnect...');
      });
      
      clientRef.current = client;
    } catch (error) {
      console.error('Connection error:', error);
      setIsConnecting(false);
      alert('Failed to connect to MQTT broker');
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