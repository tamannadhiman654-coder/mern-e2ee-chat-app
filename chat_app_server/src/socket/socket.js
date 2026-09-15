import { Server } from 'socket.io';
import Message from '../publickey/message.js';
import User from '../model/user_model.js';

const userSocketMap = new Map(); // Store online users: userId -> socketId
let ioInstance = null;

export const getIO = () => ioInstance;
export const getSocketIdForUser = (userId) => userSocketMap.get(userId?.toString());

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  ioInstance = io;

  io.on('connection', (socket) => {
    // 1. User Presence Registration
    socket.on('register_user', async (userId) => {
      if (!userId) return;
      userSocketMap.set(userId.toString(), socket.id);
      socket.userId = userId.toString();

      try {
        await User.findByIdAndUpdate(userId, { isOnline: true });
      } catch (err) {
        console.error('Error updating user online status:', err);
      }

      // Broadcast status change
      io.emit('user_status_change', { userId: userId.toString(), isOnline: true });

      // Send the current list of online user IDs to the connected user
      socket.emit('online_users_list', Array.from(userSocketMap.keys()));
    });

    // 2. Real-Time Encrypted Chat Relay
    socket.on('send_encrypted_message', async (data) => {
      try {
        const { senderId, receiverId, ciphertext, iv } = data;

        // Save encrypted payload to database
        const savedMessage = await Message.create({
          sender: senderId,
          receiver: receiverId,
          ciphertext,
          iv
        });

        // Emit back to sender with created _id and timestamp
        socket.emit('message_sent', savedMessage);

        // Send to receiver if online
        const receiverSocketId = userSocketMap.get(receiverId?.toString());
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_encrypted_message', savedMessage);
        }
      } catch (err) {
        console.error('Error in send_encrypted_message:', err);
      }
    });

    // 3. Typing Indicators
    socket.on('typing', ({ to, from }) => {
      const targetSocketId = userSocketMap.get(to?.toString());
      if (targetSocketId) {
        io.to(targetSocketId).emit('user_typing', { from });
      }
    });

    socket.on('stop_typing', ({ to, from }) => {
      const targetSocketId = userSocketMap.get(to?.toString());
      if (targetSocketId) {
        io.to(targetSocketId).emit('user_stop_typing', { from });
      }
    });

    // 4. WebRTC Call Signaling (Audio / Video)
    socket.on('call_user', ({ userToCall, signalData, from, name, avatar, callType }) => {
      const receiverSocketId = userSocketMap.get(userToCall?.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('incoming_call', {
          signal: signalData,
          from,
          name,
          avatar,
          callType: callType || 'video'
        });
      } else {
        socket.emit('call_failed', { reason: 'User is offline' });
      }
    });

    socket.on('answer_call', (data) => {
      const callerSocketId = userSocketMap.get(data.to?.toString());
      if (callerSocketId) {
        io.to(callerSocketId).emit('call_accepted', data.signal);
      }
    });

    socket.on('reject_call', ({ to }) => {
      const callerSocketId = userSocketMap.get(to?.toString());
      if (callerSocketId) {
        io.to(callerSocketId).emit('call_rejected');
      }
    });

    socket.on('ice_candidate', ({ to, candidate }) => {
      const targetSocketId = userSocketMap.get(to?.toString());
      if (targetSocketId) {
        io.to(targetSocketId).emit('ice_candidate', { candidate });
      }
    });

    socket.on('end_call', ({ to }) => {
      const targetSocketId = userSocketMap.get(to?.toString());
      if (targetSocketId) {
        io.to(targetSocketId).emit('call_ended');
      }
    });

    // 5. Disconnect Handling
    socket.on('disconnect', async () => {
      if (socket.userId) {
        userSocketMap.delete(socket.userId);
        try {
          await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen: new Date() });
        } catch (err) {
          console.error('Error updating user offline status:', err);
        }
        io.emit('user_status_change', { userId: socket.userId, isOnline: false, lastSeen: new Date() });
      }
    });
  });

  return io;
};