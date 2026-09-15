import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { Search, UserPlus, Users } from 'lucide-react';

export default function Sidebar({
  friends = [],
  activeFriend,
  onSelectFriend,
  onOpenSearch,
  loading
}) {
  const { isDark } = useTheme();
  const { onlineUsers } = useSocket();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside
      className={`w-full md:w-80 h-full flex flex-col border-r transition-colors duration-300 ${
        isDark
          ? 'bg-[#0d0d0e] border-[#27272a] text-white'
          : 'bg-[#ffffff] border-[#d1e7ef] text-[#092c3e]'
      }`}
    >
      {/* Search and Header */}
      <div className="p-4 border-b border-inherit">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Users
              className={`w-4 h-4 ${isDark ? 'text-[#facc15]' : 'text-[#0a9396]'}`}
            />
            <h2 className="font-bold text-sm">Friends & Chats</h2>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              isDark
                ? 'bg-[#17171a] text-[#facc15]'
                : 'bg-[#eaf6fa] text-[#005f73]'
            }`}
          >
            {friends.length}
          </span>
        </div>

        {/* Filter Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search friends..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl border transition-all outline-none ${
              isDark
                ? 'bg-[#17171a] border-[#27272a] text-white placeholder-zinc-500 focus:border-[#facc15]'
                : 'bg-[#f4f8fa] border-[#d1e7ef] text-[#092c3e] placeholder-slate-400 focus:border-[#0a9396] focus:bg-white'
            }`}
          />
        </div>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <div className="p-6 text-center text-xs text-slate-400">Loading friends...</div>
        ) : filteredFriends.length === 0 ? (
          <div className="p-6 text-center">
            <p className={`text-xs mb-3 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              {friends.length === 0 ? 'No friends added yet.' : 'No friends match your search.'}
            </p>
            {friends.length === 0 && (
              <button
                onClick={onOpenSearch}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isDark
                    ? 'bg-[#facc15] text-black border-[#facc15] hover:bg-[#eab308]'
                    : 'bg-[#005f73] text-white border-[#005f73] hover:bg-[#0a9396]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Find People</span>
              </button>
            )}
          </div>
        ) : (
          filteredFriends.map((friend) => {
            const isOnline = onlineUsers.has(friend._id || friend.id);
            const isSelected = activeFriend && (activeFriend._id === friend._id || activeFriend.id === friend.id);

            return (
              <button
                key={friend._id || friend.id}
                onClick={() => onSelectFriend(friend)}
                className={`w-full p-2.5 rounded-2xl flex items-center space-x-3 text-left transition-all border ${
                  isSelected
                    ? isDark
                      ? 'bg-[#1c1c20] border-[#facc15] shadow-md shadow-yellow-500/5'
                      : 'bg-[#eaf6fa] border-[#0a9396] shadow-sm'
                    : isDark
                    ? 'border-transparent hover:bg-[#17171a]'
                    : 'border-transparent hover:bg-[#f4f8fa]'
                }`}
              >
                {/* Avatar with Online Status */}
                <div className="relative flex-shrink-0">
                  {friend.profilePic ? (
                    <img
                      src={friend.profilePic}
                      alt={friend.username}
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        isDark ? 'bg-[#facc15] text-black' : 'bg-[#0a9396] text-white'
                      }`}
                    >
                      {friend.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  {/* Status Dot */}
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${
                      isDark ? 'border-[#0d0d0e]' : 'border-white'
                    } ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}
                    title={isOnline ? 'Online' : 'Offline'}
                  />
                </div>

                {/* Friend Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold truncate">{friend.username}</h3>
                    <span
                      className={`text-[10px] ${
                        isOnline
                          ? 'text-emerald-500 font-semibold'
                          : isDark
                          ? 'text-zinc-500'
                          : 'text-slate-400'
                      }`}
                    >
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] truncate mt-0.5 ${
                      isDark ? 'text-zinc-400' : 'text-slate-500'
                    }`}
                  >
                    {friend.bio || 'Available'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
