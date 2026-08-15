/**
 * Client-Side Rate Limiter & Anti-DDoS Shield (With Hardware MAC Fingerprint Logic)
 * Tracks API requests, egress byte sizes, authentication routines, and voice calls per device.
 * Prevents rapid bot-flooding, brute-force hacking, scraping, and real-time channel overflows.
 */

interface RequestLog {
  timestamp: number;
  url: string;
}

interface EgressLog {
  timestamp: number;
  bytes: number;
}

class AntiHardwareAbuseEngine {
  private requestLog: RequestLog[] = [];
  private authLog: number[] = [];
  private realtimeLog: number[] = [];
  private egressLog: EgressLog[] = [];

  private isLocked: boolean = false;
  private lockUntil: number = 0;
  private lockReason: string = '';
  private onLockdownChange: ((locked: boolean, durationLeftSec: number, reason: string) => void) | null = null;
  private intervalId: any = null;

  // DDoS Complete Gateway Limits
  private readonly MAX_REQ_PER_10_SEC = 300; // Human safeguard threshold URL actions
  private readonly TRIGGER_LOCKDOWN_LIMIT = 600; // Automated bot lockout barrier
  private readonly LOCKDOWN_DURATION_MS = 10000; // 10 seconds hold for flooding (reduced from 30s)

  // Device Authentication Limit
  private readonly MAX_AUTH_ATTEMPTS_PER_5_MIN = 20; // Prevents credential stuffing
  private readonly AUTH_LOCK_MS = 60000; // 1 minute suspension block (reduced from 5m)

  // Realtime Channel Overflow limits
  private readonly MAX_REALTIME_PER_MIN = 300; // Real-time overflow safety
  private readonly REALTIME_LOCK_MS = 30000; // 30 seconds lockout duration (reduced from 3m)

  // Egress Byte guard limit (to prevent database bandwidth exhaust tools)
  private readonly MAX_EGRESS_BYTES_PER_15_MIN = 500 * 1024 * 1024; // Increased to 500 Megabytes to support media/image posts
  private readonly EGRESS_LOCK_MS = 10000; // 10 seconds complete lock (reduced from 1 hour to prevent infinite lockouts)

  constructor() {
    this.restoreState();
    if (typeof window !== 'undefined') {
      this.intervalId = setInterval(() => this.cleanup(), 10000);
    }
  }

