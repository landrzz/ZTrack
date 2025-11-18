# Timestamp Toggle Feature

## Overview
Added interactive timestamp display in the InfoPanel that allows users to toggle between relative and absolute time formats.

## User Experience

### Default View (Relative Time)
Shows human-friendly relative timestamps:
- **"Just now"** - Less than 1 minute ago
- **"5 mins ago"** - Less than 1 hour ago
- **"2 hours ago"** - Less than 24 hours ago
- **"Nov 18 at 2:12 PM"** - Older than 24 hours

### Tapped View (Absolute Time)
Shows precise timestamp with full details:
- **"Nov 18, 2025 at 2:12:04 PM"**
- Includes year, full date, and seconds
- Always in local timezone

### Interaction
1. Tap the "Last Update" timestamp in InfoPanel
2. Display toggles to absolute time
3. Tap again to return to relative time
4. State persists during app session

## Technical Implementation

### Format Functions (`utils/format.ts`)

#### `formatTimestamp(timestamp: number): string`
- Converts seconds to milliseconds automatically
- Returns relative time strings
- Falls back to short date format for old timestamps

#### `formatAbsoluteTimestamp(timestamp: number): string`
- Converts seconds to milliseconds automatically
- Always returns full date/time with seconds
- Uses `toLocaleString()` for proper localization

### Component Changes (`components/InfoPanel.tsx`)

```typescript
// State management
const [showAbsoluteTime, setShowAbsoluteTime] = useState(false);

// Tappable timestamp
<TouchableOpacity 
  style={styles.infoItem}
  onPress={() => setShowAbsoluteTime(!showAbsoluteTime)}
  activeOpacity={0.7}
>
  <Clock size={16} color="#6b7280" />
  <View style={styles.infoContent}>
    <Text style={styles.infoLabel}>Last Update</Text>
    <Text style={styles.infoValue}>
      {showAbsoluteTime 
        ? formatAbsoluteTimestamp(lastPosition.timestamp)
        : formatTimestamp(lastPosition.timestamp)
      }
    </Text>
  </View>
</TouchableOpacity>
```

## Why This Matters

### User Benefits
1. **Quick Glance**: Relative time is easier to understand at a glance
2. **Precise Details**: Absolute time available when needed
3. **No Settings**: Toggle on-demand, no configuration required
4. **Local Time**: Always shows in user's timezone

### Use Cases
- **Relative Time**: "Is my tracker updating regularly?"
- **Absolute Time**: "Exactly when was the last update?"
- **Debugging**: "What time did the issue occur?"
- **Logging**: "Need to record exact timestamp"

## Data Flow

```
Meshtastic Device
    ↓
  time: 1763493125 (Unix seconds)
    ↓
Sync Service (stores as-is)
    ↓
Convex Database
    ↓
timestamp: 1763493125 (seconds)
    ↓
Expo App (converts for display)
    ↓
timestampMs: 1763493125000 (milliseconds)
    ↓
JavaScript Date Object
    ↓
Formatted String
```

## Timestamp Conversion Logic

```typescript
// Auto-detect seconds vs milliseconds
const timestampMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
```

**Why 10 billion?**
- Unix timestamp in seconds: ~1.7 billion (current)
- Unix timestamp in milliseconds: ~1.7 trillion (current)
- 10 billion is safely between them
- Covers dates until year 2286 in seconds format

## Future Enhancements

Potential improvements:
- [ ] Add visual indicator that timestamp is tappable (e.g., subtle underline)
- [ ] Animate transition between formats
- [ ] Remember user's preference across sessions
- [ ] Add "Copy timestamp" option on long press
- [ ] Show timezone abbreviation in absolute format
- [ ] Add ISO 8601 format option for developers

## Accessibility

- Uses `TouchableOpacity` with proper `activeOpacity`
- Text remains readable in both formats
- No color-only indicators
- Works with screen readers (timestamp is text)

## Testing

### Manual Test Steps
1. Launch app with recent position data
2. Verify "Last Update" shows relative time (e.g., "5 mins ago")
3. Tap the timestamp
4. Verify it changes to absolute format with full date/time
5. Tap again
6. Verify it returns to relative format
7. Wait for new position update
8. Verify timestamp updates automatically
9. Toggle again to ensure state is maintained

### Edge Cases
- [ ] Very old timestamps (years ago)
- [ ] Future timestamps (clock skew)
- [ ] Timestamps at midnight
- [ ] Timestamps during DST transitions
- [ ] Rapid toggling
- [ ] Multiple position updates while in absolute mode

## Files Modified
- `expo_app/utils/format.ts` - Added `formatAbsoluteTimestamp()`
- `expo_app/components/InfoPanel.tsx` - Added toggle functionality
