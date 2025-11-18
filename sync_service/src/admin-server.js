const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.ADMIN_PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the admin directory
app.use(express.static(path.join(__dirname, '../admin')));

// Serve the admin interface at the root with environment variables injected
app.get('/', (req, res) => {
  const fs = require('fs');
  const htmlPath = path.join(__dirname, '../admin/index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  
  // Inject Convex URL from environment
  require('dotenv').config();
  const convexUrl = process.env.CONVEX_URL || 'https://utmost-porcupine-898.convex.cloud';
  html = html.replace(
    'const CONVEX_URL = "https://utmost-porcupine-898.convex.cloud";',
    `const CONVEX_URL = "${convexUrl}";`
  );
  
  console.log('[AdminServer] Injecting Convex URL:', convexUrl);
  
  res.send(html);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Meshtastic Admin Interface'
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🌐 Meshtastic Admin Interface is running!`);
  console.log(`📍 Open your browser to: http://localhost:${PORT}`);
  console.log(`🔧 Health check: http://localhost:${PORT}/health`);
  console.log(`\n💡 This interface connects to your Convex database to manage MQTT broker connections.`);
  console.log(`📝 The sync service (npm run dev) should be running separately to handle the MQTT connections.\n`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down admin server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down admin server...');
  process.exit(0);
});
