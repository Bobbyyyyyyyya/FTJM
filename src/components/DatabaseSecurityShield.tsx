import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Database, 
  Lock, 
  CheckCircle2, 
  RefreshCw, 
  Info, 
  FileCode, 
  KeyRound, 
  Activity, 
  Radio,
  Terminal
} from 'lucide-react';
import { POSTGRES_SECURITY_RULES } from '../utils/securityScanner';

interface SecurityStatsResponse {
  shieldActive: boolean;
  totalScanned: number;
  totalBlocked: number;
  recentIncidents: Array<{
    id: string;
    timestamp: string;
    ip: string;
    path: string;
    method: string;
    category: string;
    threatName: string;
    severity: string;
    matchedSnippet: string;
  }>;
  activeRulesCount: number;
}

export const DatabaseSecurityShield: React.FC = () => {
  const [stats, setStats] = useState<SecurityStatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'matrix' | 'incidents'>('matrix');

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch('/api/security/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.warn('Could not fetch server security stats', e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-app-card rounded-3xl p-6 sm:p-8 border border-app-border shadow-sm space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-app-border pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center border border-cyan-500/30 text-cyan-400">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-xl sm:text-2xl font-black text-app-ink uppercase tracking-tight">
                PostgreSQL Security Shield
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Protection
              </span>
            </div>
            <p className="text-app-muted text-xs sm:text-sm font-medium mt-0.5">
              Geautomatiseerde detectie en server-side preventie van SQL-injecties, RCE exploits, privilege escalatie en database-aanvallen.
            </p>
          </div>
        </div>

        <button
          onClick={fetchStats}
          disabled={loadingStats}
          className="self-start md:self-auto px-4 py-2.5 bg-app-accent hover:bg-app-border text-app-ink rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border border-app-border"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
          Vernieuwen
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-app-accent/40 border border-app-border flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-app-muted">Actieve Firewall</span>
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm sm:text-base font-black text-app-ink">Middleware Aan</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-app-accent/40 border border-app-border flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-app-muted">Detectieregels</span>
          <div className="flex items-center gap-2 mt-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span className="text-sm sm:text-base font-black text-app-ink">{POSTGRES_SECURITY_RULES.length} Vectoren</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-app-accent/40 border border-app-border flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-app-muted">Scans Uitgevoerd</span>
          <div className="flex items-center gap-2 mt-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <span className="text-sm sm:text-base font-black text-app-ink">{stats?.totalScanned ?? 0}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-app-accent/40 border border-app-border flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-app-muted">Geweerde Aanvallen</span>
          <div className="flex items-center gap-2 mt-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span className="text-sm sm:text-base font-black text-app-ink">{stats?.totalBlocked ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-app-border pb-3">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'matrix'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-app-muted hover:text-app-ink'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          Beveiligingsvectoren Matrix
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'incidents'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-app-muted hover:text-app-ink'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          Incident Log ({stats?.recentIncidents?.length ?? 0})
        </button>
      </div>

      {/* TAB 1: VULNERABILITY MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-app-accent/30 border border-app-border text-xs text-app-muted leading-relaxed">
            <p className="font-bold text-app-ink flex items-center gap-1.5 mb-1">
              <Info className="w-4 h-4 text-cyan-400" />
              PostgreSQL Security Baseline & Exploit Afdichting
            </p>
            Het FTJM platform hanteert een multi-layered beveiligingsarchitectuur volgens het <strong>Principle of Least Privilege</strong> en automatische backend input parameterisering.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-app-accent/20 border border-app-border space-y-2">
              <div className="flex items-center gap-2 text-cyan-400">
                <FileCode className="w-4 h-4" />
                <h5 className="text-xs font-bold uppercase tracking-wider text-app-ink">1. SQL Injection & Tautologies</h5>
              </div>
              <p className="text-xs text-app-muted">
                Volledige afdichting via geparameteriseerde queries (<code className="text-cyan-300">$1, $2</code>) en ORM binding. Concateneren van raw SQL-strings is programmatisch verboden.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-app-accent/20 border border-app-border space-y-2">
              <div className="flex items-center gap-2 text-rose-400">
                <Terminal className="w-4 h-4" />
                <h5 className="text-xs font-bold uppercase tracking-wider text-app-ink">2. RCE via COPY PROGRAM</h5>
              </div>
              <p className="text-xs text-app-muted">
                Het <code className="text-cyan-300">COPY ... PROGRAM</code> commando en server-side bestandsfuncties (<code className="text-cyan-300">pg_read_file</code>) zijn geblokkeerd en uitgeschakeld voor niet-superusers.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-app-accent/20 border border-app-border space-y-2">
              <div className="flex items-center gap-2 text-amber-400">
                <KeyRound className="w-4 h-4" />
                <h5 className="text-xs font-bold uppercase tracking-wider text-app-ink">3. Privilege Escalation & Rollen</h5>
              </div>
              <p className="text-xs text-app-muted">
                Web-applicatie gebruikers opereren zonder <code className="text-cyan-300">SUPERUSER</code> of <code className="text-cyan-300">CREATEROLE</code> rechten. Schema-modificaties zijn afgeschermd.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-app-accent/20 border border-app-border space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Lock className="w-4 h-4" />
                <h5 className="text-xs font-bold uppercase tracking-wider text-app-ink">4. SCRAM-SHA-256 & SSL/TLS</h5>
              </div>
              <p className="text-xs text-app-muted">
                Verouderde authenticatiemethoden (<code className="text-cyan-300">trust</code> / <code className="text-cyan-300">md5</code>) zijn uitgeschakeld ten gunste van moderne SCRAM-SHA-256 en geforceerde TLS encryptie.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE INCIDENT AUDIT LOG */}
      {activeTab === 'incidents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-app-muted uppercase tracking-wider">
              Recente Geblokkeerde Pogingen ({stats?.recentIncidents?.length ?? 0})
            </span>
          </div>

          {(!stats?.recentIncidents || stats.recentIncidents.length === 0) ? (
            <div className="py-12 text-center rounded-2xl bg-app-accent/20 border border-app-border">
              <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
              <h5 className="text-sm font-bold text-app-ink">Geen Verdachte Pogingen Geregistreerd</h5>
              <p className="text-xs text-app-muted mt-0.5">Alle inkomende databaseverzoeken voldoen aan de beveiligingsregels.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {stats.recentIncidents.map((inc) => (
                <div 
                  key={inc.id}
                  className="p-3 rounded-xl bg-app-accent/30 border border-app-border flex items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-rose-400">[{inc.method} {inc.path}]</span>
                      <span className="font-bold text-app-ink">{inc.threatName}</span>
                    </div>
                    <p className="text-[11px] font-mono text-app-muted">
                      Snippet: <span className="text-amber-300">{inc.matchedSnippet}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-app-muted shrink-0">
                    {new Date(inc.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
