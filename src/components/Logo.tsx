import React, { useState } from 'react';
import defaultLogo from '../assets/logo.png';

interface LogoProps {
  className?: string;
  fallbackTextSize?: string;
  alt?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "w-full h-full object-cover rounded-xl", 
  fallbackTextSize = "text-xs font-black tracking-tighter",
  alt = "FTJM Logo"
}) => {
  const [imgSrc, setImgSrc] = useState<string>(defaultLogo);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white select-none rounded-[inherit]">
        <span className={fallbackTextSize}>FTJM</span>
      </div>
    );
  }

  // Ensure logo stays cleanly rounded and non-distorted
  const isContain = className.includes('object-contain');
  const fitClass = isContain ? 'object-contain' : 'object-cover';

  return (
    <img 
      src={imgSrc}
      alt={alt} 
      className={`select-none rounded-[inherit] ${fitClass} ${className}`}
      referrerPolicy="no-referrer"
      onError={() => {
        if (imgSrc !== '/logo.png') {
          // Try relative root logo as secondary fallback
          setImgSrc('/logo.png');
        } else {
          setHasError(true);
        }
      }}
    />
  );
};
