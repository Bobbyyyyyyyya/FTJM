import React from 'react';
import { Trophy, Gamepad2 } from 'lucide-react';
import { decryptGeneralChat } from '../utils/encryption';

interface RichContentProps {
  content: string;
  searchQuery?: string;
}

const highlightMatch = (text: string, query?: string) => {
  if (!query || !query.trim()) return text;
  
  const escapeRegex = (str: string) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const safeQuery = escapeRegex(query.trim());
  
  try {
    const regex = new RegExp(`(${safeQuery})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === query.trim().toLowerCase() ? (
            <mark 
              key={index} 
              className="bg-yellow-400/35 dark:bg-yellow-400/25 text-inherit rounded-md px-1 py-0.5 font-bold border-b border-yellow-400/40"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  } catch (e) {
    return text;
  }
};

export const RichContent: React.FC<RichContentProps> = React.memo(({ content, searchQuery }) => {
  // Attempt to decrypt if it looks like an encrypted general chat message
  const decryptedContent = decryptGeneralChat(content);

  const shareMatch = decryptedContent.match(/\[ARCADE_SCORE_SHARE:(\w+):(\d+):([^\]]+)\]/);
  if (shareMatch) {
    const gameId = shareMatch[1];
    const score = parseInt(shareMatch[2], 10);
    const playerName = shareMatch[3];

    const getGameConfig = (id: string) => {
      switch (id) {
        case 'snake':
          return {
            name: 'FTJM Slang (Snake) 🐍',
            color: 'border-cyan-500 bg-cyan-950/25 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]',
            accent: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
          };
        case 'flappy':
          return {
            name: 'Flappy FTJM Logo 🚀',
            color: 'border-emerald-500 bg-emerald-950/25 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]',
            accent: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          };
        case 'sysadmin':
          return {
            name: 'SysAdmin Bitterbal Chaos 🔥',
            color: 'border-rose-500 bg-rose-950/25 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)] hover:shadow-[0_0_25px_rgba(244,63,94,0.3)]',
            accent: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          };
        case 'hamster':
          return {
            name: 'Hamster Vodka Run 🐹',
            color: 'border-yellow-500 bg-yellow-950/25 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.15)] hover:shadow-[0_0_25px_rgba(234,179,8,0.3)]',
            accent: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
          };
        case 'conquest':
          return {
            name: 'Wereld Heerschappij (Conquest) ⚔️',
            color: 'border-blue-500 bg-blue-950/25 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:shadow-[0_0_25px_rgba(59,130,246,0.3)]',
            accent: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
          };
        default:
          return {
            name: 'FTJM Arcade Game 🕹️',
            color: 'border-purple-500 bg-purple-950/25 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:shadow-[0_0_25px_rgba(168,85,247,0.3)]',
            accent: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
          };
      }
    };

    const cfg = getGameConfig(gameId);

    const handlePlayTooClick = () => {
      const event = new CustomEvent('ftjm_switch_view', { detail: 'arcade' });
      window.dispatchEvent(event);
    };

    return (
      <div className={`border rounded-2xl p-5 w-full max-w-sm font-primary transition-all duration-300 ${cfg.color}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${cfg.accent}`}>
              🏆 FTJM ARCADE RECORD
            </span>
            <h4 className="text-base font-black text-white mt-2 leading-tight">
              {cfg.name}
            </h4>
            <p className="text-xs text-white/70 font-medium leading-relaxed mt-1">
              Behaald door <span className="font-extrabold text-white">{playerName}</span>
            </p>
          </div>
          <div className="p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-xl animate-pulse">
            <Trophy className="w-6 h-6 text-yellow-500" />
          </div>
        </div>
        
        <div className="my-4 py-3 px-4 bg-black/40 border border-white/5 rounded-xl text-center">
          <span className="text-[10px] text-white/50 block font-bold uppercase tracking-wider font-mono">SCOORE</span>
          <span className="text-2xl font-black text-white tracking-tight font-mono">{score} <span className="text-xs text-yellow-500 font-bold">PUNTEN</span></span>
        </div>

        <button 
          onClick={handlePlayTooClick}
          className="w-full py-2 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Gamepad2 className="w-4 h-4 text-cyan-600" /> Speel Het Ook! 🕹️
        </button>
      </div>
    );
  }
  
  const urlRegex = /(https?:\/\/[^\s]+|data:image\/[a-zA-Z0-9+.-]+;base64,[^\s]+|data:audio\/[a-zA-Z0-9+.-]+;base64,[^\s]+)/g;
  const mentionRegex = /(@[a-zA-Z0-9_]+)/g;
  
  const combinedRegex = /(https?:\/\/[^\s]+|data:image\/[a-zA-Z0-9+.-]+;base64,[^\s]+|data:audio\/[a-zA-Z0-9+.-]+;base64,[^\s]+|@[a-zA-Z0-9_]+)/g;
  const parts = decryptedContent.split(combinedRegex);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const isImage = (url: string) => {
    if (url.startsWith('data:image/')) return true;
    const imageExtensions = /\.(jpeg|jpg|gif|png|webp|bmp|svg|avif)(\?.*)?$/i;
    const imageHosts = [
      'giphy.com/media',
      'tenor.com/view',
      'supabase.co/storage/v1/object/public',
      'images.unsplash.com',
      'i.imgur.com',
      'images.pexels.com',
      'cdn.discordapp.com/attachments',
      'media.discordapp.net/attachments',
      'cdn.imageurlgenerator.com'
    ];
    
    return url.match(imageExtensions) || imageHosts.some(host => url.includes(host));
  };

  const isAudio = (url: string) => {
    if (url.startsWith('data:audio/')) return true;
    const audioExtensions = /\.(mp3|wav|m4a|ogg|opus)(\?.*)?$/i;
    return url.match(audioExtensions);
  };

  return (
    <div className="space-y-2 break-words">
      <div className="whitespace-pre-wrap">{parts.map((part, i) => {
        if (part.match(urlRegex)) {
          if (part.startsWith('data:')) {
            return null; // Don't render raw base64 data strings as text
          }
          return (
            <a 
              key={i} 
              href={part} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-500 hover:underline break-all"
            >
              {part}
            </a>
          );
        }
        if (part.match(mentionRegex)) {
          return (
            <span key={i} className="px-1.5 py-0.5 bg-app-accent text-app-ink font-bold rounded-md border border-app-border/30 shadow-sm">
              {part}
            </span>
          );
        }
        return <React.Fragment key={i}>{highlightMatch(part, searchQuery)}</React.Fragment>;
      })}</div>
      
      <div className="flex flex-col gap-4 mt-2">
        {decryptedContent.match(urlRegex)?.map((url, i) => {
          const youtubeId = getYoutubeId(url);
          if (youtubeId) {
            return (
              <div key={i} className="relative aspect-video w-full max-w-2xl rounded-xl overflow-hidden shadow-lg border border-zinc-200">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            );
          }
          
          if (isImage(url)) {
            return (
              <div key={i} className="max-w-md rounded-xl overflow-hidden shadow-md border border-zinc-200">
                <img 
                  src={url} 
                  alt="Embedded content" 
                  className="w-full h-auto"
                  referrerPolicy="no-referrer"
                />
              </div>
            );
          }

          if (isAudio(url)) {
            return (
              <div key={i} className="max-w-md rounded-xl p-2 bg-app-bg border border-app-border flex items-center justify-center">
                <audio 
                  src={url} 
                  controls 
                  className="w-full focus:outline-none h-10"
                />
              </div>
            );
          }
          
          return null;
        })}
      </div>
    </div>
  );
});
