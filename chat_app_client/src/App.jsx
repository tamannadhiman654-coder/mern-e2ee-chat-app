import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import FriendModal from './components/FriendModal';
import CallModal from './components/CallModal';
import { url } from './components/GlobalUrl';

function MainApp() {
  const { user, token, loading } = useAuth();
  const { isDark } = useTheme();
  const { socket } = useSocket();

  const [friends, setFriends] = useState([]);
  const [activeFriend, setActiveFriend] = useState(null);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Modals state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [friendModalTab, setFriendModalTab] = useState('search');

  // Fetch Friends List
  const fetchFriends = async () => {
    if (!token) return;
    setLoadingFriends(true);
    try {
      const res = await fetch(`${url}api/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.friends)) {
        setFriends(data.friends);
        // If activeFriend exists, update its reference if present in fresh data
        if (activeFriend) {
          const updated = data.friends.find(
            (f) => (f._id || f.id) === (activeFriend._id || activeFriend.id)
          );
          if (updated) setActiveFriend(updated);
        }
      }
    } catch (err) {
      console.error('Error fetching friends list:', err);
    } finally {
      setLoadingFriends(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchFriends();
    } else {
      setFriends([]);
      setActiveFriend(null);
    }
  }, [user, token]);

  // Listen to friend events
  useEffect(() => {
    if (!socket) return;

    const handleFriendAccepted = () => {
      fetchFriends();
    };

    socket.on('friend_request_accepted', handleFriendAccepted);
    return () => {
      socket.off('friend_request_accepted', handleFriendAccepted);
    };
  }, [socket]);

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark ? 'bg-black text-[#facc15]' : 'bg-[#f4f8fa] text-[#005f73]'
        }`}
      >
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-current border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold tracking-wider uppercase">Loading CipherChat...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <AuthModal />;
  }

  return (
    <div
      className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${
        isDark ? 'bg-black text-white' : 'bg-[#f4f8fa] text-[#092c3e]'
      }`}
    >
      {/* Top Navbar */}
      <Navbar
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenFriends={() => {
          setFriendModalTab('requests');
          setIsFriendsOpen(true);
        }}
        onOpenSearch={() => {
          setFriendModalTab('search');
          setIsFriendsOpen(true);
        }}
      />

      {/* Main Home Dashboard */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          friends={friends}
          activeFriend={activeFriend}
          onSelectFriend={(f) => setActiveFriend(f)}
          onOpenSearch={() => {
            setFriendModalTab('search');
            setIsFriendsOpen(true);
          }}
          loading={loadingFriends}
        />
        <ChatArea
          activeFriend={activeFriend}
          onOpenSearch={() => {
            setFriendModalTab('search');
            setIsFriendsOpen(true);
          }}
        />
      </div>

      {/* Modals & Overlays */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <FriendModal
        isOpen={isFriendsOpen}
        onClose={() => setIsFriendsOpen(false)}
        initialTab={friendModalTab}
        onFriendAdded={fetchFriends}
      />

      <CallModal />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <MainApp />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
