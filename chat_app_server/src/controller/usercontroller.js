import User from '../model/user_model.js';
import Message from '../publickey/message.js';
import FriendRequest from '../model/friend_request_model.js';

// Get Current User Profile
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// Update User Profile (Username, Bio, Profile Picture)
export const updateProfile = async (req, res, next) => {
  try {
    const { username, bio, profilePic } = req.body;
    const userId = req.user.id;

    if (username) {
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username is already taken' });
      }
    }

    const updates = {};
    if (username !== undefined) updates.username = username.trim();
    if (bio !== undefined) updates.bio = bio;
    if (profilePic !== undefined) updates.profilePic = profilePic;

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true }).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// Search Users for Friend Requests
export const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user.id;

    if (!q || !q.trim()) {
      return res.json({ success: true, users: [] });
    }

    const regex = new RegExp(q.trim(), 'i');
    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [{ username: regex }, { email: regex }]
    }).select('username email bio profilePic isOnline lastSeen publicKey');

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// Get All Users (Suggestions / Directory)
export const getAllUsers = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select('username email bio profilePic isOnline lastSeen publicKey')
      .limit(50);

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// Delete Account & Associated Data
export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Delete all messages sent or received by the user
    await Message.deleteMany({
      $or: [{ sender: userId }, { receiver: userId }]
    });

    // 2. Delete all friend requests involving the user
    await FriendRequest.deleteMany({
      $or: [{ sender: userId }, { receiver: userId }]
    });

    // 3. Remove user from all friends lists
    await User.updateMany(
      { friends: userId },
      { $pull: { friends: userId } }
    );

    // 4. Delete the user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Account and all related data deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
