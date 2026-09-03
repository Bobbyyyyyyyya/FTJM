import React, { useState, useEffect } from 'react';
import { User as UserIcon } from 'lucide-react';
import { getSafeImageUrl, handleImageError } from '../utils/helpers';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  imageClassName?: string;
  iconClassName?: string;
  alt?: string;
  onClick?: () => void;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  className = 'w-9 h-9 rounded-xl',
  imageClassName = 'w-full h-full object-cover',
  iconClassName = 'w-1/2 h-1/2 text-app-muted',
  alt = '',
  onClick,
}) => {
  const [loadFailed, setLoadFailed] = useState(false);

  // Reset error state if src changes
  useEffect(() => {
    setLoadFailed(false);
  }, [src]);

  const safeSrc = !loadFailed ? getSafeImageUrl(src) : '';

  return (
    <div
      className={`relative overflow-hidden bg-app-accent flex items-center justify-center shrink-0 select-none ${className}`}
      onClick={onClick}
    >
      {safeSrc ? (
        <img
          src={safeSrc}
          alt={alt || name || ''}
          className={imageClassName}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            handleImageError(e);
            if (e.currentTarget.src.includes('/api/image-proxy')) {
              setLoadFailed(true);
            }
          }}
        />
      ) : name?.trim() ? (
        <span className="font-bold text-app-muted uppercase text-xs">
          {name.trim().charAt(0)}
        </span>
      ) : (
        <UserIcon className={iconClassName} />
      )}
    </div>
  );
};
