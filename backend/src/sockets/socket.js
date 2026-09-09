const { Server } = require('socket.io');

let io = null;

// Initialize Socket.io on top of the existing HTTP server
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // tighten this to your dashboard's origin in production
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Dashboard client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Dashboard client disconnected:', socket.id);
    });
  });

  return io;
}

// Emit a new incoming message event to all connected dashboard clients
function emitNewMessage(payload) {
  if (!io) return;
  io.emit('new_message', payload);
}

module.exports = { initSocket, emitNewMessage };
