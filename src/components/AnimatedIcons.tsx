import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  useIconAnimationMode, 
  IconAnimationMode, 
  getIconAnimationMode, 
  setIconAnimationMode 
} from '../utils/iconAnimationSettings';

export { useIconAnimationMode, getIconAnimationMode, setIconAnimationMode };
export type { IconAnimationMode };

export interface AnimatedIconProps {
  isActive?: boolean;
  isTriggered?: boolean;
  className?: string;
  size?: number | string;
  style?: React.CSSProperties;
  animationMode?: IconAnimationMode;
}

// 1. MESSAGES / BERICHTEN - Clean crisp envelope with smooth gentle spring
export const AnimatedMailIcon: React.FC<AnimatedIconProps> = ({
  isActive = false,
  isTriggered = false,
  className = 'w-5 h-5',
  style,
  animationMode,
}) => {
  const globalMode = useIconAnimationMode();
  const mode = animationMode || globalMode;
  const [isHovered, setIsHovered] = useState(false);

  const isMotionEnabled = mode !== 'disabled';
  const active = mode === 'disabled' ? false : mode === 'hover_only' ? isHovered : (isActive || isHovered || isTriggered);

  return (
    <motion.div
      className={`inline-flex items-center justify-center relative select-none shrink-0 ${className}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={isMotionEnabled ? { scale: 1.15, y: -1 } : undefined}
      whileTap={isMotionEnabled ? { scale: 0.92 } : undefined}
      transition={{ duration: 0.2 }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full"
      >
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <motion.path
          d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"
          animate={active && isMotionEnabled ? {
            y: [0, -1, 0]
          } : { y: 0 }}
          transition={{ duration: 0.8, repeat: active && isMotionEnabled ? Infinity : 0, ease: "easeInOut" }}
        />
      </svg>
    </motion.div>
  );
};

// 2. CHAT - Chat speech bubble with bouncing typing dots
export const AnimatedChatIcon: React.FC<AnimatedIconProps> = ({
  isActive = false,
  isTriggered = false,
  className = 'w-5 h-5',
  style,
  animationMode,
}) => {
  const globalMode = useIconAnimationMode();
  const mode = animationMode || globalMode;
  const [isHovered, setIsHovered] = useState(false);

  const isMotionEnabled = mode !== 'disabled';
  const active = mode === 'disabled' ? false : mode === 'hover_only' ? isHovered : (isActive || isHovered || isTriggered);

  return (
    <motion.div
      className={`inline-flex items-center justify-center relative select-none shrink-0 ${className}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={isMotionEnabled ? { scale: 1.15, rotate: [-2, 2, 0] } : undefined}
      whileTap={isMotionEnabled ? { scale: 0.9 } : undefined}
      transition={{ duration: 0.2 }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full overflow-visible"
      >
        {/* Chat bubble body */}
        <motion.path
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          animate={active && isMotionEnabled ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={{ repeat: active && isMotionEnabled ? Infinity : 0, duration: 1.5, ease: "easeInOut" }}
        />

        {/* 3 Animated Typing Dots inside chat bubble */}
        <motion.circle
          cx="8"
          cy="10"
          r="1.2"
          fill="currentColor"
          stroke="none"
          animate={active && isMotionEnabled ? { y: [0, -2.5, 0], opacity: [0.4, 1, 0.4] } : { y: 0, opacity: 0.8 }}
          transition={{ repeat: active && isMotionEnabled ? Infinity : 0, duration: 0.8, delay: 0 }}
        />
        <motion.circle
          cx="12"
          cy="10"
          r="1.2"
          fill="currentColor"
          stroke="none"
          animate={active && isMotionEnabled ? { y: [0, -2.5, 0], opacity: [0.4, 1, 0.4] } : { y: 0, opacity: 0.8 }}
          transition={{ repeat: active && isMotionEnabled ? Infinity : 0, duration: 0.8, delay: 0.2 }}
        />
        <motion.circle
          cx="16"
          cy="10"
          r="1.2"
          fill="currentColor"
          stroke="none"
          animate={active && isMotionEnabled ? { y: [0, -2.5, 0], opacity: [0.4, 1, 0.4] } : { y: 0, opacity: 0.8 }}
          transition={{ repeat: active && isMotionEnabled ? Infinity : 0, duration: 0.8, delay: 0.4 }}
        />
      </svg>
    </motion.div>
  );
};

// 3. MENU / SETTINGS - Spinning cogwheel with playful spring ratchet
export const AnimatedMenuIcon: React.FC<AnimatedIconProps & { isOpen?: boolean }> = ({
  isActive = false,
  isOpen = false,
  isTriggered = false,
  className = 'w-5 h-5',
  style,
  animationMode,
}) => {
  const globalMode = useIconAnimationMode();
  const mode = animationMode || globalMode;
  const [isHovered, setIsHovered] = useState(false);

  const isMotionEnabled = mode !== 'disabled';
  const active = mode === 'disabled' ? false : mode === 'hover_only' ? isHovered : (isActive || isOpen || isHovered || isTriggered);

  return (
    <motion.div
      className={`inline-flex items-center justify-center relative select-none shrink-0 ${className}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={isMotionEnabled ? { scale: 1.15 } : undefined}
      whileTap={isMotionEnabled ? { scale: 0.88 } : undefined}
    >
      <motion.svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full"
        animate={{
          rotate: !isMotionEnabled ? 0 : isOpen ? 90 : active ? 180 : 0
        }}
        transition={isMotionEnabled ? { type: 'spring', stiffness: 300, damping: 18 } : { duration: 0 }}
      >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </motion.svg>
    </motion.div>
  );
};

// 4. MEDIA FEED - Clean film reel with subtle play triangle
export const AnimatedMediaIcon: React.FC<AnimatedIconProps> = ({
  isActive = false,
  isTriggered = false,
  className = 'w-5 h-5',
  style,
  animationMode,
}) => {
  const globalMode = useIconAnimationMode();
  const mode = animationMode || globalMode;
  const [isHovered, setIsHovered] = useState(false);

  const isMotionEnabled = mode !== 'disabled';
  const active = mode === 'disabled' ? false : mode === 'hover_only' ? isHovered : (isActive || isHovered || isTriggered);

  return (
    <motion.div
      className={`inline-flex items-center justify-center relative select-none shrink-0 ${className}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={isMotionEnabled ? { scale: 1.15 } : undefined}
      whileTap={isMotionEnabled ? { scale: 0.9 } : undefined}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full"
      >
        <rect width="20" height="20" x="2" y="2" rx="2.5" />
        <line x1="7" y1="2" x2="7" y2="22" />
        <line x1="17" y1="2" x2="17" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="2" y1="7" x2="7" y2="7" />
        <line x1="2" y1="17" x2="7" y2="17" />
        <line x1="17" y1="7" x2="22" y2="7" />
        <line x1="17" y1="17" x2="22" y2="17" />
        <motion.polygon
          points="10,8 15,12 10,16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          animate={active && isMotionEnabled ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ repeat: active && isMotionEnabled ? Infinity : 0, duration: 1 }}
          style={{ transformOrigin: '12px 12px' }}
        />
      </svg>
    </motion.div>
  );
};

// 5. NOTIFICATIONS - Bell swinging with ringing clapper
export const AnimatedBellIcon: React.FC<AnimatedIconProps & { hasUnread?: boolean }> = ({
  isActive = false,
  hasUnread = false,
  isTriggered = false,
  className = 'w-5 h-5',
  style,
  animationMode,
}) => {
  const globalMode = useIconAnimationMode();
  const mode = animationMode || globalMode;
  const [isHovered, setIsHovered] = useState(false);

  const isMotionEnabled = mode !== 'disabled';
  const active = mode === 'disabled' 
    ? false 
    : mode === 'hover_only' 
      ? isHovered 
      : (isActive || isHovered || isTriggered);

  const shouldAnimateBell = isMotionEnabled && (active || (mode === 'all' && hasUnread));

  return (
    <motion.div
      className={`inline-flex items-center justify-center relative select-none shrink-0 ${className}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={isMotionEnabled ? { scale: 1.15 } : undefined}
      whileTap={isMotionEnabled ? { scale: 0.9 } : undefined}
    >
      <motion.svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full overflow-visible"
        style={{ transformOrigin: 'top center' }}
        animate={
          shouldAnimateBell
            ? { rotate: [0, -18, 16, -14, 10, -6, 0] }
            : { rotate: 0 }
        }
        transition={{
          repeat: shouldAnimateBell && hasUnread && !active ? Infinity : shouldAnimateBell && active ? Infinity : 0,
          repeatDelay: hasUnread && !active ? 2.5 : 0,
          duration: 0.7,
          ease: "easeInOut"
        }}
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        
        {/* Clapper ball at the bottom */}
        <motion.path
          d="M10.3 21a1.94 1.94 0 0 0 3.4 0"
          animate={shouldAnimateBell ? { x: [-2, 2, -2] } : { x: 0 }}
          transition={{ repeat: shouldAnimateBell ? Infinity : 0, duration: 0.4 }}
        />
      </motion.svg>
    </motion.div>
  );
};

// 6. KEYBINDS / SHORTCUTS - Mechanical keyboard keys clicking down
export const AnimatedKeyboardIcon: React.FC<AnimatedIconProps> = ({
  isActive = false,
  isTriggered = false,
  className = 'w-5 h-5',
  style,
  animationMode,
}) => {
  const globalMode = useIconAnimationMode();
  const mode = animationMode || globalMode;
  const [isHovered, setIsHovered] = useState(false);

  const isMotionEnabled = mode !== 'disabled';
  const active = mode === 'disabled' ? false : mode === 'hover_only' ? isHovered : (isActive || isHovered || isTriggered);

  return (
    <motion.div
      className={`inline-flex items-center justify-center relative select-none shrink-0 ${className}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={isMotionEnabled ? { scale: 1.15 } : undefined}
      whileTap={isMotionEnabled ? { scale: 0.88 } : undefined}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full"
      >
        {/* Keyboard body */}
        <rect width="20" height="16" x="2" y="4" rx="3" />

        {/* Row 1 Keys */}
        <motion.path
          d="M6 8h.01"
          strokeWidth="3"
          animate={active && isMotionEnabled ? { y: [0, 1.5, 0] } : { y: 0 }}
          transition={{ repeat: active && isMotionEnabled ? Infinity : 0, duration: 0.6, delay: 0 }}
        />
        <motion.path
          d="M10 8h.01"
          strokeWidth="3"
          animate={active && isMotionEnabled ? { y: [0, 1.5, 0] } : { y: 0 }}
          transition={{ repeat: active && isMotionEnabled ? Infinity : 0, duration: 0.6, delay: 0.1 }}
        />
        <motion.path
          d="M14 8h.01"
          strokeWidth="3"
          animate={active && isMotionEnabled ? { y: [0, 1.5, 0] } : { y: 0 }}
          transition={{ repeat: active && isMotionEnabled ? Infinity : 0, duration: 0.6, delay: 0.2 }}
        />
        <motion.path
          d="M18 8h.01"
          strokeWidth="3"
          animate={active && isMotionEnabled ? { y: [0, 1.5, 0] } : { y: 0 }}
          transition={{ repeat: active && isMotionEnabled ? Infinity : 0, duration: 0.6, delay: 0.3 }}
        />

        {/* Row 2 Keys */}
        <motion.path
          d="M6 12h.01"
          strokeWidth="3"
          animate={active && isMotionEnabled ? { y: [0, 1.5, 0] } : { y: 0 }}
          transition={{ repeat: active && isMotionEnabled ? Infinity : 0, duration: 0.6, delay: 0.15 }}
        />
        <motion.path
          d="M10 12h.01"
          strokeWidth="3"
          animate={active && isMotionEnabled ? { y: [0, 1.5, 0] } : { y: 0 }}
          transition={{ repeat: active && isMotionEnabled ? Infinity : 0, duration: 0.6, delay: 0.25 }}
        />
        <motion.path
          d="M14 12h.01"
          strokeWidth="3"
          animate={active && isMotionEnabled ? { y: [0, 1.5, 0] } : { y: 0 }}
          transition={{ repeat: active && isMotionEnabled ? Infinity : 0, duration: 0.6, delay: 0.35 }}
        />
        <motion.path
          d="M18 12h.01"
          strokeWidth="3"
          animate={active && isMotionEnabled ? { y: [0, 1.5, 0] } : { y: 0 }}
          transition={{ repeat: active && isMotionEnabled ? Infinity : 0, duration: 0.6, delay: 0.45 }}
        />

        {/* Spacebar */}
        <motion.path
          d="M7 16h10"
          animate={active && isMotionEnabled ? { y: [0, 1.5, 0] } : { y: 0 }}
          transition={{ repeat: active && isMotionEnabled ? Infinity : 0, duration: 0.6, delay: 0.2 }}
        />
      </svg>
    </motion.div>
  );
};

// 7. DARK / LIGHT / ENHANCED THEME MODE
export const AnimatedThemeIcon: React.FC<AnimatedIconProps & { themeMode: 'light' | 'dark' | 'enhanced' }> = ({
  themeMode,
  isActive = false,
  isTriggered = false,
  className = 'w-5 h-5',
  style,
  animationMode,
}) => {
  const globalMode = useIconAnimationMode();
  const mode = animationMode || globalMode;
  const [isHovered, setIsHovered] = useState(false);

  const isMotionEnabled = mode !== 'disabled';
  const active = mode === 'disabled' ? false : mode === 'hover_only' ? isHovered : (isActive || isHovered || isTriggered);

  return (
    <motion.div
      className={`inline-flex items-center justify-center relative select-none shrink-0 ${className}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={isMotionEnabled ? { scale: 1.2, rotate: themeMode === 'light' ? 45 : -15 } : undefined}
      whileTap={isMotionEnabled ? { scale: 0.85 } : undefined}
      transition={isMotionEnabled ? { type: 'spring', stiffness: 400, damping: 15 } : { duration: 0 }}
    >
      <AnimatePresence mode="wait">
        {themeMode === 'light' ? (
          // Moon for toggling to dark
          <motion.svg
            key="moon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-full h-full"
            initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: active && isMotionEnabled ? [0, -15, 0] : 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ duration: isMotionEnabled ? 0.3 : 0 }}
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            {active && isMotionEnabled && (
              <motion.circle
                cx="19"
                cy="5"
                r="1"
                fill="currentColor"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0.8] }}
                transition={{ duration: 0.4 }}
              />
            )}
          </motion.svg>
        ) : themeMode === 'dark' ? (
          // Sparkles for toggling to enhanced
          <motion.svg
            key="sparkles"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-full h-full"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1, rotate: active && isMotionEnabled ? [0, 30, 0] : 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: isMotionEnabled ? 0.3 : 0 }}
          >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
          </motion.svg>
        ) : (
          // Sun for toggling to light
          <motion.svg
            key="sun"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-full h-full"
            initial={{ opacity: 0, rotate: 90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: active && isMotionEnabled ? [0, 90] : 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.6 }}
            transition={{ duration: isMotionEnabled ? 0.3 : 0 }}
          >
            <circle cx="12" cy="12" r="4" />
            <motion.path
              d="M12 2v2"
              animate={active && isMotionEnabled ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            />
            <motion.path
              d="M12 20v2"
              animate={active && isMotionEnabled ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            />
            <motion.path
              d="m4.93 4.93 1.41 1.41"
              animate={active && isMotionEnabled ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            />
            <motion.path
              d="m17.66 17.66 1.41 1.41"
              animate={active && isMotionEnabled ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            />
            <motion.path
              d="M2 12h2"
              animate={active && isMotionEnabled ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            />
            <motion.path
              d="M20 12h2"
              animate={active && isMotionEnabled ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            />
            <motion.path
              d="m6.34 17.66-1.41 1.41"
              animate={active && isMotionEnabled ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            />
            <motion.path
              d="m19.07 4.93-1.41 1.41"
              animate={active && isMotionEnabled ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// 8. FORUM - Multi-card layout panels expanding
export const AnimatedForumIcon: React.FC<AnimatedIconProps> = ({
  isActive = false,
  isTriggered = false,
  className = 'w-5 h-5',
  style,
  animationMode,
}) => {
  const globalMode = useIconAnimationMode();
  const mode = animationMode || globalMode;
  const [isHovered, setIsHovered] = useState(false);

  const isMotionEnabled = mode !== 'disabled';
  const active = mode === 'disabled' ? false : mode === 'hover_only' ? isHovered : (isActive || isHovered || isTriggered);

  return (
    <motion.div
      className={`inline-flex items-center justify-center relative select-none shrink-0 ${className}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={isMotionEnabled ? { scale: 1.15 } : undefined}
      whileTap={isMotionEnabled ? { scale: 0.9 } : undefined}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <motion.path
          d="M3 9h18"
          animate={active && isMotionEnabled ? { y: [-1, 1, 0] } : { y: 0 }}
          transition={{ duration: isMotionEnabled ? 0.4 : 0 }}
        />
        <motion.path
          d="M9 21V9"
          animate={active && isMotionEnabled ? { x: [-1, 1, 0] } : { x: 0 }}
          transition={{ duration: isMotionEnabled ? 0.4 : 0, delay: 0.1 }}
        />
      </svg>
    </motion.div>
  );
};

// 9. NEWS / NIEUWS - Newspaper icon with clean subtle pulse
export const AnimatedNewsIcon: React.FC<AnimatedIconProps> = ({
  isActive = false,
  isTriggered = false,
  className = 'w-5 h-5',
  style,
  animationMode,
}) => {
  const globalMode = useIconAnimationMode();
  const mode = animationMode || globalMode;
  const [isHovered, setIsHovered] = useState(false);

  const isMotionEnabled = mode !== 'disabled';
  const active = mode === 'disabled' ? false : mode === 'hover_only' ? isHovered : (isActive || isHovered || isTriggered);

  return (
    <motion.div
      className={`inline-flex items-center justify-center relative select-none shrink-0 ${className}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={isMotionEnabled ? { scale: 1.15, rotate: -3 } : undefined}
      whileTap={isMotionEnabled ? { scale: 0.9 } : undefined}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full"
      >
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
        <path d="M18 14h-8" />
        <path d="M15 18h-5" />
        <rect x="10" y="6" width="8" height="4" rx="1" />
      </svg>
    </motion.div>
  );
};

// 10. ARCADE - Retro Gamepad with pressing D-pad and action buttons
export const AnimatedArcadeIcon: React.FC<AnimatedIconProps> = ({
  isActive = false,
  isTriggered = false,
  className = 'w-5 h-5',
  style,
  animationMode,
}) => {
  const globalMode = useIconAnimationMode();
  const mode = animationMode || globalMode;
  const [isHovered, setIsHovered] = useState(false);

  const isMotionEnabled = mode !== 'disabled';
  const active = mode === 'disabled' ? false : mode === 'hover_only' ? isHovered : (isActive || isHovered || isTriggered);

  return (
    <motion.div
      className={`inline-flex items-center justify-center relative select-none shrink-0 ${className}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={isMotionEnabled ? { scale: 1.2, rotate: [-4, 4, -2, 2, 0] } : undefined}
      whileTap={isMotionEnabled ? { scale: 0.88 } : undefined}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full"
      >
        <line x1="6" x2="10" y1="12" y2="12" />
        <line x1="8" x2="8" y1="10" y2="14" />
        <motion.line
          x1="15"
          x2="15.01"
          y1="13"
          y2="13"
          strokeWidth="3"
          animate={active && isMotionEnabled ? { scale: [1, 1.6, 1] } : { scale: 1 }}
          transition={{ repeat: active && isMotionEnabled ? Infinity : 0, duration: 0.5 }}
        />
        <motion.line
          x1="18"
          x2="18.01"
          y1="11"
          y2="11"
          strokeWidth="3"
          animate={active && isMotionEnabled ? { scale: [1, 1.6, 1] } : { scale: 1 }}
          transition={{ repeat: active && isMotionEnabled ? Infinity : 0, duration: 0.5, delay: 0.2 }}
        />
        <rect width="20" height="12" x="2" y="6" rx="6" />
      </svg>
    </motion.div>
  );
};

// 11. SEND - Paper Airplane tilting and launching forward on hover/active
export const AnimatedSendIcon: React.FC<AnimatedIconProps> = ({
  isActive = false,
  isTriggered = false,
  className = 'w-5 h-5',
  style,
  animationMode,
}) => {
  const globalMode = useIconAnimationMode();
  const mode = animationMode || globalMode;
  const [isHovered, setIsHovered] = useState(false);

  const isMotionEnabled = mode !== 'disabled';
  const active = mode === 'disabled' ? false : mode === 'hover_only' ? isHovered : (isActive || isHovered || isTriggered);

  return (
    <motion.div
      className={`inline-flex items-center justify-center relative select-none shrink-0 ${className}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={isMotionEnabled ? { scale: 1.15, x: 2, y: -2, rotate: 8 } : undefined}
      whileTap={isMotionEnabled ? { scale: 0.9, x: 3, y: -3 } : undefined}
      transition={{ duration: 0.2 }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full overflow-visible"
      >
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </svg>
    </motion.div>
  );
};

// 12. HEART / LIKE - Heart with pulsing pop and micro particle burst
export const AnimatedHeartIcon: React.FC<AnimatedIconProps & { isLiked?: boolean }> = ({
  isActive = false,
  isLiked = false,
  isTriggered = false,
  className = 'w-5 h-5',
  style,
  animationMode,
}) => {
  const globalMode = useIconAnimationMode();
  const mode = animationMode || globalMode;
  const [isHovered, setIsHovered] = useState(false);

  const isMotionEnabled = mode !== 'disabled';
  const active = mode === 'disabled' ? false : mode === 'hover_only' ? isHovered : (isActive || isLiked || isHovered || isTriggered);

  return (
    <motion.div
      className={`inline-flex items-center justify-center relative select-none shrink-0 ${className}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={isMotionEnabled ? { scale: 1.25 } : undefined}
      whileTap={isMotionEnabled ? { scale: 0.85 } : undefined}
    >
      <motion.svg
        viewBox="0 0 24 24"
        fill={isLiked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full overflow-visible"
        animate={active && isMotionEnabled ? {
          scale: [1, 1.35, 0.9, 1.1, 1],
        } : { scale: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </motion.svg>
    </motion.div>
  );
};

// 13. SPARKLE - Twinkling magic stars with rotating sheen
export const AnimatedSparkleIcon: React.FC<AnimatedIconProps> = ({
  isActive = false,
  isTriggered = false,
  className = 'w-5 h-5',
  style,
  animationMode,
}) => {
  const globalMode = useIconAnimationMode();
  const mode = animationMode || globalMode;
  const [isHovered, setIsHovered] = useState(false);

  const isMotionEnabled = mode !== 'disabled';
  const active = mode === 'disabled' ? false : mode === 'hover_only' ? isHovered : (isActive || isHovered || isTriggered);

  return (
    <motion.div
      className={`inline-flex items-center justify-center relative select-none shrink-0 ${className}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={isMotionEnabled ? { scale: 1.2, rotate: 20 } : undefined}
      whileTap={isMotionEnabled ? { scale: 0.88 } : undefined}
    >
      <motion.svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full"
        animate={active && isMotionEnabled ? {
          rotate: [0, 90, 180],
          scale: [1, 1.15, 1],
        } : { rotate: 0, scale: 1 }}
        transition={{ duration: 1.2, repeat: active ? Infinity : 0, ease: "linear" }}
      >
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        <path d="M5 3v4" />
        <path d="M19 17v4" />
        <path d="M3 5h4" />
        <path d="M17 19h4" />
      </motion.svg>
    </motion.div>
  );
};

// 14. SEARCH - Magnifying glass focusing in and tilting
export const AnimatedSearchIcon: React.FC<AnimatedIconProps> = ({
  isActive = false,
  isTriggered = false,
  className = 'w-5 h-5',
  style,
  animationMode,
}) => {
  const globalMode = useIconAnimationMode();
  const mode = animationMode || globalMode;
  const [isHovered, setIsHovered] = useState(false);

  const isMotionEnabled = mode !== 'disabled';
  const active = mode === 'disabled' ? false : mode === 'hover_only' ? isHovered : (isActive || isHovered || isTriggered);

  return (
    <motion.div
      className={`inline-flex items-center justify-center relative select-none shrink-0 ${className}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={isMotionEnabled ? { scale: 1.15, rotate: -8 } : undefined}
      whileTap={isMotionEnabled ? { scale: 0.9 } : undefined}
    >
      <motion.svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full"
        animate={active && isMotionEnabled ? {
          scale: [1, 1.1, 1],
          x: [0, 1, -1, 0],
          y: [0, -1, 1, 0]
        } : { scale: 1, x: 0, y: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </motion.svg>
    </motion.div>
  );
};

