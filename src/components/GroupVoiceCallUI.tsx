import React, { useState, useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, User, Volume2, VolumeX, Users, Video, VideoOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GroupCallState, GroupParticipant } from '../hooks/useGroupVoiceCall';

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
      className="fixed inset-0 z-[200] bg-neutral-950 flex flex-col p-6 overflow-hidden animate-fade-in"
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
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-app-accent flex items-center justify-center ring-1 ring-white/10 shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{roomName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">
                Live Groeps{isVideoCall ? 'video' : 'voice'}call • {formatDuration(duration)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowParticipantsList(prev => !prev)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all backdrop-blur-md cursor-pointer ${
              showParticipantsList
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-emerald-500/10'
                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-xs font-bold leading-none">
              {participantList.length + 1} deelnemers
            </span>
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
              className="w-80 shrink-0 border border-white/10 rounded-[32px] p-6 flex flex-col h-full bg-neutral-950/20 backdrop-blur-3xl relative z-10"
              id="group-call-sidebar"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6 shrink-0">
                <span className="text-sm font-bold text-white tracking-wide uppercase">Deelnemers ({participantList.length + 1})</span>
                <button 
                  onClick={() => setShowParticipantsList(false)}
                  className="text-white/40 hover:text-white transition-colors text-xs uppercase font-bold"
                >
                  Sluiten
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {/* Me */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-900 shrink-0 border border-white/10">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white leading-none">Jij</span>
                      <span className="text-[10px] text-white/40 mt-1 font-semibold tracking-wide uppercase">Organisator</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isMuted ? (
                      <MicOff className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Mic className="w-4 h-4 text-emerald-500" />
                    )}
                    {isVideoCall && (
                      isVideoMuted ? (
                        <VideoOff className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Video className="w-4 h-4 text-emerald-500" />
                      )
                    )}
                  </div>
                </div>

                {/* Others */}
                {participantList.map(p => (
                  <div key={p.uid} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-900 shrink-0 border border-white/10">
                        {p.photo_url ? (
                          <img src={p.photo_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white/40" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white leading-none">{p.name}</span>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {p.isMuted && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 uppercase tracking-widest">Muted</span>
                          )}
                          {locallyMutedUsers.includes(p.uid) && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-red-500 uppercase tracking-widest leading-none">Lokaal Gedempt</span>
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
                            ? 'bg-red-500/20 border-red-500/30 text-red-500 shadow-lg shadow-red-500/10'
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

      {/* Controls */}
      <div className="relative z-10 flex items-center justify-center gap-5 mt-6 shrink-0">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border backdrop-blur-md shadow-2xl cursor-pointer ${
            isMuted 
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-500 shadow-amber-500/10' 
              : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
          }`}
          title={isMuted ? "Geluidsopname activeren" : "Geluidsopname dempen"}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </motion.button>

        {isVideoCall && toggleVideo && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border backdrop-blur-md shadow-2xl cursor-pointer ${
              isVideoMuted 
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-500 shadow-amber-500/10' 
                : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
            }`}
            title={isVideoMuted ? "Camera inschakelen" : "Camera uitschakelen"}
          >
            {isVideoMuted ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={leaveCall}
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-2xl transition-all border border-red-400/20 cursor-pointer"
          title="Gesprek verlaten"
        >
          <PhoneOff className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full translate-x-1/2 translate-y-1/2" />
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
      className="relative flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-[32px] overflow-hidden group backdrop-blur-sm"
    >
      {/* Video stream layer */}
      {isVideoCall && stream && (
        <div className="absolute inset-0 z-0 overflow-hidden rounded-[32px]">
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
      <div className="relative z-10 w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden mb-4 ring-4 ring-white/5 group-hover:ring-white/10 transition-all shadow-2xl shrink-0">
        {photo_url ? (
          <img src={photo_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <User className="w-12 h-12 text-white/20" />
          </div>
        )}
        
        {!isMuted && !isLocallyMuted && (
          <div className="absolute inset-0 border-4 border-emerald-500 animate-pulse rounded-full" />
        )}
      </div>

      <span className="relative z-10 text-lg font-bold text-white drop-shadow-md">{name}</span>
      
      <div className="relative z-10 mt-2 flex items-center gap-2">
        {isLocallyMuted ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30">
            <VolumeX className="w-3 h-3 text-red-400" />
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Lokaal Stemloos</span>
          </div>
        ) : isMuted ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <MicOff className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Gedempt</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Volume2 className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Spreekt</span>
          </div>
        )}

        {isVideoCall && (
          isVideoMuted ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <VideoOff className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Cam Uit</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Video className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Cam Aan</span>
            </div>
          )
        )}
      </div>

      {isMe && (
        <div className="absolute top-4 right-4 px-2 py-1 rounded-lg bg-white/10 border border-white/10 backdrop-blur-md z-20">
          <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Jij</span>
        </div>
      )}

      {!isMe && onToggleLocalMute && (
        <button 
          onClick={onToggleLocalMute}
          className={`absolute top-4 right-4 p-2 rounded-xl border backdrop-blur-md z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer ${
            isLocallyMuted 
              ? 'bg-red-500/20 border-red-500/40 text-red-500' 
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