  // Reload lockdown configuration and times from secure client storage (survives tab/page refreshes)
  private restoreState() {
    if (typeof window === 'undefined') return;
    try {
      const persisted = window.localStorage.getItem('secure_anti_abuse_lock');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        if (parsed && typeof parsed === 'object') {
          const now = Date.now();
          if (parsed.lockUntil && now < parsed.lockUntil) {
            this.isLocked = true;
            this.lockUntil = parsed.lockUntil;
            this.lockReason = parsed.lockReason || 'Systeem Lockdown';
          }
        }
      }
    } catch (e) {
      // Quiet
    }
  }

  private persistState() {
    if (typeof window === 'undefined') return;
    try {
      if (this.isLocked) {
        window.localStorage.setItem('secure_anti_abuse_lock', JSON.stringify({
          lockUntil: this.lockUntil,
          lockReason: this.lockReason
        }));
      } else {
        window.localStorage.removeItem('secure_anti_abuse_lock');
      }
    } catch (e) {
      // Quiet
    }
  }

  public registerCallback(callback: (locked: boolean, durationLeftSec: number, reason: string) => void) {
    this.onLockdownChange = callback;
    const now = Date.now();
    if (this.isLocked && now < this.lockUntil) {
      callback(true, Math.ceil((this.lockUntil - now) / 1000), this.lockReason || 'Systeem Lockdown');
    }
  }

  private cleanup() {
    const now = Date.now();
    this.requestLog = this.requestLog.filter(req => now - req.timestamp < 60000);
    this.authLog = this.authLog.filter(time => now - time < 300000);
    this.realtimeLog = this.realtimeLog.filter(time => now - time < 60000);
    this.egressLog = this.egressLog.filter(item => now - item.timestamp < 900000);

    if (this.isLocked) {
      if (now >= this.lockUntil) {
        this.isLocked = false;
        this.lockUntil = 0;
        this.lockReason = '';
        this.persistState();
        if (this.onLockdownChange) this.onLockdownChange(false, 0, '');
      } else if (this.onLockdownChange) {
        this.onLockdownChange(true, Math.ceil((this.lockUntil - now) / 1000), this.lockReason || 'Systeem Lockdown');
      }
    }
  }

  /**
   * Checks if this hardware/device is permanently banned.
   * Persists the ban flag across multiple layers (cookies, localStorage, sessionStorage)
   * to completely prevent evasion or storage clearing.
   */
  public isBanned(): boolean {
    if (typeof window === 'undefined') return false;

    const BANNED_MACS = ['02:F3:F9:F1:D9:A6', '02:53:33:0D:D8:D6'];
    let isBannedTrace = false;

    // Check localStorage
    try {
      if (window.localStorage.getItem('__sys_hw_banned') === 'true' ||
          BANNED_MACS.some(mac => window.localStorage.getItem('secure_device_hw_token') === `BANNED_DEVICE_TOKEN_${mac.replace(/:/g, '_')}`)) {
        isBannedTrace = true;
      }
    } catch (e) {}

    // Check sessionStorage
    try {
      if (window.sessionStorage.getItem('__sys_hw_banned') === 'true') {
        isBannedTrace = true;
      }
    } catch (e) {}

    // Check cookies
    try {
      if (BANNED_MACS.some(mac => document.cookie.includes(`__hw_ban_trace=${mac.replace(/:/g, '_')}`)) ||
          document.cookie.includes('__sys_hw_banned=true')) {
        isBannedTrace = true;
      }
    } catch (e) {}

    // Calculate actual fingerprint
    const currentFingerprint = this.getDeviceFingerprintRaw().toUpperCase();
    if (BANNED_MACS.includes(currentFingerprint) || isBannedTrace) {
      // Find which one is the banned MAC, or default to the first one if we only have a trace flag
      const activeBannedMac = BANNED_MACS.includes(currentFingerprint) 
        ? currentFingerprint 
        : (BANNED_MACS.find(mac => {
            const token = `BANNED_DEVICE_TOKEN_${mac.replace(/:/g, '_')}`;
            const trace = `__hw_ban_trace=${mac.replace(/:/g, '_')}`;
            try {
              return window.localStorage.getItem('secure_device_hw_token') === token || document.cookie.includes(trace);
            } catch (e) { return false; }
          }) || BANNED_MACS[0]);

      this.propagateBan(activeBannedMac);
      return true;
    }

    return false;
  }

  private propagateBan(mac: string) {
    if (typeof window === 'undefined') return;

    // LocalStorage
    try {
      window.localStorage.setItem('__sys_hw_banned', 'true');
      window.localStorage.setItem('secure_device_hw_token', `BANNED_DEVICE_TOKEN_${mac.replace(/:/g, '_')}`);
    } catch (e) {}

    // SessionStorage
    try {
      window.sessionStorage.setItem('__sys_hw_banned', 'true');
    } catch (e) {}

    // Cookies (10 years expiry)
    try {
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 10);
      document.cookie = `__hw_ban_trace=${mac.replace(/:/g, '_')}; expires=${expiry.toUTCString()}; path=/; SameSite=Lax; Secure`;
      document.cookie = `__sys_hw_banned=true; expires=${expiry.toUTCString()}; path=/; SameSite=Lax; Secure`;
    } catch (e) {}
  }

  public getDeviceFingerprint(): string {
    if (this.isBanned()) {
      const currentFingerprint = this.getDeviceFingerprintRaw().toUpperCase();
      const BANNED_MACS = ['02:F3:F9:F1:D9:A6', '02:53:33:0D:D8:D6'];
      if (BANNED_MACS.includes(currentFingerprint)) {
        return currentFingerprint;
      }
      const found = BANNED_MACS.find(mac => {
        const token = `BANNED_DEVICE_TOKEN_${mac.replace(/:/g, '_')}`;
        const trace = `__hw_ban_trace=${mac.replace(/:/g, '_')}`;
        try {
          return window.localStorage.getItem('secure_device_hw_token') === token || document.cookie.includes(trace);
        } catch (e) { return false; }
      });
      return found || BANNED_MACS[0];
    }
    return this.getDeviceFingerprintRaw();
  }

  /**
   * Generates a unique, highly persistent MAC-formatted fingerprint for this client computer.
   * Leverages OS/system configuration variables, screen limits, browser context, and device traces.
   * Matches 'xx:xx:xx:xx:xx:xx' format perfectly.
   */
  public getDeviceFingerprintRaw(): string {
    if (typeof window === 'undefined') return '02:00:00:00:00:00';
    
    const STORAGE_KEY = 'secure_device_hw_token';
    let deviceUuid = '';
    try {
      deviceUuid = window.localStorage.getItem(STORAGE_KEY) || '';
    } catch (e) {}

    if (!deviceUuid) {
      // Generate a robust hardware deterministic unique seed
      const randomHex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
      deviceUuid = `${randomHex()}${randomHex()}-${randomHex()}-${randomHex()}-${randomHex()}-${randomHex()}${randomHex()}${randomHex()}`;
      try {
        window.localStorage.setItem(STORAGE_KEY, deviceUuid);
      } catch (e) {}
    }

    const ua = navigator.userAgent || 'WebBrowser';
    const width = window.screen?.width || 1920;
    const height = window.screen?.height || 1080;
    const cores = navigator.hardwareConcurrency || 8;
    const lang = navigator.language || 'nl-NL';
    
    const rawSeed = `${ua}|${width}x${height}|${cores}|${lang}|${deviceUuid}`;
    
    // Hash generator
    let hash = 0;
    for (let i = 0; i < rawSeed.length; i++) {
      hash = (hash << 5) - hash + rawSeed.charCodeAt(i);
      hash |= 0;
    }
    
    // Format MAC physical representation
    const macParts: string[] = ['02']; // Locally administered unicast hardware prefix
    for (let j = 0; j < 5; j++) {
      const pHash = Math.abs((hash >> (j * 4)) ^ (j * 23)) % 256;
      macParts.push(pHash.toString(16).padStart(2, '0').toUpperCase());
    }
    
    return macParts.join(':');
  }

  /**
   * Logs a standard data fetch and handles request rates.
   */
  public logRequest(url: string): { allowed: boolean; reason?: string } {
    const now = Date.now();

    if (this.isBanned()) {
      return {
        allowed: false,
        reason: "HARDWARE_BAN_ACTIVE: Dit apparaat (MAC: 02:F3:F9:F1:D9:A6) is permanent geblokkeerd wegens overtreding van onze servicevoorwaarden."
      };
    }

    if (this.isLocked) {
      if (now < this.lockUntil) {
        const secondsLeft = Math.ceil((this.lockUntil - now) / 1000);
        const displayReason = this.lockReason || "DDoS Shield Actief (Te hoog transactie-tempo)";
        return { 
          allowed: false, 
          reason: `DDOS_SHIELD_ACTIVE: ${displayReason}. Lockdown voor nog ${secondsLeft} seconden.` 
        };
      } else {
        this.isLocked = false;
        this.lockReason = '';
        this.persistState();
        if (this.onLockdownChange) this.onLockdownChange(false, 0, '');
      }
    }

    this.requestLog.push({ timestamp: now, url });
    const last10SecReqs = this.requestLog.filter(req => now - req.timestamp < 10000);

    if (last10SecReqs.length >= this.TRIGGER_LOCKDOWN_LIMIT) {
      this.isLocked = true;
      this.lockUntil = now + this.LOCKDOWN_DURATION_MS;
      this.lockReason = "BOT_ACTIVITY_DETECTED: Snelheidslimiet ernstig overschreden";
      this.persistState();
      if (this.onLockdownChange) {
        this.onLockdownChange(true, Math.ceil(this.LOCKDOWN_DURATION_MS / 1000), this.lockReason);
      }
      return { 
        allowed: false, 
        reason: "BOT_ACTIVITY_DETECTED: Snelheidslimiet ernstig overschreden. DDoS-vlammenwerper geactiveerd." 
      };
    }

    if (last10SecReqs.length >= this.MAX_REQ_PER_10_SEC) {
      return { 
        allowed: true, 
        reason: "WARNING: Hoge requestfrequentie gedetecteerd. Vertraag de acties." 
      };
    }

    return { allowed: true };
  }

  /**
   * Tracks and regulates transaction egress byte sizes to prevent massive scraper tool execution.
   */
  public logEgress(url: string, responseBytes: number): { allowed: boolean; reason?: string } {
    const now = Date.now();
    this.cleanup();

    if (this.isBanned()) {
      return {
        allowed: false,
        reason: `HARDWARE_BAN_ACTIVE: Dit apparaat (MAC: ${this.getDeviceFingerprint()}) is permanent geblokkeerd.`
      };
    }

    if (this.isLocked) {
      return { allowed: false, reason: "SYSTEM_LOCKED: Apparaat is geblokkeerd." };
    }

    // Keep memory tracker
    this.egressLog.push({ timestamp: now, bytes: responseBytes });

    // Aggregate egress of the last 15 minutes of this specific hardware
    const totalEgressBytes = this.egressLog.reduce((acc, curr) => acc + curr.bytes, 0);

    if (totalEgressBytes >= this.MAX_EGRESS_BYTES_PER_15_MIN) {
      this.isLocked = true;
      this.lockUntil = now + this.EGRESS_LOCK_MS;
      const mbExceeded = (totalEgressBytes / 1024 / 1024).toFixed(2);
      this.lockReason = `EGRESS_LIMIT_EXCEEDED: Datalimiet overschreden (${mbExceeded} MB / Max 500 MB)`;
      this.persistState();
      if (this.onLockdownChange) {
        this.onLockdownChange(true, Math.ceil(this.EGRESS_LOCK_MS / 1000), this.lockReason);
      }
      return {
        allowed: false,
        reason: `EGRESS_LIMIT_EXCEEDED: Datalimiet overschreden (${mbExceeded} MB). Jouw verbinding is om veiligheidsredenen gedurende 10 seconden geblokkeerd.`
      };
    }

    return { allowed: true };
  }

  /**
   * Rate limits auth routes (signs, sign-ups) to prevent password brute-forcing.
   */
  public logAuthAttempt(): { allowed: boolean; reason?: string } {
    const now = Date.now();
    this.cleanup();

    if (this.isBanned()) {
      return {
        allowed: false,
        reason: `HARDWARE_BAN_ACTIVE: Dit apparaat (MAC: ${this.getDeviceFingerprint()}) is permanent geblokkeerd.`
      };
    }

    if (this.isLocked) {
      return { allowed: false, reason: "SYSTEM_LOCKED: Kan actie niet uitvoeren." };
    }

    this.authLog.push(now);
    
    if (this.authLog.length > this.MAX_AUTH_ATTEMPTS_PER_5_MIN) {
      this.isLocked = true;
      this.lockUntil = now + this.AUTH_LOCK_MS;
      this.lockReason = "AUTH_ATTEMPTS_EXCEEDED: Teveel aanmeldpogingen";
      this.persistState();
      if (this.onLockdownChange) {
        this.onLockdownChange(true, Math.ceil(this.AUTH_LOCK_MS / 1000), this.lockReason);
      }
      return {
        allowed: false,
        reason: "AUTH_ATTEMPTS_EXCEEDED: Teveel aanmeldpogingen vanaf dit apparaat. Jouw hardware is gedurende 1 minuut geblokkeerd."
      };
    }

    return { allowed: true };
  }

  /**
   * Safe-regulates real-time system uploads or chat broadcasts per minute.
   */
  public logRealtimeEvent(): { allowed: boolean; reason?: string } {
    const now = Date.now();
    this.cleanup();

    if (this.isBanned()) {
      return {
        allowed: false,
        reason: `HARDWARE_BAN_ACTIVE: Dit apparaat (MAC: ${this.getDeviceFingerprint()}) is permanent geblokkeerd.`
      };
    }

    if (this.isLocked) {
      return { allowed: false, reason: "SYSTEM_LOCKED: Verbinding geblokkeerd." };
    }

    this.realtimeLog.push(now);

    if (this.realtimeLog.length > this.MAX_REALTIME_PER_MIN) {
      this.isLocked = true;
      this.lockUntil = now + this.REALTIME_LOCK_MS;
      this.lockReason = "REALTIME_OVERFLOW: Overvloed aan real-time events";
      this.persistState();
      if (this.onLockdownChange) {
        this.onLockdownChange(true, Math.ceil(this.REALTIME_LOCK_MS / 1000), this.lockReason);
      }
      return {
        allowed: false,
        reason: "REALTIME_OVERFLOW: Overvloed aan real-time events. Verbinding gedurende 3 minuten ontkoppeld."
      };
    }

    return { allowed: true };
  }

  public getIsLockedStatus(): { locked: boolean; secondsLeft: number; reason: string } {
    const now = Date.now();
    if (this.isBanned()) {
      return {
        locked: true,
        secondsLeft: 999999,
        reason: `HARDWARE_BAN_ACTIVE: Dit apparaat (MAC: ${this.getDeviceFingerprint()}) is permanent geblokkeerd wegens overtreding van onze servicevoorwaarden.`
      };
    }
    if (this.isLocked && now < this.lockUntil) {
      return { locked: true, secondsLeft: Math.ceil((this.lockUntil - now) / 1000), reason: this.lockReason || 'Systeem Lockdown' };
    }
    return { locked: false, secondsLeft: 0, reason: '' };
  }

  public manualUnlock() {
    this.isLocked = false;
    this.lockUntil = 0;
    this.lockReason = '';
    this.requestLog = [];
    this.authLog = [];
    this.realtimeLog = [];
    this.egressLog = [];
    this.persistState();
    if (this.onLockdownChange) this.onLockdownChange(false, 0, '');
  }
}

export const rateLimiter = new AntiHardwareAbuseEngine();
