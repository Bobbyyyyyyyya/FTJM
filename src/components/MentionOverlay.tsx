import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserIcon } from 'lucide-react';
import { UserProfile } from '../types';

interface MentionOverlayProps {
  show: boolean;
  results: UserProfile[];
  position: { top: number, left: number } | null;
  onSelect: (user: UserProfile) => void;
  onClose: () => void;
}

export const MentionOverlay: React.FC<MentionOverlayProps> = ({
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
            left: position.left,
            transform: 'translateY(-100%) translateY(-10px)' // Show above cursor
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3 border-b border-app-border bg-app-accent/5">
            <p className="text-[9px] font-black text-app-muted uppercase tracking-widest">Gebruikers Mentionen</p>
          </div>
          <div className="p-1">
            {results.map((user) => (
              <button
                key={user.id}
                onClick={() => onSelect(user)}
                className="w-full flex items-center gap-3 p-2 hover:bg-app-accent rounded-xl transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-app-bg border border-app-border overflow-hidden flex-shrink-0">
                  {user.photo_url ? (
                    <img src={user.photo_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-app-muted" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-app-ink truncate">{user.display_name || 'Anoniem'}</p>
                  <p className="text-[10px] text-app-muted truncate">@{user.display_name?.toLowerCase().replace(/\s+/g, '_')}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
