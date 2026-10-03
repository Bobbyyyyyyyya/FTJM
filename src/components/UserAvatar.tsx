import React, { useState, useEffect } from 'react';
import { getSafeImageUrl, handleImageError } from '../utils/helpers';

export const AVATAR_PALETTES = [
  'bg-gradient-to-br from-indigo-500 to-purple-600 text-white',
  'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
  'bg-gradient-to-br from-amber-500 to-orange-600 text-white',
  'bg-gradient-to-br from-rose-500 to-pink-600 text-white',
  'bg-gradient-to-br from-sky-500 to-blue-600 text-white',
  'bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white',
  'bg-gradient-to-br from-teal-500 to-emerald-600 text-white',
  'bg-gradient-to-br from-blue-600 to-indigo-700 text-white',
  'bg-gradient-to-br from-orange-500 to-red-600 text-white',
  'bg-gradient-to-br from-cyan-500 to-teal-600 text-white',
  'bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white',
  'bg-gradient-to-br from-lime-600 to-emerald-600 text-white',
];

/**
 * Extracts the first meaningful letter from a name or email.
 */
export function getAvatarInitial(name?: string | null, email?: string | null): string {
  const cleanName = name?.trim();
  if (cleanName && cleanName.length > 0) {
    // If it starts with non-letter emoji or tag, look for first alphanumeric or take first char
    const match = cleanName.match(/[a-zA-Z0-9]/);
    if (match) return match[0].toUpperCase();
    return cleanName.charAt(0).toUpperCase();
  }
  const cleanEmail = email?.trim();
  if (cleanEmail && cleanEmail.length > 0) {
    const match = cleanEmail.match(/[a-zA-Z0-9]/);
    if (match) return match[0].toUpperCase();
    return cleanEmail.charAt(0).toUpperCase();
  }
  return '?';
}

/**
 * Deterministically returns a consistent gradient based on the user's name/identifier.
 */
export function getAvatarColorClasses(identifier?: string | null): string {
  if (!identifier || !identifier.trim()) {
    return AVATAR_PALETTES[0];
  }
  let hash = 0;
  const str = identifier.trim().toLowerCase();
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

export interface LetterAvatarProps {
  name?: string | null;
  email?: string | null;
  className?: string;
  textClassName?: string;
  onClick?: (e?: React.MouseEvent) => void;
  title?: string;
}

export const LetterAvatar: React.FC<LetterAvatarProps> = ({
  name,
  email,
  className = 'w-9 h-9 rounded-xl',
  textClassName,
  onClick,
  title,
}) => {
  const initial = getAvatarInitial(name, email);
  const colorClasses = getAvatarColorClasses(name || email || initial);

  // Responsive font size calculation based on container class names
  let defaultSize = 'text-sm';
  if (className.includes('w-2') || className.includes('w-3') || className.includes('w-4')) {
    defaultSize = 'text-[9px]';
  } else if (className.includes('w-5') || className.includes('w-6')) {
    defaultSize = 'text-[11px]';
  } else if (className.includes('w-7') || className.includes('w-8')) {
    defaultSize = 'text-xs';
  } else if (className.includes('w-9') || className.includes('w-10')) {
    defaultSize = 'text-sm';
  } else if (className.includes('w-12') || className.includes('w-14') || className.includes('w-16')) {
    defaultSize = 'text-xl';
  } else if (className.includes('w-20') || className.includes('w-24') || className.includes('w-28') || className.includes('w-32')) {
    defaultSize = 'text-3xl font-black';
  }

  return (
    <div
      onClick={onClick}
      title={title || name || ''}
      className={`relative overflow-hidden flex items-center justify-center font-extrabold select-none uppercase tracking-tight shrink-0 shadow-sm ${colorClasses} ${className}`}
    >
      <span className={textClassName || defaultSize}>
        {initial}
      </span>
    </div>
  );
};

export interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  className?: string;
  imageClassName?: string;
  iconClassName?: string;
  textClassName?: string;
  alt?: string;
  onClick?: (e?: React.MouseEvent) => void;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  email,
  className = 'w-9 h-9 rounded-xl',
  imageClassName = 'w-full h-full object-cover',
  textClassName,
  alt = '',
  onClick,
}) => {
  const [loadFailed, setLoadFailed] = useState(false);

  // Reset error state if src changes
  useEffect(() => {
    setLoadFailed(false);
  }, [src]);

  const safeSrc = !loadFailed ? getSafeImageUrl(src) : '';

  if (!safeSrc) {
    return (
      <LetterAvatar
        name={name}
        email={email}
        className={className}
        textClassName={textClassName}
        onClick={onClick}
        title={alt || name || ''}
      />
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-app-accent flex items-center justify-center shrink-0 select-none ${className}`}
      onClick={onClick}
    >
      <img
        src={safeSrc}
        alt={alt || name || ''}
        className={imageClassName}
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          handleImageError(e);
          setLoadFailed(true);
        }}
      />
    </div>
  );
};

export default UserAvatar;
