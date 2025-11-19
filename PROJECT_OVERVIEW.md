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
│  • Parses JSON & Protobuf Meshtastic payloads                    │
│  • Converts coordinates (latitude_i → decimal degrees)           │
│  • Smart deduplication (distance + time based)                   │
│  • Pushes to Convex database                                     │
│                                                                   │
│  Managed via: Admin Web UI (npm run admin)                       │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CONVEX (Backend/Database)                     │
│  URL: https://utmost-porcupine-898.convex.cloud                 │
│                                                                   │
│  Tables:                                                          │
│  • positions - GPS coordinates with broker tracking              │
│  • brokerConfigs - MQTT connection settings (multi-user ready)   │
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
│  • Real-time map with tracker position (Convex subscriptions)    │
│  • Configurable historical trail (by count or time)              │
│  • Broker management UI (full CRUD)                              │
│  • Toggle timestamp display (relative/absolute)                  │
│  • Works on iOS, Android & Web                                   │
│                                                                   │
│  Status: ✅ FULLY INTEGRATED with Convex                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
ZTrack/
├── expo_app/                    # Mobile/Web App (Expo + React Native)
│   ├── app/
│   │   ├── index.tsx            # ✅ Main screen (full-screen map)
│   │   ├── settings.tsx         # ✅ Settings with history config
│   │   ├── brokers.tsx          # ✅ Broker management UI
│   │   ├── onboarding.tsx       # ✅ Simplified tracker setup
│   │   └── _layout.tsx          # ✅ ConvexProvider + navigation
│   ├── components/
│   │   ├── TrackerMap.tsx       # ✅ Convex queries (native)
│   │   ├── TrackerMap.web.tsx   # ✅ Convex queries (web)
│   │   ├── InfoPanel.tsx        # ✅ Tappable timestamp toggle
│   │   └── MapControls.tsx      # ✅ Trail controls
│   ├── convex/                  # ✅ Copied from sync_service
│   │   ├── _generated/          # Auto-generated types
│   │   ├── positions.ts         # Position queries
│   │   └── brokers.ts           # Broker CRUD
│   ├── store/
│   │   └── useTrackerStore.ts   # ✅ App state (no MQTT)
│   ├── utils/
│   │   └── format.ts            # ✅ Timestamp formatting
│   └── package.json             # ✅ Convex added, MQTT removed
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
   - Detects format (JSON if topic contains `/json/`, else Protobuf)
   - Parses payload accordingly
   - Converts: `latitude_i * 1e-7` → `35.205280`
   - Checks smart deduplication (< 2m AND < 1 minute)
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
     brokerId: "j972sa510wesh9pda6pm84g5wd7vnj8j", // Links to brokerConfig
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

## � Data Relationships

### Position → Broker Tracking

Every position record includes a `brokerId` that links it to the broker configuration that captured it:

```typescript
// Position record
{
  deviceId: "!9e75c710",
  latitude: 35.205280,
  longitude: -79.525229,
  brokerId: "j972sa510wesh9pda6pm84g5wd7vnj8j" // References brokerConfigs._id
}

// Broker config
{
  _id: "j972sa510wesh9pda6pm84g5wd7vnj8j",
  name: "Landers",
  broker: "mqtt.meshtastic.org",
  userId: null // FUTURE: Will link to user account
}
```

**Why This Matters:**
- **Multi-broker scenarios**: Track which broker captured each position
- **Debugging**: Identify if specific brokers have issues
- **Analytics**: Compare performance across different MQTT brokers
- **Data isolation**: Future multi-user support - users only see their broker's data

### Broker → User (Future Multi-User)

Broker configs include an optional `userId` field for future multi-user support:

```typescript
// Single-user mode (current)
{
  name: "Landers",
  userId: null // No user isolation yet
}

// Multi-user mode (future)
{
  name: "Landers",
  userId: "user_abc123" // Only this user can see/manage this broker
}
```

**Queries Available:**
- `positions.getPositionsByBroker(brokerId)` - All devices on a broker
- `positions.getPositionsByBrokerAndDevice(brokerId, deviceId)` - Specific device on specific broker
- `brokers.getBrokersByUser(userId)` - All brokers owned by a user (future)

---

## � Key Components

### 1. Sync Service (`sync_service/`)

**Purpose:** Server-side MQTT listener that runs 24/7

**Key Features:**
- ✅ Multi-broker support (connect to multiple MQTT servers)
- ✅ Hot-reload configuration (no restart needed)
- ✅ Web UI for broker management (`npm run admin`)
- ✅ Dual format support: JSON and Protobuf messages
- ✅ Smart deduplication (distance + time based)
- ✅ Node ID filtering
- ✅ Auto-fills credentials for mqtt.meshtastic.org
- ✅ Graceful error handling for mixed message formats

**Running:**
```bash
cd sync_service
npm run dev
```

**Managing Brokers:**
```bash
npm run admin
# Opens http://localhost:3001
# Fill form → Add broker → Service auto-syncs
```

### 2. Convex Backend

**Purpose:** Real-time database and API layer

**Database Tables:**
- `positions` - GPS history with indexing
- `brokerConfigs` - MQTT connection settings

