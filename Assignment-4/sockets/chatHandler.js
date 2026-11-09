const jwt = require('jsonwebtoken');

const ROOM_NAME_PATTERN = /^[a-zA-Z0-9_-]{1,50}$/;
const MAX_MESSAGE_LENGTH = 500;

const chatHandler = (io) => {
  // Authenticate every socket connection with the same JWT used by the REST API.
  // Client sends it as: io(url, { auth: { token } })
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers.token;

    if (!token) {
      return next(new Error('No token provided'));
    }

    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { username } = socket.user;
    console.log(`User connected: ${username} (${socket.id})`);

    // join_room: payload is a room name string, e.g. "general"
    socket.on('join_room', (room) => {
      if (typeof room !== 'string' || !ROOM_NAME_PATTERN.test(room)) {
        return socket.emit('error_message', {
          message: 'Room name must be 1-50 letters, numbers, _ or -',
        });
      }

      socket.join(room);
      console.log(`${username} joined room ${room}`);

      socket.emit('joined_room', { room });
      socket.to(room).emit('system_message', {
        room,
        message: `${username} joined the room`,
      });
    });

    // send_message: payload { room, message }
    socket.on('send_message', (payload) => {
      const { room, message } = payload || {};

      if (typeof room !== 'string' || !socket.rooms.has(room)) {
        return socket.emit('error_message', {
          message: 'Join the room before sending messages',
        });
      }

      if (typeof message !== 'string' || message.trim().length === 0) {
        return socket.emit('error_message', { message: 'Message cannot be empty' });
      }

      const text = message.trim().slice(0, MAX_MESSAGE_LENGTH);

      console.log(`[${room}] ${username}: ${text}`);

      io.to(room).emit('receive_message', {
        room,
        username,
        message: text,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${username} (${socket.id}) - ${reason}`);
    });
  });
};

module.exports = chatHandler;
