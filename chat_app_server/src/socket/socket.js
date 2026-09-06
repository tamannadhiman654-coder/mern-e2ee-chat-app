import { Server } from 'socket.io';
import Message from '../publickey/message.js';
import User from '../model/user_model.js';

const userSocketMap = new Map(); // Store online users: userId -> socketId

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    // 1. User Presence Registration
    socket.on('register_user', async (userId) => {
      userSocketMap.set(userId, socket.id);
      socket.userId = userId;
      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit('user_status_change', { userId, isOnline: true });
    });

    // 2. Real-Time Encrypted Chat Relay
    socket.on('send_encrypted_message', async (data) => {
      const { senderId, receiverId, ciphertext, iv } = data;

      // Save encrypted payload to database
      const savedMessage = await Message.create({
        sender: senderId,
        receiver: receiverId,
        ciphertext,
        iv
      });

      const receiverSocketId = userSocketMap.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_encrypted_message', savedMessage);
      }
    });

    // 3. WebRTC Call Signaling (Audio / Video)
    socket.on('call_user', ({ userToCall, signalData, from, name }) => {
      const receiverSocketId = userSocketMap.get(userToCall);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('incoming_call', { signal: signalData, from, name });
      }
    });

    socket.on('answer_call', (data) => {
      const callerSocketId = userSocketMap.get(data.to);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call_accepted', data.signal);
      }
    });

    socket.on('ice_candidate', ({ to, candidate }) => {
      const targetSocketId = userSocketMap.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('ice_candidate', { candidate });
      }
    });

    socket.on('end_call', ({ to }) => {
      const targetSocketId = userSocketMap.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('call_ended');
      }
    });

    // 4. Disconnect Handling
    socket.on('disconnect', async () => {
      if (socket.userId) {
        userSocketMap.delete(socket.userId);
        await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen: new Date() });
        io.emit('user_status_change', { userId: socket.userId, isOnline: false });
      }
    });
  });

  return io;
};