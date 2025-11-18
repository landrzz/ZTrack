# ZTrack - Meshtastic GPS Tracking System

## 🎯 Project Vision

A real-time GPS tracking system that uses Meshtastic LoRa devices to track pets/assets, with a React Native Expo mobile app for visualization and a server-side bridge for 24/7 data capture.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     MESHTASTIC NETWORK                           │
│  LoRa Devices (e.g., Dog Collar !9e75c710)                      │
│         ↓ LoRa Radio                                             │
│  Gateway Node → mqtt.meshtastic.org                              │
└──────────────────────────────┬──────────────────────────────────┘
                               │ MQTT (Position Updates)
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SYNC SERVICE (Node.js)                        │
│  Location: sync_service/                                         │
│                                                                   │
│  • Subscribes to MQTT brokers (multi-broker support)             │
│  • Parses Meshtastic JSON payloads                               │
│  • Converts coordinates (latitude_i → decimal degrees)           │
│  • Deduplicates positions                                        │
│  • Pushes to Convex database                                     │
│                                                                   │
│  Managed via: Admin Web UI (admin/index.html)                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CONVEX (Backend/Database)                     │
│  URL: https://utmost-porcupine-898.convex.cloud                 │
│                                                                   │
│  Tables:                                                          │
│  • positions - GPS coordinates with history                      │
│  • brokerConfigs - MQTT connection settings                      │
│                                                                   │
│  Functions:                                                       │
│  • positions.logPosition() - Store new coordinates               │
│  • positions.getLatestPosition() - Get current location          │
│  • positions.getHistory() - Query trail                          │
│  • brokers.* - CRUD for broker configs                           │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Real-time Subscriptions
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                  EXPO APP (React Native)                         │
│  Location: expo_app/                                             │
│                                                                   │
│  • Real-time map with tracker position                           │
│  • Historical trail visualization                                │
│  • Works on iOS & Android                                        │
│  • Web version available                                         │
│                                                                   │
│  Status: ⚠️ NEEDS UPDATES (see Next Steps)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
ZTrack/
├── expo_app/                    # Mobile/Web App (Expo + React Native)
│   ├── app/
│   │   ├── index.tsx            # Main screen (map view)
│   │   ├── index.web.tsx        # Web-specific entry
│   │   └── _layout.tsx          # Navigation layout
│   ├── components/
│   │   ├── TrackerMap.tsx       # ⚠️ NEEDS UPDATE - Map component
│   │   ├── InfoPanel.tsx        # Device info display
│   │   └── MapControls.tsx      # Map interaction controls
│   ├── hooks/
│   │   ├── useMQTTConnection.ts      # ⚠️ DEPRECATED - Remove
│   │   └── useMQTTConnection.web.ts  # ⚠️ DEPRECATED - Remove
│   └── package.json
│
├── sync_service/                # Server-side MQTT → Convex Bridge
│   ├── src/
│   │   ├── multi-broker-service.ts  # ✅ NEW - Multi-broker manager
│   │   └── service.ts               # ⚠️ OLD - Single broker (legacy)
│   ├── convex/
│   │   ├── schema.ts            # Database schema definition
│   │   ├── positions.ts         # Position tracking API
│   │   ├── brokers.ts           # ✅ NEW - Broker config API
│   │   └── _generated/          # Auto-generated (from npx convex dev)
│   ├── admin/
│   │   └── index.html           # ✅ NEW - Web UI for broker management
│   ├── package.json             # Updated to use multi-broker by default
│   ├── QUICKSTART.md            # Getting started guide
│   ├── SETUP.md                 # Detailed documentation
│   └── COMMANDS.md              # Command reference
│
├── PROJECT_OVERVIEW.md          # ✅ THIS FILE - Big picture
└── meshtastic-convex-bridge.md  # ⚠️ DEPRECATED - Original plan
```

---

## 🔄 Data Flow

### Position Update Journey

1. **Meshtastic Device** (e.g., dog collar) sends position via LoRa
2. **Gateway** receives and publishes to MQTT broker:
   ```
   Topic: msh/US/2/2/json/LandersOnly/!9e75c710
   Payload: {
     "payload": {
       "latitude_i": 352052802,
       "longitude_i": -79255229,
       "altitude": 113
     },
     "sender": "!9e75c710",
     "type": "position"
   }
   ```

3. **Sync Service** receives MQTT message:
   - Parses JSON payload
   - Converts: `latitude_i * 1e-7` → `35.205280`
   - Checks deduplication (< 2 meters)
   - Calls Convex mutation

4. **Convex** stores in `positions` table:
   ```typescript
   {
     _id: "...",
     deviceId: "!9e75c710",
     latitude: 35.205280,
     longitude: -7.925523,
     altitude: 113,
     timestamp: 1700234567000,
     rawPayload: {...}
   }
   ```

5. **Expo App** receives real-time update via Convex subscription:
   ```typescript
   const position = useQuery(api.positions.getLatestPosition, {
     deviceId: "!9e75c710"
   });
   // position updates automatically when new data arrives
   ```

---

## 🔑 Key Components

### 1. Sync Service (`sync_service/`)

**Purpose:** Server-side MQTT listener that runs 24/7

**Key Features:**
- ✅ Multi-broker support (connect to multiple MQTT servers)
- ✅ Hot-reload configuration (no restart needed)
- ✅ Web UI for broker management
- ✅ Parses actual Meshtastic payload structure
- ✅ Node ID filtering
- ✅ Position deduplication
- ✅ Auto-fills credentials for mqtt.meshtastic.org

**Running:**
```bash
cd sync_service
npm run dev
```

**Managing Brokers:**
```bash
open admin/index.html
# Fill form → Add broker → Service auto-syncs
```

### 2. Convex Backend

**Purpose:** Real-time database and API layer

**Database Tables:**
- `positions` - GPS history with indexing
- `brokerConfigs` - MQTT connection settings

**API Functions:**
- `positions.logPosition(...)` - Store coordinates
- `positions.getLatestPosition(deviceId)` - Current location
- `positions.getHistory(deviceId, limit)` - Historical trail
- `brokers.createBroker(...)` - Add MQTT connection
- `brokers.listBrokers()` - Get all configurations
- `brokers.updateBroker(...)` - Modify settings
- `brokers.deleteBroker(...)` - Remove connection

**Deploying:**
```bash
cd sync_service
npx convex dev  # Development
npx convex deploy  # Production
```

### 3. Expo App (`expo_app/`)

**Purpose:** Mobile/web interface for tracking

**Current State:** ⚠️ **NEEDS MAJOR UPDATES**

**What Works:**
- ✅ Map rendering
- ✅ Basic UI components
- ✅ Web and native builds

**What Needs Updating:**
- ❌ Remove MQTT client code (now server-side)
- ❌ Add Convex client integration
- ❌ Update position fetching to use Convex queries
- ❌ Add real-time subscriptions
- ❌ (Optional) Add broker configuration UI

---

## 🚀 Next Steps - Expo App Integration

### Priority 1: Remove Direct MQTT Connection

**Files to Modify/Delete:**
```
expo_app/hooks/useMQTTConnection.ts        → DELETE
expo_app/hooks/useMQTTConnection.web.ts    → DELETE
expo_app/package.json                       → Remove MQTT dependencies
```

**Why:** The app no longer connects directly to MQTT. The sync service handles this.

### Priority 2: Add Convex Client

**Install Convex:**
```bash
cd expo_app
npm install convex
npx convex dev
```

**Create Convex Provider:**
```typescript
// expo_app/app/_layout.tsx
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      {/* existing layout */}
    </ConvexProvider>
  );
}
```

**Add Environment Variable:**
```bash
# expo_app/.env
EXPO_PUBLIC_CONVEX_URL=https://utmost-porcupine-898.convex.cloud
```

### Priority 3: Update Map Component

**Current Code (expo_app/components/TrackerMap.tsx):**
```typescript
// OLD - Uses MQTT hook
const { lastPosition } = useMQTTConnection();
```

**New Code:**
```typescript
// NEW - Uses Convex subscription
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function TrackerMap({ deviceId }: { deviceId: string }) {
  // Real-time position updates
  const position = useQuery(api.positions.getLatestPosition, {
    deviceId: deviceId
  });

  // Historical trail (last 100 points)
  const trail = useQuery(api.positions.getHistory, {
    deviceId: deviceId,
    limit: 100
  });

  if (!position) {
    return <Text>Loading position...</Text>;
  }

  return (
    <MapView
      initialRegion={{
        latitude: position.latitude,
        longitude: position.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      {/* Current position marker */}
      <Marker
        coordinate={{
          latitude: position.latitude,
          longitude: position.longitude,
        }}
        title={deviceId}
      />

      {/* Historical trail */}
      {trail && (
        <Polyline
          coordinates={trail.map(p => ({
            latitude: p.latitude,
            longitude: p.longitude,
          }))}
          strokeColor="#667eea"
          strokeWidth={3}
        />
      )}
    </MapView>
  );
}
```

### Priority 4: Copy Convex Schema to Expo App

The Expo app needs the Convex API types to call functions:

```bash
# From sync_service
cp -r convex expo_app/

# Then in expo_app
npx convex dev
# This generates expo_app/convex/_generated/
```

### Priority 5: (Optional) Add Broker Configuration UI

**For single-user:** You can keep using the admin web UI

**For multi-user app:** Create a settings screen in the Expo app:

```typescript
// expo_app/app/settings.tsx
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function SettingsScreen() {
  const createBroker = useMutation(api.brokers.createBroker);

  const handleAddBroker = async (formData) => {
    await createBroker({
      name: formData.name,
      broker: formData.broker,
      port: parseInt(formData.port),
      username: formData.username,
      password: formData.password,
      topic: formData.topic,
      nodeIds: [formData.nodeId],
      enabled: true,
    });
  };

  return (
    <View>
      <Text>Configure Your MQTT Broker</Text>
      {/* Form fields matching admin UI */}
    </View>
  );
}
```

---

## 🔐 Configuration & Secrets

### Sync Service Environment

**File: `sync_service/.env`**
```env
CONVEX_URL=https://utmost-porcupine-898.convex.cloud
```

**Note:** MQTT broker credentials are now stored in Convex `brokerConfigs` table (managed via admin UI)

### Expo App Environment

**File: `expo_app/.env`**
```env
EXPO_PUBLIC_CONVEX_URL=https://utmost-porcupine-898.convex.cloud
```

### Known MQTT Credentials

**Public Meshtastic Broker:**
- **Broker:** `mqtt.meshtastic.org`
- **Port:** `1883`
- **Username:** `meshdev`
- **Password:** `large4cats`
- **Auto-filled in admin UI ✅**

---

## 🛠️ Development Workflow

### Starting Everything

```bash
# Terminal 1: Convex (watches for schema changes)
cd sync_service
npx convex dev

# Terminal 2: Sync Service (processes MQTT)
cd sync_service
npm run dev

# Terminal 3: Expo App (mobile/web UI)
cd expo_app
npx expo start
```

### Making Changes

**To add/modify MQTT brokers:**
1. Open `sync_service/admin/index.html`
2. Add/edit broker configuration
3. Service auto-syncs within 30 seconds

**To update database schema:**
1. Edit `sync_service/convex/schema.ts`
2. Convex auto-deploys changes
3. Copy updated types to Expo app if needed

**To add new Convex functions:**
1. Create/edit files in `sync_service/convex/`
2. Functions auto-deploy on save
3. Available immediately in app via `useQuery`/`useMutation`

---

## 📊 Monitoring & Debugging

### View Live Data

**Convex Dashboard:**
https://dashboard.convex.dev/d/utmost-porcupine-898

- **Data Tab:** View `positions` and `brokerConfigs` tables
- **Logs Tab:** See function calls and errors
- **Deployments Tab:** Track schema changes

**Sync Service Logs:**
```bash
cd sync_service
npm run dev
# Watch terminal for:
# 📍 [My Meshtastic] Position: !9e75c710 @ (35.205280, -7.925523)
# ✓ Logged to Convex
```

**Admin UI:**
Open `sync_service/admin/index.html` to see:
- Active broker connections
- Enabled/disabled status
- Configuration details

### Common Issues

**No position updates:**
1. Check sync service is running: `npm run dev`
2. Verify broker is enabled in admin UI
3. Check node ID filter matches your device
4. Confirm Meshtastic device is publishing

**Admin UI not loading brokers:**
1. Open browser console (F12)
2. Verify Convex URL in HTML file
3. Check network tab for API errors
4. Ensure `npx convex dev` has been run

**Expo app not updating:**
1. Verify `EXPO_PUBLIC_CONVEX_URL` is set
2. Check ConvexProvider is wrapping app
3. Ensure `convex/_generated/` exists
4. Clear Metro bundler cache: `npx expo start -c`

---

## 🎯 Immediate Action Items

### For You (Right Now)

1. ✅ **Test Admin UI:** Should now work with fixed API calls
   ```bash
   open sync_service/admin/index.html
   # Add your broker configuration
   ```

2. ✅ **Start Sync Service:**
   ```bash
   cd sync_service
   npm run dev
   # Should connect and start logging positions
   ```

3. ✅ **Verify in Convex Dashboard:**
   - Visit https://dashboard.convex.dev/d/utmost-porcupine-898
   - Check `brokerConfigs` table has your entry
   - Wait for positions to appear in `positions` table

### For Next Coding Session

1. **Update Expo App** (following Priority steps above)
   - Remove MQTT client code
   - Add Convex integration
   - Update map component to use Convex queries

2. **Test End-to-End Flow:**
   - Meshtastic device → MQTT → Sync Service → Convex → Expo App
   - Verify real-time updates on mobile

3. **Polish UI:**
   - Add loading states
   - Handle offline scenarios
   - Add settings screen for broker config (optional)

---

## 📚 Documentation Links

**Internal Docs:**
- `sync_service/QUICKSTART.md` - Get started in 3 steps
- `sync_service/SETUP.md` - Detailed setup guide
- `sync_service/COMMANDS.md` - Command reference

**External Resources:**
- [Convex Docs](https://docs.convex.dev)
- [Expo Docs](https://docs.expo.dev)
- [Meshtastic MQTT Docs](https://meshtastic.org/docs/software/mqtt/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)

---

## 🎉 What's Been Accomplished

### ✅ Completed
- Multi-broker support with hot-reload
- Web-based admin UI for broker management
- Correct Meshtastic payload parsing
- Convex database schema with indexing
- Position deduplication logic
- Auto-fill for Meshtastic credentials
- Comprehensive documentation

### 🔄 In Progress
- Expo app Convex integration

### 📋 Planned
- User authentication
- Geofencing alerts
- Battery monitoring
- Multi-user support
- Historical data export

---

**Last Updated:** November 18, 2025  
**Status:** Sync service operational, Expo app needs updates  
**Next Agent:** Focus on Expo app Convex integration (Priority 1-4 above)
