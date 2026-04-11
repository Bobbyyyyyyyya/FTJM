import React from 'react';

interface RichContentProps {
  content: string;
}

export const RichContent: React.FC<RichContentProps> = React.memo(({ content }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const mentionRegex = /(@[a-zA-Z0-9_]+)/g;
  
  const combinedRegex = /(https?:\/\/[^\s]+|@[a-zA-Z0-9_]+)/g;
  const parts = content.split(combinedRegex);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const isImage = (url: string) => {
    return url.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)(\?.*)?$/i) || 
           url.includes('giphy.com/media') || 
           url.includes('tenor.com/view') ||
           url.includes('supabase.co/storage/v1/object/public/images') ||
           url.includes('supabase.co/storage/v1/object/public/public-1');
  };

  return (
    <div className="space-y-2 break-words">
      <div className="whitespace-pre-wrap">{parts.map((part, i) => {
        if (part.match(urlRegex)) {
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
        return part;
      })}</div>
      
      <div className="flex flex-col gap-4 mt-2">
        {content.match(urlRegex)?.map((url, i) => {
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
          
          return null;
        })}
      </div>
    </div>
  );
});
