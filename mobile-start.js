/**
 * Ojasvita Mobile Development Server
 * 
 * This script starts both backend and frontend servers
 * and displays the network URLs for mobile access.
 */

const { exec } = require('child_process');
const os = require('os');

/**
 * Get all network IP addresses
 */
function getNetworkIPs() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  
  return addresses;
}

/**
 * Display startup information
 */
function displayInfo() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           OJASVITA - MOBILE DEVELOPMENT SERVER               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  const ips = getNetworkIPs();
  
  console.log('📱 MOBILE ACCESS URLs:');
  console.log('─────────────────────────────────────────────────────────────');
  
  if (ips.length === 0) {
    console.log('⚠️  No network interfaces found. Connect to WiFi to access from phone.');
  } else {
    ips.forEach(ip => {
      console.log(`   Frontend: http://${ip}:5173`);
      console.log(`   Backend:  http://${ip}:5000`);
      console.log('');
    });
  }
  
  console.log('💻 LOCAL ACCESS:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('   Frontend: http://localhost:5173');
  console.log('   Backend:  http://localhost:5000');
  console.log('');
  
  console.log('📋 INSTRUCTIONS:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('   1. Connect your phone to the same WiFi network');
  console.log('   2. Open one of the Frontend URLs on your phone browser');
  console.log('   3. For PWA install:');
  console.log('      • Android: Menu → Add to Home screen');
  console.log('      • iOS: Share → Add to Home Screen');
  console.log('');
  console.log('⚠️  Make sure MongoDB is running before starting!');
  console.log('');
  console.log('Starting servers...\n');
}

/**
 * Start the servers
 */
function startServers() {
  displayInfo();
  
  // Start backend server
  const backend = exec('npm start', {
    cwd: __dirname
  });
  
  backend.stdout.on('data', (data) => {
    console.log(`[BACKEND] ${data.toString().trim()}`);
  });
  
  backend.stderr.on('data', (data) => {
    console.error(`[BACKEND ERROR] ${data.toString().trim()}`);
  });
  
  // Start frontend server after a short delay
  setTimeout(() => {
    const frontend = exec('npm run dev', {
      cwd: __dirname + '/frontend'
    });
    
    frontend.stdout.on('data', (data) => {
      console.log(`[FRONTEND] ${data.toString().trim()}`);
    });
    
    frontend.stderr.on('data', (data) => {
      console.error(`[FRONTEND ERROR] ${data.toString().trim()}`);
    });
  }, 3000);
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n\nShutting down servers...');
    backend.kill();
    process.exit(0);
  });
}

// Run the script
startServers();
