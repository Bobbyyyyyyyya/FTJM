import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, PhoneCall, Volume2, User, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CallState, CallData, CallLayout } from '../hooks/useVoiceCall';

interface VoiceCallUIProps {
  callState: CallState;
  activeCall: CallData | null;
  isMuted: boolean;
  layout: CallLayout;
  setLayout: (layout: CallLayout) => void;
  isInitiator: boolean;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  remoteAudioRef: React.RefObject<HTMLAudioElement | null>;
}

export const VoiceCallUI: React.FC<VoiceCallUIProps> = ({
  callState,
  activeCall,
  isMuted,
  layout,
  setLayout,
  isInitiator,
  remoteAudioRef,
  acceptCall,
  rejectCall,
  endCall,
  toggleMute
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

  const peerName = isInitiator ? activeCall.targetName : activeCall.callerName;
  const peerAvatar = isInitiator ? activeCall.targetAvatar : activeCall.callerAvatar;

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
            className="fixed inset-0 z-[200] bg-neutral-950 flex flex-col items-center justify-center p-6 overflow-hidden"
          >
            {/* Background Image / Blur */}
            <div className="absolute inset-0 z-0">
              {peerAvatar ? (
                <img 
                  src={peerAvatar} 
                  alt="" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-20 blur-3xl scale-125"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-neutral-800 to-neutral-950 opacity-40" />
              )}
            </div>

            <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-md">
              {/* Header Info */}
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
                >
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500 animate-ping'}`} />
                  <span className="text-xs font-bold uppercase tracking-widest text-white/70">
                    {isIncoming && 'Inkomende Oproep'}
                    {isOutgoing && 'Bent aan het bellen...'}
                    {isConnected && 'Verbonden door End-to-End encryptie'}
                  </span>
                </motion.div>
                
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight drop-shadow-2xl">
                  {peerName}
                </h1>
                
                {isConnected && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-2xl font-mono text-emerald-400"
                  >
                    {formatDuration(duration)}
                  </motion.p>
                )}
              </div>

              {/* Avatar */}
              <div className="relative">
                <AnimatePresence>
                  {(isIncoming || isOutgoing) && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.5, opacity: 0.2 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`absolute inset-0 rounded-full ${isIncoming ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    />
                  )}
                </AnimatePresence>
                
                <motion.div
                  layoutId="call-avatar"
                  className={`w-48 h-48 md:w-64 md:h-64 rounded-full border-8 ${
                    isIncoming ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)]' : 
                    isOutgoing ? 'border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.3)]' :
                    'border-white/10'
                  } bg-neutral-900 overflow-hidden relative shadow-2xl`}
                >
                  {peerAvatar ? (
                    <img 
                      src={peerAvatar} 
                      alt={peerName} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-24 h-24 text-neutral-700" />
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col items-center gap-8 w-full">
                <div className="flex items-center justify-center gap-10">
                  {isIncoming && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={rejectCall}
                      className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-2xl transition-all"
                    >
                      <PhoneOff className="w-8 h-8" />
                    </motion.button>
                  )}

                  {(isConnected || isOutgoing) && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleMute}
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all bg-white/10 border border-white/10 backdrop-blur-md ${
                        isMuted ? 'text-amber-500' : 'text-white'
                      }`}
                    >
                      {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </motion.button>
                  )}

                  {isIncoming && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      onClick={acceptCall}
                      className="w-20 h-20 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-2xl transition-all"
                    >
                      <Phone className="w-8 h-8" />
                    </motion.button>
                  )}

                  {(isConnected || isOutgoing) && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={endCall}
                      className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-2xl transition-all"
                    >
                      <PhoneOff className="w-8 h-8" />
                    </motion.button>
                  )}
                </div>

                {/* Layout Toggle */}
                <button 
                  onClick={() => setLayout('compact')}
                  className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-medium"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>Minimaliseer scherm</span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="compact-call"
            initial={{ opacity: 0, scale: 0.8, x: 20, y: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-[200] max-w-xs w-full"
          >
            <div className="bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl relative">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <motion.div
                    layoutId="call-avatar"
                    className={`w-14 h-14 rounded-full border-2 ${
                      isIncoming ? 'border-emerald-500' : 
                      isOutgoing ? 'border-blue-500' : 
                      'border-white/10'
                    } bg-neutral-800 overflow-hidden relative`}
                  >
                    {peerAvatar ? (
                      <img 
                        src={peerAvatar} 
                        alt={peerName} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-6 h-6 text-neutral-500" />
                      </div>
                    )}
                  </motion.div>
                  {isConnected && (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1 rounded-full border-2 border-neutral-900">
                      <Volume2 className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{peerName}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    {isConnected ? formatDuration(duration) : (isIncoming ? 'Inkomend...' : 'Bellen...')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setLayout('large')}
                    className="p-2 text-neutral-500 hover:text-white transition-colors"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  
                  {isIncoming ? (
                    <button onClick={acceptCall} className="p-2 bg-emerald-500 text-white rounded-full">
                      <Phone className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={endCall} className="p-2 bg-red-500 text-white rounded-full">
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

