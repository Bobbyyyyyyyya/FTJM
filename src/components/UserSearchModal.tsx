import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, User as UserIcon, Mail, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';

interface UserSearchModalProps {
  show: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  users: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onlineUsers: Set<string>;
}

export const UserSearchModal: React.FC<UserSearchModalProps> = ({
  show,
  onClose,
  searchQuery,
  setSearchQuery,
  users,
  onSelectUser,
  onlineUsers
}) => {
  const filteredUsers = users.filter(u => 
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {show && (
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
            className="relative w-full max-w-lg bg-app-card rounded-[2.5rem] shadow-2xl border border-app-border overflow-hidden"
          >
            <div className="p-6 sm:p-8 border-b border-app-border flex items-center justify-between bg-app-accent/5">
              <h3 className="text-xl font-black text-app-ink uppercase tracking-tighter">Gebruikers Zoeken</h3>
              <button onClick={onClose} className="p-2 hover:bg-app-accent rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 sm:p-8 space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-app-muted" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Zoek op naam of email..."
                  className="w-full pl-12 pr-4 py-4 bg-app-bg border border-app-border rounded-2xl focus:ring-2 focus:ring-app-ink transition-all text-app-ink font-medium"
                  autoFocus
                />
              </div>
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-2 pr-2">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-app-muted font-medium">Geen gebruikers gevonden.</p>
                  </div>
                ) : (
                  filteredUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => onSelectUser(u)}
                      className="w-full p-4 rounded-2xl flex items-center gap-4 hover:bg-app-accent transition-all text-left group border border-transparent hover:border-app-border"
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-app-card border border-app-border flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                          {u.photo_url ? (
                            <img src={u.photo_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <UserIcon className="w-6 h-6 text-app-muted" />
                          )}
                        </div>
                        {onlineUsers.has(u.id) && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-app-card rounded-full shadow-sm" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-app-ink truncate">{u.display_name || 'Anoniem'}</p>
                        <p className="text-xs text-app-muted truncate">{u.email}</p>
                      </div>
                      <Mail className="w-5 h-5 text-app-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
