import React from 'react';
import { Code2, Sparkles, Terminal } from 'lucide-react';
import { isDeveloper } from '../constants';

export interface DeveloperBadgeProps {
  user?: string | { email?: string | null; role?: string | null; display_name?: string | null } | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  customLabel?: string;
}

export const DeveloperBadge: React.FC<DeveloperBadgeProps> = ({
  user,
  size = 'sm',
  showLabel = false,
  className = '',
  customLabel,
}) => {
  if (!isDeveloper(user)) return null;

  const iconSizes = {
    xs: 'w-2.5 h-2.5 stroke-[2.5]',
    sm: 'w-3 h-3 stroke-[2.5]',
    md: 'w-3.5 h-3.5 stroke-[2.5]',
    lg: 'w-4 h-4 stroke-[2.5]',
  }[size];

  const padSizes = {
    xs: showLabel ? 'px-1.5 py-0.5 text-[9px]' : 'p-0.5',
    sm: showLabel ? 'px-2 py-0.5 text-[10px]' : 'p-0.5 sm:p-1',
    md: showLabel ? 'px-2.5 py-0.5 text-xs' : 'p-1',
    lg: showLabel ? 'px-3 py-1 text-xs' : 'p-1.5',
  }[size];

  const label = customLabel || 'Developer';

  return (
    <span
      className={`inline-flex items-center gap-1 font-black uppercase tracking-wider rounded-md select-none shrink-0 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-[0_0_10px_rgba(139,92,246,0.45)] border border-violet-300/40 relative group/dev transition-all hover:scale-105 active:scale-95 ${padSizes} ${className}`}
      title="Lead Developer (Marko Hoksen)"
    >
      <Code2 className={`${iconSizes} text-violet-100 shrink-0`} />
      {showLabel && (
        <span className="font-extrabold tracking-widest text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] flex items-center gap-0.5">
          <span>{label}</span>
          <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-pulse" />
        </span>
      )}
    </span>
  );
};

export default DeveloperBadge;
