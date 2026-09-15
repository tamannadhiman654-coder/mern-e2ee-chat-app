import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { url } from './GlobalUrl';
import {
  X,
  Search,
  UserPlus,
  Check,
  UserCheck,
  Clock,
  Inbox,
  Users
} from 'lucide-react';

export default function FriendModal({ isOpen, onClose, initialTab = 'search', onFriendAdded }) {
  const { user, token } = useAuth();
  const { isDark } = useTheme();
  const { setPendingFriendRequestsCount } = useSocket();

  const [activeTab, setActiveTab] = useState(initialTab); // 'search' | 'requests'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sentRequestIds, setSentRequestIds] = useState(new Set());

  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Load Requests
  const fetchRequests = async () => {
    if (!token) return;
    setLoadingRequests(true);
    try {
      const res = await fetch(`${url}api/friends/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setIncomingRequests(data.incoming || []);
        setOutgoingRequests(data.outgoing || []);
        setPendingFriendRequestsCount((data.incoming || []).length);
      }
    } catch (err) {
      console.error('Error fetching friend requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Load Initial Users when tab opened or searching
  useEffect(() => {
    if (!isOpen || !token) return;

    if (activeTab === 'requests') {
      fetchRequests();
    } else {
      // Fetch initial suggestions if search query is empty
      const fetchInitialUsers = async () => {
        setSearching(true);
        try {
          const endpoint = searchQuery.trim()
            ? `${url}api/users/search?q=${encodeURIComponent(searchQuery.trim())}`
            : `${url}api/users/all`;

          const res = await fetch(endpoint, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            setSearchResults(data.users || []);
          }
        } catch (err) {
          console.error('Error searching users:', err);
        } finally {
          setSearching(false);
        }
      };

      const delayDebounce = setTimeout(fetchInitialUsers, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [isOpen, activeTab, searchQuery, token]);

  if (!isOpen) return null;

  // Send Friend Request
  const handleSendRequest = async (targetUserId) => {
    setActionLoading(targetUserId);
    try {
      const res = await fetch(`${url}api/friends/request/${targetUserId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSentRequestIds((prev) => new Set(prev).add(targetUserId));
      } else {
        alert(data.message || 'Could not send request');
      }
    } catch (err) {
      console.error('Error sending friend request:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Accept Friend Request
  const handleAcceptRequest = async (requestId) => {
    setActionLoading(requestId);
    try {
      const res = await fetch(`${url}api/friends/accept/${requestId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setIncomingRequests((prev) => prev.filter((r) => r._id !== requestId));
        setPendingFriendRequestsCount((prev) => Math.max(0, prev - 1));
        if (onFriendAdded) onFriendAdded();
      }
    } catch (err) {
      console.error('Error accepting friend request:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Reject Friend Request
  const handleRejectRequest = async (requestId) => {
    setActionLoading(requestId);
    try {
      const res = await fetch(`${url}api/friends/reject/${requestId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setIncomingRequests((prev) => prev.filter((r) => r._id !== requestId));
        setOutgoingRequests((prev) => prev.filter((r) => r._id !== requestId));
        setPendingFriendRequestsCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error rejecting friend request:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        className={`w-full max-w-md h-[550px] rounded-3xl flex flex-col border shadow-2xl transition-all duration-300 ${
          isDark ? 'bg-[#0d0d0e] border-[#27272a] text-white' : 'bg-white border-[#d1e7ef] text-[#092c3e]'
        }`}
      >
        {/* Header with Tabs */}
        <div className="p-4 border-b border-inherit">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Users className={`w-5 h-5 ${isDark ? 'text-[#facc15]' : 'text-[#0a9396]'}`} />
              <h2 className="font-bold text-sm">Friends & Community</h2>
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

          {/* Tab Switcher */}
          <div
            className={`grid grid-cols-2 p-1 rounded-2xl border ${
              isDark ? 'bg-[#17171a] border-[#27272a]' : 'bg-[#eaf6fa] border-[#d1e7ef]'
            }`}
          >
            <button
              onClick={() => setActiveTab('search')}
              className={`py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'search'
                  ? isDark
                    ? 'bg-[#facc15] text-black shadow-md'
                    : 'bg-white text-[#005f73] shadow-sm'
                  : isDark
                  ? 'text-zinc-400 hover:text-white'
                  : 'text-slate-600 hover:text-[#005f73]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Find Users</span>
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'requests'
                  ? isDark
                    ? 'bg-[#facc15] text-black shadow-md'
                    : 'bg-white text-[#005f73] shadow-sm'
                  : isDark
                  ? 'text-zinc-400 hover:text-white'
                  : 'text-slate-600 hover:text-[#005f73]'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Requests ({incomingRequests.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Search Users */}
        {activeTab === 'search' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl border transition-all outline-none ${
                  isDark
                    ? 'bg-[#17171a] border-[#27272a] text-white focus:border-[#facc15]'
                    : 'bg-[#f4f8fa] border-[#d1e7ef] text-[#092c3e] focus:border-[#0a9396] focus:bg-white'
                }`}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {searching ? (
                <div className="p-8 text-center text-xs text-slate-400">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No users found. Try another search query!
                </div>
              ) : (
                searchResults.map((u) => {
                  const isSent = sentRequestIds.has(u._id);
                  const isAlreadyFriend = user?.friends?.includes(u._id);

                  return (
                    <div
                      key={u._id}
                      className={`p-3 rounded-2xl flex items-center justify-between border transition-all ${
                        isDark ? 'bg-[#17171a] border-[#27272a]' : 'bg-[#f4f8fa] border-[#d1e7ef]'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {u.profilePic ? (
                          <img
                            src={u.profilePic}
                            alt={u.username}
                            className="w-10 h-10 rounded-full object-cover border"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                              isDark ? 'bg-[#facc15] text-black' : 'bg-[#0a9396] text-white'
                            }`}
                          >
                            {u.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold truncate">{u.username}</h4>
                          <p
                            className={`text-[11px] truncate ${
                              isDark ? 'text-zinc-400' : 'text-slate-500'
                            }`}
                          >
                            {u.bio || 'Available'}
                          </p>
                        </div>
                      </div>

                      {isAlreadyFriend ? (
                        <span
                          className={`inline-flex items-center space-x-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl ${
                            isDark
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Friends</span>
                        </span>
                      ) : isSent ? (
                        <span
                          className={`inline-flex items-center space-x-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl ${
                            isDark
                              ? 'bg-[#facc15]/15 text-[#facc15]'
                              : 'bg-[#eaf6fa] text-[#005f73]'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Requested</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(u._id)}
                          disabled={actionLoading === u._id}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm transition-all ${
                            isDark
                              ? 'bg-[#facc15] hover:bg-[#eab308] text-black'
                              : 'bg-[#005f73] hover:bg-[#0a9396] text-white'
                          }`}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Incoming & Outgoing Requests */}
        {activeTab === 'requests' && (
          <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
            {/* Incoming Requests */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70">
                Incoming Requests ({incomingRequests.length})
              </h3>
              {loadingRequests ? (
                <div className="p-4 text-center text-xs text-slate-400">Loading requests...</div>
              ) : incomingRequests.length === 0 ? (
                <div className={`p-4 text-center text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  No incoming friend requests.
                </div>
              ) : (
                <div className="space-y-2">
                  {incomingRequests.map((req) => (
                    <div
                      key={req._id}
                      className={`p-3 rounded-2xl flex items-center justify-between border ${
                        isDark ? 'bg-[#17171a] border-[#27272a]' : 'bg-[#f4f8fa] border-[#d1e7ef]'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {req.sender?.profilePic ? (
                          <img
                            src={req.sender.profilePic}
                            alt={req.sender.username}
                            className="w-10 h-10 rounded-full object-cover border"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                              isDark ? 'bg-[#facc15] text-black' : 'bg-[#0a9396] text-white'
                            }`}
                          >
                            {req.sender?.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold truncate">{req.sender?.username}</h4>
                          <p
                            className={`text-[11px] truncate ${
                              isDark ? 'text-zinc-400' : 'text-slate-500'
                            }`}
                          >
                            {req.sender?.bio || 'Hey there!'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleAcceptRequest(req._id)}
                          disabled={actionLoading === req._id}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req._id)}
                          disabled={actionLoading === req._id}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-red-500/15 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing Requests */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70">
                Sent Requests ({outgoingRequests.length})
              </h3>
              {outgoingRequests.length === 0 ? (
                <div className={`p-4 text-center text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  No pending sent requests.
                </div>
              ) : (
                <div className="space-y-2">
                  {outgoingRequests.map((req) => (
                    <div
                      key={req._id}
                      className={`p-3 rounded-2xl flex items-center justify-between border ${
                        isDark ? 'bg-[#17171a] border-[#27272a]' : 'bg-[#f4f8fa] border-[#d1e7ef]'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {req.receiver?.profilePic ? (
                          <img
                            src={req.receiver.profilePic}
                            alt={req.receiver.username}
                            className="w-8 h-8 rounded-full object-cover border"
                          />
                        ) : (
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              isDark ? 'bg-[#facc15] text-black' : 'bg-[#0a9396] text-white'
                            }`}
                          >
                            {req.receiver?.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <span className="text-xs font-bold truncate">{req.receiver?.username}</span>
                      </div>
                      <button
                        onClick={() => handleRejectRequest(req._id)}
                        disabled={actionLoading === req._id}
                        className="text-[11px] text-red-400 hover:text-red-500"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