**API Functions:**
- `positions.logPosition(...)` - Store coordinates (requires brokerId)
- `positions.getLatestPosition(deviceId)` - Current location
- `positions.getHistory(deviceId, limit)` - Historical trail by count
- `positions.getHistoryByTime(deviceId, minutesAgo)` - Historical trail by time
- `positions.getPositionsByBroker(brokerId)` - All positions from a broker
- `positions.getPositionsByBrokerAndDevice(brokerId, deviceId)` - Precise tracking
- `brokers.createBroker(...)` - Add MQTT connection (supports userId)
- `brokers.listBrokers()` - Get all configurations
- `brokers.getBrokersByUser(userId)` - Get user's brokers (multi-user)
- `brokers.updateBroker(...)` - Modify settings
- `brokers.deleteBroker(...)` - Remove connection
- `brokers.toggleBroker(id)` - Enable/disable broker

**Deploying:**
```bash
cd sync_service
npx convex dev  # Development
npx convex deploy  # Production
```

### 3. Expo App (`expo_app/`)

**Purpose:** Mobile/web interface for tracking

**Current State:** ✅ **FULLY INTEGRATED WITH CONVEX**

**Features:**
- ✅ Real-time position updates via Convex subscriptions
- ✅ Full-screen map (iOS safe area removed)
- ✅ Configurable history loading:
  - By position count (10-500, default: 100)
  - By time range (5-1440 minutes, default: 60)
- ✅ Tappable timestamp toggle (relative ↔ absolute)
- ✅ Broker management UI (create, edit, delete, toggle)
- ✅ Trail visualization with toggle controls
- ✅ Multi-unit support with enable/disable
- ✅ Works on iOS, Android & Web
- ✅ No direct MQTT connection (server-side only)

**Timestamp Handling:**
- Meshtastic sends timestamps in Unix seconds
- App auto-detects and converts to milliseconds
- Displays in local timezone
- Toggle: "5 mins ago" ↔ "Nov 18, 2025 at 2:12:04 PM"

---

## 🎨 Expo App Features

### History Configuration

Users can configure how much position history to load:

**Mode 1: By Position Count**
- Load last N positions (10-500)
- Fast and predictable
- Default: 100 positions

**Mode 2: By Time Range**
- Load positions from last N minutes (5-1440)
- Useful for "show me last hour" scenarios
- Default: 60 minutes

**Settings UI:**
- Toggle between modes
- Conditional inputs based on selection
- Validation with reasonable limits
- Persists across sessions

### Timestamp Display

**Relative Time (Default):**
- "Just now" (< 1 minute)
- "5 mins ago" (< 1 hour)
- "2 hours ago" (< 24 hours)
- "Nov 18 at 2:12 PM" (older)

**Absolute Time (Tap to Toggle):**
- "Nov 18, 2025 at 2:12:04 PM"
- Full date with year and seconds
- Always in local timezone

**How It Works:**
1. Meshtastic sends: `time: 1763493125` (Unix seconds)
2. Convex stores: `1763493125` (as-is)
3. App converts: `1763493125000` (milliseconds for JS Date)
4. Displays: Formatted in local time

### Broker Management

Full CRUD interface matching sync_service admin UI:
- ✅ Create new broker configs
- ✅ Edit existing configs
- ✅ Delete brokers
- ✅ Toggle enabled/disabled
- ✅ Real-time sync with sync_service

### UI/UX Improvements

**Home Screen:**
- Full-screen map (no iOS safe area padding)
- InfoPanel positioned 35px from bottom
- Trail toggle with error handling
- Stats card with live updates

**Settings Screen:**
- Single back button (no duplicates)
- History mode configuration
- Map style selection
- Trail length control

---

## 🚀 Getting Started (Complete Setup)

### Initial Setup

**1. Clone and Install:**
```bash
git clone <repo-url>
cd ZTrack

# Install sync service
cd sync_service
npm install

# Install expo app
cd ../expo_app
npm install
```

**2. Configure Environment:**
```bash
# sync_service/.env
CONVEX_URL=https://utmost-porcupine-898.convex.cloud

# expo_app/.env
EXPO_PUBLIC_CONVEX_URL=https://utmost-porcupine-898.convex.cloud
```

**3. Initialize Convex:**
```bash
cd sync_service
npx convex dev  # Generates schema and types
```

**4. Copy Convex to Expo App:**
```bash
# From project root
cp -r sync_service/convex expo_app/

# Then in expo_app
cd expo_app
npx convex dev  # Generates expo_app/convex/_generated/
```

**5. Start Services:**
```bash
# Terminal 1: Convex
cd sync_service
npx convex dev

# Terminal 2: Sync Service
cd sync_service
npm run dev

# Terminal 3: Expo App
cd expo_app
npx expo start
```

