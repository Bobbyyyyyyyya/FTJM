import React from 'react';
import { Trophy, Gamepad2 } from 'lucide-react';
import { decryptGeneralChat } from '../utils/encryption';

interface RichContentProps {
  content: string;
  searchQuery?: string;
  hideMedia?: boolean;
}

const RichImage: React.FC<{ url: string }> = ({ url }) => {
  const getCleanSrc = (u: string) => {
    if (!u) return '';
    const clean = u.trim();
    if (clean.includes('ibb.co/') && !clean.includes('i.ibb.co/')) {
      return `/api/image-proxy?url=${encodeURIComponent(clean)}`;
    }
    if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('/') && !clean.startsWith('data:')) {
      return `/uploads/${clean}`;
    }
    return clean;
  };

  const initialSrc = getCleanSrc(url);
  const [currentSrc, setCurrentSrc] = React.useState<string>(initialSrc);
  const [hasError, setHasError] = React.useState(false);
  const [triedProxy, setTriedProxy] = React.useState(url.includes('ibb.co/') && !url.includes('i.ibb.co/'));

  const handleError = () => {
    if (!triedProxy && (url.startsWith('http://') || url.startsWith('https://'))) {
      setTriedProxy(true);
      setCurrentSrc(`/api/image-proxy?url=${encodeURIComponent(url)}`);
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className="max-w-md rounded-xl p-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-between gap-3 text-xs text-app-muted shadow-sm">
        <div className="flex items-center gap-2">
          <span>🖼️</span>
          <span>Afbeelding niet meer beschikbaar ({url.includes('ibb.co') ? 'ImgBB' : 'CDN'})</span>
        </div>
        {url.startsWith('http') && (
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-2 py-0.5 bg-app-accent hover:bg-app-accent/80 text-app-ink font-semibold rounded-md text-[11px] transition-all"
          >
            Bekijken ↗
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md rounded-xl overflow-hidden shadow-md border border-zinc-200 dark:border-zinc-800 bg-black/5">
      <img 
        src={currentSrc} 
        alt="Embedded content" 
        className="w-full h-auto object-contain max-h-[500px]"
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        onError={handleError}
      />
    </div>
  );
};

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

export const RichContent: React.FC<RichContentProps> = React.memo(({ content, searchQuery, hideMedia = false }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showCollapsedMedia, setShowCollapsedMedia] = React.useState(false);

  // Attempt to decrypt if it looks like an encrypted general chat message
  const safeContent = (content && typeof content === 'string') ? content : '';
  const decryptedContent = decryptGeneralChat(safeContent) || '';
  const safeDecryptedContent: string = (decryptedContent && typeof decryptedContent === 'string') ? decryptedContent : '';

  const shareMatch = safeDecryptedContent ? safeDecryptedContent.match(/\[ARCADE_SCORE_SHARE:(\w+):(\d+):([^\]]+)\]/) : null;
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
        case 'breakout':
          return {
            name: 'Retro Brick Breaker 🧱',
            color: 'border-purple-500 bg-purple-950/25 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:shadow-[0_0_25px_rgba(168,85,247,0.3)]',
            accent: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
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
  
  const urlRegex = /(https?:\/\/[^\s]+|\/uploads\/[^\s]+|\/api\/uploads\/[^\s]+|data:image\/[a-zA-Z0-9+.-]+;base64,[^\s]+|data:audio\/[a-zA-Z0-9+.-]+;base64,[^\s]+|data:video\/[a-zA-Z0-9+.-]+;base64,[^\s]+)/g;
  const mentionRegex = /(@[a-zA-Z0-9_]+)/g;
  
  const combinedRegex = /(https?:\/\/[^\s]+|\/uploads\/[^\s]+|\/api\/uploads\/[^\s]+|data:image\/[a-zA-Z0-9+.-]+;base64,[^\s]+|data:audio\/[a-zA-Z0-9+.-]+;base64,[^\s]+|data:video\/[a-zA-Z0-9+.-]+;base64,[^\s]+|@[a-zA-Z0-9_]+)/g;
  const parts = safeDecryptedContent.split(combinedRegex);

  // Calculate actual text length excluding base64 media attachments to avoid counting image/audio/video data
  const textOnlyForLengthCheck = safeDecryptedContent.replace(/data:(image|audio|video)\/[a-zA-Z0-9+.-]+;base64,[^\s]+/g, '');
  const isLongMessage = textOnlyForLengthCheck.length > 350;

  const getYoutubeId = (url: string) => {
    if (!url || typeof url !== 'string') return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const isVideo = (url: string) => {
    if (!url || typeof url !== 'string') return false;
    if (url.startsWith('data:video/')) return true;
    if (url.startsWith('data:audio/mp4') || url.startsWith('data:audio/webm') || url.startsWith('data:audio/quicktime')) return true;
    const videoExtensions = /\.(mp4|webm|mov|mkv|m4v|ogv|avi|3gp)(\?.*)?$/i;
    return videoExtensions.test(url);
  };

  const isImage = (url: string) => {
    if (!url || typeof url !== 'string') return false;
    if (isVideo(url)) return false;
    if (url.startsWith('/uploads/') || url.startsWith('/api/uploads/')) {
      if (/\.(mp4|webm|mov|mkv|avi)$/i.test(url)) return false;
      if (/\.(mp3|wav|ogg|m4a|aac)$/i.test(url)) return false;
      return true;
    }
    if (url.startsWith('data:image/')) return true;
    const imageExtensions = /\.(jpeg|jpg|gif|png|webp|bmp|svg|avif)(\?.*)?$/i;
    const imageHosts = [
      'giphy.com/media',
      'tenor.com/view',
      'klipy.co',
      'supabase.co/storage/v1/object/public',
      'images.unsplash.com',
      'i.imgur.com',
      'images.pexels.com',
      'cdn.discordapp.com/attachments',
      'media.discordapp.net/attachments',
      'cdn.imageurlgenerator.com',
      'i.ibb.co',
      'ibb.co',
      'postimg.cc',
      'postimages.org',
      'imgur.com',
      'i.imgur.com'
    ];
    
    const matched = url.match(imageExtensions);
    return matched || imageHosts.some(host => url.includes(host)) ? true : false;
  };

  const isAudio = (url: string) => {
    if (!url || typeof url !== 'string') return false;
    if (isVideo(url)) return false;
    if (url.startsWith('data:audio/')) return true;
    const audioExtensions = /\.(mp3|wav|m4a|ogg|opus|aac|flac)(\?.*)?$/i;
    const matched = url.match(audioExtensions);
    return matched ? true : false;
  };

  const renderSinglePart = (part: string, i: number) => {
    if (!part || typeof part !== 'string') return null;
    if (part.match(urlRegex)) {
      if (part.startsWith('data:')) {
        return null; // Don't render raw base64 data strings as text
      }
      // If the link is an image, don't show the ugly raw text URL in the message bubble because it renders as an embedded image below
      if (isImage(part)) {
        return null;
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
  };

  const renderParts = () => {
    if (!isLongMessage || isExpanded) {
      return parts.map((part, i) => renderSinglePart(part, i));
    }

    let charCount = 0;
    const maxChars = 250;
    const result: React.ReactNode[] = [];
    let truncated = false;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;

      if (part.match(urlRegex)) {
        if (part.startsWith('data:')) {
          continue; // skip base64 strings in character budgeting
        }
        result.push(renderSinglePart(part, i));
        charCount += part.length;
      } else if (part.match(mentionRegex)) {
        result.push(renderSinglePart(part, i));
        charCount += part.length;
      } else {
        if (charCount + part.length > maxChars) {
          const remainingBudget = maxChars - charCount;
          if (remainingBudget > 0) {
            const truncatedText = part.substring(0, remainingBudget) + '...';
            result.push(<React.Fragment key={i}>{highlightMatch(truncatedText, searchQuery)}</React.Fragment>);
          } else if (result.length === 0 || !truncated) {
            result.push(<span key={i}>...</span>);
          }
          truncated = true;
          break;
        } else {
          result.push(renderSinglePart(part, i));
          charCount += part.length;
        }
      }
    }

    return result;
  };

  return (
    <div className="space-y-2 break-words">
      <div className="whitespace-pre-wrap">{renderParts()}</div>
      
      {isLongMessage && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-1 text-[10px] font-black text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest flex items-center gap-1 cursor-pointer bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-xl border border-cyan-500/25 w-fit font-mono"
        >
          {isExpanded ? 'Inklappen ⬆️' : 'Lees meer ⬇️'}
        </button>
      )}
      
      <div className="flex flex-col gap-4 mt-2">
        {hideMedia && !showCollapsedMedia && safeDecryptedContent.match(urlRegex) ? (
          <button
            type="button"
            onClick={() => setShowCollapsedMedia(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-[11px] text-app-muted hover:text-app-ink font-medium w-fit transition-colors cursor-pointer"
          >
            <span>🖼️</span>
            <span>Media weergeven</span>
          </button>
        ) : (
          safeDecryptedContent.match(urlRegex)?.map((url, i) => {
          if (!url || typeof url !== 'string') return null;
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
          
          if (isVideo(url)) {
            return (
              <div key={i} className="max-w-md rounded-xl overflow-hidden shadow-md border border-app-border bg-black">
                <video 
                  src={url} 
                  controls 
                  playsInline 
                  preload="metadata" 
                  className="w-full h-auto max-h-[350px] object-contain"
                />
              </div>
            );
          }

          if (isImage(url)) {
            return (
              <RichImage key={i} url={url} />
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
        }))}
      </div>
    </div>
  );
});
