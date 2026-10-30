import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Maximize2, Minimize2, Video, VideoOff, ScreenShare, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CallState, CallData, CallLayout } from '../hooks/useVoiceCall';
import { LetterAvatar } from './UserAvatar';

interface VoiceCallUIProps {
  callState: CallState;
  endingReason?: string;
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
  endingReason = 'Gesprek beëindigd',
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
    } else if (callState === 'idle') {
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
  const isEnding = callState === 'ending';

  if (callState === 'idle' || !activeCall) return null;

  const rawPeerName = isInitiator ? activeCall.targetName : activeCall.callerName;
  const peerName = (rawPeerName || 'Onbekende Beller').trim();
  const peerAvatar = isInitiator ? activeCall.targetAvatar : activeCall.callerAvatar;

  return (
    <>
      <audio ref={remoteAudioRef} autoPlay playsInline />
      <AnimatePresence mode="wait">
        {layout === 'large' ? (
          <motion.div
            key="immersive-call"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3 } }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed inset-0 z-[200] bg-[#07070d] flex flex-col items-center justify-between p-6 sm:p-8 overflow-hidden select-none"
          >
            {/* Ambient Background Glow System */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <motion.div
                animate={{
                  x: isIncoming ? [0, 50, -30, 0] : [0, 40, -30, 0],
                  y: isIncoming ? [0, -40, 50, 0] : [0, -60, 40, 0],
                  scale: isIncoming ? [1, 1.3, 0.9, 1] : [1, 1.25, 0.85, 1],
                }}
                transition={{
                  duration: isIncoming ? 8 : 12,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full blur-[140px] transition-colors duration-700 ${
                  isEnding 
                    ? 'bg-rose-700 opacity-25'
                    : isIncoming 
                    ? 'bg-fuchsia-600 opacity-30' 
                    : isOutgoing 
                    ? 'bg-sky-600 opacity-20' 
                    : 'bg-emerald-600 opacity-20'
                }`}
              />
              <motion.div
                animate={{
                  x: [0, -40, 30, 0],
                  y: [0, 50, -50, 0],
                  scale: [1, 0.9, 1.15, 1],
                }}
                transition={{
                  duration: isIncoming ? 10 : 15,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.5
                }}
                className={`absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full blur-[130px] transition-colors duration-700 ${
                  isEnding
                    ? 'bg-red-800 opacity-25'
                    : isIncoming 
                    ? 'bg-violet-600 opacity-30' 
                    : isOutgoing 
                    ? 'bg-indigo-600 opacity-20' 
                    : 'bg-teal-600 opacity-20'
                }`}
              />
              <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#07070d]/50 to-[#07070d]/95" />
            </div>

            {/* Video Streams Canvas (Fullscreen when remote video is streaming) */}
            <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
              {isVideoCall && isConnected ? (
                <div className="w-full h-full bg-[#050508] flex items-center justify-center relative pointer-events-auto">
                  {remoteStream ? (
                    <>
                      <VideoStream 
                        stream={remoteStream} 
                        className={`w-full h-full object-cover transition-all duration-700 ${
                          isRemoteVideoMuted ? 'filter blur-3xl scale-110 opacity-30' : ''
                        }`} 
                      />
                      {isRemoteVideoMuted && (
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-xl flex flex-col items-center justify-center gap-3 z-10">
                          <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-16 h-16 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shadow-xl"
                          >
                            <VideoOff className="w-7 h-7 text-white/70" />
                          </motion.div>
                          <p className="text-white/80 text-sm font-semibold tracking-wide drop-shadow-md">
                            {peerName} heeft camera gepauzeerd
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-white/40 text-sm animate-pulse font-medium tracking-wider">
                      Wachten op videosignaal...
                    </div>
                  )}
                </div>
              ) : isVideoCall && (isOutgoing || isIncoming) && localStream ? (
                <div className="w-full h-full bg-[#050508] flex items-center justify-center pointer-events-auto">
                  <VideoStream stream={localStream} muted className="w-full h-full object-cover opacity-50 filter blur-sm" />
                </div>
              ) : peerAvatar?.trim() ? (
                <div className="relative w-full h-full overflow-hidden bg-[#07070d]">
                  <img 
                    src={peerAvatar} 
                    alt="" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-15 blur-3xl scale-125"
                  />
                  <div className="absolute inset-0 bg-[#07070d]/75" />
                </div>
              ) : null}
            </div>

            {/* Floating Picture-in-Picture Local Camera Stream */}
            {isVideoCall && isConnected && localStream && !isEnding && (
              <div id="webrtc-local-pip" className="absolute top-6 right-6 w-32 h-44 sm:w-36 sm:h-48 rounded-2xl border border-white/15 bg-neutral-950/85 shadow-2xl overflow-hidden z-30 pointer-events-auto backdrop-blur-md">
                {isScreenSharing ? (
                  <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center p-3 text-center">
                    <ScreenShare className="w-7 h-7 text-emerald-400 animate-pulse mb-2" />
                    <span className="text-[10px] font-bold tracking-wider text-emerald-300 uppercase">Scherm delen</span>
                    <span className="text-[8px] text-white/40 mt-1">Actief venster</span>
                  </div>
                ) : (
                  <>
                    <VideoStream 
                      stream={localStream} 
                      muted 
                      className={`w-full h-full object-cover transition-all duration-500 ${
                        isVideoMuted ? 'filter blur-2xl scale-110 opacity-30 shadow-none' : ''
                      }`} 
                    />
                    {isVideoMuted && (
                      <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-md flex flex-col items-center justify-center">
                        <VideoOff className="w-6 h-6 text-white/50" />
                        <span className="text-[9px] font-bold tracking-wider text-white/40 uppercase mt-1">Camera uit</span>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[8px] font-bold text-white/70 uppercase">
                      Jij
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Top Bar Status Info & Controls */}
            <div className="relative z-30 w-full flex items-center justify-between px-2 pt-2">
              {isEnding ? (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/20 border border-rose-500/40 backdrop-blur-md shadow-lg shadow-rose-950/40 text-rose-300"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-bold tracking-wide uppercase">
                    {endingReason || 'Gesprek beëindigd'}
                  </span>
                </motion.div>
              ) : isIncoming ? (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-violet-950/80 border border-violet-500/40 backdrop-blur-xl shadow-lg shadow-violet-950/50"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-bold tracking-wide text-white uppercase">
                    {isVideoCall ? 'Inkomend videogesprek' : 'Inkomende oproep'}
                  </span>
                  {/* Miniature Animated Ringing Audio Bars */}
                  <div className="flex items-center gap-1 h-3 ml-1 pl-2 border-l border-white/15">
                    {[0.4, 0.9, 0.6, 1, 0.5].map((_, idx) => (
                      <motion.div
                        key={idx}
                        animate={{ height: [3, 14, 3] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: idx * 0.12, ease: "easeInOut" }}
                        className="w-1 bg-gradient-to-t from-violet-400 to-emerald-300 rounded-full"
                      />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md shadow-md">
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-sky-400 animate-ping'
                  }`} />
                  <span className="text-xs font-semibold tracking-wide text-white/90">
                    {isOutgoing && (isVideoCall ? 'Videosprek starten...' : 'Bellen...')}
                    {isConnected && (isVideoCall ? 'Actief videogesprek' : 'Beveiligd gesprek')}
                  </span>
                  {isConnected && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400/80 font-medium pl-1 border-l border-white/10">
                      <ShieldCheck className="w-3 h-3" />
                      <span>E2EE</span>
                    </span>
                  )}
                </div>
              )}

              {/* Top right: Minimize button to switch to floating compact widget (hidden during hangup) */}
              {!isEnding && (
                <button 
                  onClick={() => setLayout('compact')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-all shadow-md cursor-pointer text-xs font-medium"
                  title="Minimaliseer naar mini-speler"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Minimaliseren</span>
                </button>
              )}
            </div>

            {/* Middle Main Content */}
            <div className="relative z-20 flex flex-col items-center justify-center flex-1 w-full max-w-md my-auto gap-6">
              
              {/* Scenario 1: Call Ending / Telephone Hangup Animation */}
              {isEnding ? (
                <motion.div
                  key="hangup-animation"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="flex flex-col items-center justify-center text-center my-auto py-4"
                >
                  {/* Caller Avatar (Dimmed with red ring) */}
                  <div className="relative mb-5">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-rose-500/50 opacity-40 grayscale filter blur-[1px]">
                      {peerAvatar?.trim() ? (
                        <img src={peerAvatar} alt={peerName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      ) : (
                        <LetterAvatar name={peerName} className="w-full h-full rounded-full" />
                      )}
                    </div>
                    {/* Disconnect shockwave */}
                    <motion.div
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: [0.7, 1.8], opacity: [0.8, 0] }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="absolute inset-0 rounded-full border-2 border-rose-500 pointer-events-none"
                    />
                  </div>

                  {/* Mechanical Phone Cradle & Handset Receiver */}
                  <div className="relative flex flex-col items-center justify-center my-4 w-60 h-36">
                    {/* Cradle Base */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-2 w-52 h-14 rounded-2xl bg-gradient-to-b from-neutral-800 to-neutral-950 border border-white/20 flex items-center justify-between px-6 shadow-2xl"
                    >
                      {/* Left cradle rest groove */}
                      <div className="w-10 h-6 rounded-lg bg-black border border-white/10 shadow-inner flex items-center justify-center">
                        <div className="w-4 h-2 rounded-full bg-neutral-700/60" />
                      </div>

                      {/* Center status accent */}
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)]" />

                      {/* Right cradle rest groove */}
                      <div className="w-10 h-6 rounded-lg bg-black border border-white/10 shadow-inner flex items-center justify-center">
                        <div className="w-4 h-2 rounded-full bg-neutral-700/60" />
                      </div>

                      {/* Impact shockwave on receiver contact */}
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: [0.8, 1.7, 2.1], opacity: [0.9, 0.4, 0] }}
                        transition={{ duration: 0.65, delay: 0.2, ease: "easeOut" }}
                        className="absolute inset-0 rounded-2xl border-2 border-rose-500 pointer-events-none"
                      />
                    </motion.div>

                    {/* Telephone Handset Receiver */}
                    {/* Starts angled up in speaking posture (-25deg), rotates smoothly to -135deg and snaps down into the cradle */}
                    <motion.div
                      initial={{ y: -70, rotate: -25, scale: 1.15 }}
                      animate={{
                        y: [-70, -38, 13, 13],
                        rotate: [-25, -65, -135, -135],
                        scale: [1.15, 1.05, 0.95, 1],
                      }}
                      transition={{
                        duration: 0.58,
                        times: [0, 0.35, 0.75, 1],
                        ease: [0.25, 1, 0.5, 1],
                      }}
                      className="absolute z-20 w-48 h-12 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 border-2 border-white/30 shadow-[0_15px_40px_rgba(225,29,72,0.6)] flex items-center justify-between px-3.5 text-white"
                    >
                      {/* Left earpiece */}
                      <div className="w-8 h-8 rounded-full bg-red-900 border border-white/30 flex items-center justify-center shadow-inner">
                        <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
                      </div>

                      {/* Center grip label */}
                      <div className="flex items-center gap-1.5 px-1">
                        <PhoneOff className="w-4 h-4 text-white drop-shadow" />
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-white/95">Opgehangen</span>
                      </div>

                      {/* Right mouthpiece */}
                      <div className="w-8 h-8 rounded-full bg-red-900 border border-white/30 flex items-center justify-center shadow-inner">
                        <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
                      </div>
                    </motion.div>
                  </div>

                  {/* Hangup Text Notice */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 }}
                    className="space-y-2 mt-3"
                  >
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                      {endingReason || 'Telefoon Opgehangen'}
                    </h2>
                    <p className="text-sm font-semibold text-rose-300/90 tracking-wide">
                      {peerName} • {duration > 0 ? `Duur: ${formatDuration(duration)}` : 'Verbinding verbroken'}
                    </p>
                  </motion.div>
                </motion.div>
              ) : isIncoming ? (
                /* Scenario 2: Incoming Call Screen with Smooth Animations & Radiant Ripple Waves */
                <motion.div
                  key="incoming-animated-view"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  className="flex flex-col items-center justify-center w-full gap-6"
                >
                  {/* Caller Avatar with Expanding Radiant Ring Waves & Ringing Vibration */}
                  <div className="relative flex items-center justify-center my-2">
                    {/* Ripple Wave 1 */}
                    <motion.div
                      animate={{ scale: [1, 1.55], opacity: [0.75, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                      className="absolute w-36 h-36 md:w-44 md:h-44 rounded-full border-2 border-violet-400/60 bg-violet-500/10 pointer-events-none"
                    />
                    {/* Ripple Wave 2 */}
                    <motion.div
                      animate={{ scale: [1, 2.1], opacity: [0.55, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 0.7 }}
                      className="absolute w-36 h-36 md:w-44 md:h-44 rounded-full border border-fuchsia-500/40 bg-fuchsia-500/5 pointer-events-none"
                    />
                    {/* Ripple Wave 3 */}
                    <motion.div
                      animate={{ scale: [1, 2.7], opacity: [0.35, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 1.4 }}
                      className="absolute w-36 h-36 md:w-44 md:h-44 rounded-full border border-indigo-400/30 pointer-events-none"
                    />

                    {/* Ringing Wobble Vibration Avatar Container */}
                    <motion.div
                      animate={{
                        rotate: [0, -5, 5, -5, 5, -2, 2, 0],
                        scale: [1, 1.04, 1, 1.04, 1],
                      }}
                      transition={{
                        duration: 0.65,
                        repeat: Infinity,
                        repeatDelay: 1.6,
                        ease: "easeInOut",
                      }}
                      className="w-36 h-36 md:w-44 md:h-44 rounded-full p-[4px] bg-gradient-to-tr from-violet-500 via-fuchsia-400 to-emerald-400 shadow-[0_0_55px_rgba(168,85,247,0.4)] relative z-10"
                    >
                      <div className="w-full h-full rounded-full overflow-hidden bg-neutral-900 border-2 border-white/20 flex items-center justify-center">
                        {peerAvatar?.trim() ? (
                          <img 
                            src={peerAvatar} 
                            alt={peerName} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <LetterAvatar name={peerName} className="w-full h-full rounded-full text-4xl" />
                        )}
                      </div>
                    </motion.div>
                  </div>

                  {/* Caller Name & Ringing Subtitle */}
                  <div className="text-center space-y-2">
                    <motion.h1 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg"
                    >
                      {peerName}
                    </motion.h1>
                    
                    <motion.p
                      animate={{ opacity: [0.65, 1, 0.65] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                      className="text-sm font-semibold text-violet-300 tracking-wide flex items-center justify-center gap-2"
                    >
                      <span>Inkomende oproep wacht op antwoord...</span>
                    </motion.p>
                  </div>
                </motion.div>
              ) : (
                /* Scenario 3: Connected or Outgoing View */
                <>
                  {(!isVideoCall || !isConnected) && (
                    <div className="relative flex items-center justify-center">
                      {isOutgoing && (
                        <motion.div
                          animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                          className="absolute inset-0 w-32 h-32 md:w-40 md:h-40 rounded-full border border-sky-500/40"
                        />
                      )}

                      <motion.div
                        className="w-32 h-32 md:w-40 md:h-40 rounded-full p-[3px] bg-gradient-to-br from-white/20 via-white/5 to-white/10 border border-white/15 shadow-2xl relative z-10"
                      >
                        <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-b from-neutral-800 to-neutral-900 flex items-center justify-center">
                          {peerAvatar?.trim() ? (
                            <img 
                              src={peerAvatar} 
                              alt={peerName} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <LetterAvatar name={peerName} className="w-full h-full rounded-full" />
                          )}
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* Name, State & Audio Visualizer */}
                  <div className="text-center space-y-2">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight drop-shadow-md">
                      {peerName}
                    </h1>
                    
                    {isConnected ? (
                      <div className="flex flex-col items-center gap-3">
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-3xl sm:text-4xl font-light font-mono text-white tracking-widest tabular-nums drop-shadow-[0_0_25px_rgba(168,139,250,0.35)]"
                        >
                          {formatDuration(duration)}
                        </motion.div>

                        {/* Glowing Audio Waves */}
                        <div className="flex items-center gap-1.5 h-6 mt-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((_, i) => (
                            <motion.div
                              key={i}
                              animate={{
                                height: isMuted ? [3, 3, 3] : [3, Math.random() * 22 + 4, 3],
                              }}
                              transition={{
                                duration: isMuted ? 1 : 0.45 + (i % 4) * 0.1,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                              className={`w-[3px] rounded-full ${
                                isMuted 
                                  ? 'bg-neutral-600/40' 
                                  : 'bg-gradient-to-t from-violet-500 via-fuchsia-400 to-emerald-400'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-semibold text-white/50 tracking-wider uppercase">
                        Verbinding maken met beller...
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Bottom Controls Dock (Hidden during hangup transition) */}
            {!isEnding && (
              <div className="relative z-30 w-full flex items-center justify-center pb-4 sm:pb-6">
                {isIncoming ? (
                  /* Incoming Call Action Dock: Responsive, Glowing, Animated Accept & Decline */
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="flex items-center gap-8 sm:gap-14 px-8 py-4 rounded-full bg-neutral-950/85 border border-white/15 backdrop-blur-2xl shadow-2xl"
                  >
                    {/* Decline Button */}
                    <div className="flex flex-col items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: "#dc2626" }}
                        whileTap={{ scale: 0.92 }}
                        onClick={rejectCall}
                        className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-rose-600 to-red-600 flex items-center justify-center text-white shadow-xl shadow-red-950/60 cursor-pointer border border-rose-400/30 transition-all hover:shadow-red-500/40"
                        aria-label="Weigeren"
                        title="Weigeren"
                      >
                        <PhoneOff className="w-7 h-7 sm:w-8 sm:h-8" />
                      </motion.button>
                      <span className="text-xs font-semibold text-rose-300 tracking-wide">Weigeren</span>
                    </div>

                    {/* Accept Button with Radiant Pulse & Swinging Handset */}
                    <div className="flex flex-col items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.12 }}
                        whileTap={{ scale: 0.92 }}
                        animate={{
                          boxShadow: [
                            "0 0 0 0px rgba(16, 185, 129, 0.7)",
                            "0 0 0 20px rgba(16, 185, 129, 0)",
                          ],
                        }}
                        transition={{
                          duration: 1.6,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        onClick={acceptCall}
                        className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-emerald-950/60 cursor-pointer border border-emerald-300/40"
                        aria-label="Beantwoorden"
                        title="Beantwoorden"
                      >
                        <motion.div
                          animate={{ rotate: [0, -14, 14, -10, 10, 0] }}
                          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
                        >
                          <Phone className="w-7 h-7 sm:w-8 sm:h-8" />
                        </motion.div>
                      </motion.button>
                      <span className="text-xs font-bold text-emerald-300 tracking-wide">Beantwoorden</span>
                    </div>
                  </motion.div>
                ) : (
                  /* Connected / Outgoing Unified Control Dock */
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 sm:gap-4 px-5 py-3 rounded-full bg-neutral-950/75 border border-white/10 backdrop-blur-2xl shadow-2xl"
                  >
                    {/* 1. Mute Microphone Toggle */}
                    <button 
                      onClick={toggleMute}
                      className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full transition-all duration-200 border cursor-pointer active:scale-95 ${
                        isMuted 
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                          : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
                      }`}
                      title={isMuted ? "Microfoon aanzetten" : "Microfoon dempen"}
                    >
                      {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </button>

                    {/* 2. Video Toggle */}
                    {isVideoCall && toggleVideo && (
                      <button 
                        onClick={toggleVideo}
                        className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full transition-all duration-200 border cursor-pointer active:scale-95 ${
                          isVideoMuted 
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                            : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
                        }`}
                        title={isVideoMuted ? "Camera inschakelen" : "Camera uitschakelen"}
                      >
                        {isVideoMuted ? <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Video className="w-5 h-5 sm:w-6 sm:h-6" />}
                      </button>
                    )}

                    {/* 3. Screen Sharing Toggle */}
                    {isConnected && toggleScreenShare && (
                      <button 
                        onClick={toggleScreenShare}
                        className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full transition-all duration-200 border cursor-pointer active:scale-95 ${
                          isScreenSharing 
                            ? 'bg-emerald-500/25 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]' 
                            : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
                        }`}
                        title={isScreenSharing ? "Stoppen met scherm delen" : "Scherm delen"}
                      >
                        <ScreenShare className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    )}

                    {/* 4. End Call Button with Hangup Micro-interaction */}
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={endCall}
                      className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-lg shadow-red-950/50 cursor-pointer border-none transition-all group"
                      title="Gesprek beëindigen (Ophangen)"
                    >
                      <motion.div
                        className="group-hover:rotate-[-25deg] transition-transform duration-200"
                      >
                        <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
                      </motion.div>
                    </motion.button>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          /* High-quality Compact Frosted Control Widget with Instant Mute, Smooth Waves, and Hangup Settle */
          <motion.div
            key="compact-call"
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.25 } }}
            className="fixed bottom-6 right-6 z-[200] max-w-sm w-88 select-none"
          >
            <div className={`backdrop-blur-2xl border rounded-2xl p-3.5 shadow-2xl relative overflow-hidden transition-all duration-500 ${
              isEnding 
                ? 'bg-neutral-950/95 border-rose-500/30 shadow-rose-950/50' 
                : 'bg-neutral-950/90 border-white/15'
            }`}>
              {/* Radial backdrop accent in compact */}
              <div className={`absolute -inset-[1px] -z-10 rounded-2xl bg-gradient-to-r ${
                isEnding ? 'from-rose-500/25 to-red-600/25' :
                isIncoming ? 'from-violet-500/25 to-fuchsia-500/25' :
                isOutgoing ? 'from-blue-500/20 to-indigo-500/20' :
                'from-emerald-500/20 to-teal-500/20'
              } opacity-70 blur-xs`} />

              <div className="flex items-center gap-3">
                {/* Avatar / Video preview with Ringing wobble or Hangup Tilt */}
                <div className="relative flex-shrink-0">
                  <motion.div
                    animate={
                      isEnding 
                        ? { rotate: -135, scale: 0.9 }
                        : isIncoming 
                        ? { rotate: [0, -6, 6, -6, 6, 0], scale: [1, 1.05, 1] } 
                        : {}
                    }
                    transition={
                      isIncoming 
                        ? { duration: 0.6, repeat: Infinity, repeatDelay: 1.5 } 
                        : { duration: 0.4 }
                    }
                    className={`w-11 h-11 rounded-full border-2 ${
                      isEnding ? 'border-rose-500 bg-rose-950/60' :
                      isIncoming ? 'border-violet-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 
                      isOutgoing ? 'border-sky-500' : 
                      'border-emerald-500'
                    } bg-neutral-900 overflow-hidden relative shadow-lg flex items-center justify-center`}
                  >
                    {isEnding ? (
                      <PhoneOff className="w-5 h-5 text-rose-400" />
                    ) : isVideoCall && isConnected && remoteStream && !isRemoteVideoMuted ? (
                      <VideoStream stream={remoteStream} className="w-full h-full object-cover" />
                    ) : isVideoCall && isConnected && localStream && !isScreenSharing ? (
                      <VideoStream stream={localStream} muted className="w-full h-full object-cover" />
                    ) : peerAvatar?.trim() ? (
                      <img 
                        src={peerAvatar} 
                        alt={peerName} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <LetterAvatar name={peerName} className="w-full h-full rounded-full" />
                    )}
                  </motion.div>
                  {isConnected && isMuted && !isEnding && (
                    <span className="absolute -bottom-1 -right-1 bg-amber-500 p-0.5 rounded-full border border-neutral-950 flex items-center justify-center shadow-md">
                      <MicOff className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                </div>

                {/* Name, State & Mini Wave */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">{peerName}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {isEnding ? (
                      <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider leading-none">
                        Opgehangen
                      </span>
                    ) : isConnected ? (
                      <span className="text-[11px] font-mono text-emerald-400 font-semibold leading-none">
                        {formatDuration(duration)}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider leading-none">
                        {isIncoming ? 'Inkomend...' : 'Bellen...'}
                      </span>
                    )}

                    {/* Animated visualizer in compact */}
                    {isConnected && !isEnding && (
                      <div className="flex items-center gap-[2px] h-2">
                        {[1, 2, 3, 4].map((bar) => (
                          <motion.div
                            key={bar}
                            animate={{ height: isMuted ? [2, 2, 2] : [2, Math.random() * 8 + 2, 2] }}
                            transition={{ duration: isMuted ? 1 : 0.5 + Math.random() * 0.3, repeat: Infinity }}
                            className={`w-[2px] rounded-full ${isMuted ? 'bg-white/20' : 'bg-emerald-400'}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Compact Action Buttons */}
                {!isEnding && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Quick Mute Toggle */}
                    {isConnected && (
                      <button 
                        onClick={toggleMute}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          isMuted 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                            : 'bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10'
                        }`}
                        title={isMuted ? "Microfoon aanzetten" : "Microfoon dempen"}
                      >
                        {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    {/* Quick Video Toggle */}
                    {isConnected && isVideoCall && toggleVideo && (
                      <button 
                        onClick={toggleVideo}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          isVideoMuted 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                            : 'bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10'
                        }`}
                        title={isVideoMuted ? "Camera aanzetten" : "Camera uitzetten"}
                      >
                        {isVideoMuted ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    {/* Maximize to full screen */}
                    <button 
                      onClick={() => setLayout('large')}
                      className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-white/10"
                      title="Vergroot belscherm"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    
                    {/* Accept or End Call */}
                    {isIncoming ? (
                      <div className="flex items-center gap-1.5">
                        <motion.button 
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          onClick={rejectCall} 
                          className="p-2.5 bg-gradient-to-br from-rose-600 to-red-600 text-white rounded-xl cursor-pointer hover:brightness-110 active:scale-95 shadow-md flex items-center justify-center border-none"
                          title="Weigeren"
                        >
                          <PhoneOff className="w-3.5 h-3.5" />
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          animate={{
                            boxShadow: [
                              "0 0 0 0px rgba(16, 185, 129, 0.6)",
                              "0 0 0 8px rgba(16, 185, 129, 0)",
                            ],
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          onClick={acceptCall} 
                          className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl cursor-pointer hover:brightness-110 active:scale-95 shadow-md flex items-center justify-center border-none"
                          title="Beantwoorden"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    ) : (
                      <motion.button 
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={endCall} 
                        className="p-2.5 bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-xl cursor-pointer hover:brightness-110 active:scale-95 shadow-md flex items-center justify-center border-none"
                        title="Ophangen"
                      >
                        <PhoneOff className="w-3.5 h-3.5" />
                      </motion.button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
