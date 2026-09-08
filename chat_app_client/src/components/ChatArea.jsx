import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { url } from './GlobalUrl';
import { encryptText, decryptText } from '../utils/crypto';
import {
  Phone,
  Video,
  Trash2,
  Send,
  Lock,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export default function ChatArea({ activeFriend, onOpenSearch }) {
  const { user, token } = useAuth();
  const { isDark } = useTheme();
  const { socket, onlineUsers, startCall } = useSocket();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingChat, setDeletingChat] = useState(false);

  const messagesEndRef = useRef(null);

  const friendId = activeFriend?._id || activeFriend?.id;
  const isFriendOnline = friendId ? onlineUsers.has(friendId) : false;

  // Fetch Message History
  useEffect(() => {
    if (!friendId || !token) return;

    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const res = await fetch(`${url}/api/messages/${friendId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          // Decrypt messages
          const decrypted = await Promise.all(
            data.messages.map(async (msg) => {
              const text = await decryptText(msg.ciphertext, msg.iv);
              return { ...msg, decryptedText: text };
            })
          );
          setMessages(decrypted);
        }
      } catch (err) {
        console.error('Error fetching message history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [friendId, token]);

  // Listen to Real-Time incoming/outgoing messages and chat deletion
  useEffect(() => {
    if (!socket || !friendId) return;

    const handleIncoming = async (msg) => {
      if (
        (msg.sender === friendId && msg.receiver === user.id) ||
        (msg.sender === user.id && msg.receiver === friendId)
      ) {
        const text = await decryptText(msg.ciphertext, msg.iv);
        setMessages((prev) => [...prev, { ...msg, decryptedText: text }]);
      }
    };

    const handleChatCleared = ({ withUserId }) => {
      if (withUserId === friendId) {
        setMessages([]);
      }
    };

    socket.on('receive_encrypted_message', handleIncoming);
    socket.on('message_sent', handleIncoming);
    socket.on('chat_cleared', handleChatCleared);

    return () => {
      socket.off('receive_encrypted_message', handleIncoming);
      socket.off('message_sent', handleIncoming);
      socket.off('chat_cleared', handleChatCleared);
    };
  }, [socket, friendId, user?.id]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !friendId || !user) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      // Encrypt with E2EE
      const encrypted = await encryptText(textToSend);

      const messagePayload = {
        senderId: user.id,
        receiverId: friendId,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv
      };

      if (socket && socket.connected) {
        socket.emit('send_encrypted_message', messagePayload);
      } else {
        // Fallback REST
        const res = await fetch(`${url}/api/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(messagePayload)
        });
        const data = await res.json();
        if (data.success && data.message) {
          setMessages((prev) => [
            ...prev,
            { ...data.message, decryptedText: textToSend }
          ]);
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Delete Chat History
  const handleDeleteChat = async () => {
    if (!friendId || !token) return;
    setDeletingChat(true);
    try {
      const res = await fetch(`${url}/api/messages/${friendId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessages([]);
        setShowDeleteModal(false);
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
    } finally {
      setDeletingChat(false);
    }
  };

  // If no conversation is active
  if (!activeFriend) {
    return (
      <main
        className={`flex-1 h-full flex flex-col items-center justify-center p-6 text-center transition-colors duration-300 ${
          isDark ? 'bg-black text-white' : 'bg-[#f4f8fa] text-[#092c3e]'
        }`}
      >
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl mb-4 ${
            isDark
              ? 'bg-[#17171a] text-[#facc15] border border-[#facc15]/30 shadow-yellow-500/10'
              : 'bg-gradient-to-br from-[#005f73] via-[#0a9396] to-[#38bdf8] text-white shadow-teal-500/20'
          }`}
        >
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-black mb-2">Secure End-to-End Chat</h2>
        <p className={`text-xs max-w-sm mb-6 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
          Select a friend from the sidebar or find new users to start messaging and making crystal-clear audio & video calls.
        </p>
        <button
          onClick={onOpenSearch}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
            isDark
              ? 'bg-[#facc15] text-black hover:bg-[#eab308] shadow-yellow-500/20'
              : 'bg-[#005f73] text-white hover:bg-[#0a9396] shadow-teal-500/20'
          }`}
        >
          Find New Friends
        </button>
      </main>
    );
  }

  return (
    <main
      className={`flex-1 h-full flex flex-col transition-colors duration-300 ${
        isDark ? 'bg-black text-white' : 'bg-[#f4f8fa] text-[#092c3e]'
      }`}
    >
      {/* Chat Header */}
      <header
        className={`h-16 px-4 md:px-6 flex items-center justify-between border-b transition-colors duration-300 ${
          isDark
            ? 'bg-[#0d0d0e] border-[#27272a]'
            : 'bg-white border-[#d1e7ef]'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            {activeFriend.profilePic ? (
              <img
                src={activeFriend.profilePic}
                alt={activeFriend.username}
                className="w-10 h-10 rounded-full object-cover border"
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  isDark ? 'bg-[#facc15] text-black' : 'bg-[#0a9396] text-white'
                }`}
              >
                {activeFriend.username?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${
                isDark ? 'border-[#0d0d0e]' : 'border-white'
              } ${isFriendOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}
            />
          </div>
          <div>
            <h2 className="text-sm font-bold flex items-center space-x-2">
              <span>{activeFriend.username}</span>
              <Lock className="w-3 h-3 text-[#0a9396]" title="End-to-End Encrypted" />
            </h2>
            <p
              className={`text-[11px] ${
                isFriendOnline
                  ? 'text-emerald-500 font-medium'
                  : isDark
                  ? 'text-zinc-400'
                  : 'text-slate-500'
              }`}
            >
              {isFriendOnline ? 'Online' : 'Offline'} • {activeFriend.bio || 'Available'}
            </p>
          </div>
        </div>

        {/* Action Buttons: Audio Call, Video Call, Delete Chat */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() =>
              startCall({
                userId: friendId,
                name: activeFriend.username,
                avatar: activeFriend.profilePic,
                callType: 'audio'
              })
            }
            title="Start Audio Call"
            className={`p-2.5 rounded-xl border transition-all ${
              isDark
                ? 'bg-[#17171a] border-[#27272a] text-[#facc15] hover:bg-[#facc15]/15'
                : 'bg-[#eaf6fa] border-[#d1e7ef] text-[#005f73] hover:bg-[#d8f0f6]'
            }`}
          >
            <Phone className="w-4 h-4" />
          </button>

          <button
            onClick={() =>
              startCall({
                userId: friendId,
                name: activeFriend.username,
                avatar: activeFriend.profilePic,
                callType: 'video'
              })
            }
            title="Start Video Call"
            className={`p-2.5 rounded-xl border transition-all ${
              isDark
                ? 'bg-[#17171a] border-[#27272a] text-[#facc15] hover:bg-[#facc15]/15'
                : 'bg-[#eaf6fa] border-[#d1e7ef] text-[#005f73] hover:bg-[#d8f0f6]'
            }`}
          >
            <Video className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            title="Delete Chat History"
            className={`p-2.5 rounded-xl border transition-all ${
              isDark
                ? 'bg-[#17171a] border-[#27272a] text-red-400 hover:bg-red-500/10 hover:border-red-500/40'
                : 'bg-white border-[#d1e7ef] text-red-600 hover:bg-red-50 hover:border-red-200'
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="text-center my-2">
          <span
            className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
              isDark
                ? 'bg-[#17171a] text-[#facc15] border border-[#facc15]/20'
                : 'bg-[#eaf6fa] text-[#005f73] border border-[#d1e7ef]'
            }`}
          >
            <Lock className="w-3 h-3" />
            <span>Messages are end-to-end encrypted</span>
          </span>
        </div>

        {loadingHistory ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading conversation...</div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center">
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              No messages yet. Send a message to start chatting!
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender === user?.id;
            const time = msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div
                key={msg._id || index}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs break-words shadow-sm transition-all ${
                    isMe
                      ? isDark
                        ? 'bg-[#facc15] text-black font-medium rounded-br-none'
                        : 'bg-gradient-to-r from-[#005f73] via-[#0a9396] to-[#38bdf8] text-white rounded-br-none'
                      : isDark
                      ? 'bg-[#17171a] border border-[#27272a] text-zinc-100 rounded-bl-none'
                      : 'bg-white border border-[#d1e7ef] text-[#092c3e] rounded-bl-none'
                  }`}
                >
                  <p className="leading-relaxed">{msg.decryptedText || '[Encrypted payload]'}</p>
                  <div
                    className={`flex items-center justify-end space-x-1 mt-1 text-[9px] ${
                      isMe
                        ? isDark
                          ? 'text-black/70'
                          : 'text-white/80'
                        : isDark
                        ? 'text-zinc-400'
                        : 'text-slate-400'
                    }`}
                  >
                    <span>{time}</span>
                    <Lock className="w-2.5 h-2.5" />
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className={`p-3 md:p-4 border-t flex items-center space-x-2 transition-colors duration-300 ${
          isDark
            ? 'bg-[#0d0d0e] border-[#27272a]'
            : 'bg-white border-[#d1e7ef]'
        }`}
      >
        <input
          type="text"
          placeholder="Type an end-to-end encrypted message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className={`flex-1 px-4 py-2.5 text-xs rounded-2xl border transition-all outline-none ${
            isDark
              ? 'bg-[#17171a] border-[#27272a] text-white placeholder-zinc-500 focus:border-[#facc15]'
              : 'bg-[#f4f8fa] border-[#d1e7ef] text-[#092c3e] placeholder-slate-400 focus:border-[#0a9396] focus:bg-white'
          }`}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className={`p-2.5 rounded-2xl transition-all shadow-md ${
            isDark
              ? 'bg-[#facc15] hover:bg-[#eab308] text-black shadow-yellow-500/20'
              : 'bg-gradient-to-r from-[#005f73] via-[#0a9396] to-[#38bdf8] text-white shadow-teal-500/20 hover:opacity-95'
          } ${!inputText.trim() ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Delete Chat Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl ${
              isDark ? 'bg-[#0d0d0e] border-[#27272a] text-white' : 'bg-white border-[#d1e7ef] text-[#092c3e]'
            }`}
          >
            <div className="flex items-center space-x-3 text-red-500 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-sm">Delete Chat Conversation?</h3>
            </div>
            <p className={`text-xs mb-6 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Are you sure you want to delete all messages with <strong>{activeFriend.username}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingChat}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  isDark ? 'bg-[#17171a] border-[#27272a] text-white' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteChat}
                disabled={deletingChat}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20"
              >
                {deletingChat ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
