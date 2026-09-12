import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export const initSocket = (server: HTTPServer, allowedOrigins: string[]) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`⚡ Client connected to WebSocket: ${socket.id}`);

    // Join table or order room for targeted updates
    socket.on('join_order', (orderId: string) => {
      socket.join(`order:${orderId}`);
      console.log(`Socket ${socket.id} joined order:${orderId}`);
    });

    socket.on('join_admin', () => {
      socket.join('admin_channel');
      console.log(`Socket ${socket.id} joined admin_channel`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected from WebSocket: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO not initialized! Call initSocket first.');
  }
  return io;
};

// Real-time Event Broadcasters
export const emitNewOrder = (order: any) => {
  if (io) {
    io.to('admin_channel').emit('order:new', order);
    io.emit('order:new', order); // Broadcast to any active dashboard listeners
  }
};

export const emitOrderStatusUpdate = (orderId: string, order: any) => {
  if (io) {
    io.to(`order:${orderId}`).emit('order:status_updated', order);
    io.to('admin_channel').emit('order:status_updated', order);
    io.emit('order:status_updated', order);
  }
};

export const emitWaiterCall = (waiterCall: any) => {
  if (io) {
    io.to('admin_channel').emit('waiter:call', waiterCall);
    io.emit('waiter:call', waiterCall);
  }
};
