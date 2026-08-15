import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, Maximize2, Minimize2, Video, VideoOff, ScreenShare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CallState, CallData, CallLayout } from '../hooks/useVoiceCall';

interface VoiceCallUIProps {
  callState: CallState;
  activeCall: CallData | null;
  isMuted: boolean;
  isVideoMuted?: boolean;
  isRemoteVideoMuted?: boolean;
  isVideoCall?: boolean;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  layout: CallLayout;
  setLayout: (layout: CallLayout) => void;
  isInitiator: boolean;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo?: () => void;
  isScreenSharing?: boolean;
  isRemoteScreenSharing?: boolean;
  toggleScreenShare?: () => void;
  remoteAudioRef: React.RefObject<HTMLAudioElement | null>;
}

const VideoStream: React.FC<{ stream: MediaStream | null; muted?: boolean; className?: string }> = ({ stream, muted = false, className }) => {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream]);
  return <video ref={ref} autoPlay playsInline muted={muted} className={className} />;
};

export const VoiceCallUI: React.FC<VoiceCallUIProps> = ({
  callState,
  activeCall,
  isMuted,
  isVideoMuted = false,
  isRemoteVideoMuted = false,
  isVideoCall = false,
  localStream = null,
  remoteStream = null,
  layout,
  setLayout,
  isInitiator,
  remoteAudioRef,
  acceptCall,
  rejectCall,
  endCall,
  toggleMute,
  toggleVideo,
  isScreenSharing = false,
  isRemoteScreenSharing = false,
  toggleScreenShare
}) => {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let interval: any;
    if (callState === 'connected') {
      const startTime = Date.now();
      interval = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isOutgoing = callState === 'calling';
  const isIncoming = callState === 'ringing';
  const isConnected = callState === 'connected';

  if (callState === 'idle' || !activeCall) return null;

  const rawPeerName = isInitiator ? activeCall.targetName : activeCall.callerName;
  const peerName = (rawPeerName || 'Onbekende Beller').trim();
  const peerAvatar = isInitiator ? activeCall.targetAvatar : activeCall.callerAvatar;

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <audio ref={remoteAudioRef} autoPlay playsInline />
      <AnimatePresence mode="wait">
        {layout === 'large' ? (
          <motion.div
            key="immersive-call"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#07070d] flex flex-col items-center justify-between p-8 overflow-hidden select-none"
          >
            {/* Ambient Background Glow System */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              {/* Dynamic Animated Gradient Blobs */}
              <motion.div
                animate={{
                  x: [0, 40, -30, 0],
                  y: [0, -60, 40, 0],
                  scale: [1, 1.25, 0.85, 1],
                }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[130px] opacity-[0.16] transition-colors duration-1000 ${
                  isIncoming ? 'bg-fuchsia-600' : isOutgoing ? 'bg-sky-600' : 'bg-emerald-600'
                }`}
              />
              <motion.div
                animate={{
                  x: [0, -40, 30, 0],
                  y: [0, 50, -50, 0],
                  scale: [1, 0.9, 1.15, 1],
                }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2
                }}
                className={`absolute -bottom-40 -right-40 w-[450px] h-[450px] rounded-full blur-[110px] opacity-[0.18] transition-colors duration-1000 ${
                  isIncoming ? 'bg-violet-600' : isOutgoing ? 'bg-indigo-600' : 'bg-teal-600'
                }`}
              />
              {/* Subtle noise pattern overlay or deep radial vignette */}
              <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#07070d]/30 to-[#07070d]/90" />
            </div>

            {/* Video Streams & Visualizers */}
            <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
              {isVideoCall && isConnected ? (
                <div className="w-full h-full bg-[#050508] flex items-center justify-center animate-fade-in relative pointer-events-auto">
                  {remoteStream ? (
                    <>
                      <VideoStream 
                        stream={remoteStream} 
                        className={`w-full h-full object-cover transition-all duration-700 ${
                          isRemoteVideoMuted ? 'filter blur-3xl scale-110 opacity-40' : ''
                        }`} 
                      />
                      {isRemoteVideoMuted && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4 z-10">
                          <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-16 h-16 rounded-full bg-white/5 border border-white/15 backdrop-blur-xl flex items-center justify-center animate-pulse shadow-xl"
                          >
                            <VideoOff className="w-8 h-8 text-white/70" />
                          </motion.div>
                          <p className="text-white/60 text-sm font-medium tracking-wide drop-shadow-md">
                            {peerName} heeft de camera uitgeschakeld
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-white/40 text-sm animate-pulse font-light tracking-wider">Wachten op video signaal...</div>
                  )}
                </div>
              ) : isVideoCall && (isOutgoing || isIncoming) && localStream ? (
                <div className="w-full h-full bg-[#050508] flex items-center justify-center pointer-events-auto">
                  <VideoStream stream={localStream} muted className="w-full h-full object-cover opacity-60 filter blur-sm" />
                </div>
              ) : peerAvatar ? (
                <div className="relative w-full h-full overflow-hidden bg-[#07070d]">
                  <img 
                    src={peerAvatar} 
                    alt="" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-10 blur-3xl scale-125"
                  />
                  <div className="absolute inset-0 bg-[#07070d]/70" />
                </div>
              ) : null}
            </div>

            {/* Floating Picture-in-Picture Local Camera Stream */}
            {isVideoCall && isConnected && localStream && (
              <div id="webrtc-local-pip" className="absolute top-6 right-6 w-32 h-44 md:w-36 md:h-48 rounded-2xl border border-white/10 bg-neutral-950/80 shadow-2xl overflow-hidden z-30 pointer-events-auto backdrop-blur-md">
                {isScreenSharing ? (
                  <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center p-3 text-center">
                    <ScreenShare className="w-8 h-8 text-emerald-400 animate-pulse mb-2" />
                    <span className="text-[10px] font-bold tracking-wider text-emerald-300 uppercase">Scherm delen</span>
                    <span className="text-[8px] text-white/40 mt-1">Feedback-lus voorkomen</span>
                  </div>
                ) : (
                  <>
                    <VideoStream 
                      stream={localStream} 
                      muted 
                      className={`w-full h-full object-cover transition-all duration-700 ${
                        isVideoMuted ? 'filter blur-2xl scale-110 opacity-30 shadow-none' : ''
                      }`} 
                    />
                    {isVideoMuted && (
                      <div className="absolute inset-0 bg-neutral-950/50 backdrop-blur-xl flex flex-col items-center justify-center">
                        <VideoOff className="w-6 h-6 text-white/40" />
                        <span className="text-[9px] font-bold tracking-wider text-white/30 uppercase mt-1">Gedempt</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Top Bar Status Info */}
            <div className="relative z-20 w-full flex flex-col items-center gap-2 pt-6">
              <motion.div
                initial={{ y: -15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                key={`badge-${callState}`}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-md"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-violet-400 animate-ping'}`} />
                <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-white/80 uppercase">
                  {isIncoming && (isVideoCall ? 'Inkomende video oproep' : 'Inkomende oproep')}
                  {isOutgoing && (isVideoCall ? 'Spraakoproep starten...' : 'Uitgaande oproep...')}
                  {isConnected && (isVideoCall ? 'Actief videogesprek' : 'Gesprek is beveiligd')}
                </span>
              </motion.div>
            </div>

            {/* Middle Main Content */}
            <div className="relative z-20 flex flex-col items-center justify-center flex-1 w-full max-w-md my-auto gap-6 sm:gap-8">
              
              {/* Avatar with luxury ripple waves (Only when camera's not displaying on main screen) */}
              {(!isVideoCall || (isVideoCall && !isConnected)) && (
                <div className="relative flex items-center justify-center">
                  <AnimatePresence>
                    {isIncoming && (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                          className="absolute inset-0 w-32 h-32 md:w-40 md:h-40 rounded-full border border-violet-500/40"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
                          className="absolute inset-0 w-32 h-32 md:w-40 md:h-40 rounded-full border border-violet-500/25"
                        />
                      </>
                    )}
                    {isOutgoing && (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                          className="absolute inset-0 w-32 h-32 md:w-40 md:h-40 rounded-full border border-sky-500/40"
                        />
                      </>
                    )}
                  </AnimatePresence>

                  <motion.div
                    layoutId="call-avatar"
                    className={`w-32 h-32 md:w-40 md:h-40 rounded-full p-[3px] bg-gradient-to-br from-white/15 to-white/5 border border-white/10 shadow-2xl relative z-10`}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-b from-neutral-800 to-neutral-900 flex items-center justify-center">
                      {peerAvatar ? (
                        <img 
                          src={peerAvatar} 
                          alt={peerName} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className="text-4xl font-light tracking-widest text-white/90">
                          {getInitials(peerName)}
                        </span>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Name and State description */}
              <div className="text-center space-y-1.5 sm:space-y-2">
                <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight drop-shadow-md">
                  {peerName}
                </h1>
                
                {isConnected ? (
                  <div className="flex flex-col items-center gap-3">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-4xl md:text-5xl font-light font-mono text-white tracking-widest tabular-nums select-all drop-shadow-[0_0_35px_rgba(168,139,250,0.35)]"
                    >
                      {formatDuration(duration)}
                    </motion.div>

                    {/* Glowing Audio Waves */}
                    <div className="flex items-center gap-1.5 h-6 mt-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((bar, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            height: isMuted ? [3, 3, 3] : [3, Math.random() * 24 + 4, 3],
                          }}
                          transition={{
                            duration: isMuted ? 1 : 0.5 + (i % 4) * 0.12,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className={`w-[3px] rounded-full ${
                            isMuted ? 'bg-neutral-600/35' : 'bg-gradient-to-t from-violet-500 via-fuchsia-400 to-sky-400'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs font-light text-white/40 tracking-widest uppercase">
                    {isIncoming && 'Inkomend gesprek'}
                    {isOutgoing && 'Verbinding maken...'}
                  </p>
                )}
              </div>

              {/* Glass Frosted Action Pad */}
              {(isConnected || isOutgoing) && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-4 gap-4 w-full max-w-sm mt-4 p-4 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-xl"
                >
                  {/* Mute action */}
                  <button 
                    onClick={toggleMute}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer border-none bg-transparent"
                  >
                    <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center transition-all duration-300 border ${
                      isMuted 
                        ? 'bg-amber-500/20 border-amber-500/35 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                        : 'bg-white/5 border-white/10 text-white/80 group-hover:bg-white/10 group-hover:text-white'
                    }`}>
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </div>
                    <span className="text-[9px] font-medium tracking-wide text-white/40 uppercase group-hover:text-white/60 text-center">
                      Dempen
                    </span>
                  </button>

                  {/* Video toggle button */}
                  {isVideoCall && toggleVideo ? (
                    <button 
                      onClick={toggleVideo}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer border-none bg-transparent"
                    >
                      <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center transition-all duration-300 border ${
                        isVideoMuted 
                          ? 'bg-amber-500/20 border-amber-500/35 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                          : 'bg-white/5 border-white/10 text-white/80 group-hover:bg-white/10 group-hover:text-white'
                      }`}>
                        {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                      </div>
                      <span className="text-[9px] font-medium tracking-wide text-white/40 uppercase group-hover:text-white/60 text-center">
                        Camera
                      </span>
                    </button>
                  ) : (
                    <button 
                      className="flex flex-col items-center gap-1.5 group cursor-pointer border-none bg-transparent opacity-40 cursor-not-allowed"
                      disabled
                    >
                      <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center border bg-white/5 border-white/5 text-white/30">
                        <VideoOff className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] font-medium tracking-wide text-white/30 uppercase text-center">
                        Video uit
                      </span>
                    </button>
                  )}

                  {/* Screenshare toggle button */}
                  {isConnected && toggleScreenShare ? (
                    <button 
                      onClick={toggleScreenShare}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer border-none bg-transparent"
                    >
                      <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center transition-all duration-300 border ${
                        isScreenSharing 
                          ? 'bg-emerald-500/20 border-emerald-500/35 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                          : 'bg-white/5 border-white/10 text-white/80 group-hover:bg-white/10 group-hover:text-white'
                      }`}>
                        <ScreenShare className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] font-medium tracking-wide text-white/40 uppercase group-hover:text-white/60 text-center">
                        {isScreenSharing ? 'Stoppen' : 'Scherm'}
                      </span>
                    </button>
                  ) : (
                    <button 
                      className="flex flex-col items-center gap-1.5 group cursor-pointer border-none bg-transparent opacity-40 cursor-not-allowed"
                      disabled
                    >
                      <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center border bg-white/5 border-white/5 text-white/30">
                        <ScreenShare className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] font-medium tracking-wide text-white/30 uppercase text-center">
                        Scherm
                      </span>
                    </button>
                  )}

                  {/* Speaker badge mock */}
                  <button 
                    className="flex flex-col items-center gap-1.5 group cursor-pointer border-none bg-transparent"
                  >
                    <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center transition-all duration-300 border bg-white/5 border-white/10 text-white/80 group-hover:bg-white/10 group-hover:text-white">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-medium tracking-wide text-white/40 uppercase group-hover:text-white/60 text-center">
                      Kanaal
                    </span>
                  </button>
                </motion.div>
              )}
            </div>

            {/* Bottom Actions Row & Minimize Menu */}
            <div className="relative z-20 w-full flex flex-col items-center gap-6 pb-6">
              <div className="flex items-center justify-center gap-8 w-full">
                {isIncoming && (
                  <>
                    {/* Decline */}
                    <motion.button
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={rejectCall}
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white flex items-center justify-center shadow-lg shadow-red-950/40 cursor-pointer border-none transition-all duration-300"
                      aria-label="Weigeren"
                    >
                      <PhoneOff className="w-6 h-6" />
                    </motion.button>

                    {/* Accept with breathing heartbeat */}
                    <motion.button
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.95 }}
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      onClick={acceptCall}
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 hover:from-emerald-500 hover:to-green-700 text-white flex items-center justify-center shadow-lg shadow-green-950/40 cursor-pointer border-none transition-all duration-300"
                      aria-label="Beantwoorden"
                    >
                      <Phone className="w-6 h-6" />
                    </motion.button>
                  </>
                )}

                {(isConnected || isOutgoing) && (
                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={endCall}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white flex items-center justify-center shadow-lg shadow-red-950/40 cursor-pointer border-none transition-all duration-300"
                    aria-label="Ophangen"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </motion.button>
                )}
              </div>

              {/* Minimize Trigger */}
              <button 
                onClick={() => setLayout('compact')}
                className="flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors text-xs font-semibold px-4 py-2 rounded-full border border-white/5 bg-white/[0.02]"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Minimaliseer belscherm</span>
              </button>
            </div>
          </motion.div>
        ) : (
          /* High-quality Compact frosted control bubble */
          <motion.div
            key="compact-call"
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className="fixed bottom-6 right-6 z-[200] max-w-sm w-80 select-none"
          >
            <div className="bg-neutral-950/85 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl relative">
              {/* Radial backdrop accent in compact */}
              <div className={`absolute -inset-[1px] -z-10 rounded-2xl bg-gradient-to-r ${
                isIncoming ? 'from-violet-500/15 to-fuchsia-500/15' :
                isOutgoing ? 'from-blue-500/15 to-indigo-500/15' :
                'from-emerald-500/15 to-teal-500/15'
              } opacity-70 blur-xs`} />

              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <motion.div
                    layoutId="call-avatar"
                    className={`w-12 h-12 rounded-full border-2 ${
                      isIncoming ? 'border-violet-500' : 
                      isOutgoing ? 'border-sky-500' : 
                      'border-emerald-500'
                    } bg-neutral-900 overflow-hidden relative shadow-lg`}
                  >
                    {isVideoCall && isConnected && remoteStream && !isRemoteVideoMuted ? (
                      <VideoStream stream={remoteStream} className="w-full h-full object-cover" />
                    ) : isVideoCall && isConnected && localStream && !isScreenSharing ? (
                      <VideoStream stream={localStream} muted className="w-full h-full object-cover" />
                    ) : peerAvatar ? (
                      <img 
                        src={peerAvatar} 
                        alt={peerName} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                        <span className="text-sm font-semibold tracking-wider text-white/80">
                          {getInitials(peerName)}
                        </span>
                      </div>
                    )}
                  </motion.div>
                  {isConnected && (
                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 p-1 rounded-full border border-neutral-950 flex items-center justify-center shadow-md">
                      <Volume2 className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">{peerName}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {isConnected ? (
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold leading-none">
                        {formatDuration(duration)}
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold text-neutral-500 uppercase tracking-widest leading-none">
                        {isIncoming ? 'Inkomend...' : 'Bellen...'}
                      </span>
                    )}

                    {/* Animated visualizer in compact */}
                    {isConnected && !isMuted && (
                      <div className="flex items-center gap-[2px] h-2">
                        {[1, 2, 3, 4].map((bar) => (
                          <motion.div
                            key={bar}
                            animate={{ height: [2, Math.random() * 8 + 2, 2] }}
                            transition={{ duration: 0.5 + Math.random() * 0.3, repeat: Infinity }}
                            className="w-[2px] bg-emerald-400 rounded-full"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setLayout('large')}
                    className="p-1.5 text-neutral-400 hover:text-white transition-colors hover:bg-white/5 rounded-lg"
                    title="Vergroot belscherm"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  
                  {isIncoming ? (
                    <button 
                      onClick={acceptCall} 
                      className="p-2.5 bg-gradient-to-br from-emerald-400 to-green-600 text-white rounded-full cursor-pointer hover:brightness-110 active:scale-95 shadow-md flex items-center justify-center border-none"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  ) : (
                    <button 
                      onClick={endCall} 
                      className="p-2.5 bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-full cursor-pointer hover:brightness-110 active:scale-95 shadow-md flex items-center justify-center border-none"
                    >
                      <PhoneOff className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
