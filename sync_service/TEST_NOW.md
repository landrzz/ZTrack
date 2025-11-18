# 🧪 Test the Admin UI Right Now

## Step 0: Run the Admin UI Locally

From the `sync_service` folder start the lightweight Express server that serves the admin panel:

```bash
cd sync_service
npm run admin
```

Then open your browser to [http://localhost:3001](http://localhost:3001). Leave this tab open while completing the steps below.

---

With the admin UI running locally, follow these steps:

## Step 1: Fill in Your Broker Details

In the form on the left side, enter:

| Field | Your Value |
|-------|------------|
| **Connection Name** | `My Meshtastic` |
| **Broker Address** | `mqtt.meshtastic.org` |
| **Port** | `1883` |
| **Username** | Will auto-fill to `meshdev` ✨ |
| **Password** | Will auto-fill to `large4cats` ✨ |
| **Topic** | `msh/US/2/2/json/LandersOnly/!9e75c710` |
| **Node IDs** | `!9e75c710` |

### ✨ Auto-Fill Magic
When you type `mqtt.meshtastic.org` in the Broker Address field and tab away, the username and password will automatically populate!

## Step 2: Click "Add Broker Connection"

You should see:
- ✅ A success message: "✓ Broker added successfully!"
- ✅ Your new broker appears in the right panel
- ✅ Status shows "Enabled" in green

## Step 3: Verify in Convex

1. Open: https://dashboard.convex.dev/d/utmost-porcupine-898
2. Click "Data" tab
3. Select `brokerConfigs` table
4. You should see your broker configuration!

## Step 4: Start the Sync Service

In your terminal:
```bash
cd sync_service
npm run dev
```

You should see:
```
🚀 Meshtastic Multi-Broker Service started
🔌 Connecting to broker: My Meshtastic
   URL: mqtt://mqtt.meshtastic.org:1883
   Topic: msh/US/2/2/json/LandersOnly/!9e75c710
✓ Connected to My Meshtastic
✓ Subscribed to msh/US/2/2/json/LandersOnly/!9e75c710
  Filtering for nodes: !9e75c710
```

## Step 5: Wait for Position Data

When your Meshtastic device sends a position, you'll see:
```
📍 [My Meshtastic] Position: !9e75c710 @ (35.205280, -7.925523)
✓ Logged to Convex
```

Then check Convex Dashboard → `positions` table to see the stored data!

---

## 🐛 Troubleshooting

### If nothing happens when clicking "Add Broker Connection":

1. Open browser console (F12)
2. Look for red error messages
3. Common issues:
   - CORS errors → This is okay, Convex handles it
   - "Cannot read property" errors → Report these!

### If broker appears but service won't connect:

1. Check your Meshtastic device is online
2. Verify the topic pattern is correct
3. Try using wildcard: `msh/US/2/#` to catch all messages
4. Check firewall allows outbound port 1883

### If credentials don't auto-fill:

- Make sure you typed exactly: `mqtt.meshtastic.org`
- Try clicking in the username field after entering broker
- You can manually type: `meshdev` / `large4cats`

---

## ✅ Success Checklist

- [ ] Admin UI loads without errors
- [ ] Can add broker configuration
- [ ] Broker appears in right panel
- [ ] Visible in Convex Dashboard
- [ ] Sync service connects successfully
- [ ] Position updates appear in logs
- [ ] Data stored in Convex `positions` table

Once all checked, you're ready to update the Expo app! 🎉
