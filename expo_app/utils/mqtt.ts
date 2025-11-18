export interface MeshtasticPayload {
  latitude_i?: number;
  longitude_i?: number;
  altitude?: number;
  time?: number;
  PDOP?: number;
  from?: string; // Node ID of the sender
  sender?: string; // Alternative field for node ID
  [key: string]: any;
}

export function convertCoordinates(latitude_i: number, longitude_i: number) {
  return {
    latitude: latitude_i / 10000000,
    longitude: longitude_i / 10000000,
  };
}

export function parseMQTTMessage(message: string): MeshtasticPayload | null {
  try {
    const payload = JSON.parse(message);
    return payload;
  } catch (error) {
    console.error('Failed to parse MQTT message:', error);
    return null;
  }
}

export function extractPosition(payload: MeshtasticPayload) {
  if (!payload.latitude_i || !payload.longitude_i) {
    return null;
  }
  
  const coords = convertCoordinates(payload.latitude_i, payload.longitude_i);
  const nodeId = payload.from || payload.sender;
  
  return {
    nodeId,
    latitude: coords.latitude,
    longitude: coords.longitude,
    timestamp: payload.time || Date.now(),
    accuracy: payload.PDOP,
  };
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters.toFixed(0)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffSecs < 60) {
    return `${diffSecs}s ago`;
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  
  return date.toLocaleTimeString();
}
