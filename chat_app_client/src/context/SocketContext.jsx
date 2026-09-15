import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { url } from '../components/GlobalUrl';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  // Call States
  const [callStatus, setCallStatus] = useState('idle'); // 'idle' | 'calling' | 'incoming' | 'connected'
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCallDetails, setActiveCallDetails] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [pendingFriendRequestsCount, setPendingFriendRequestsCount] = useState(0);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const activeCallRef = useRef(null);

  // Clean up WebRTC call and streams
  const cleanupCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus('idle');
    setIncomingCall(null);
    setActiveCallDetails(null);
    setIsMuted(false);
    setIsVideoOff(false);
    activeCallRef.current = null;
  };

  // Initialize Socket connection
  useEffect(() => {
    if (!user || !user.id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(url, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      newSocket.emit('register_user', user.id);
    });

    newSocket.on('online_users_list', (userIds) => {
      setOnlineUsers(new Set(userIds));
    });

    newSocket.on('user_status_change', ({ userId, isOnline }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (isOnline) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    // Friend Request Realtime Notifications
    newSocket.on('friend_request_received', () => {
      setPendingFriendRequestsCount((prev) => prev + 1);
    });

    // Call Signaling Events
    newSocket.on('incoming_call', (data) => {
      setIncomingCall(data);
      setCallStatus('incoming');
    });

    newSocket.on('call_accepted', async (signal) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
          setCallStatus('connected');
        } catch (err) {
          console.error('Error setting remote description on accept:', err);
        }
      }
    });

    newSocket.on('call_rejected', () => {
      cleanupCall();
      alert('The call was declined.');
    });

    newSocket.on('call_failed', ({ reason }) => {
      cleanupCall();
      alert(reason || 'Call failed.');
    });

    newSocket.on('ice_candidate', async ({ candidate }) => {
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    });

    newSocket.on('call_ended', () => {
      cleanupCall();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Start Call (Audio or Video)
  const startCall = async ({ userId, name, avatar, callType = 'video' }) => {
    if (!socket) return;
    try {
      const constraints = {
        audio: true,
        video: callType === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice_candidate', {
            to: userId,
            candidate: event.candidate
          });
        }
      };

      // Handle remote tracks
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const callDetails = { peerId: userId, peerName: name, peerAvatar: avatar, callType };
      setActiveCallDetails(callDetails);
      activeCallRef.current = callDetails;
      setCallStatus('calling');

      socket.emit('call_user', {
        userToCall: userId,
        signalData: offer,
        from: user.id,
        name: user.username,
        avatar: user.profilePic,
        callType
      });
    } catch (err) {
      console.error('Failed to access media devices for call:', err);
      alert('Could not access microphone/camera. Please grant media permissions.');
      cleanupCall();
    }
  };

  // Answer Incoming Call
  const answerCall = async () => {
    if (!socket || !incomingCall) return;
    try {
      const { signal, from, name, avatar, callType } = incomingCall;
      const constraints = {
        audio: true,
        video: callType === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice_candidate', {
            to: from,
            candidate: event.candidate
          });
        }
      };

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(signal));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const callDetails = { peerId: from, peerName: name, peerAvatar: avatar, callType };
      setActiveCallDetails(callDetails);
      activeCallRef.current = callDetails;
      setCallStatus('connected');
      setIncomingCall(null);

      socket.emit('answer_call', { signal: answer, to: from });
    } catch (err) {
      console.error('Failed to answer call:', err);
      alert('Error answering call.');
      cleanupCall();
    }
  };

  // Reject Incoming Call
  const rejectCall = () => {
    if (socket && incomingCall) {
      socket.emit('reject_call', { to: incomingCall.from });
    }
    cleanupCall();
  };

  // End Active Call
  const endCall = () => {
    const peerId = activeCallRef.current?.peerId || incomingCall?.from;
    if (socket && peerId) {
      socket.emit('end_call', { to: peerId });
    }
    cleanupCall();
  };

  // Toggle Mute
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        callStatus,
        incomingCall,
        activeCallDetails,
        localStream,
        remoteStream,
        isMuted,
        isVideoOff,
        pendingFriendRequestsCount,
        setPendingFriendRequestsCount,
        startCall,
        answerCall,
        rejectCall,
        endCall,
        toggleAudio,
        toggleVideo
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
