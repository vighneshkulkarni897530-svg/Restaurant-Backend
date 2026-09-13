import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { initSocket } from './lib/socket';

// Routes
import authRoutes from './routes/authRoutes';
import tableRoutes from './routes/tableRoutes';
import menuRoutes from './routes/menuRoutes';
import orderRoutes from './routes/orderRoutes';
import paymentRoutes from './routes/paymentRoutes';
import waiterRoutes from './routes/waiterRoutes';
import reportRoutes from './routes/reportRoutes';
import settingRoutes from './routes/settingRoutes';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Initialize Socket.IO
initSocket(server, [FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000']);

// Middleware
app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/waiter', waiterRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);

import os from 'os';

export function getLocalIpAddresses(): { name: string; ip: string; isWifi: boolean; isHotspot: boolean }[] {
  const interfaces = os.networkInterfaces();
  const results: { name: string; ip: string; isWifi: boolean; isHotspot: boolean }[] = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const lower = name.toLowerCase();
        const isHotspot = iface.address.startsWith('192.168.137.') || lower.includes('hotspot') || lower.includes('wi-fi 3') || lower.includes('virtual');
        const isWifi = lower.includes('wi-fi') || lower.includes('wlan') || lower.includes('wireless') || isHotspot;
        
        let displayName = name;
        if (isHotspot) {
          displayName = `Mobile Hotspot (${iface.address})`;
        } else if (isWifi) {
          displayName = `Wi-Fi Network (${iface.address})`;
        } else {
          displayName = `Ethernet / LAN (${iface.address})`;
        }

        results.push({
          name: displayName,
          ip: iface.address,
          isWifi,
          isHotspot,
        });
      }
    }
  }

  // Sort real Wi-Fi first, then other LAN, then Hotspot
  results.sort((a, b) => {
    if (a.isWifi && !a.isHotspot) return -1;
    if (b.isWifi && !b.isHotspot) return 1;
    if (!a.isHotspot && b.isHotspot) return -1;
    if (a.isHotspot && !b.isHotspot) return 1;
    return 0;
  });

  return results;
}

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'online',
    system: 'Hotel QR Table Ordering System API',
    timestamp: new Date().toISOString(),
  });
});

// Network IP Discovery for Mobile QR Standees
app.get('/api/network-ip', (req: Request, res: Response) => {
  const ips = getLocalIpAddresses();
  const preferred = ips.find((i) => i.isWifi && !i.isHotspot)?.ip || ips[0]?.ip || '10.230.94.1';
  res.status(200).json({
    success: true,
    preferredIp: preferred,
    frontendUrl: `http://${preferred}:3000`,
    interfaces: ips,
  });
});

import { ensureDatabaseInitialized } from './lib/bootstrap';

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled API Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

server.listen(Number(PORT), '0.0.0.0', async () => {
  console.log(`=======================================================`);
  console.log(`🏨 Hotel QR Ordering Backend Server running on port ${PORT}`);
  console.log(`🔗 Local API: http://localhost:${PORT}/api`);
  console.log(`📱 LAN Network API: http://0.0.0.0:${PORT}/api (accessible via PC's Wi-Fi/LAN IP)`);
  console.log(`⚡ Real-time Socket.IO Server active`);
  console.log(`=======================================================`);
  
  // Safe auto-initialization of tables, menu items & settings without wiping any customer orders
  await ensureDatabaseInitialized();
});
