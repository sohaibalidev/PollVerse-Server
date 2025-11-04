const { Server } = require('socket.io');
const appConfig = require('./app.config');

exports.setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: appConfig.FRONTEND_URL.replace(/\/$/, ''),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[SOCKET] User connected: ${socket.id}`);

    socket.on('joinPoll', (pollCode) => {
      socket.join(`poll_${pollCode}`);
      console.log(`[SOCKET] User ${socket.id} joined poll: ${pollCode}`);
    });

    socket.on('leavePoll', (pollCode) => {
      socket.leave(`poll_${pollCode}`);
      console.log(`[SOCKET] User ${socket.id} left poll: ${pollCode}`);
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET] User disconnected: ${socket.id}`);
    });
  });

  global._io = io;
  console.log('[SOCKET] Socket.IO initialized successfully');
};
