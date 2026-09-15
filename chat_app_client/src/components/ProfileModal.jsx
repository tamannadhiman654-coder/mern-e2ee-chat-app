import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { X, User, Image as ImageIcon, AlertTriangle, Check } from 'lucide-react';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Aiden',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bella',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Charlie',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Daisy',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Echo'
];

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateProfile, deleteAccount } = useAuth();
  const { isDark } = useTheme();

  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profilePic, setProfilePic] = useState(user?.profilePic || PRESET_AVATARS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !user) return null;

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

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      if (!username.trim()) throw new Error('Username cannot be empty');
      await updateProfile({
        username: username.trim(),
        bio: bio.trim(),
        profilePic
      });
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl transition-all duration-300 ${
          isDark ? 'bg-[#0d0d0e] border-[#27272a] text-white' : 'bg-white border-[#d1e7ef] text-[#092c3e]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-inherit">
          <div className="flex items-center space-x-2">
            <User className={`w-5 h-5 ${isDark ? 'text-[#facc15]' : 'text-[#0a9396]'}`} />
            <h2 className="font-bold text-sm">Profile Settings</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl border transition-colors ${
              isDark ? 'border-[#27272a] text-zinc-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-black'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl text-xs bg-red-500/15 border border-red-500/30 text-red-500 font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 rounded-xl text-xs bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-medium flex items-center space-x-1.5">
            <Check className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          {/* Avatar Section */}
          <div>
            <label className="block text-xs font-bold mb-2">Profile Picture</label>
            <div className="flex items-center space-x-3 mb-2">
              <img
                src={profilePic}
                alt="Avatar"
                className="w-14 h-14 rounded-full object-cover border-2 border-dashed border-[#0a9396] p-0.5"
              />
              <div>
                <label
                  htmlFor="profile-upload"
                  className={`cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    isDark
                      ? 'bg-[#17171a] border-[#27272a] text-zinc-300 hover:border-[#facc15] hover:text-white'
                      : 'bg-[#eaf6fa] border-[#d1e7ef] text-[#005f73] hover:bg-[#d8f0f6]'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Upload Custom Picture</span>
                </label>
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Presets */}
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

          {/* Username */}
          <div>
            <label className="block text-xs font-bold mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-xl border transition-all outline-none ${
                isDark
                  ? 'bg-[#17171a] border-[#27272a] text-white focus:border-[#facc15]'
                  : 'bg-[#f4f8fa] border-[#d1e7ef] text-[#092c3e] focus:border-[#0a9396] focus:bg-white'
              }`}
            />
          </div>

          {/* Email (Read only) */}
          <div>
            <label className="block text-xs font-bold mb-1">Email (Registered)</label>
            <input
              type="text"
              disabled
              value={user.email}
              className={`w-full px-3 py-2 text-xs rounded-xl border opacity-60 cursor-not-allowed ${
                isDark ? 'bg-[#17171a] border-[#27272a] text-zinc-400' : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold mb-1">Bio (Status)</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others something about yourself..."
              className={`w-full px-3 py-2 text-xs rounded-xl border transition-all outline-none resize-none ${
                isDark
                  ? 'bg-[#17171a] border-[#27272a] text-white focus:border-[#facc15]'
                  : 'bg-[#f4f8fa] border-[#d1e7ef] text-[#092c3e] focus:border-[#0a9396] focus:bg-white'
              }`}
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md ${
              isDark
                ? 'bg-[#facc15] hover:bg-[#eab308] text-black shadow-yellow-500/20'
                : 'bg-gradient-to-r from-[#005f73] via-[#0a9396] to-[#38bdf8] text-white hover:opacity-95 shadow-teal-500/20'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        {/* Danger Zone: Delete Account */}
        <div className="mt-6 pt-4 border-t border-inherit">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-red-500">Delete Account</h4>
              <p className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                Permanently delete account and chat history
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Delete Confirmation Sub-modal */}
        {showConfirmDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div
              className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl ${
                isDark ? 'bg-[#0d0d0e] border-[#27272a] text-white' : 'bg-white border-[#d1e7ef] text-[#092c3e]'
              }`}
            >
              <div className="flex items-center space-x-3 text-red-500 mb-3">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="font-bold text-sm">Delete Your Account?</h3>
              </div>
              <p className={`text-xs mb-6 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                This will permanently delete your user account, profile, all encrypted conversations, and friend links. This action cannot be reversed.
              </p>
              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  disabled={deleting}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    isDark ? 'bg-[#17171a] border-[#27272a] text-white' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete My Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
