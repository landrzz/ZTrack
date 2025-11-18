# Timestamp and History Configuration Fixes

## Issue 1: Timestamp Display Fix ✅

### Problem
Timestamps were displaying incorrectly (e.g., showing "Jan 21 at 4:51AM" when actual time was "Nov 18, 2025 2:12:04 PM"). 

### Root Cause
- **Meshtastic devices send timestamps in Unix seconds** (e.g., `1763493125`)
- **Convex stores these as-is** (in seconds)
- **JavaScript `Date` expects milliseconds** (seconds × 1000)
- The app was not converting seconds to milliseconds for display

### Example from Real Data
```javascript
// Meshtastic payload
{
  payload: {
    time: 1763493125,  // Unix timestamp in SECONDS
    // ...
  }
}

// Stored in Convex
timestamp: 1763493124351.0134  // Still in seconds (with sub-second precision)

// Convex displays correctly: 11/18/25 2:12:04 PM
// App was displaying wrong: Jan 21 at 4:51AM (treating seconds as milliseconds)
```

### Solution

#### 1. App-Side Fix (`utils/format.ts`)
Added auto-detection to convert seconds to milliseconds:
```typescript
// Convert to milliseconds if timestamp is in seconds (< year 2100 in seconds)
const timestampMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
```

This ensures timestamps display correctly by:
- Detecting if value is in seconds (< 10 billion = before year 2286)
- Multiplying by 1000 to convert to milliseconds
- Passing correct value to JavaScript `Date` object

#### 2. Sync Service Clarification
The sync service was **already correct**:
- Stores timestamps in seconds (as received from Meshtastic)
- Uses `payload.time` field which is Unix epoch in seconds
- Falls back to `Math.floor(Date.now() / 1000)` for current time in seconds
- This is the correct format for Meshtastic data

#### 3. Toggle Feature
Added ability to toggle between relative and absolute time:
- **Relative:** "Just now", "5 mins ago", "2 hours ago"
- **Absolute:** "Nov 18, 2025 at 2:12:04 PM"
- Tap the timestamp in InfoPanel to toggle
- State persists during session

### Files Modified
- `expo_app/utils/format.ts` - Auto-detect seconds vs milliseconds, added `formatAbsoluteTimestamp()`
- `expo_app/components/InfoPanel.tsx` - Made timestamp tappable with toggle state
- `sync_service/src/multi-broker-service.ts` - Clarified to use `payload.time` (already in seconds)

---

## Issue 2: Configurable Position History ✅

### Problem
App was hardcoded to load last 100 positions. Users wanted:
- Configurable number of positions
- Option to load by time range instead of count
- Reasonable limits to prevent performance issues

### Solution

#### 1. New Settings Added
Added three new settings to `AppSettings`:
- `historyMode`: 'positions' | 'time' - Choose loading strategy
- `historyPositionCount`: 10-500 positions
- `historyTimeMinutes`: 5-1440 minutes (up to 24 hours)

#### 2. New Convex Query
Created `getHistoryByTime` query in `positions.ts`:
```typescript
export const getHistoryByTime = query({
  args: {
    deviceId: v.string(),
    minutesAgo: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoffTime = Date.now() - (args.minutesAgo * 60 * 1000);
    
    return await ctx.db
      .query("positions")
      .withIndex("by_device_time", (q) => q.eq("deviceId", args.deviceId))
      .filter((q) => q.gte(q.field("timestamp"), cutoffTime))
      .order("desc")
      .collect();
  },
});
```

#### 3. Map Components Updated
Both `TrackerMap.tsx` and `TrackerMap.web.tsx` now:
- Query based on selected mode (positions or time)
- Use conditional queries with 'skip' for inactive mode
- Automatically switch data source based on settings

#### 4. Settings UI
Added comprehensive controls in `settings.tsx`:
- Toggle between "By Count" and "By Time" modes
- Conditional input fields based on selected mode
- Validation for all inputs:
  - Position count: 10-500
  - Time range: 5-1440 minutes
  - Trail length: 10-1000 positions

### Default Values
- History Mode: By Count (positions)
- Position Count: 100
- Time Range: 60 minutes (1 hour)

### Limits & Rationale

| Setting | Min | Max | Reason |
|---------|-----|-----|--------|
| Position Count | 10 | 500 | Balance between useful data and performance |
| Time Range | 5 min | 1440 min (24h) | Prevent excessive data loads |
| Trail Length | 10 | 1000 | Visual clarity on map |

### Files Modified
- `expo_app/store/useTrackerStore.ts` - Added settings types and defaults
- `expo_app/convex/positions.ts` - Added time-based query
- `sync_service/convex/positions.ts` - Synced with expo_app version
- `expo_app/components/TrackerMap.tsx` - Dual query support
- `expo_app/components/TrackerMap.web.tsx` - Dual query support
- `expo_app/app/settings.tsx` - Added UI controls

---

## Testing Checklist

### Timestamps
- [ ] Recent positions show "Just now" or "X mins ago" (relative time)
- [ ] Older positions show proper date/time in local timezone
- [ ] No more incorrect dates (Jan 21, etc.)
- [ ] Timestamps update correctly as new data arrives
- [ ] Tapping timestamp toggles to absolute time format
- [ ] Absolute time shows full date with year, time with seconds
- [ ] Tapping again toggles back to relative time
- [ ] Toggle state persists while app is open

### History Configuration
- [ ] Can switch between "By Count" and "By Time" modes
- [ ] Position count input appears when "By Count" selected
- [ ] Time range input appears when "By Time" selected
- [ ] Validation prevents invalid values
- [ ] Map loads correct number of positions
- [ ] Time-based mode shows positions within time window
- [ ] Settings persist after app restart
- [ ] Performance is acceptable with max values (500 positions, 24 hours)

---

## Migration Notes

### For Existing Users
- Old timestamps in database will be auto-converted by the app
- New data will be stored in milliseconds (consistent format)
- Default history settings will be applied on first launch
- No data migration needed

### For Developers
- Sync service must be restarted to apply timestamp fixes
- Convex schema is backward compatible
- Both position count and time queries are available
- Consider adding indexes if time-based queries are slow

---

## Performance Considerations

### Position Count Mode
- Direct limit on query results
- Fast and predictable
- Best for most use cases

### Time Range Mode
- May return variable number of results
- Could be many positions if device updates frequently
- Useful for "show me last hour" scenarios
- Convex handles filtering efficiently

### Recommendations
- Use position count for general tracking
- Use time range for specific time-based analysis
- Monitor query performance with large time windows
- Consider adding pagination for very large datasets

---

## Future Enhancements

Potential improvements:
- [ ] Add "Last 24 hours" quick preset
- [ ] Show estimated position count for time range
- [ ] Add "Refresh" button to reload history
- [ ] Cache position data locally
- [ ] Add data usage indicator
- [ ] Support multiple time ranges (last hour, day, week)