**6. Configure Broker:**
```bash
# Open admin UI
cd sync_service
npm run admin
# Navigate to http://localhost:3001
# Add your MQTT broker configuration
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
1. Run `npm run admin` (opens http://localhost:3001)
2. Add/edit broker configuration in web UI
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
Run `npm run admin` and open http://localhost:3001 to see:
- Active broker connections
- Enabled/disabled status
- Configuration details
- Add/edit/delete brokers

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

1. ✅ **COMPLETED - Admin UI:** Working perfectly with Convex integration
   ```bash
   npm run admin  # Opens http://localhost:3001
   # Broker management fully functional
   ```

2. ✅ **COMPLETED - Sync Service:** Operational with dual format support
   ```bash
   cd sync_service
   npm run dev
   # Successfully logging positions from !9e75c710
   # Supports both JSON and Protobuf messages
   ```

3. ✅ **COMPLETED - Convex Integration:** Data flowing correctly
   - Broker configs stored in `brokerConfigs` table
   - Positions being logged to `positions` table
   - Smart deduplication active (2m + 1min threshold)

### Completed Features

1. ✅ **Expo App Convex Integration**
   - Removed all MQTT client code
   - Added ConvexProvider and real-time queries
   - Updated map components (native + web)
   - Copied Convex schema and generated types

2. ✅ **End-to-End Flow Verified:**
   - Meshtastic device → MQTT → Sync Service → Convex → Expo App
   - Real-time updates working on mobile and web
   - Position history loading correctly

3. ✅ **UI Polish:**
   - Full-screen map experience
   - Tappable timestamp toggle
   - Configurable history loading
   - Broker management UI
   - Loading states and error handling
   - Settings screen with validation

### Future Enhancements

1. **User Authentication:**
   - Add Clerk or Auth0 integration
   - Enable userId in broker configs
   - Multi-user data isolation

2. **Advanced Features:**
   - Geofencing alerts
   - Battery monitoring
   - Historical data export
   - Push notifications
   - Offline mode support

3. **Analytics:**
   - Distance traveled reports
   - Time spent in areas
   - Movement patterns
   - Battery usage trends

---

## 📚 Documentation Links

**Internal Docs:**
- `sync_service/QUICKSTART.md` - Get started in 3 steps
- `sync_service/SETUP.md` - Detailed setup guide
- `sync_service/COMMANDS.md` - Command reference
- `expo_app/MIGRATION_SUMMARY.md` - Convex migration details
- `expo_app/UI_FIXES.md` - UI/UX improvements
- `expo_app/TIMESTAMP_AND_HISTORY_FIXES.md` - Timestamp and history features
- `expo_app/TIMESTAMP_TOGGLE_FEATURE.md` - Toggle functionality details

**External Resources:**
- [Convex Docs](https://docs.convex.dev)
- [Expo Docs](https://docs.expo.dev)
- [Meshtastic MQTT Docs](https://meshtastic.org/docs/software/mqtt/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)

---

## 🎉 What's Been Accomplished

### ✅ Completed - Sync Service (Fully Operational)
- ✅ Multi-broker support with hot-reload (30s polling)
- ✅ Web-based admin UI with Convex integration (`npm run admin`)
- ✅ Dual format support: JSON and Protobuf messages
- ✅ Smart deduplication (distance + time based: 2m + 1min)
- ✅ Correct Meshtastic payload parsing
- ✅ Convex database schema with proper relationships
  - ✅ Position → Broker tracking (brokerId required)
  - ✅ Broker → User support (userId optional, for future)
  - ✅ Indexed queries for broker-specific lookups
- ✅ Auto-fill for Meshtastic credentials
- ✅ Graceful error handling for mixed message formats
- ✅ Node ID filtering
- ✅ Comprehensive documentation
- ✅ Real-time position logging from device !9e75c710
- ✅ Timestamps stored in Unix seconds (Meshtastic format)

### ✅ Completed - Expo App (Fully Integrated)
- ✅ Removed all MQTT client code
- ✅ ConvexProvider integration
- ✅ Real-time position queries
- ✅ Configurable history loading:
  - ✅ By position count (10-500)
  - ✅ By time range (5-1440 minutes)
  - ✅ New `getHistoryByTime` query
- ✅ Timestamp display fixes:
  - ✅ Auto-detect seconds vs milliseconds
  - ✅ Convert to local timezone
  - ✅ Tappable toggle (relative ↔ absolute)
- ✅ Broker management UI:
  - ✅ Create, edit, delete brokers
  - ✅ Toggle enabled/disabled
  - ✅ Full CRUD matching admin UI
- ✅ UI/UX improvements:
  - ✅ Full-screen map (removed iOS safe area)
  - ✅ InfoPanel repositioned
  - ✅ Trail toggle with error handling
  - ✅ Single back button in settings
- ✅ Map components updated (native + web)
- ✅ Settings screen with validation
- ✅ Comprehensive documentation

### 📋 Planned
- User authentication (Clerk/Auth0)
- Geofencing alerts
- Battery monitoring
- Multi-user support (userId activation)
- Historical data export
- Push notifications
- Offline mode

---

**Last Updated:** November 18, 2025  
**Status:** ✅ FULLY OPERATIONAL - Sync service + Expo app both integrated with Convex  
**Current Device:** !9e75c710 (Landers) - Actively tracking  
**Features:** Real-time updates, configurable history, broker management, timestamp toggle  
**Next Steps:** User authentication, geofencing, advanced analytics
