import React, { useState, useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, User, Volume2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GroupCallState, GroupParticipant } from '../hooks/useGroupVoiceCall';

interface GroupVoiceCallUIProps {
  state: GroupCallState;
  participants: Record<string, GroupParticipant>;
  isMuted: boolean;
  leaveCall: () => void;
  toggleMute: () => void;
  roomName: string;
  user: any;
}

export const GroupVoiceCallUI: React.FC<GroupVoiceCallUIProps> = ({
  state,
  participants,
  isMuted,
  leaveCall,
  toggleMute,
  roomName,
  user
}) => {
  const [duration, setDuration] = useState(0);

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
      className="fixed inset-0 z-[200] bg-neutral-950 flex flex-col p-6 overflow-hidden"
    >
      {/* Participant Audio Elements */}
      {participantList.map(p => (
        p.stream && <ParticipantAudio key={p.uid} stream={p.stream} />
      ))}

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-app-accent flex items-center justify-center ring-1 ring-white/10">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{roomName}</h1>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">
                Live Groepscall • {formatDuration(duration)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="text-xs font-bold text-white/60">
              {participantList.length + 1} deelnemers
            </span>
          </div>
        </div>
      </div>

      {/* Participants Grid */}
      <div className="flex-1 min-h-0 relative z-10">
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
            isMe={true}
          />
          
          {/* Others */}
          {participantList.map(p => (
            <ParticipantCard 
              key={p.uid}
              name={p.name}
              photo_url={p.photo_url}
              isMuted={p.isMuted}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 flex items-center justify-center gap-6 mt-8">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleMute}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all border backdrop-blur-md shadow-2xl ${
            isMuted 
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-500' 
              : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
          }`}
        >
          {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={leaveCall}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-2xl transition-all border border-red-400/20"
        >
          <PhoneOff className="w-7 h-7" />
        </motion.button>
      </div>

      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full translate-x-1/2 translate-y-1/2" />
      </div>
    </motion.div>
  );
};

const ParticipantCard = ({ name, photo_url, isMuted, isMe = false }: { name: string, photo_url?: string, isMuted: boolean, isMe?: boolean }) => {
  return (
    <motion.div 
      layout
      className="relative flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-[32px] overflow-hidden group backdrop-blur-sm"
    >
      <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden mb-4 ring-4 ring-white/5 group-hover:ring-white/10 transition-all shadow-2xl">
        {photo_url ? (
          <img src={photo_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <User className="w-12 h-12 text-white/20" />
          </div>
        )}
        
        {!isMuted && (
          <div className="absolute inset-0 border-4 border-emerald-500 animate-pulse rounded-full" />
        )}
      </div>

      <span className="text-lg font-bold text-white drop-shadow-md">{name}</span>
      
      <div className="mt-2 flex items-center gap-2">
        {isMuted ? (
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
      </div>

      {isMe && (
        <div className="absolute top-4 right-4 px-2 py-1 rounded-lg bg-white/10 border border-white/10 backdrop-blur-md">
          <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Jij</span>
        </div>
      )}
    </motion.div>
  );
};

const ParticipantAudio = ({ stream }: { stream: MediaStream }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline />;
};
