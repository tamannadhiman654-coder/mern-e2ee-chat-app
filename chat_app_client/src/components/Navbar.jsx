import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Sun,
  Moon,
  UserPlus,
  Bell,
  LogOut,
  ShieldCheck
} from 'lucide-react';

export default function Navbar({ onOpenProfile, onOpenFriends, onOpenSearch }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { pendingFriendRequestsCount } = useSocket();

  return (
    <header
      className={`h-16 px-4 md:px-6 flex items-center justify-between border-b transition-colors duration-300 ${
        isDark
          ? 'bg-[#0d0d0e] border-[#27272a] text-white'
          : 'bg-white border-[#d1e7ef] text-[#092c3e]'
      }`}
    >
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
            isDark
              ? 'bg-[#facc15] text-black shadow-yellow-500/20'
              : 'bg-gradient-to-br from-[#005f73] via-[#0a9396] to-[#38bdf8] text-white shadow-teal-500/20'
          }`}
        >
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span
              className={`font-black text-lg tracking-tight ${
                isDark
                  ? 'text-white'
                  : 'bg-gradient-to-r from-[#005f73] to-[#0a9396] bg-clip-text text-transparent'
              }`}
            >
              CipherChat
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isDark
                  ? 'bg-[#facc15]/15 text-[#facc15] border border-[#facc15]/30'
                  : 'bg-[#eaf6fa] text-[#0a9396] border border-[#d1e7ef]'
              }`}
            >
              E2EE
            </span>
          </div>
          <p className={`text-[11px] hidden sm:block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            End-to-End Encrypted Messenger
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 md:space-x-3">
        {/* Dark / Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Theme (White + Peacock + Sky Blue)' : 'Switch to Dark Theme (Black + Yellow)'}
          className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center space-x-1.5 font-medium text-xs ${
            isDark
              ? 'bg-[#17171a] border-[#facc15]/40 text-[#facc15] hover:bg-[#facc15]/15 shadow-sm shadow-yellow-500/10'
              : 'bg-[#eaf6fa] border-[#d1e7ef] text-[#005f73] hover:bg-[#d8f0f6]'
          }`}
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-[#facc15] animate-spin-slow" />
              <span className="hidden md:inline font-semibold">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-[#005f73]" />
              <span className="hidden md:inline font-semibold">Dark</span>
            </>
          )}
        </button>

        {user && (
          <>
            {/* Friend Requests Bell Button */}
            <button
              onClick={onOpenFriends}
              title="Friend Requests"
              className={`relative p-2.5 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-[#17171a] border-[#27272a] text-zinc-300 hover:text-[#facc15] hover:border-[#facc15]/50'
                  : 'bg-white border-[#d1e7ef] text-[#005f73] hover:bg-[#eaf6fa]'
              }`}
            >
              <Bell className="w-4 h-4" />
              {pendingFriendRequestsCount > 0 && (
                <span
                  className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse ${
                    isDark ? 'bg-[#facc15] text-black' : 'bg-red-500 text-white'
                  }`}
                >
                  {pendingFriendRequestsCount}
                </span>
              )}
            </button>

            {/* Add Friend Search Button */}
            <button
              onClick={onOpenSearch}
              title="Add Friends"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isDark
                  ? 'bg-[#17171a] border-[#27272a] text-zinc-200 hover:text-black hover:bg-[#facc15] hover:border-[#facc15]'
                  : 'bg-[#005f73] border-[#005f73] text-white hover:bg-[#0a9396] hover:border-[#0a9396]'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Friends</span>
            </button>

            {/* User Profile Chip */}
            <button
              onClick={onOpenProfile}
              title="View & Edit Profile"
              className={`flex items-center space-x-2 pl-1.5 pr-3 py-1.5 rounded-full border transition-all ${
                isDark
                  ? 'bg-[#17171a] border-[#27272a] hover:border-[#facc15]/60 text-white'
                  : 'bg-[#eaf6fa] border-[#d1e7ef] hover:border-[#0a9396] text-[#092c3e]'
              }`}
            >
              {user.profilePic ? (
                <img
                  src={user.profilePic}
                  alt={user.username}
                  className="w-7 h-7 rounded-full object-cover border"
                />
              ) : (
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    isDark ? 'bg-[#facc15] text-black' : 'bg-[#0a9396] text-white'
                  }`}
                >
                  {user.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="text-xs font-semibold max-w-[90px] truncate">
                {user.username}
              </span>
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Log Out"
              className={`p-2.5 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-[#17171a] border-[#27272a] text-red-400 hover:bg-red-500/10 hover:border-red-500/40'
                  : 'bg-white border-[#d1e7ef] text-red-600 hover:bg-red-50 hover:border-red-200'
              }`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
