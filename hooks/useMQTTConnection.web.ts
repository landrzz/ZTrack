import { useEffect } from 'react';

export function useMQTTConnection() {
  const isConnecting = false;
  const isConnected = false;
  
  useEffect(() => {
    console.log('MQTT connection not available on web platform');
  }, []);
  
  const connect = () => {
    // No-op on web
  };
  
  const disconnect = () => {
    // No-op on web
  };
  
  return {
    isConnected,
    isConnecting,
    reconnect: connect,
    disconnect,
  };
}