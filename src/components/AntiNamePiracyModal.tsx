import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, AlertOctagon, Lock, X, CheckCircle2, UserX } from 'lucide-react';

interface AntiNamePiracyModalProps {
  isOpen: boolean;
  onClose: () => void;
  attemptedName: string;
  reason?: string;
}

export const AntiNamePiracyModal: React.FC<AntiNamePiracyModalProps> = ({
  isOpen,
  onClose,
  attemptedName,
  reason
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="anti-name-piracy-overlay"
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          id="anti-name-piracy-card"
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-lg bg-zinc-950 border-2 border-red-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-red-950/80 text-white overflow-hidden"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close button top right */}
          <button
            id="anti-piracy-close-btn"
            onClick={onClose}
            aria-label="Sluit waarschuwing"
            className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Shield Icon & Header */}
          <div className="flex flex-col items-center text-center space-y-4 pt-2">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-red-950/70 border border-red-500/50 flex items-center justify-center shadow-lg shadow-red-900/40 relative">
                <ShieldAlert className="w-10 h-10 text-red-400 animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 border-2 border-zinc-950 flex items-center justify-center">
                <AlertOctagon className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[11px] font-black tracking-widest uppercase mb-1">
                <Lock className="w-3 h-3" />
                Security Protocol Actief
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
                Anti Name Piracy
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-red-300/90">
                Gereserveerde Identiteit & Merkbescherming
              </p>
            </div>
          </div>

          {/* Conflict detail badge */}
          <div className="mt-6 p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-red-200">
              <UserX className="w-4 h-4 text-red-400 shrink-0" />
              <span>Gedetecteerde poging tot naampiraterij:</span>
            </div>
            <div className="px-3 py-2 bg-black/60 rounded-xl border border-red-500/20 font-mono text-sm text-red-300 font-bold break-all flex items-center justify-between">
              <span>"{attemptedName || 'Gereserveerde naam'}"</span>
              <span className="text-[10px] font-black text-red-400 bg-red-500/20 px-2 py-0.5 rounded uppercase">Geblokkeerd</span>
            </div>
            {reason && (
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {reason}
              </p>
            )}
          </div>

          {/* Policy Information */}
          <div className="mt-4 p-4 rounded-2xl bg-zinc-900/70 border border-white/5 space-y-2.5 text-xs text-zinc-300 text-left">
            <p className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              Waarom wordt deze registratie tegengehouden?
            </p>
            <p className="text-zinc-300 leading-relaxed text-[11.5px]">
              Namen en variaties rondom <strong className="text-white">Jonatech</strong>, <strong className="text-white">Marko</strong>, <strong className="text-white">Hoksen</strong> en <strong className="text-white">Marko Hoksen</strong> zijn exclusief voorbehouden aan de officiële beheerder en merkeigenaar.
            </p>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Het claimen of nabootsen van deze identiteiten (inclusief leetspeak en speciale tekens) is niet toegestaan om verwarring en misleiding binnen de community te voorkomen.
            </p>
          </div>

          {/* Action Button */}
          <div className="mt-6 flex flex-col gap-2">
            <button
              id="anti-piracy-confirm-btn"
              type="button"
              onClick={onClose}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-red-950/60 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>Begrepen, ik kies een eigen unieke naam</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default AntiNamePiracyModal;
