import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff
} from 'lucide-react';

export default function CallModal() {
  const { isDark } = useTheme();
  const {
    callStatus,
    incomingCall,
    activeCallDetails,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    answerCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo
  } = useSocket();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [callDuration, setCallDuration] = useState(0);

  // Bind local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Bind remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Call timer when connected
  useEffect(() => {
    let interval = null;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStatus]);

  if (callStatus === 'idle') return null;

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. Incoming Call Prompt
  if (callStatus === 'incoming' && incomingCall) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div
          className={`w-full max-w-sm rounded-3xl p-8 text-center border shadow-2xl ${
            isDark ? 'bg-[#0d0d0e] border-[#27272a] text-white' : 'bg-white border-[#d1e7ef] text-[#092c3e]'
          }`}
        >
          {/* Avatar with pulsing ring */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div
              className={`absolute inset-0 rounded-full animate-call-ring ${
                isDark ? 'bg-[#facc15]/30' : 'bg-[#0a9396]/30'
              }`}
            />
            {incomingCall.avatar ? (
              <img
                src={incomingCall.avatar}
                alt={incomingCall.name}
                className="w-24 h-24 rounded-full object-cover relative z-10 border-4 border-white shadow-xl"
              />
            ) : (
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center font-black text-2xl relative z-10 border-4 border-white shadow-xl ${
                  isDark ? 'bg-[#facc15] text-black' : 'bg-[#0a9396] text-white'
                }`}
              >
                {incomingCall.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>

          <h3 className="text-lg font-black mb-1">{incomingCall.name}</h3>
          <p className={`text-xs mb-8 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Incoming {incomingCall.callType === 'video' ? 'Video' : 'Audio'} Call...
          </p>

          {/* Accept / Decline Buttons */}
          <div className="flex items-center justify-center space-x-6">
            <button
              onClick={rejectCall}
              title="Decline Call"
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-600/30 transition-all hover:scale-105"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <button
              onClick={answerCall}
              title="Accept Call"
              className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
            >
              {incomingCall.callType === 'video' ? (
                <Video className="w-6 h-6" />
              ) : (
                <Phone className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Call Window (Calling or Connected)
  const isVideo = activeCallDetails?.callType === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-md">
      <div
        className={`w-full max-w-4xl h-[90vh] rounded-3xl overflow-hidden flex flex-col border shadow-2xl relative ${
          isDark ? 'bg-[#0d0d0e] border-[#27272a]' : 'bg-[#122b39] border-[#0a9396]/40 text-white'
        }`}
      >
        {/* Call Header */}
        <div className="absolute top-0 inset-x-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            {activeCallDetails?.peerAvatar ? (
              <img
                src={activeCallDetails.peerAvatar}
                alt={activeCallDetails.peerName}
                className="w-9 h-9 rounded-full object-cover border"
              />
            ) : (
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                  isDark ? 'bg-[#facc15] text-black' : 'bg-[#0a9396] text-white'
                }`}
              >
                {activeCallDetails?.peerName?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <h3 className="text-xs font-bold">{activeCallDetails?.peerName}</h3>
              <p className="text-[11px] text-zinc-300">
                {callStatus === 'connected' ? formatTimer(callDuration) : 'Calling...'}
              </p>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              isDark ? 'bg-[#facc15] text-black' : 'bg-[#0a9396] text-white'
            }`}
          >
            {isVideo ? 'Video Call' : 'Audio Call'}
          </span>
        </div>

        {/* Video / Audio Stage */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          {isVideo ? (
            <>
              {/* Remote Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Waiting overlay for remote stream */}
              {!remoteStream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white z-10">
                  <div className="w-20 h-20 rounded-full mb-3 flex items-center justify-center animate-pulse bg-white/10">
                    <Video className="w-10 h-10 text-[#38bdf8]" />
                  </div>
                  <p className="text-xs font-medium text-zinc-300">
                    {callStatus === 'calling' ? 'Ringing...' : 'Connecting video stream...'}
                  </p>
                </div>
              )}

              {/* Local Video (Picture-in-Picture) */}
              <div className="absolute bottom-20 right-4 w-32 sm:w-44 h-24 sm:h-32 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl z-20 bg-zinc-900">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                />
                {isVideoOff && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800 text-zinc-400 text-xs">
                    <VideoOff className="w-6 h-6 mb-1" />
                    <span>Camera off</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Audio Call UI
            <div className="flex flex-col items-center justify-center text-center p-6">
              <div className="relative w-32 h-32 mb-6">
                <div
                  className={`absolute inset-0 rounded-full animate-call-ring ${
                    isDark ? 'bg-[#facc15]/20' : 'bg-[#38bdf8]/30'
                  }`}
                />
                {activeCallDetails?.peerAvatar ? (
                  <img
                    src={activeCallDetails.peerAvatar}
                    alt={activeCallDetails.peerName}
                    className="w-32 h-32 rounded-full object-cover relative z-10 border-4 border-white/20 shadow-2xl"
                  />
                ) : (
                  <div
                    className={`w-32 h-32 rounded-full flex items-center justify-center font-black text-4xl relative z-10 border-4 border-white/20 shadow-2xl ${
                      isDark ? 'bg-[#facc15] text-black' : 'bg-[#0a9396] text-white'
                    }`}
                  >
                    {activeCallDetails?.peerName?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <h2 className="text-lg font-bold text-white mb-1">{activeCallDetails?.peerName}</h2>
              <p className="text-xs text-zinc-400">
                {callStatus === 'connected' ? 'Secure Audio Connected' : 'Calling...'}
              </p>
              {/* Hidden audio element for remote stream */}
              <audio ref={remoteVideoRef} autoPlay playsInline />
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="h-20 bg-gradient-to-t from-black to-transparent sm:bg-black/90 px-6 flex items-center justify-center space-x-4 z-20">
          {/* Mute Toggle */}
          <button
            onClick={toggleAudio}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isMuted
                ? 'bg-red-600 text-white'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video Toggle (only for video calls) */}
          {isVideo && (
            <button
              onClick={toggleVideo}
              title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isVideoOff
                  ? 'bg-red-600 text-white'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          {/* End Call */}
          <button
            onClick={endCall}
            title="End Call"
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-600/30 transition-all hover:scale-105"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
