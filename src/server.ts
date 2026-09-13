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

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'online',
    system: 'Hotel QR Table Ordering System API',
    timestamp: new Date().toISOString(),
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
