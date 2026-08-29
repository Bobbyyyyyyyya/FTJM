export interface SecurityThreat {
  category: 'SQL_INJECTION' | 'POSTGRES_RCE' | 'PRIVILEGE_ESCALATION' | 'CATALOG_SNOOPING' | 'EXTENSION_EXPLOIT' | 'TIMING_ATTACK' | 'STACKED_QUERY';
  name: string;
  severity: 'HIGH' | 'CRITICAL' | 'MEDIUM';
  description: string;
  matchedPattern: string;
  mitigation: string;
}

export interface SecurityScanResult {
  isSafe: boolean;
  threats: SecurityThreat[];
  riskScore: number; // 0 to 100
  sanitizedValue: string;
  analyzedAt: string;
}

// Comprehensive PostgreSQL Exploit & SQL Injection Rule Definitions
export const POSTGRES_SECURITY_RULES: Array<{
  category: SecurityThreat['category'];
  name: string;
  severity: SecurityThreat['severity'];
  description: string;
  mitigation: string;
  pattern: RegExp;
}> = [
  // 1. Remote Code Execution (RCE) via COPY TO/FROM PROGRAM
  {
    category: 'POSTGRES_RCE',
    name: 'COPY TO/FROM PROGRAM Shell Command Execution',
    severity: 'CRITICAL',
    description: 'Poging tot Remote Code Execution via de PostgreSQL COPY PROGRAM functionaliteit om commando\'s op het host-besturingssysteem uit te voeren.',
    mitigation: 'Beperk COPY PROGRAM uitsluitend tot superusers en controleer input op shell redirects en OS-commando\'s.',
    pattern: /COPY\s+[\s\S]*?\s+(TO|FROM)\s+PROGRAM\s+['"][^'"]+['"]/i
  },
  {
    category: 'POSTGRES_RCE',
    name: 'PostgreSQL Server-side File Access Function',
    severity: 'CRITICAL',
    description: 'Aanroep van server-side bestandsfuncties (pg_read_file, pg_write_file, pg_ls_dir of lo_export).',
    mitigation: 'Schakel server-side bestandsfuncties uit voor standaard applicatierollen en gebruik veilige parameterisering.',
    pattern: /\b(pg_read_file|pg_write_file|pg_ls_dir|lo_export|lo_import|local_preload_libraries)\s*\(/i
  },

  // 2. Privilege Escalation
  {
    category: 'PRIVILEGE_ESCALATION',
    name: 'PostgreSQL Superuser / Role Escalation',
    severity: 'CRITICAL',
    description: 'Poging om gebruikersrechten te verhogen naar SUPERUSER, CREATEROLE of REPLICATION.',
    mitigation: 'Pas het Principle of Least Privilege toe; applicatie-accounts mogen nooit rechten verlenen of wijzigen.',
    pattern: /\b(ALTER|CREATE)\s+(USER|ROLE)\s+[\s\S]*?\s+WITH\s+[\s\S]*?(SUPERUSER|CREATEROLE|CREATEDB|REPLICATION|BYPASSRLS)/i
  },
  {
    category: 'PRIVILEGE_ESCALATION',
    name: 'GRANT ALL PRIVILEGES Inversion',
    severity: 'CRITICAL',
    description: 'Ongeautoriseerd toekennen van alle databaserechten aan ongeprivilegieerde rollen.',
    mitigation: 'Voorkom DDL/DCL queries vanuit applicatiecontext via rol-isolatie.',
    pattern: /\bGRANT\s+(ALL|ALL\s+PRIVILEGES|SUPERUSER)\s+ON\s+/i
  },

  // 3. Extension Exploitation
  {
    category: 'EXTENSION_EXPLOIT',
    name: 'Arbitrary C Extension Injection',
    severity: 'HIGH',
    description: 'Poging om niet-vertrouwde PostgreSQL C-extensies of externe bibliotheken te laden.',
    mitigation: 'Verwijder CREATE EXTENSION permissies voor webrollen en installeer extensies enkel via geverifieerde scripts.',
    pattern: /\b(CREATE|DROP|ALTER)\s+EXTENSION\s+(IF\s+(NOT\s+)?EXISTS\s+)?[\w_]+/i
  },

  // 4. Classic & Boolean SQL Injection
  {
    category: 'SQL_INJECTION',
    name: 'Tautology / Auth Bypass Signature (\' OR \'1\'=\'1)',
    severity: 'HIGH',
    description: 'Klassieke SQL-injectie die authenticatie omzeilt door een logische expressie te forceren die altijd waar is.',
    mitigation: 'Gebruik uitsluitend prepared statements / geparameteriseerde queries met bind-variabelen ($1, $2).',
    pattern: /(?:'|"|\b)(?:OR|AND)\s+['"]?([a-zA-Z0-9_-]+)['"]?\s*=\s*['"]?\1['"]?(?:\s*--|\s*#|\s*\/\*|$|\s+AND|\s+OR)/i
  },
  {
    category: 'SQL_INJECTION',
    name: 'Numeric Tautology SQLi (OR 1=1 / OR 1=1--)',
    severity: 'HIGH',
    description: 'Numerieke tautologie injectiepatroon gericht op query manipulatie.',
    mitigation: 'Type-valideer getallen strikt en bind inputs als parameters.',
    pattern: /(?:\bOR|\bAND)\s+\(?\s*(\d+)\s*=\s*\1\s*\)?/i
  },
  {
    category: 'SQL_INJECTION',
    name: 'UNION-based SQL Data Exfiltration',
    severity: 'HIGH',
    description: 'UNION SELECT injectie bedoeld om data uit andere tabellen of schema\'s op te vragen.',
    mitigation: 'Parameteriseer alle zoek- en filterparameters; vermijd string concatenatie in SQL.',
    pattern: /\bUNION\s+(?:ALL\s+)?SELECT\s+/i
  },

  // 5. System Catalog Snooping
  {
    category: 'CATALOG_SNOOPING',
    name: 'PostgreSQL System Catalog / Credential Probe',
    severity: 'HIGH',
    description: 'Poging om systeemtabellen met wachtwoord-hashes of configuratie uit te lezen (pg_shadow, pg_authid).',
    mitigation: 'Blokkeer leestoegang tot pg_catalog tabellen voor de applicatierol.',
    pattern: /\b(FROM|JOIN)\s+(pg_catalog\.)?(pg_shadow|pg_authid|pg_user|pg_roles|pg_proc|information_schema\.)/i
  },

  // 6. Stacked Destructive Queries
  {
    category: 'STACKED_QUERY',
    name: 'Destructive Stacked Statement (DROP/TRUNCATE/DELETE)',
    severity: 'CRITICAL',
    description: 'Geïnjecteerde opeenvolgende SQL-statement gericht op datavernietiging of schema-modificatie.',
    mitigation: 'Schakel multi-statements uit in database drivers en verbied DDL commando\'s voor webgebruikers.',
    pattern: /;\s*(?:DROP\s+(?:TABLE|DATABASE|SCHEMA|VIEW|INDEX)|TRUNCATE\s+(?:TABLE\s+)?|DELETE\s+FROM)\s+/i
  },

  // 7. Time-based Blind SQL Injection
  {
    category: 'TIMING_ATTACK',
    name: 'Time-based Blind Delay Probe (pg_sleep)',
    severity: 'HIGH',
    description: 'Injectie van pg_sleep() of vertragingen om gegevens byte voor byte blind uit te lezen.',
    mitigation: 'Blokkeer slaapfuncties en monitor afwijkende query-uitvoeringstijden.',
    pattern: /\b(pg_sleep|pg_sleep_for|pg_sleep_until)\s*\(\s*\d+/i
  }
];

/**
 * Scans a string or structured object recursively for PostgreSQL exploits and SQLi patterns.
 */
export function scanForDatabaseExploits(input: any): SecurityScanResult {
  const threats: SecurityThreat[] = [];

  const extractStrings = (val: any): string[] => {
    if (typeof val === 'string') return [val];
    if (Array.isArray(val)) return val.flatMap(extractStrings);
    if (val !== null && typeof val === 'object') {
      return Object.values(val).flatMap(extractStrings);
    }
    return [];
  };

  const stringValues = extractStrings(input);
  const combinedText = stringValues.join('\n');

  for (const rule of POSTGRES_SECURITY_RULES) {
    if (rule.pattern.test(combinedText)) {
      const match = combinedText.match(rule.pattern);
      threats.push({
        category: rule.category,
        name: rule.name,
        severity: rule.severity,
        description: rule.description,
        matchedPattern: match ? match[0] : rule.name,
        mitigation: rule.mitigation
      });
    }
  }

  // Calculate composite risk score
  let riskScore = 0;
  for (const threat of threats) {
    if (threat.severity === 'CRITICAL') riskScore += 45;
    else if (threat.severity === 'HIGH') riskScore += 30;
    else riskScore += 15;
  }
  riskScore = Math.min(100, riskScore);

  return {
    isSafe: threats.length === 0,
    threats,
    riskScore,
    sanitizedValue: sanitizeSqlInput(typeof input === 'string' ? input : JSON.stringify(input)),
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Sanitizes input by neutralizing dangerous SQL metacharacters and suspicious control sequences.
 */
export function sanitizeSqlInput(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/--.*$/gm, '') // Remove single-line SQL comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/[\u0000\u001a]/g, '') // Remove null bytes & end-of-file chars
    .trim();
}

/**
 * Preset payloads for interactive demonstration and automated testing in UI/API.
 */
export const POSTGRES_EXPLOIT_PRESETS = [
  {
    title: 'Auth Bypass (Tautologie)',
    category: 'SQL Injection',
    payload: "' OR '1'='1",
    explanation: "Manipuleert WHERE clausules zodat logins zonder geldige inloggegevens slagen."
  },
  {
    title: 'COPY TO PROGRAM (RCE)',
    category: 'Remote Code Execution',
    payload: "COPY (SELECT '') TO PROGRAM 'rm -rf /important/data';",
    explanation: "Voert OS shell commando's uit op de databaseserver."
  },
  {
    title: 'Superuser Escalatie',
    category: 'Privilege Escalation',
    payload: "ALTER USER web_app WITH SUPERUSER CREATEROLE;",
    explanation: "Verhoogt de rechten van een standaard webaccount naar database-superuser."
  },
  {
    title: 'Time-Based Blind Probe',
    category: 'Blind SQLi',
    payload: "SELECT * FROM users WHERE id = 1 AND pg_sleep(5);",
    explanation: "Injecteert kunstmatige vertragingen om data karakter voor karakter af te leiden."
  },
  {
    title: 'Catalog Hash Exfiltratie',
    category: 'Credential Snooping',
    payload: "UNION SELECT usename, passwd FROM pg_shadow--",
    explanation: "Probeert de interne PostgreSQL authenticatietabel uit te lezen."
  },
  {
    title: 'Stacked Data Destruction',
    category: 'Destructive DDL',
    payload: "'; DROP TABLE posts; --",
    explanation: "Opeenvolgende query die hele databasetabellen verwijdert."
  }
];
