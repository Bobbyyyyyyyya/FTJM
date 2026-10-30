import React, { useState, useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, Users, Video, VideoOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GroupCallState, GroupParticipant } from '../hooks/useGroupVoiceCall';
import { getSafeImageUrl, handleImageError } from '../utils/helpers';
import { LetterAvatar } from './UserAvatar';

interface GroupVoiceCallUIProps {
  state: GroupCallState;
  participants: Record<string, GroupParticipant>;
  isMuted: boolean;
  isVideoCall?: boolean;
  isVideoMuted?: boolean;
  localStream?: MediaStream | null;
  leaveCall: () => void;
  toggleMute: () => void;
  toggleVideo?: () => void;
  roomName: string;
  user: any;
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

export const GroupVoiceCallUI: React.FC<GroupVoiceCallUIProps> = ({
  state,
  participants,
  isMuted,
  isVideoCall = false,
  isVideoMuted = false,
  localStream = null,
  leaveCall,
  toggleMute,
  toggleVideo,
  roomName,
  user
}) => {
  const [duration, setDuration] = useState(0);
  const [showParticipantsList, setShowParticipantsList] = useState(false);
  const [locallyMutedUsers, setLocallyMutedUsers] = useState<string[]>([]);

  useEffect(() => {
    let interval: any;
    if (state === 'connected') {
      const startTime = Date.now();
      interval = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [state]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (state === 'idle') return null;

  const participantList = Object.values(participants);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-[#07070d] flex flex-col p-6 overflow-hidden select-none"
    >
      {/* Participant Audio Elements */}
      {participantList.map(p => (
        p.stream && (
          <ParticipantAudio 
            key={p.uid} 
            stream={p.stream} 
            isLocallyMuted={locallyMutedUsers.includes(p.uid)} 
          />
        )
      ))}

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shadow-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">{roomName}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-emerald-400/90 font-mono">
                Live Groepscall • {formatDuration(duration)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowParticipantsList(prev => !prev)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all backdrop-blur-md cursor-pointer text-xs font-semibold ${
              showParticipantsList
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{participantList.length + 1} deelnemers</span>
          </button>
        </div>
      </div>

      {/* Main content grid combining Sidebar & Card views */}
      <div className="flex-1 min-h-0 relative z-10 flex gap-6">
        
        {/* Participants Cards Panel */}
        <div className="flex-1 min-h-0">
          <div className={`grid gap-4 h-full ${
            participantList.length === 0 ? 'grid-cols-1' :
            participantList.length <= 1 ? 'grid-cols-1 md:grid-cols-2' :
            participantList.length <= 3 ? 'grid-cols-2' :
            'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          }`}>
            {/* Me */}
            <ParticipantCard 
              name="Jij" 
              photo_url={user.photoURL} 
              isMuted={isMuted} 
              isVideoCall={isVideoCall}
              isVideoMuted={isVideoMuted}
              stream={localStream}
              isMe={true}
            />
            
            {/* Others */}
            {participantList.map(p => (
              <ParticipantCard 
                key={p.uid}
                name={p.name}
                photo_url={p.photo_url}
                isMuted={p.isMuted}
                isVideoCall={isVideoCall}
                isVideoMuted={p.isVideoMuted}
                stream={p.stream}
                isLocallyMuted={locallyMutedUsers.includes(p.uid)}
                onToggleLocalMute={() => {
                  setLocallyMutedUsers(prev => 
                    prev.includes(p.uid) ? prev.filter(id => id !== p.uid) : [...prev, p.uid]
                  );
                }}
              />
            ))}
          </div>
        </div>

        {/* Sidebar Participant List */}
        <AnimatePresence>
          {showParticipantsList && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-80 shrink-0 border border-white/10 rounded-3xl p-5 flex flex-col h-full bg-neutral-950/80 backdrop-blur-2xl relative z-10"
              id="group-call-sidebar"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4 shrink-0">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Deelnemers ({participantList.length + 1})
                </span>
                <button 
                  onClick={() => setShowParticipantsList(false)}
                  className="text-white/40 hover:text-white transition-colors text-xs font-semibold cursor-pointer"
                >
                  Sluiten
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                {/* Me in list */}
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-white/10">
                      {user.photoURL ? (
                        <img src={getSafeImageUrl(user.photoURL)} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={handleImageError} />
                      ) : (
                        <LetterAvatar name="Jij" className="w-full h-full rounded-full" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-white truncate">Jij</span>
                      <span className="text-[10px] text-white/40 font-medium">Jouw microfoon</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isMuted ? (
                      <MicOff className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Mic className="w-4 h-4 text-emerald-400" />
                    )}
                    {isVideoCall && (
                      isVideoMuted ? (
                        <VideoOff className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Video className="w-4 h-4 text-emerald-400" />
                      )
                    )}
                  </div>
                </div>

                {/* Others in list */}
                {participantList.map(p => (
                  <div key={p.uid} className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-white/10">
                        {p.photo_url?.trim() ? (
                          <img src={getSafeImageUrl(p.photo_url)} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={handleImageError} />
                        ) : (
                          <LetterAvatar name={p.name} className="w-full h-full rounded-full" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-white truncate">{p.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {p.isMuted && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 uppercase tracking-wider">Gedempt</span>
                          )}
                          {locallyMutedUsers.includes(p.uid) && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 uppercase tracking-wider">Lokaal Stil</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setLocallyMutedUsers(prev => 
                            prev.includes(p.uid) ? prev.filter(id => id !== p.uid) : [...prev, p.uid]
                          );
                        }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                          locallyMutedUsers.includes(p.uid)
                            ? 'bg-red-500/20 border-red-500/30 text-red-400'
                            : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/15'
                        }`}
                        title={locallyMutedUsers.includes(p.uid) ? "Geluid herstellen" : "Lokaal dempen"}
                      >
                        {locallyMutedUsers.includes(p.uid) ? (
                          <VolumeX className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Streamlined Ergonomic Controls Dock */}
      <div className="relative z-20 flex items-center justify-center pb-2 pt-4 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 px-5 py-3 rounded-full bg-neutral-950/75 border border-white/10 backdrop-blur-2xl shadow-2xl">
          {/* Mute */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMute}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all border cursor-pointer ${
              isMuted 
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
            }`}
            title={isMuted ? "Microfoon inschakelen" : "Microfoon dempen"}
          >
            {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
          </motion.button>

          {/* Video Toggle (if Video Call enabled) */}
          {isVideoCall && toggleVideo && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleVideo}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all border cursor-pointer ${
                isVideoMuted 
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                  : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
              }`}
              title={isVideoMuted ? "Camera aanzetten" : "Camera uitzetten"}
            >
              {isVideoMuted ? <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Video className="w-5 h-5 sm:w-6 sm:h-6" />}
            </motion.button>
          )}

          {/* Leave Call */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={leaveCall}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white flex items-center justify-center shadow-lg shadow-red-950/50 cursor-pointer border-none transition-all"
            title="Groepscall verlaten"
          >
            <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
        </div>
      </div>

      {/* Ambient background blur */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-500/5 blur-[120px] rounded-full" />
      </div>
    </motion.div>
  );
};

interface ParticipantCardProps {
  name: string;
  photo_url?: string;
  isMuted: boolean;
  isVideoCall?: boolean;
  isVideoMuted?: boolean;
  stream?: MediaStream | null;
  isMe?: boolean;
  isLocallyMuted?: boolean;
  onToggleLocalMute?: () => void;
}

const ParticipantCard = ({ 
  name, 
  photo_url, 
  isMuted, 
  isVideoCall = false, 
  isVideoMuted = false, 
  stream = null,
  isMe = false,
  isLocallyMuted = false,
  onToggleLocalMute
}: ParticipantCardProps) => {
  return (
    <motion.div 
      layout
      className="relative flex flex-col items-center justify-center bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden group backdrop-blur-md p-4"
    >
      {/* Video stream layer */}
      {isVideoCall && stream && (
        <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl">
          <VideoStream 
            stream={stream} 
            muted={isMe} 
            className={`w-full h-full object-cover transition-all duration-700 ${
              isVideoMuted ? 'filter blur-2xl opacity-20 scale-110' : 'opacity-80'
            }`} 
          />
        </div>
      )}

      {/* Profile Ring Overlay */}
      <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden mb-3 ring-4 ring-white/10 group-hover:ring-white/20 transition-all shadow-xl shrink-0">
        {photo_url?.trim() ? (
          <img src={getSafeImageUrl(photo_url)} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={handleImageError} />
        ) : (
          <LetterAvatar name={name} className="w-full h-full rounded-full" />
        )}
        
        {!isMuted && !isLocallyMuted && (
          <div className="absolute inset-0 border-2 border-emerald-400 animate-pulse rounded-full" />
        )}
      </div>

      <span className="relative z-10 text-sm sm:text-base font-bold text-white drop-shadow-md truncate max-w-full px-2">
        {name}
      </span>
      
      {/* Discrete status chip */}
      <div className="relative z-10 mt-1.5 flex items-center gap-1.5">
        {isLocallyMuted ? (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30">
            <VolumeX className="w-3 h-3 text-red-400" />
            <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Lokaal stil</span>
          </div>
        ) : isMuted ? (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
            <MicOff className="w-3 h-3 text-amber-400" />
            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Gedempt</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
            <Volume2 className="w-3 h-3 text-emerald-400" />
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Spreekt</span>
          </div>
        )}

        {isVideoCall && isVideoMuted && (
          <div className="flex items-center p-1 rounded-full bg-amber-500/15 border border-amber-500/30" title="Camera uit">
            <VideoOff className="w-3 h-3 text-amber-400" />
          </div>
        )}
      </div>

      {isMe && (
        <div className="absolute top-3.5 right-3.5 px-2 py-0.5 rounded-md bg-white/10 border border-white/10 backdrop-blur-md z-20">
          <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Jij</span>
        </div>
      )}

      {!isMe && onToggleLocalMute && (
        <button 
          onClick={onToggleLocalMute}
          className={`absolute top-3.5 right-3.5 p-1.5 rounded-xl border backdrop-blur-md z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer ${
            isLocallyMuted 
              ? 'bg-red-500/20 border-red-500/40 text-red-400' 
              : 'bg-white/10 border-white/10 text-white/80 hover:bg-white/20'
          }`}
          title={isLocallyMuted ? "Geluid herstellen" : "Lokaal dempen"}
        >
          {isLocallyMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      )}
    </motion.div>
  );
};

const ParticipantAudio = ({ stream, isLocallyMuted }: { stream: MediaStream; isLocallyMuted: boolean }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline muted={isLocallyMuted} />;
};
