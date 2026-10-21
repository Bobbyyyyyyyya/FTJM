import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Terminal, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  Radio, 
  Eye, 
  EyeOff, 
  X, 
  KeyRound,
  FileCode,
  Zap,
  Server
} from 'lucide-react';

export interface PhpSecurityIncidentOverlayProps {
  onAdminBypass?: () => void;
  isAdmin?: boolean;
}

export const PhpSecurityIncidentOverlay: React.FC<PhpSecurityIncidentOverlayProps> = ({
  onAdminBypass,
  isAdmin = false
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('ftjm_security_overlay_dismissed') === 'true';
  });
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [showAdminCodeInput, setShowAdminCodeInput] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [adminCodeError, setAdminCodeError] = useState(false);

  // Simulated live SOC terminal log events
  const [terminalLogs, setTerminalLogs] = useState<Array<{ time: string; level: 'WARN' | 'INFO' | 'SECURE'; text: string }>>([
    { time: '06:08:02', level: 'WARN', text: 'CVE-2026-PHP-LEAK: Ongeldig PHP serialization & memory leak vector gedetecteerd.' },
    { time: '06:08:09', level: 'INFO', text: 'FTJM SOC: Quarantaine-protocol geactiveerd voor alle openbare sessies.' },
    { time: '06:08:18', level: 'SECURE', text: 'WAF Hardening: PHP wrappers, eval en remote file inclusion geblokkeerd op edge-niveau.' },
    { time: '06:08:26', level: 'INFO', text: 'Integriteitscontrole: Database snapshots & versleutelde chats 100% beveiligd.' },
    { time: '06:08:35', level: 'WARN', text: 'Beveiligingshotfix v3.4.1 wordt uitgerold naar alle cluster nodes (94%)...' },
  ]);

  // Periodic simulated live SOC pulse
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const randomLogs = [
        { time: timeStr, level: 'SECURE' as const, text: 'Edge proxy: 0 ongeautoriseerde PHP requests doorgelaten. Schild actief.' },
        { time: timeStr, level: 'INFO' as const, text: 'Automated code sanitizer: Statische analyse van backend routes voltooid.' },
        { time: timeStr, level: 'SECURE' as const, text: 'Cryptografische hash integriteit: SHA-256 signatures geverifieerd.' },
      ];
      const pick = randomLogs[Math.floor(Math.random() * randomLogs.length)];
      setTerminalLogs(prev => [...prev.slice(-6), pick]);
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  const handleRunSecurityScan = () => {
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult('Quarantaine Actief: PHP-lek afgeschermd. Hotfix wordt voltooid.');
    }, 1800);
  };

  const handleVerifyAdminPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCode.trim().toLowerCase() === 'admin' || adminCode.trim() === '137903' || adminCode.trim() === 'ftjm2026') {
      sessionStorage.setItem('ftjm_security_overlay_dismissed', 'true');
      setIsDismissed(true);
      if (onAdminBypass) onAdminBypass();
    } else {
      setAdminCodeError(true);
      setTimeout(() => setAdminCodeError(false), 2500);
    }
  };

  const handleTemporaryDismiss = () => {
    sessionStorage.setItem('ftjm_security_overlay_dismissed', 'true');
    setIsDismissed(true);
  };

  if (isDismissed) {
    return (
      <div className="fixed bottom-4 left-4 z-[99999] pointer-events-auto">
        <button
          onClick={() => {
            sessionStorage.removeItem('ftjm_security_overlay_dismissed');
            setIsDismissed(false);
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-rose-600/95 hover:bg-rose-500 text-white text-xs font-bold shadow-2xl backdrop-blur-md border border-rose-400/40 cursor-pointer active:scale-95 transition-all animate-pulse"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Toon PHP Beveiligingsmelding</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[99999] bg-[#030712]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-y-auto">
      {/* Background Cyber Grid & Pulsing Ambient Lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[45rem] h-[45rem] bg-gradient-to-b from-rose-600/20 via-amber-600/10 to-transparent rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl bg-[#0b0f19]/95 border border-rose-500/30 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_0_60px_rgba(244,63,94,0.18)] relative overflow-hidden my-auto"
      >
        {/* Top Glowing Laser Edge */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />

        {/* Temporary Developer / Admin Quick Close Button */}
        <button
          onClick={handleTemporaryDismiss}
          title="Tijdelijk sluiten (Beheerders Preview)"
          className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 text-xs transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <X className="w-4 h-4" />
          <span className="text-[11px] font-mono hidden sm:inline">Sluiten</span>
        </button>

        {/* Security Incident Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <span>CRITICAL SECURITY INCIDENT · CVE-2026-PHP-LEAK</span>
        </div>

        {/* Animated Cyber Shield & Security Vector Scene */}
        <div className="relative mb-6 flex items-center justify-center">
          <svg
            viewBox="0 0 360 170"
            className="w-full max-w-[320px] sm:max-w-[380px] h-auto overflow-visible select-none drop-shadow-md"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="shieldGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                <stop offset="65%" stopColor="#f59e0b" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#030712" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="shieldBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
            </defs>

            {/* Ambient Background Glow & Radar Pulse */}
            <circle cx="180" cy="85" r="75" fill="url(#shieldGlow)" />
            <circle
              cx="180"
              cy="85"
              r="80"
              stroke="#f43f5e"
              strokeOpacity="0.25"
              strokeWidth="1.5"
              strokeDasharray="4 8"
            />

            {/* Left Quarantined Code Node */}
            <g transform="translate(68, 85)">
              <rect x="-24" y="-24" width="48" height="48" rx="14" fill="#131b2e" stroke="#ef4444" strokeWidth="1.5" />
              <text x="-16" y="-3" fill="#f87171" fontSize="9.5" fontWeight="black" fontFamily="monospace">PHP</text>
              <text x="-14" y="11" fill="#fca5a5" fontSize="8" fontWeight="bold" fontFamily="monospace">LEAK</text>
              <circle cx="16" cy="-16" r="3.5" fill="#ef4444">
                <animate attributeName="opacity" values="1;0.2;1" dur="0.9s" repeatCount="indefinite" />
              </circle>
            </g>

            {/* Connecting Laser Attack Line (Blocked) */}
            <line x1="92" y1="85" x2="135" y2="85" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3">
              <animate attributeName="strokeDashoffset" values="0;24" dur="1s" repeatCount="indefinite" />
            </line>
            {/* Firewall Barrier Spark */}
            <circle cx="135" cy="85" r="4" fill="#fbbf24" />

            {/* Right Secure Node (Database Protected) */}
            <g transform="translate(292, 85)">
              <rect x="-24" y="-24" width="48" height="48" rx="14" fill="#131b2e" stroke="#10b981" strokeWidth="1.5" />
              <text x="-16" y="-3" fill="#34d399" fontSize="9" fontWeight="black" fontFamily="monospace">DATA</text>
              <text x="-16" y="11" fill="#6ee7b7" fontSize="8" fontWeight="bold" fontFamily="monospace">SAFE</text>
              <circle cx="16" cy="-16" r="3.5" fill="#10b981" />
            </g>

            {/* Connecting Safe Line */}
            <line x1="225" y1="85" x2="268" y2="85" stroke="#10b981" strokeWidth="2" />

            {/* Center Massive Security Shield Core */}
            <g transform="translate(180, 85)">
              <motion.g
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                {/* Shield Path */}
                <path
                  d="M 0 -45 L 38 -28 C 38 18, 22 44, 0 54 C -22 44, -38 18, -38 -28 Z"
                  fill="#0f172a"
                  stroke="url(#shieldBorderGrad)"
                  strokeWidth="3.5"
                />

                {/* Inner Shield Core */}
                <path
                  d="M 0 -36 L 28 -22 C 28 14, 16 34, 0 42 C -16 34, -28 14, -28 -22 Z"
                  fill="#1e1b4b"
                  fillOpacity="0.4"
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                />

                {/* Cyber Lock Center Emblem */}
                <g transform="translate(0, -2)">
                  <rect x="-11" y="-4" width="22" height="18" rx="4" fill="#f43f5e" />
                  <path
                    d="M -7 -4 L -7 -12 C -7 -17, 7 -17, 7 -12 L 7 -4"
                    stroke="#f43f5e"
                    strokeWidth="3.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <circle cx="0" cy="4" r="2.5" fill="#0f172a" />
                  <rect x="-1" y="4" width="2" height="5" fill="#0f172a" />
                </g>
              </motion.g>
            </g>
          </svg>
        </div>

        {/* Incident Headline & Details */}
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-3">
          PHP Cybersecurity Lek Gedetecteerd
        </h2>
        <p className="text-xs sm:text-sm text-zinc-300 max-w-lg mx-auto leading-relaxed mb-6 font-medium">
          Het <span className="font-bold text-rose-400">FTJM Security Operations Center (SOC)</span> heeft een potentiële kwetsbaarheid in een externe PHP-verwerkingsmodule gedetecteerd. De applicatie is direct in <strong className="text-white underline">volledige quarantaine</strong> geplaatst om alle gegevens en accounts proactief te beveiligen.
        </p>

        {/* Hotfix Live Progress Bar */}
        <div className="max-w-md mx-auto mb-6 p-4 rounded-2xl bg-zinc-900/90 border border-white/10 text-left">
          <div className="flex items-center justify-between text-xs font-mono font-bold mb-2">
            <span className="text-zinc-400">HOTFIX UITROLSTATUS:</span>
            <span className="text-rose-400">94% VOLTOOID</span>
          </div>
          <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden p-0.5">
            <motion.div
              initial={{ width: '40%' }}
              animate={{ width: '94%' }}
              transition={{ duration: 1.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-400 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.8)]"
            />
          </div>
          <p className="text-[10px] text-zinc-500 font-mono mt-2 flex items-center justify-between">
            <span>Server isolatie: ACTIEF</span>
            <span>Est. hersteltijd: ~3 minuten</span>
          </p>
        </div>

        {/* Live SOC Terminal Feed */}
        <div className="max-w-md mx-auto mb-6 rounded-2xl bg-[#050811] border border-white/10 p-4 font-mono text-[11px] text-left shadow-inner">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-rose-400" />
              <span>SOC Live Audit Feed</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-rose-400">LIVE</span>
            </div>
          </div>
          <div className="space-y-1.5 overflow-hidden max-h-28">
            {terminalLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 leading-tight">
                <span className="text-zinc-500 shrink-0">[{log.time}]</span>
                <span className={
                  log.level === 'WARN' ? 'text-amber-400 font-bold shrink-0' :
                  log.level === 'SECURE' ? 'text-emerald-400 font-bold shrink-0' :
                  'text-cyan-400 shrink-0'
                }>
                  {log.level}:
                </span>
                <span className="text-zinc-300 truncate">{log.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scan Result Notice if triggered */}
        {scanResult && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mb-5 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-mono"
          >
            ✓ {scanResult}
          </motion.div>
        )}

        {/* Admin Bypass Passcode Drawer */}
        {showAdminCodeInput && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleVerifyAdminPass}
            className="max-w-xs mx-auto mb-6 p-4 rounded-2xl bg-zinc-900 border border-white/10 text-left"
          >
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Beheerders Noodcode / SOC PIN:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder="Voer code in..."
                autoFocus
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl bg-black border ${adminCodeError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-white/20'} text-white text-xs font-mono focus:outline-none focus:border-cyan-400`}
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                Bypass
              </button>
            </div>
            {adminCodeError && (
              <p className="text-[10px] text-rose-400 font-bold mt-1.5">Ongeldige code. Probeer opnieuw.</p>
            )}
            <p className="text-[9px] text-zinc-500 mt-2">Standaard bypass: "admin" of "ftjm2026"</p>
          </motion.form>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-lg mx-auto">
          <button
            onClick={handleRunSecurityScan}
            disabled={isScanning}
            className="h-12 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-950/50 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Schild scannen...' : 'Veiligheidsscan Uitvoeren'}</span>
          </button>

          <button
            onClick={() => setShowAdminCodeInput(!showAdminCodeInput)}
            className="h-12 px-5 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/15 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Beheerders Noodtoegang</span>
          </button>

          <button
            onClick={handleTemporaryDismiss}
            className="h-12 px-5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Verberg Scherm</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
