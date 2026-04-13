import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User as UserIcon, ShieldCheck, Mail, MessageSquare, Calendar } from 'lucide-react';
import { UserProfile } from '../types';
import { formatDate } from '../utils/helpers';

interface UserProfileModalProps {
  user: UserProfile | null;
  onClose: () => void;
  onStartDM: (user: { id: string, display_name: string }) => void;
  isMe: boolean;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  onClose,
  onStartDM,
  isMe
}) => {
  return (
    <AnimatePresence>
      {user && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-app-ink/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-app-card rounded-[3rem] shadow-2xl border border-app-border overflow-y-auto max-h-[90vh] custom-scrollbar"
          >
            <div className="h-32 bg-gradient-to-br from-app-ink to-[#004276] relative">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-8 pb-8">
              <div className="relative -mt-16 mb-6 flex justify-center">
                <div className="p-1.5 bg-app-card rounded-[2.5rem] shadow-xl">
                  {user.photo_url ? (
                    <img 
                      src={user.photo_url} 
                      alt={user.display_name} 
                      className="w-32 h-32 rounded-[2rem] object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-[2rem] bg-app-accent flex items-center justify-center">
                      <UserIcon className="w-12 h-12 text-app-muted" />
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-2xl font-black text-app-ink tracking-tight uppercase">{user.display_name || 'Anoniem'}</h3>
                  {user.role === 'admin' && (
                    <div className="p-1 bg-app-ink text-app-bg rounded-md" title="Admin">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <p className="text-app-muted text-sm font-medium">{user.email}</p>
              </div>

              <div className="mt-8 p-6 bg-app-accent/30 rounded-3xl border border-app-border/50">
                <p className="text-[10px] font-black text-app-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                  <MessageSquare className="w-3 h-3" />
                  Over Mij
                </p>
                <p className="text-sm text-app-ink leading-relaxed font-medium italic">
                  {user.bio || "Deze gebruiker heeft nog geen bio toegevoegd."}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-center gap-6 text-app-muted">
                <div className="flex flex-col items-center">
                  <Calendar className="w-4 h-4 mb-1 opacity-50" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Lid Sinds</span>
                  <span className="text-xs font-bold text-app-ink">{formatDate(user.created_at)}</span>
                </div>
              </div>

              {!isMe && (
                <div className="mt-8 flex gap-3">
                  <button 
                    onClick={() => onStartDM({ id: user.id, display_name: user.display_name || 'Anoniem' })}
                    className="flex-1 py-4 bg-app-ink text-app-bg rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Mail className="w-5 h-5" />
                    Bericht Sturen
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
