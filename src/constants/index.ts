export const NEWS_ITEMS = [
  {
    id: 14,
    title: "FTJM Modern UI & Audio Update v2.5.5 🌟",
    content: "Welkom bij de officiële FTJM v2.5.5 update! In deze versie introduceren we Modern UI v2.5.5 met verbeterde Glass & Float styling, ultrasnelle navigatie en flexibele profielenlijst positionering (links, rechts of in de sidebar). Daarnaast is 'Fears to Fathom' nu het nieuwe standaard notificatiegeluid voor alle chatberichten en posts! Ook zijn er automatische CDN-media-optimalisaties en prestatieverbeteringen doorgevoerd voor een vliegensvlugge ervaring.",
    date: new Date().toISOString().split('T')[0],
    category: "Grote Update"
  },
  {
    id: 13,
    title: "FTJM Web Update v2.5.0 🔥",
    content: "Welkom bij de grote FTJM Web v2.5.0 update! We hebben de uploadlimiet verhoogd naar 4 MB voor alle profielfoto's, achtergronden, audio en chatberichten. Daarnaast introduceren we een vernieuwde geluids- en beltonenverzameling, automatische desktop app detectie met directe GitHub download (v1.3.1) voor macOS, Windows en Linux, badges voor Geverifieerde Accounts en Beta Testers, en verbeterde beveiligings- en snelheidsoptimalisaties!",
    date: "2026-08-25",
    category: "Update"
  },
  {
    id: 12,
    title: "FTJM Enterprise Update v2.4.5 🚀",
    content: "We hebben het platform geüpdatet naar v2.4.5! Deze update brengt de nieuwste optimalisaties, een nog betere weergave van het FTJM logo in icon spaces, en verbeterde systeem- en beveiligingsfuncties door het hele platform.",
    date: "2026-07-10",
    category: "Update"
  },
  {
    id: 11,
    title: "FTJM Extreem-Beveiligde Core Update v2.4.0 🧬",
    content: "Gelaagde Verificatie & Chat Revamp! Met trots introduceren we de v2.4.0 update. In deze versie hebben we het inlogscherm volledig vernieuwd met een modernere, gelaagde look en gestroomlijnde animaties. Daarnaast hebben we de registratielink verborgen tijdens het invoeren van je wachtwoord om de focus op je actieve sessie te houden en fouten te voorkomen. In de algemene chat en privéberichten hebben we de decryptie robuuster gemaakt voor betere verwerking van emoji's en speciale tekens. Ten slotte worden extreem lange berichten voortaan netjes ingekort met een handige 'Lees meer' knop, zodat de chat overzichtelijk blijft!",
    date: "2026-06-25",
    category: "Beveiliging"
  },
  {
    id: 10,
    title: "FTJM Extreem-Beveiligde Core Update v2.3.0 🧬",
    content: "Biometrische Veiligheid & Privacy! We introduceren de v2.3.0 update. In deze versie lanceren we hardware-beveiligde Passkeys (WebAuthn). Hiermee kun je vliegensvlug inloggen met je vingerafdruk, FaceID of Windows Hello op je eigen apparaat. Ter extra bescherming verplichten we de passkey-scan direct na het handmatig invoeren van je wachtwoord zodra er een sleutel is gekoppeld aan je account op dit apparaat. Daarnaast hebben we de ouderwetse Veiligheidscontrole verwijderd en de Passkeys verhuist naar de nieuwe tab Beveiliging!",
    date: "2026-06-15",
    category: "Beveiliging"
  },
  {
    id: 9,
    title: "FTJM Militair-Beveiligde Core Update v2.2.0 ⚡",
    content: "Absolute Hack-Bestendigheid! Met trots presenteren we v2.2.0. We hebben ons complete netwerk voorzien van hardware MAC-verificatie fingerprinting, gelaagde Anti-DDoS-shields met geavanceerde rate limiters op database transacties, brute-force inbraakdetectie met IP/account lockouts, en militair-grade AES-256 / HMAC-SHA256 opslagsignering. Onnodige introducties zijn volledig weggesneden om de site direct en flitsend te laden. Jouw data is onkraakbaar en optimaal afgeschermd tegen scrapers en bots!",
    date: "2026-06-07",
    category: "Zwaarbeveiligd"
  },
  {
    id: 8,
    title: "FTJM Ultra-Beveiligde Core Update v2.1.0 ⚡",
    content: "Onafhankelijkheid en absolute controle! Met trots introduceren we de v2.1.0 core update. In deze versie hebben we Google Auth volledig vervangen wegens onbetrouwbaarheid. Alle authenticatie verloopt nu via onze eigen, hoog-beveiligde en versleutelde Supabase registers. Registratie is strikt dichtgetimmerd; enkel gewhitelisteerde e-mailadressen kunnen voortaan toetreden. Geniet van een naadloze onboarding zonder extra inlogschermen na registratie, en beheer je profiel sneller dan ooit met geïntegreerde ondersteuning voor imageurlgenerator.com links!",
    date: "2026-05-21",
    category: "Update"
  },
  {
    id: 6,
    title: "Nieuwe Gebruiksvoorwaarden (ToS)",
    content: "We hebben onze Gebruiksvoorwaarden bijgewerkt. Belangrijk om te weten: de eigenaar is niet verantwoordelijk voor het gedrag of de uitingen van gebruikers op dit platform. Elke gebruiker draagt zelf de volledige verantwoordelijkheid voor hun acties en geplaatste inhoud. Lees de volledige voorwaarden op de voorpagina.",
    date: "2026-04-15",
    category: "Juridisch"
  },
  {
    id: 5,
    title: "FTJM Forum Update v1.7.9.6",
    content: "In deze update hebben we de synchronisatie van geluidsinstellingen verbeterd. Oude instellingen worden nu automatisch opgeschoond en gemigreerd naar het nieuwe formaat om conflicten te voorkomen. Ook zijn de standaard geluiden bijgewerkt naar de nieuwe image2url links.",
    date: "2026-04-14",
    category: "Update"
  },
  {
    id: 4,
    title: "FTJM Forum Update v1.7.9.05",
    content: "In deze tussentijdse update hebben we diverse kritieke bugs opgelost die door de community zijn gemeld. Fixes: [MSG-01] Profielfoto's in chat header laden nu correct. [NOT-02] Meldingen voor gemiste berichten worden nu correct weergegeven. [UI-05] Dropdown menu z-index bug opgelost. [SYS-08] Berichtenlijst synchronisatie verbeterd. [NAV-03] Nieuwe visuele indicators voor menu en nieuws toegevoegd.",
    date: "2026-04-11",
    category: "Update"
  },
  {
    id: 1,
    title: "FTJM Forum Update v1.7.9",
    content: "We hebben zojuist versie 1.7.9 uitgerold. In deze update hebben we het rapportage-systeem verbeterd, de beveiliging aangescherpt met menselijke verificatie en diverse bugfixes doorgevoerd voor een stabielere ervaring.",
    date: "2026-04-10",
    category: "Update"
  },
  {
    id: 2,
    title: "Nieuwe Huisregels",
    content: "Zorg ervoor dat je de bijgewerkte huisregels leest in de instellingen sectie om een veilige omgeving voor iedereen te behouden.",
    date: "2026-04-07",
    category: "Aankondiging"
  },
  {
    id: 3,
    title: "Community Spotlight",
    content: "Deze week zetten we onze meest actieve forumleden in het zonnetje. Bedankt voor jullie waardevolle bijdragen!",
    date: "2026-04-05",
    category: "Community"
  }
];

