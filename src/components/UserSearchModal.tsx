import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, User as UserIcon, Users, Mail, Check, ShieldCheck, FlaskConical } from 'lucide-react';
import { UserProfile } from '../types';
import { isVerifiedEmail, isBetaTester } from '../constants';

interface UserSearchModalProps {
  show: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  users: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onStartGroup: (users: UserProfile[], groupName: string) => void;
  onlineUsers: Set<string>;
}

export const UserSearchModal: React.FC<UserSearchModalProps> = ({
  show,
  onClose,
  searchQuery,
  setSearchQuery,
  users,
  onSelectUser,
  onStartGroup,
  onlineUsers
}) => {
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
  const [groupName, setGroupName] = useState('');
  const [mode, setMode] = useState<'single' | 'group'>('single');

  const filteredUsers = users.filter(u => 
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserSelection = (u: UserProfile) => {
    if (selectedUsers.some(selected => selected.id === u.id)) {
      setSelectedUsers(selectedUsers.filter(selected => selected.id !== u.id));
    } else {
      setSelectedUsers([...selectedUsers, u]);
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setGroupName('');
    setMode('single');
    onClose();
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-app-ink/40 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-app-card rounded-[2.5rem] shadow-2xl border border-app-border overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 sm:p-8 border-b border-app-border flex items-center justify-between bg-app-accent/5">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-app-ink uppercase tracking-tight">
                  {mode === 'single' ? 'Gebruikers Zoeken' : 'Groep Aanmaken'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setMode(mode === 'single' ? 'group' : 'single')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                    mode === 'group' 
                      ? 'bg-app-ink text-app-bg' 
                      : 'bg-app-accent text-app-muted hover:text-app-ink'
                  }`}
                >
                  {mode === 'single' ? 'Meerdere selecteren' : 'Annuleer groep'}
                </button>
                <button onClick={handleClose} className="p-2 hover:bg-app-accent rounded-full transition-colors text-app-muted hover:text-app-ink">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 flex-1 overflow-hidden flex flex-col space-y-6">
              {mode === 'group' && (
                <div className="space-y-4">
                  <input 
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Naam van de groep..."
                    className="w-full px-6 py-4 bg-app-bg border border-app-border rounded-2xl focus:ring-2 focus:ring-app-ink transition-all text-app-ink font-bold"
                  />
                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2 py-2">
                      {selectedUsers.map(u => (
                        <div key={u.id} className="flex items-center gap-2 bg-app-ink text-app-bg pl-1 pr-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ring-1 ring-app-border">
                          <div className="w-5 h-5 rounded-full overflow-hidden bg-app-bg/20">
                            {u.photo_url ? (
                              <img src={u.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px]">
                                {u.display_name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span>{u.display_name}</span>
                          <button onClick={() => toggleUserSelection(u)} className="ml-1 hover:text-red-400 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-app-muted font-medium">Geen gebruikers gevonden.</p>
                  </div>
                ) : (
                  filteredUsers.map(u => {
                    const isSelected = selectedUsers.some(selected => selected.id === u.id);
                    return (
                      <button
                        key={u.id}
                        onClick={() => mode === 'group' ? toggleUserSelection(u) : onSelectUser(u)}
                        className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-left group border ${
                          isSelected 
                            ? 'bg-app-ink/5 border-app-ink' 
                            : 'hover:bg-app-accent border-transparent hover:border-app-border'
                        }`}
                      >
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden transition-all ${
                            isSelected ? 'bg-app-ink ring-2 ring-app-ink/20' : 'bg-app-card border border-app-border'
                          }`}>
                            {u.photo_url ? (
                              <img src={u.photo_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <UserIcon className={`w-6 h-6 ${isSelected ? 'text-app-bg' : 'text-app-muted'}`} />
                            )}
                          </div>
                          {onlineUsers.has(u.id) && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-app-card rounded-full shadow-sm" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className={`font-bold truncate ${isSelected ? 'text-app-ink' : 'text-app-ink'}`}>{u.display_name || 'Anoniem'}</p>
                            {isVerifiedEmail(u) && (
                              <span className="inline-flex items-center justify-center bg-cyan-500 text-white rounded-full p-0.5 shrink-0 select-none shadow-[0_0_6px_rgba(6,182,212,0.4)]" title="Geverifieerd Account">
                                <Check className="w-2.5 h-2.5 stroke-[4]" />
                              </span>
                            )}
                            {isBetaTester(u) && (
                              <span className="inline-flex items-center justify-center bg-amber-500/15 border border-amber-500/30 text-amber-400 p-0.5 rounded shrink-0 select-none shadow-[0_0_6px_rgba(245,158,11,0.25)]" title="Beta Tester">
                                <FlaskConical className="w-2.5 h-2.5 stroke-[2.5]" />
                              </span>
                            )}
                            {(u.role === 'admin' || u.email?.toLowerCase() === 'markohoksen@gmail.com') && (
                              <span className="inline-flex items-center justify-center bg-red-500/15 border border-red-500/30 text-red-400 p-0.5 rounded shrink-0 select-none" title="Administrator">
                                <ShieldCheck className="w-3 h-3 text-red-400 stroke-[2.5]" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-app-muted truncate">{u.email}</p>
                        </div>
                        {mode === 'group' ? (
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            isSelected ? 'bg-app-ink border-app-ink text-app-bg' : 'border-app-border text-transparent'
                          }`}>
                            <Check className="w-4 h-4" />
                          </div>
                        ) : (
                          <Mail className="w-5 h-5 text-app-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {mode === 'group' && (
              <div className="p-6 sm:p-8 border-t border-app-border bg-app-accent/5">
                <button
                  disabled={selectedUsers.length < 2 || !groupName.trim()}
                  onClick={() => onStartGroup(selectedUsers, groupName)}
                  className="w-full py-4 bg-app-ink text-app-bg rounded-2xl font-bold uppercase tracking-widest disabled:opacity-30 transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  Groep Aanmaken
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
