import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../model/user_model.js';
import { sendEmail } from '../utils/sendemail.js';

export const register = async (req, res, next) => {
  try {
    const { username, email, password, publicKey, bio, profilePic } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      publicKey: publicKey || '',
      bio: bio || 'Hey there! I am using E2EE Chat.',
      profilePic: profilePic || ''
    });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'secret_key', {
      expiresIn: '7d'
    });

    // Send Welcome Email (Non-blocking)
    sendEmail({
      to: user.email,
      subject: 'Welcome to E2EE Chat App!',
      html: `<h3>Hello ${user.username},</h3><p>Your account has been created successfully. Your Public Key is registered for end-to-end encrypted messaging.</p>`
    }).catch((err) => console.error('Welcome email error:', err.message));

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        publicKey: user.publicKey,
        bio: user.bio,
        profilePic: user.profilePic,
        friends: user.friends || []
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'secret_key', {
      expiresIn: '7d'
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        publicKey: user.publicKey,
        bio: user.bio,
        profilePic: user.profilePic,
        friends: user.friends || []
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicKey = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('publicKey username email');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, publicKey: user.publicKey, username: user.username });
  } catch (error) {
    next(error);
  }
};