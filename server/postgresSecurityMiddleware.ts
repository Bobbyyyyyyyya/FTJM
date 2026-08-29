import { Request, Response, NextFunction } from 'express';

export interface BlockedIncident {
  id: string;
  timestamp: string;
  ip: string;
  path: string;
  method: string;
  category: string;
  threatName: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  matchedSnippet: string;
  userAgent?: string;
}

// In-memory audit log for real-time dashboard inspection (keeps last 50 incidents)
const recentIncidents: BlockedIncident[] = [];
let totalScanned = 0;
let totalBlocked = 0;

// PostgreSQL & SQL Injection Detection Signatures
const DETECTORS = [
  {
    category: 'POSTGRES_RCE',
    name: 'COPY TO/FROM PROGRAM Execution',
    severity: 'CRITICAL' as const,
    regex: /COPY\s+[\s\S]*?\s+(TO|FROM)\s+PROGRAM\s+['"][^'"]+['"]/i
  },
  {
    category: 'POSTGRES_RCE',
    name: 'Server-side File/OS Function Probe',
    severity: 'CRITICAL' as const,
    regex: /\b(pg_read_file|pg_write_file|pg_ls_dir|lo_export|lo_import|local_preload_libraries)\s*\(/i
  },
  {
    category: 'PRIVILEGE_ESCALATION',
    name: 'PostgreSQL Superuser / Role Escalation',
    severity: 'CRITICAL' as const,
    regex: /\b(ALTER|CREATE)\s+(USER|ROLE)\s+[\s\S]*?\s+WITH\s+[\s\S]*?(SUPERUSER|CREATEROLE|CREATEDB|REPLICATION|BYPASSRLS)/i
  },
  {
    category: 'PRIVILEGE_ESCALATION',
    name: 'GRANT ALL PRIVILEGES Inversion',
    severity: 'CRITICAL' as const,
    regex: /\bGRANT\s+(ALL|ALL\s+PRIVILEGES|SUPERUSER)\s+ON\s+/i
  },
  {
    category: 'EXTENSION_EXPLOIT',
    name: 'Arbitrary C Extension Injection',
    severity: 'HIGH' as const,
    regex: /\b(CREATE|DROP|ALTER)\s+EXTENSION\s+(IF\s+(NOT\s+)?EXISTS\s+)?[\w_]+/i
  },
  {
    category: 'SQL_INJECTION',
    name: 'Tautology / Auth Bypass Signature',
    severity: 'HIGH' as const,
    regex: /(?:'|"|\b)(?:OR|AND)\s+['"]?([a-zA-Z0-9_-]+)['"]?\s*=\s*['"]?\1['"]?(?:\s*--|\s*#|\s*\/\*|$|\s+AND|\s+OR)/i
  },
  {
    category: 'SQL_INJECTION',
    name: 'Numeric Tautology SQLi (OR 1=1)',
    severity: 'HIGH' as const,
    regex: /(?:\bOR|\bAND)\s+\(?\s*(\d+)\s*=\s*\1\s*\)?/i
  },
  {
    category: 'SQL_INJECTION',
    name: 'UNION SELECT Exfiltration',
    severity: 'HIGH' as const,
    regex: /\bUNION\s+(?:ALL\s+)?SELECT\s+/i
  },
  {
    category: 'CATALOG_SNOOPING',
    name: 'PostgreSQL System Catalog Snooping',
    severity: 'HIGH' as const,
    regex: /\b(FROM|JOIN)\s+(pg_catalog\.)?(pg_shadow|pg_authid|pg_user|pg_roles|information_schema\.)/i
  },
  {
    category: 'STACKED_QUERY',
    name: 'Destructive Stacked SQL Statement',
    severity: 'CRITICAL' as const,
    regex: /;\s*(?:DROP\s+(?:TABLE|DATABASE|SCHEMA|VIEW|INDEX)|TRUNCATE\s+(?:TABLE\s+)?|DELETE\s+FROM)\s+/i
  },
  {
    category: 'TIMING_ATTACK',
    name: 'Blind Time-delay Injection (pg_sleep)',
    severity: 'HIGH' as const,
    regex: /\b(pg_sleep|pg_sleep_for|pg_sleep_until)\s*\(\s*\d+/i
  }
];

function extractStrings(val: any): string[] {
  if (typeof val === 'string') return [val];
  if (Array.isArray(val)) return val.flatMap(extractStrings);
  if (val !== null && typeof val === 'object') {
    return Object.values(val).flatMap(extractStrings);
  }
  return [];
}

/**
 * Express Middleware that inspects incoming queries and body payloads for PostgreSQL exploit patterns.
 */
export function postgresSecurityMiddleware(req: Request, res: Response, next: NextFunction) {
  totalScanned++;

  // Exempt internal static or image proxy queries if needed, but inspect all API inputs
  if (!req.path.startsWith('/api/')) {
    return next();
  }

  // Exempt the security stats endpoint from blocking
  if (req.path === '/api/security/stats') {
    return next();
  }

  const queryStrings = extractStrings(req.query);
  const bodyStrings = extractStrings(req.body);
  const paramStrings = extractStrings(req.params);
  const combinedPayload = [...queryStrings, ...bodyStrings, ...paramStrings].join('\n');

  for (const detector of DETECTORS) {
    if (detector.regex.test(combinedPayload)) {
      totalBlocked++;
      const match = combinedPayload.match(detector.regex);
      const incident: BlockedIncident = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
        path: req.path,
        method: req.method,
        category: detector.category,
        threatName: detector.name,
        severity: detector.severity,
        matchedSnippet: match ? match[0].substring(0, 100) : 'Matched rule pattern',
        userAgent: req.headers['user-agent'] || 'Unknown'
      };

      recentIncidents.unshift(incident);
      if (recentIncidents.length > 50) recentIncidents.pop();

      console.warn(`[SECURITY SHIELD BLOCKED] ${incident.severity} threat detected on ${req.method} ${req.path} from IP ${incident.ip}: ${detector.name}`);

      return res.status(403).json({
        success: false,
        error: 'Beveiligingsfout: Onveilige database payload gedetecteerd door het PostgreSQL Security Shield.',
        code: 'SECURITY_THREAT_BLOCKED',
        threat: {
          category: detector.category,
          name: detector.name,
          severity: detector.severity
        }
      });
    }
  }

  next();
}

/**
 * Endpoint helper to get security stats
 */
export function getSecurityStats() {
  return {
    shieldActive: true,
    totalScanned,
    totalBlocked,
    recentIncidents: recentIncidents.slice(0, 20),
    activeRulesCount: DETECTORS.length,
    timestamp: new Date().toISOString()
  };
}
