import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    publicKey: { type: String, default: '' }, // For end-to-end encryption
    profilePic: { type: String, default: '' },
    bio: { type: String, default: 'Hey there! I am using E2EE Chat.' },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);