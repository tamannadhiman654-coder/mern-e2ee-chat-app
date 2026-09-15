import FriendRequest from '../model/friend_request_model.js';
import User from '../model/user_model.js';
import { getIO, getSocketIdForUser } from '../socket/socket.js';

// Send Friend Request
export const sendFriendRequest = async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const { receiverId } = req.params;

    if (senderId === receiverId) {
      return res.status(400).json({ success: false, message: 'You cannot send a friend request to yourself' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const sender = await User.findById(senderId);
    if (sender.friends && sender.friends.includes(receiverId)) {
      return res.status(400).json({ success: false, message: 'Already friends' });
    }

    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ],
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'Friend request already pending' });
    }

    const newRequest = await FriendRequest.create({
      sender: senderId,
      receiver: receiverId,
      status: 'pending'
    });

    const populatedRequest = await FriendRequest.findById(newRequest._id)
      .populate('sender', 'username email bio profilePic isOnline lastSeen')
      .populate('receiver', 'username email bio profilePic isOnline lastSeen');

    // Socket notification
    try {
      const io = getIO();
      const receiverSocketId = getSocketIdForUser(receiverId);
      if (io && receiverSocketId) {
        io.to(receiverSocketId).emit('friend_request_received', populatedRequest);
      }
    } catch (err) {
      console.warn('Socket notification skipped:', err.message);
    }

    res.status(201).json({ success: true, request: populatedRequest });
  } catch (error) {
    next(error);
  }
};

// Get Friend Requests (both incoming and outgoing)
export const getFriendRequests = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const incoming = await FriendRequest.find({
      receiver: userId,
      status: 'pending'
    }).populate('sender', 'username email bio profilePic isOnline lastSeen publicKey');

    const outgoing = await FriendRequest.find({
      sender: userId,
      status: 'pending'
    }).populate('receiver', 'username email bio profilePic isOnline lastSeen publicKey');

    res.json({ success: true, incoming, outgoing });
  } catch (error) {
    next(error);
  }
};

// Accept Friend Request
export const acceptFriendRequest = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    const request = await FriendRequest.findOne({ _id: requestId, receiver: userId, status: 'pending' })
      .populate('sender', 'username email bio profilePic isOnline lastSeen')
      .populate('receiver', 'username email bio profilePic isOnline lastSeen');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Friend request not found or already processed' });
    }

    request.status = 'accepted';
    await request.save();

    // Add each other to friends array
    await User.findByIdAndUpdate(userId, { $addToSet: { friends: request.sender._id } });
    await User.findByIdAndUpdate(request.sender._id, { $addToSet: { friends: userId } });

    // Socket notification
    try {
      const io = getIO();
      const senderSocketId = getSocketIdForUser(request.sender._id.toString());
      if (io && senderSocketId) {
        io.to(senderSocketId).emit('friend_request_accepted', {
          request,
          friend: request.receiver
        });
      }
    } catch (err) {
      console.warn('Socket notification skipped:', err.message);
    }

    res.json({ success: true, message: 'Friend request accepted', request });
  } catch (error) {
    next(error);
  }
};

// Reject / Cancel Friend Request
export const rejectFriendRequest = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    const request = await FriendRequest.findOneAndDelete({
      _id: requestId,
      $or: [{ receiver: userId }, { sender: userId }]
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Friend request not found' });
    }

    res.json({ success: true, message: 'Friend request removed' });
  } catch (error) {
    next(error);
  }
};

// Get Friends List
export const getFriends = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate(
      'friends',
      'username email bio profilePic isOnline lastSeen publicKey'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, friends: user.friends || [] });
  } catch (error) {
    next(error);
  }
};
