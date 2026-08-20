import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Monitor, Download, Globe, X, Sparkles, ExternalLink, CheckCircle2, ShieldCheck, Laptop } from 'lucide-react';
import { getDeviceOSInfo } from '../utils/helpers';

export const DESKTOP_DOWNLOAD_URL = 'https://github.com/Bobbyyyyyyyya/FTJM-chat/releases/tag/v1.3.1';

export function getDesktopOperatingSystem(): 'macOS' | 'Windows' | 'Linux' | null {
  if (typeof window === 'undefined') return null;
  const ua = navigator.userAgent || '';
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || '';
  
  // Ignore mobile devices
  if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return null;
  }
  
  // Explicitly ignore Chrome OS / Chromebook (CrOS is web/PWA based and should not prompt for Linux desktop .deb download)
  if (/CrOS|Chromebook|ChromeOS|cros/i.test(ua) || /Chrome OS|CrOS/i.test(platform)) {
    return null;
  }
  
  // Ignore if already inside Electron desktop wrapper or standalone installed PWA
  if (ua.includes('Electron') || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)) {
    return null;
  }
  
  const osInfo = getDeviceOSInfo(ua, platform);
  if (osInfo.name === 'macOS') return 'macOS';
  if (osInfo.name === 'Windows') return 'Windows';
  if (osInfo.name === 'Linux' && !osInfo.isChromeOS) return 'Linux';
  
  return null;
}

interface DesktopAppPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  osName?: 'macOS' | 'Windows' | 'Linux' | null;
}

export const DesktopAppPromptModal: React.FC<DesktopAppPromptModalProps> = ({
  isOpen,
  onClose,
  osName = getDesktopOperatingSystem(),
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        sessionStorage.setItem('ftjm_desktop_app_prompt_seen', 'true');
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentOS = osName || 'Windows';

  const handleDownload = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('ftjm_desktop_app_choice', 'downloaded');
      } catch {}
    }
    window.open(DESKTOP_DOWNLOAD_URL, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleContinueOnWeb = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('ftjm_desktop_app_choice', 'web');
      } catch {}
    }
    onClose();
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setDontShowAgain(isChecked);
    if (isChecked) {
      try {
        localStorage.setItem('ftjm_desktop_app_choice', 'web');
      } catch {}
    } else {
      try {
        localStorage.removeItem('ftjm_desktop_app_choice');
      } catch {}
    }
  };

  const getOsIcon = () => {
    switch (currentOS) {
      case 'macOS':
        return '🍎';
      case 'Windows':
        return '🪟';
      case 'Linux':
        return '🐧';
      default:
        return '💻';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        id="desktop-app-prompt-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={handleContinueOnWeb}
      >
        <motion.div
          id="desktop-app-prompt-modal"
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 16 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-700/70 p-6 sm:p-8 text-white shadow-2xl shadow-cyan-950/40"
        >
          {/* Ambient background glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-indigo-500/15 blur-3xl" />

          {/* Close button */}
          <button
            id="btn-close-desktop-prompt"
            onClick={handleContinueOnWeb}
            className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/80 transition-colors"
            title="Sluiten"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-2xl shadow-inner">
              <span role="img" aria-label={currentOS}>{getOsIcon()}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                  {currentOS} Gedetecteerd
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                  v1.3.1
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Download de Desktop App
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Voor de ultieme ervaring op {currentOS}
              </p>
            </div>
          </div>

          {/* Body Content */}
          <div className="space-y-4 mb-6 text-xs sm:text-sm text-zinc-300 leading-relaxed">
            <p>
              Je bent ingelogd op <strong className="text-white">{currentOS}</strong>. Wil je de officiële <strong className="text-cyan-400">FTJM Desktop App</strong> downloaden of liever direct in de browser doorgaan?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-2xl flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white text-xs">Achtergrond Meldingen</div>
                  <div className="text-[11px] text-zinc-400">Geen gemiste oproepen of DMs</div>
                </div>
              </div>
              <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-2xl flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white text-xs">Betere Prestaties</div>
                  <div className="text-[11px] text-zinc-400">Sneller en lichter dan browser tabs</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              id="btn-download-desktop-app"
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all transform active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>Desktop App Downloaden (v1.3.1)</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>

            <button
              id="btn-continue-on-web"
              onClick={handleContinueOnWeb}
              className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 hover:text-white font-semibold text-xs transition-all border border-zinc-700/60"
            >
              <Globe className="w-4 h-4 text-zinc-400" />
              <span>Doorgaan op het Web</span>
            </button>
          </div>

          {/* Checkbox preference */}
          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-zinc-400 hover:text-zinc-300 transition-colors">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={handleCheckboxChange}
                className="w-3.5 h-3.5 rounded bg-zinc-800 border-zinc-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-zinc-900 cursor-pointer"
              />
              <span>Onthoud mijn keuze (niet meer vragen)</span>
            </label>
            <span className="text-[10px] text-zinc-500 font-mono">FTJM v1.3.1</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
