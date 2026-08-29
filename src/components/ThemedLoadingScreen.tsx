import React from 'react';
import { motion } from 'motion/react';
import { Logo } from './Logo';
import { CustomTheme, ModernUICustomization } from '../types';
import { getAccentHex } from '../utils/modernUICustom';

export interface ThemedLoadingScreenProps {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  customTheme?: CustomTheme;
  modernCustom?: ModernUICustomization;
  showLogo?: boolean;
  className?: string;
}

export const ThemedLoadingScreen: React.FC<ThemedLoadingScreenProps> = ({
  message = 'Laden...',
  submessage,
  fullScreen = false,
  size = 'lg',
  customTheme,
  modernCustom,
  showLogo = true,
  className = '',
}) => {
  // Determine active accent color from modern custom or theme
  const accent = getAccentHex(modernCustom, customTheme) || customTheme?.primary_color || '#06b6d4';

  const logoSize = 
    size === 'sm' ? 'w-10 h-10' :
    size === 'md' ? 'w-14 h-14' : 'w-20 h-20';

  const ringSize =
    size === 'sm' ? 'w-16 h-16' :
    size === 'md' ? 'w-24 h-24' : 'w-32 h-32';

  const content = (
    <motion.div 
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`relative z-10 flex flex-col items-center justify-center text-center select-none ${className}`}
    >
      {/* Central Visual: Logo within animated orbital rings */}
      <div className={`relative ${ringSize} flex items-center justify-center mb-6`}>
        {/* Soft Ambient Glow in Accent Color */}
        <motion.div 
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.35, 0.65, 0.35],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute inset-0 rounded-full blur-2xl pointer-events-none"
          style={{ background: `radial-gradient(circle, ${accent}66 0%, transparent 70%)` }}
        />

        {/* Outer Orbital Rotating Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            padding: '2px',
            background: `conic-gradient(from 0deg, transparent 0%, ${accent} 50%, transparent 100%)`,
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #fff calc(100% - 2.5px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #fff calc(100% - 2.5px))',
          }}
        />

        {/* Secondary Counter-Rotating Ring (Subtle) */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-1.5 rounded-full pointer-events-none opacity-40"
          style={{
            border: `1.5px dashed ${accent}`,
          }}
        />

        {/* Orbiting Micro Sparkle Dot */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 pointer-events-none"
        >
          <div 
            className="w-2.5 h-2.5 rounded-full shadow-lg"
            style={{
              backgroundColor: '#ffffff',
              boxShadow: `0 0 10px 2px ${accent}`,
              transform: 'translateY(-50%)',
              margin: '0 auto'
            }}
          />
        </motion.div>

        {/* Logo Card with Breathing Animation */}
        {showLogo ? (
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className={`${logoSize} rounded-2xl bg-app-card border border-app-border shadow-xl flex items-center justify-center overflow-hidden p-2 relative z-10 backdrop-blur-md`}
          >
            <Logo className="w-full h-full object-contain p-0.5" fallbackTextSize="text-xs font-black tracking-tighter" />
          </motion.div>
        ) : (
          <motion.div 
            animate={{ scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-5 h-5 rounded-full"
            style={{ backgroundColor: accent, boxShadow: `0 0 14px ${accent}` }}
          />
        )}
      </div>

      {/* Message and Staggered Animated Wave Dots */}
      <div className="flex items-center gap-1.5">
        <h3 className="text-sm sm:text-base font-bold text-app-ink tracking-tight">
          {message}
        </h3>
        <span className="inline-flex items-center gap-1 ml-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{
                y: [0, -4, 0],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.18,
                ease: 'easeInOut'
              }}
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ backgroundColor: accent }}
            />
          ))}
        </span>
      </div>

      {/* Submessage */}
      {submessage && (
        <motion.p 
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-xs text-app-muted font-medium mt-1.5 max-w-xs sm:max-w-sm leading-relaxed"
        >
          {submessage}
        </motion.p>
      )}

      {/* Subtle Micro-Progress Bar */}
      <div className="w-32 h-1 bg-app-border/40 rounded-full mt-4 overflow-hidden relative">
        <motion.div 
          animate={{
            x: ['-100%', '150%']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="w-1/2 h-full rounded-full"
          style={{ 
            backgroundColor: accent,
            boxShadow: `0 0 8px ${accent}`
          }}
        />
      </div>
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-app-bg/95 backdrop-blur-xl overflow-hidden">
        {/* Soft Background Ambient Aura */}
        <div 
          className="absolute inset-0 pointer-events-none blur-3xl opacity-20 dark:opacity-30 transition-all"
          style={{
            background: `radial-gradient(circle at 50% 45%, ${accent} 0%, transparent 60%)`
          }}
        />
        {content}
      </div>
    );
  }

  return (
    <div className="w-full py-12 px-4 flex items-center justify-center">
      {content}
    </div>
  );
};

/**
 * Compact Themed Spinner for buttons and inline status indicators
 */
export const ThemedSpinner: React.FC<{
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
}> = ({ size = 'sm', className = '', color }) => {
  const pixelSize = 
    size === 'xs' ? 14 :
    size === 'sm' ? 18 :
    size === 'md' ? 24 : 32;

  return (
    <motion.svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={`shrink-0 inline-block ${className}`}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.2"
      />
      <motion.circle
        cx="12"
        cy="12"
        r="9"
        stroke={color || 'currentColor'}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="40 100"
      />
    </motion.svg>
  );
};

/**
 * Compact Themed Inline Loader with icon and text for feed/module loading
 */
export const ThemedInlineLoader: React.FC<{
  message?: string;
  accentColor?: string;
  className?: string;
}> = ({ message = 'Laden...', accentColor, className = '' }) => {
  const accent = accentColor || 'var(--custom-primary, #06b6d4)';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-center gap-2.5 py-4 px-4 rounded-2xl bg-app-card/60 border border-app-border/60 backdrop-blur-md ${className}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4 rounded-full border-2 border-t-transparent"
          style={{ borderColor: `${accent} transparent ${accent} ${accent}` }}
        />
        <motion.div 
          animate={{ scale: [0.6, 1.2, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: accent }}
        />
      </div>
      <span className="text-xs font-bold text-app-muted tracking-wide">
        {message}
      </span>
    </motion.div>
  );
};

/**
 * Themed Shimmer Skeleton Card
 */
export const ThemedSkeletonCard: React.FC<{
  lines?: number;
  hasAvatar?: boolean;
  className?: string;
}> = ({ lines = 2, hasAvatar = true, className = '' }) => {
  return (
    <div className={`p-4 rounded-2xl bg-app-card border border-app-border relative overflow-hidden ${className}`}>
      {/* Shimmer light beam sweeping horizontally */}
      <motion.div 
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent pointer-events-none -skew-x-12"
      />

      <div className="flex items-center gap-3 mb-3">
        {hasAvatar && (
          <div className="w-10 h-10 rounded-xl bg-app-accent/80 animate-pulse shrink-0" />
        )}
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-1/3 rounded-md bg-app-accent/80 animate-pulse" />
          <div className="h-2.5 w-1/4 rounded-md bg-app-accent/50 animate-pulse" />
        </div>
      </div>

      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i} 
            className="h-3 rounded-md bg-app-accent/60 animate-pulse" 
            style={{ width: i === lines - 1 ? '60%' : '100%' }}
          />
        ))}
      </div>
    </div>
  );
};
