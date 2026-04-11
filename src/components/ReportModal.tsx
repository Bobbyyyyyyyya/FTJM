import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flag, Loader2, AlertTriangle } from 'lucide-react';

interface ReportModalProps {
  show: boolean;
  onClose: () => void;
  target: { type: string, id: string, displayName: string } | null;
  reason: string;
  setReason: (reason: string) => void;
  details: string;
  setDetails: (details: string) => void;
  onSubmit: () => void;
  sending: boolean;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  show,
  onClose,
  target,
  reason,
  setReason,
  details,
  setDetails,
  onSubmit,
  sending
}) => {
  return (
    <AnimatePresence>
      {show && target && (
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
            <div className="p-6 sm:p-8 border-b border-app-border flex items-center justify-between bg-red-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Flag className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-xl font-black text-app-ink uppercase tracking-tighter">Rapporteren</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-red-100 rounded-full transition-colors text-red-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 sm:p-8 space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  Je rapporteert de <span className="font-bold">{target.type}</span> van <span className="font-bold">{target.displayName}</span>. Misbruik van het rapportagesysteem kan leiden tot een ban.
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-app-muted uppercase tracking-[0.2em] mb-2 ml-1">Reden</label>
                  <select 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-red-500 transition-all text-sm text-app-ink font-bold"
                  >
                    <option value="">Selecteer een reden...</option>
                    <option value="Spam">Spam / Onnodige herhaling</option>
                    <option value="Ongepast">Ongepaste taal / Content</option>
                    <option value="Intimidatie">Intimidatie / Pesten</option>
                    <option value="Nep">Nep account / Misleiding</option>
                    <option value="Overig">Overig (Licht toe hieronder)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-app-muted uppercase tracking-[0.2em] mb-2 ml-1">Details</label>
                  <textarea 
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Geef meer context over je melding..."
                    className="w-full px-4 py-4 bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-red-500 transition-all text-sm text-app-ink min-h-[120px] resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 bg-app-accent text-app-muted rounded-2xl font-bold hover:bg-app-border transition-all"
                >
                  Annuleren
                </button>
                <button 
                  onClick={onSubmit}
                  disabled={sending || !reason || !details.trim()}
                  className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Flag className="w-5 h-5" />}
                  Melding Versturen
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
