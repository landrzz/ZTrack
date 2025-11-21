const express = require('express');
const path = require('path');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.ADMIN_PORT || 3001;

// Service process management
let serviceProcess = null;
let serviceStartTime = null;
let serviceStatus = 'stopped'; // 'running', 'stopped', 'error'

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

// Service management endpoints
app.get('/api/service/status', (req, res) => {
  res.json({
    status: serviceStatus,
    running: serviceProcess !== null && !serviceProcess.killed,
    startTime: serviceStartTime,
    pid: serviceProcess ? serviceProcess.pid : null
  });
});

app.post('/api/service/start', (req, res) => {
  if (serviceProcess && !serviceProcess.killed) {
    return res.json({ success: false, message: 'Service is already running' });
  }

  try {
    // Start the multi-broker service
    serviceProcess = spawn('npm', ['run', 'dev'], {
      cwd: __dirname,
      detached: false,
      stdio: 'pipe'
    });

    serviceStartTime = new Date().toISOString();
    serviceStatus = 'running';

    serviceProcess.on('error', (error) => {
      console.error('Service process error:', error);
      serviceStatus = 'error';
      serviceProcess = null;
    });

    serviceProcess.on('exit', (code, signal) => {
      console.log(`Service process exited with code ${code}, signal ${signal}`);
      serviceStatus = 'stopped';
      serviceProcess = null;
      serviceStartTime = null;
    });

    // Log output for debugging
    serviceProcess.stdout.on('data', (data) => {
      console.log(`[Service] ${data.toString()}`);
    });

    serviceProcess.stderr.on('data', (data) => {
      console.error(`[Service Error] ${data.toString()}`);
    });

    console.log(`[AdminServer] Started sync service with PID: ${serviceProcess.pid}`);
    
    res.json({ 
      success: true, 
      message: 'Service started successfully',
      pid: serviceProcess.pid,
      startTime: serviceStartTime
    });
  } catch (error) {
    console.error('Failed to start service:', error);
    serviceStatus = 'error';
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/service/stop', (req, res) => {
  if (!serviceProcess || serviceProcess.killed) {
    return res.json({ success: false, message: 'Service is not running' });
  }

  try {
    console.log(`[AdminServer] Stopping sync service (PID: ${serviceProcess.pid})`);
    
    // Try graceful shutdown first
    serviceProcess.kill('SIGTERM');
    
    // Force kill after 5 seconds if it doesn't stop
    setTimeout(() => {
      if (serviceProcess && !serviceProcess.killed) {
        console.log('[AdminServer] Force killing service...');
        serviceProcess.kill('SIGKILL');
      }
    }, 5000);

    serviceStatus = 'stopped';
    serviceProcess = null;
    serviceStartTime = null;

    res.json({ success: true, message: 'Service stopped successfully' });
  } catch (error) {
    console.error('Failed to stop service:', error);
    res.json({ success: false, message: error.message });
  }
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
