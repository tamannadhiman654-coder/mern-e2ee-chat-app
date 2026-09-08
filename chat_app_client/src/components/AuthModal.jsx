import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Shield, Lock, Mail, User, Image as ImageIcon, Sparkles, KeyRound } from 'lucide-react';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Aiden',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bella',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Charlie',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Daisy',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Echo'
];

export default function AuthModal() {
  const { isDark } = useTheme();
  const { login, register } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('Hey there! I am using E2EE Chat.');
  const [profilePic, setProfilePic] = useState(PRESET_AVATARS[0]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file is too large (max 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!username.trim()) throw new Error('Username is required');
        if (!email.trim()) throw new Error('Email is required');
        if (password.length < 6) throw new Error('Password must be at least 6 characters');

        await register({
          username: username.trim(),
          email: email.trim(),
          password,
          bio: bio.trim(),
          profilePic
        });
      } else {
        if (!email.trim() || !password) throw new Error('Please enter email and password');
        await login(email.trim(), password);
      }
    } catch (err) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Cannot connect to backend server. Please verify that the server is running on http://localhost:8080.');
      } else {
        setError(err.message || 'Authentication error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
        isDark ? 'bg-black text-white' : 'bg-[#f4f8fa] text-[#092c3e]'
      }`}
    >
      <div
        className={`w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all duration-300 ${
          isDark
            ? 'bg-[#0d0d0e] border-[#27272a] shadow-yellow-500/5'
            : 'bg-white border-[#d1e7ef] shadow-teal-500/10'
        }`}
      >
        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div
            className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
              isDark
                ? 'bg-[#facc15] text-black shadow-yellow-500/20'
                : 'bg-gradient-to-br from-[#005f73] via-[#0a9396] to-[#38bdf8] text-white shadow-teal-500/25'
            }`}
          >
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            {isRegister
              ? 'Join E2EE Chat with end-to-end encryption keys'
              : 'Sign in to access your secure chats & calls'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          className={`grid grid-cols-2 p-1 rounded-2xl mb-6 border ${
            isDark ? 'bg-[#17171a] border-[#27272a]' : 'bg-[#eaf6fa] border-[#d1e7ef]'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              !isRegister
                ? isDark
                  ? 'bg-[#facc15] text-black shadow-md'
                  : 'bg-white text-[#005f73] shadow-sm'
                : isDark
                ? 'text-zinc-400 hover:text-white'
                : 'text-slate-600 hover:text-[#005f73]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              isRegister
                ? isDark
                  ? 'bg-[#facc15] text-black shadow-md'
                  : 'bg-white text-[#005f73] shadow-sm'
                : isDark
                ? 'text-zinc-400 hover:text-white'
                : 'text-slate-600 hover:text-[#005f73]'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl text-xs bg-red-500/15 border border-red-500/30 text-red-500 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              {/* Profile Avatar Selection */}
              <div>
                <label className="block text-xs font-bold mb-2">Select Avatar or Upload</label>
                <div className="flex items-center space-x-3 mb-2">
                  <img
                    src={profilePic}
                    alt="Preview"
                    className="w-12 h-12 rounded-full object-cover border-2 border-dashed border-[#0a9396] p-0.5"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="avatar-file"
                      className={`cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isDark
                          ? 'bg-[#17171a] border-[#27272a] text-zinc-300 hover:text-white hover:border-[#facc15]'
                          : 'bg-[#eaf6fa] border-[#d1e7ef] text-[#005f73] hover:bg-[#d8f0f6]'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Upload Custom</span>
                    </label>
                    <input
                      id="avatar-file"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Preset Avatars */}
                <div className="flex space-x-2 overflow-x-auto py-1">
                  {PRESET_AVATARS.map((avatar, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setProfilePic(avatar)}
                      className={`flex-shrink-0 w-8 h-8 rounded-full border-2 transition-all ${
                        profilePic === avatar
                          ? isDark
                            ? 'border-[#facc15] scale-110'
                            : 'border-[#005f73] scale-110'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={avatar} alt="Preset" className="w-full h-full rounded-full" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold mb-1">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. alex_coder"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border transition-all outline-none ${
                      isDark
                        ? 'bg-[#17171a] border-[#27272a] text-white focus:border-[#facc15]'
                        : 'bg-[#f4f8fa] border-[#d1e7ef] text-[#092c3e] focus:border-[#0a9396] focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* Bio Input */}
              <div>
                <label className="block text-xs font-bold mb-1">Bio (Status)</label>
                <input
                  type="text"
                  placeholder="Hey there! I am using E2EE Chat."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border transition-all outline-none ${
                    isDark
                      ? 'bg-[#17171a] border-[#27272a] text-white focus:border-[#facc15]'
                      : 'bg-[#f4f8fa] border-[#d1e7ef] text-[#092c3e] focus:border-[#0a9396] focus:bg-white'
                  }`}
                />
              </div>
            </>
          )}

          {/* Email Input */}
          <div>
            <label className="block text-xs font-bold mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border transition-all outline-none ${
                  isDark
                    ? 'bg-[#17171a] border-[#27272a] text-white focus:border-[#facc15]'
                    : 'bg-[#f4f8fa] border-[#d1e7ef] text-[#092c3e] focus:border-[#0a9396] focus:bg-white'
                }`}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-bold mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border transition-all outline-none ${
                  isDark
                    ? 'bg-[#17171a] border-[#27272a] text-white focus:border-[#facc15]'
                    : 'bg-[#f4f8fa] border-[#d1e7ef] text-[#092c3e] focus:border-[#0a9396] focus:bg-white'
                }`}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all mt-4 shadow-md ${
              isDark
                ? 'bg-[#facc15] hover:bg-[#eab308] text-black shadow-yellow-500/20'
                : 'bg-gradient-to-r from-[#005f73] via-[#0a9396] to-[#38bdf8] hover:opacity-95 text-white shadow-teal-500/20'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <span>Processing...</span>
            ) : isRegister ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Register & Enter</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Sign In & Enter</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
