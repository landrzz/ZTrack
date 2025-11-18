# MQTT Connection Setup for ZTrack

## Important: Expo Go Limitation

**The Meshtastic public MQTT broker (`mqtt.meshtastic.org`) does NOT support WebSocket connections**, which are required for Expo Go to work.

### Current Situation
- **Expo Go**: Can only use WebSocket (ws:// or wss://) connections
- **Meshtastic Broker**: Only supports standard MQTT over TCP (port 1883)
- **Result**: Cannot connect to `mqtt.meshtastic.org` in Expo Go

## Solutions

### Option 1: Use Development Build (Recommended for Production)

Create a development build that includes native MQTT support:

```bash
# For iOS
npx expo run:ios

# For Android  
npx expo run:android
```

This allows the app to use native TCP connections and connect directly to `mqtt.meshtastic.org:1883`.

**Settings for Development Build:**
```
Broker: mqtt.meshtastic.org
Port: 1883
Topic: msh/US/2/#
Username: meshdev
Password: large4cats
```

### Option 2: Set Up Your Own MQTT Broker

Run your own MQTT broker with WebSocket support (e.g., Mosquitto, EMQX) and bridge it to Meshtastic.

Example with Mosquitto:
```bash
# Install Mosquitto
brew install mosquitto

# Configure WebSocket listener (mosquitto.conf)
listener 1883
listener 8083
protocol websockets

# Bridge to Meshtastic
connection meshtastic-bridge
address mqtt.meshtastic.org:1883
topic msh/# both 0
```

**Settings for Your Broker:**
```
Broker: your-broker-address.com
Port: 8083 (ws) or 8084 (wss)
Topic: msh/US/2/#
```

### Option 3: Test with Public WebSocket Broker

For testing the app UI/functionality only (not actual Meshtastic data):

**EMQX Public Broker:**
```
Broker: broker.emqx.io
Port: 8083 (ws) or 8084 (wss)
Topic: test/topic/#
Username: (leave empty)
Password: (leave empty)
```

**Mosquitto Test Broker:**
```
Broker: test.mosquitto.org
Port: 8080 (ws) or 8081 (wss)  
Topic: test/topic/#
Username: (leave empty)
Password: (leave empty)
```

## Current App Configuration

The app is currently configured for WebSocket connections (Expo Go compatible):
- Uses `wss://` protocol for port 8084
- Uses `ws://` protocol for port 8083
- Includes Buffer polyfill for mqtt.js

To use with a development build and native TCP, you would need to modify the connection code to use `mqtt://` protocol instead of `wss://`.

## Recommended Path Forward

1. **For Development/Testing**: Use Expo Go with a test WebSocket broker (Option 3)
2. **For Production**: Create a development build (Option 1) to connect to actual Meshtastic network
3. **For Advanced Users**: Set up your own bridged broker (Option 2)
