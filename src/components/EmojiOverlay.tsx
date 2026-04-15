import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface EmojiItem {
  emoji: string;
  name: string;
  keywords: string[];
}

interface EmojiOverlayProps {
  show: boolean;
  results: EmojiItem[];
  position: { top: number, left: number } | null;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export const EmojiOverlay: React.FC<EmojiOverlayProps> = ({
  show,
  results,
  position,
  onSelect,
  onClose
}) => {
  if (!show || !position || results.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100]" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute bg-app-card border border-app-border rounded-2xl shadow-2xl overflow-hidden min-w-[200px] max-w-[300px] max-h-[250px] overflow-y-auto custom-scrollbar"
          style={{ 
            top: position.top, 
            left: Math.min(position.left, window.innerWidth - 320),
            transform: 'translateY(-100%) translateY(-10px)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3 border-b border-app-border bg-app-accent/5">
            <p className="text-[9px] font-black text-app-muted uppercase tracking-widest">Emoji Kiezen</p>
          </div>
          <div className="p-1 grid grid-cols-5 gap-1">
            {results.map((item, index) => (
              <button
                key={`${item.emoji}-${index}`}
                onClick={() => onSelect(item.emoji)}
                className="flex items-center justify-center p-2 hover:bg-app-accent rounded-xl transition-all text-xl group"
                title={item.name}
              >
                {item.emoji}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