export const SOUND_OPTIONS = [
  { name: 'Fears to Fathom (Standaard)', url: '/audio/sounds/fears-to-fathom-notification-sound.mp3' },
  { name: 'Melding Chime', url: '/audio/sounds/notification_o14egLP.mp3' },
  { name: '007 Text Message', url: '/audio/sounds/007_Text_Message-3875438.mp3' },
  { name: 'Melding Tone', url: '/audio/sounds/yt1s_nijLeKo.mp3' },
];

export const RINGTONE_OPTIONS = [
  { name: 'Skype Ringtone (New)', url: '/audio/ringtones/skype_ringtone_new.mp3' },
  { name: 'iPhone Ringtone Remix', url: '/audio/ringtones/iphone-ringtone-remix.mp3' },
  { name: 'iPhone Trap Remix', url: '/audio/ringtones/iphone_ringtone_trap_remixbigconverter.mp3' },
];

export const PATTERNS = [
  { id: 'none', name: 'Geen', style: '' },
  { id: 'dots', name: 'Stippen', style: 'radial-gradient(var(--custom-accent) 1px, transparent 1px)', size: '20px 20px' },
  { id: 'grid', name: 'Raster', style: 'linear-gradient(var(--custom-accent) 1px, transparent 1px), linear-gradient(90deg, var(--custom-accent) 1px, transparent 1px)', size: '20px 20px' },
  { id: 'stripes', name: 'Strepen', style: 'linear-gradient(45deg, var(--custom-accent) 25%, transparent 25%, transparent 50%, var(--custom-accent) 50%, var(--custom-accent) 75%, transparent 75%, transparent)', size: '20px 20px' },
  { id: 'waves', name: 'Golven', style: 'radial-gradient(circle at 100% 50%, transparent 20%, var(--custom-accent) 21%, var(--custom-accent) 34%, transparent 35%, transparent), radial-gradient(circle at 0% 50%, transparent 20%, var(--custom-accent) 21%, var(--custom-accent) 34%, transparent 35%, transparent)', size: '40px 40px' },
  { id: 'diagonal', name: 'Diagonaal', style: 'repeating-linear-gradient(45deg, transparent, transparent 10px, var(--custom-accent) 10px, var(--custom-accent) 11px)', size: 'auto' },
];

