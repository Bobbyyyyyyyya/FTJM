import React from 'react';
import { Check } from 'lucide-react';
import { getVerifiedBadgeConfig } from '../constants';

export interface VerifiedBadgeProps {
  user?: string | { email?: string | null; is_verified?: boolean | null } | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  isVerifiedCol?: boolean | null;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  user,
  size = 'sm',
  className = '',
  isVerifiedCol,
}) => {
  const config = getVerifiedBadgeConfig(user, isVerifiedCol);
  if (!config.isVerified) return null;

  const iconSizes = {
    xs: 'w-2 h-2 stroke-[4]',
    sm: 'w-2.5 h-2.5 stroke-[4]',
    md: 'w-3 h-3 stroke-[4]',
    lg: 'w-3.5 h-3.5 stroke-[4]',
  }[size];

  const padSizes = {
    xs: 'p-0.5',
    sm: 'p-0.5',
    md: 'p-0.5',
    lg: 'p-0.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full shrink-0 select-none ${config.bgClass} ${config.glowClass} ${padSizes} ${className}`}
      title={config.title}
    >
      <Check className={`${iconSizes} ${config.iconClass}`} />
    </span>
  );
};

export default VerifiedBadge;