import { EMOJI_CATEGORIES, EmojiItem } from './emojis';
import { isValidEmail, isProtectedNameOrImpersonation } from '../utils/helpers';
import { PROTECTED_NAMES_LIST } from './protectedNames';

export { EMOJI_CATEGORIES, isValidEmail, isProtectedNameOrImpersonation, PROTECTED_NAMES_LIST };

export const EMOJI_LIST: EmojiItem[] = EMOJI_CATEGORIES.flatMap(cat => cat.emojis);

export const VERIFIED_EMAILS = [
  'markohoksen@gmail.com',
  'zwedenguy@gmail.com'
];

export const BETA_TESTER_EMAILS = [
  'samleeuw803@gmail.com'
];

export const isVerifiedEmail = (
  emailOrProfile?: string | { email?: string | null; is_verified?: boolean | null } | null,
  isVerifiedCol?: boolean | null
): boolean => {
  if (!emailOrProfile) return isVerifiedCol === true;
  if (typeof emailOrProfile === 'object') {
    if (emailOrProfile.is_verified === true) return true;
    if (emailOrProfile.email) {
      return VERIFIED_EMAILS.includes(emailOrProfile.email.toLowerCase().trim());
    }
    return false;
  }
  if (isVerifiedCol === true) return true;
  return VERIFIED_EMAILS.includes(emailOrProfile.toLowerCase().trim());
};

export const isBetaTester = (
  userOrEmail?: string | { email?: string | null; role?: string | null } | null
): boolean => {
  if (!userOrEmail) return false;
  if (typeof userOrEmail === 'object') {
    if ((userOrEmail as any).is_beta_tester === true) return true;
    if (userOrEmail.email) {
      return BETA_TESTER_EMAILS.includes(userOrEmail.email.toLowerCase().trim());
    }
    return false;
  }
  return BETA_TESTER_EMAILS.includes(userOrEmail.toLowerCase().trim());
};

export const isTestUser = (
  userOrEmail?: string | { email?: string | null; display_name?: string | null; role?: string | null } | null
): boolean => {
  if (!userOrEmail) return false;
  let email = '';
  let name = '';
  let role = '';

  if (typeof userOrEmail === 'string') {
    email = userOrEmail.toLowerCase().trim();
    name = userOrEmail.toLowerCase().trim();
  } else {
    email = (userOrEmail.email || '').toLowerCase().trim();
    name = (userOrEmail.display_name || '').toLowerCase().trim();
    role = (userOrEmail.role || '').toLowerCase().trim();
  }

  // Check emails indicating test accounts
  if (
    email.includes('test@') ||
    email.endsWith('@test.com') ||
    email.endsWith('@example.com') ||
    email.includes('testuser') ||
    email.startsWith('test_') ||
    email.startsWith('test.') ||
    email.startsWith('dummy') ||
    email.startsWith('mock') ||
    email.startsWith('fake')
  ) {
    return true;
  }

  // Check display names indicating test users
  if (
    name === 'test' ||
    name === 'tester' ||
    name === 'test user' ||
    name === 'test account' ||
    name === 'testaccount' ||
    name === 'testuser' ||
    name.startsWith('test user') ||
    name.startsWith('testuser') ||
    name.startsWith('test account') ||
    name.startsWith('dummy user') ||
    name.startsWith('mock user')
  ) {
    return true;
  }

  if (role === 'test' || role === 'tester_dummy' || role === 'test_user') {
    return true;
  }

  return false;
};


