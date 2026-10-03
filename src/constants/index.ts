import type { NewsItem } from '../types';
import newsHeroImg from '../assets/images/news_featured_hero_1791016036431.jpg';
import newsClickerImg from '../assets/images/news_cat_clicker_showcase_1791016046116.jpg';
import newsSecurityImg from '../assets/images/news_security_core_shield_1791016056728.jpg';

export const APP_VERSION = 'v2.7.0';
export const APP_VERSION_NAME = 'FTJM Enterprise v2.7';

export const NEWS_ITEMS: NewsItem[] = [
  {
    id: 17,
    title: "FTJM Dynamic Identity & Crystal Decrypt v2.7 💎",
    content: "Welkom bij de baanbrekende FTJM v2.7 update! In deze versie introduceren we dynamische initialen-monogrammen voor alle gebruikers zonder profielfoto met levendige, gepersonaliseerde kleurgradiënten in plaats van het saaie standaard poppetje. Daarnaast hebben we de cryptografische AES-engine fundamenteel herbouwd met automatische Base64 spatie-normalisatie en pure UTF-8 fallback (geen 'Ⱦ' of binaire fouten meer!). Ook hebben we het Update & Release Notes Center volledig opnieuw ontworpen met interactieve categorieën, snelle navigatie en vloeiende animaties.",
    date: "2026-10-03",
    category: "Grote Update",
    version: "v2.7.0",
    readTime: "3 min leestijd",
    author: "FTJM Core Team",
    image: newsSecurityImg,
    highlights: [
      "Dynamische Initiaal-Logo's (LetterAvatar) met levendige gepersonaliseerde gradiënten",
      "Fail-Safe Crystal AES Decryptie: Oplossing voor 'Ⱦ'-bug en Base64 spatie-corruptie",
      "Compleet vernieuwd Update & Release Notes venster met interactieve tabs en filters",
      "Verfijnde typografie en naadloze ondersteuning voor donkere en lichte thema's"
    ],
    details: {
      overview: "Versie 2.7.0 markeert een grote sprong voorwaarts in visuele identiteit, platform-betrouwbaarheid en cryptografische stabiliteit. Geen grijze placeholder poppetjes meer en gegarandeerd zuivere berichtontcijfering.",
      features: [
        "Dynamische Initialen Avatars: Elk profiel zonder foto heeft nu een eigen herkenbaar monogram in de chat, sidebar, forum, media feed en overzichten.",
        "Crystal Decrypt Engine: Robuuste Base64 normalisatie en automatische herkenning van platte tekst versus AES-payloads.",
        "Overhauled Update Modal: Een modern pop-up dashboard met tabbladen voor hoogtepunten, gedetailleerde changelog en versiegeschiedenis."
      ],
      improvements: [
        "Geheugenoptimalisatie bij het decoderen van duizenden realtime berichten.",
        "Scherpere randen en vlottere contrastovergangen in de sidebar dock-modus."
      ],
      fixes: [
        "Incidentele 'Ⱦ'-weergave bij het ontvangen of cachen van versleutelde chatberichten definitief verholpen.",
        "Spatie-corruptie in Base64 gecodeerde payloads via websocket updates opgelost."
      ]
    }
  },
  {
    id: 16,
    title: "FTJM Katten Hemelvaart & Clicker Update v2.6.5 🐾",
    content: "Welkom bij de officiële FTJM v2.6.5 update! In deze versie hebben we de Katten Klikker en het interface-systeem geperfectioneerd: een vernieuwd en vliegensvlug sluitkruisje in het Hemelvaart (Ascension) menu met z-50 prioriteit en verruimd klikvlak, levendige amberkleurige glow-indicatoren en animaties voor betaalbare upgrades, eerlijke sequentiële saldo-verificatie bij 'Upgrade Alle' en dynamische brokjesbeloningen voor de Mystieke Muis en Gouden Wolbol!",
    date: "2026-09-18",
    category: "Grote Update",
    version: "v2.6.5",
    readTime: "3 min leestijd",
    author: "FTJM Core Team",
    image: newsClickerImg,
    highlights: [
      "Vernieuwd Ascension sluitkruisje met z-50 prioriteit en ruim klikvlak",
      "Levendige amber glow-indicatoren voor upgrades die direct betaalbaar zijn",
      "Eerlijke sequentiële saldo-controle bij de 'Upgrade Alle' actie",
      "Dynamische brokjesbeloningen voor Mystieke Muis en Gouden Wolbol"
    ],
    details: {
      overview: "Versie 2.6.5 legt de nadruk op vlijmscherpe interacties binnen de Arcade en Katten Klikker. Spelers kunnen nu moeiteloos ascenden zonder vast te lopen in modals, en upgrades reageren realtime op je saldo.",
      features: [
        "Ascension UI Revamp: Verbeterde header en prominente sluitknop die nooit achter andere lagen verdwijnt.",
        "Glow & Visual Cueing: Gouden en amberkleurige randen lichten op zodra je voldoende brokjes hebt.",
        "Edge-to-edge breedte in de arcade modus voor breedbeeld monitors."
      ],
      improvements: [
        "Snellere render loops bij duizenden brokjes per seconde.",
        "Geoptimaliseerde audio feedback bij het aanklikken van de katten en mittens."
      ],
      fixes: [
        "Sluitknop in Ascension overlay kon op mobiel soms buiten beeld vallen.",
        "Saldo mismatch bij snelle achtereenvolgende muisklikken."
      ]
    }
  },
  {
    id: 15,
    title: "FTJM Modern & Realtime Update v2.6.0 🚀",
    content: "Welkom bij de officiële FTJM v2.6.0 update! In deze versie introduceren we een direct interactief meldingencentrum in het Modern Sidebar logo met een dynamische rode indicator voor gemiste meldingen. Daarnaast zijn de inlog- en registratieschermen voorzien van ultra-vloeiende animaties en zachte overgangen, worden verwijderde berichten realtime opgeruimd uit de lokale browseropslag, en zijn er nieuwe notificatiegeluiden en beltonen toegevoegd!",
    date: "2026-09-08",
    category: "Grote Update",
    version: "v2.6.0",
    readTime: "4 min leestijd",
    author: "FTJM Core Team",
    image: newsHeroImg,
    highlights: [
      "Interactief notificatiecentrum direct gekoppeld aan het logo",
      "Zachte multi-stage animaties voor inloggen en registreren",
      "Realtime lokale opruiming van verwijderde chatberichten",
      "Nieuwe bibliotheek met notificatieklanken en beltonen"
    ],
    details: {
      overview: "De v2.6.0 release bracht een complete herziening van de realtime notificatie-architectuur en de login flow, met een moderne esthetiek en directe waarschuwingen voor ongelezen berichten.",
      features: [
        "Dynamische badge in de sidebar voor gemiste reacties en vermeldingen.",
        "Geheugenoptimalisatie via geavanceerde Web Workers."
      ],
      improvements: [
        "Verhoogde laadsnelheid bij het schakelen tussen chat-kanalen.",
        "Vlakkere contrastcurven in dark mode voor rustiger beeldcomfort."
      ],
      fixes: [
        "Verwijderde berichten bleven in specifieke scenario's zichtbaar in lokale cache."
      ]
    }
  },
  {
    id: 14,
    title: "FTJM Modern UI & Audio Update v2.5.5 🌟",
    content: "Welkom bij de officiële FTJM v2.5.5 update! In deze versie introduceren we Modern UI v2.5.5 met verbeterde Glass & Float styling, ultrasnelle navigatie en flexibele profielenlijst positionering (links, rechts of in de sidebar). Daarnaast is 'Fears to Fathom' nu het nieuwe standaard notificatiegeluid voor alle chatberichten en posts! Ook zijn er automatische CDN-media-optimalisaties en prestatieverbeteringen doorgevoerd voor een vliegensvlugge ervaring.",
    date: "2026-09-01",
    category: "Platform & UI",
    version: "v2.5.5",
    readTime: "3 min leestijd",
    author: "Design & UX Lab",
    highlights: [
      "Glass & Float styling met aanpasbare blur en doorzichtigheid",
      "Profielenlijst vrij te plaatsen: links, rechts of geïntegreerd",
      "'Fears to Fathom' notificatiesound als sfeervolle standaard",
      "Geautomatiseerde CDN media caching voor sneller laden van media"
    ],
    details: {
      overview: "Modern UI v2.5.5 gaf gebruikers ongekende controle over hun werkruimte, inclusief glasheldere thema's en flexibele dock-panelen.",
      features: [
        "Drie lay-out modi voor profiellijsten.",
        "Nieuw audioprofiel met zachte, filmische alerttonen."
      ],
      improvements: [
        "Vermindering van repaint overhead met 35% op schermen met hoge resolutie."
      ]
    }
  },
  {
    id: 13,
    title: "FTJM Web Update v2.5.0 🔥",
    content: "Welkom bij de grote FTJM Web v2.5.0 update! We hebben de uploadlimiet verhoogd naar 4 MB voor alle profielfoto's, achtergronden, audio en chatberichten. Daarnaast introduceren we een vernieuwde geluids- en beltonenverzameling, automatische desktop app detectie met directe GitHub download (v1.3.1) voor macOS, Windows en Linux, badges voor Geverifieerde Accounts en Beta Testers, en verbeterde beveiligings- en snelheidsoptimalisaties!",
    date: "2026-08-25",
    category: "Grote Update",
    version: "v2.5.0",
    readTime: "4 min leestijd",
    author: "FTJM Core Team",
    highlights: [
      "Uploadlimiet verhoogd naar 4 MB voor avatars, audio en media",
      "Desktop App detectie met directe download voor Mac, Windows & Linux",
      "Geverifieerde account badges en Beta Tester herkenning",
      "Robuuste client-side mediatrimmer en formaatcontrole"
    ]
  },
  {
    id: 12,
    title: "FTJM Enterprise Update v2.4.5 🚀",
    content: "We hebben het platform geüpdatet naar v2.4.5! Deze update brengt de nieuwste optimalisaties, een nog betere weergave van het FTJM logo in icon spaces, en verbeterde systeem- en beveiligingsfuncties door het hele platform.",
    date: "2026-07-10",
    category: "Platform & UI",
    version: "v2.4.5",
    readTime: "2 min leestijd",
    author: "Platform Engineering"
  },
  {
    id: 11,
    title: "FTJM Extreem-Beveiligde Core Update v2.4.0 🧬",
    content: "Gelaagde Verificatie & Chat Revamp! Met trots introduceren we de v2.4.0 update. In deze versie hebben we het inlogscherm volledig vernieuwd met een modernere, gelaagde look en gestroomlijnde animaties. Daarnaast hebben we de registratielink verborgen tijdens het invoeren van je wachtwoord om de focus op je actieve sessie te houden en fouten te voorkomen. In de algemene chat en privéberichten hebben we de decryptie robuuster gemaakt voor betere verwerking van emoji's en speciale tekens. Ten slotte worden extreem lange berichten voortaan netjes ingekort met een handige 'Lees meer' knop, zodat de chat overzichtelijk blijft!",
    date: "2026-06-25",
    category: "Beveiliging",
    version: "v2.4.0",
    readTime: "3 min leestijd",
    author: "Security Architecture",
    image: newsSecurityImg,
    highlights: [
      "Gelaagde sessie-verificatie met actieve focusbeveiliging",
      "Robuuste AES decryptie voor emoji's en Unicode codepoints",
      "Automatische tekstinkorting met 'Lees meer' accordeon in chat",
      "Veilige lockout bij verdachte inlogpatronen"
    ],
    details: {
      overview: "De 2.4.0 update legde het fundament voor enterprise-grade cryptografie binnen de chatrooms en voorkomt visuele vervuiling door extreem lange kopieer-plak berichten.",
      security: [
        "Buffer overflow bescherming op de berichtparser.",
        "Geheugen-wiping na decryptie van gevoelige payloads."
      ]
    }
  },
  {
    id: 10,
    title: "FTJM Extreem-Beveiligde Core Update v2.3.0 🧬",
    content: "Biometrische Veiligheid & Privacy! We introduceren de v2.3.0 update. In deze versie lanceren we hardware-beveiligde Passkeys (WebAuthn). Hiermee kun je vliegensvlug inloggen met je vingerafdruk, FaceID of Windows Hello op je eigen apparaat. Ter extra bescherming verplichten we de passkey-scan direct na het handmatig invoeren van je wachtwoord zodra er een sleutel is gekoppeld aan je account op dit apparaat. Daarnaast hebben we de ouderwetse Veiligheidscontrole verwijderd en de Passkeys verhuist naar de nieuwe tab Beveiliging!",
    date: "2026-06-15",
    category: "Beveiliging",
    version: "v2.3.0",
    readTime: "3 min leestijd",
    author: "Security Architecture",
    highlights: [
      "WebAuthn Passkeys: Inloggen via Touch ID, Face ID of Windows Hello",
      "Hardware-sleutel afdwinging na wachtwoordinvoer",
      "Nieuwe Beveiliging tab in het Instellingenpaneel"
    ]
  },
  {
    id: 9,
    title: "FTJM Militair-Beveiligde Core Update v2.2.0 ⚡",
    content: "Absolute Hack-Bestendigheid! Met trots presenteren we v2.2.0. We hebben ons complete netwerk voorzien van hardware MAC-verificatie fingerprinting, gelaagde Anti-DDoS-shields met geavanceerde rate limiters op database transacties, brute-force inbraakdetectie met IP/account lockouts, en militair-grade AES-256 / HMAC-SHA256 opslagsignering. Onnodige introducties zijn volledig weggesneden om de site direct en flitsend te laden. Jouw data is onkraakbaar en optimaal afgeschermd tegen scrapers en bots!",
    date: "2026-06-07",
    category: "Beveiliging",
    version: "v2.2.0",
    readTime: "4 min leestijd",
    author: "Security Architecture",
    highlights: [
      "Gelaagde Anti-DDoS shields met transactie-rate limiters",
      "AES-256 en HMAC-SHA256 data signing op opslag",
      "Geautomatiseerde detectie van geautomatiseerde scraping bots"
    ]
  },
  {
    id: 8,
    title: "FTJM Ultra-Beveiligde Core Update v2.1.0 ⚡",
    content: "Onafhankelijkheid en absolute controle! Met trots introduceren we de v2.1.0 core update. In deze versie hebben we Google Auth volledig vervangen wegens onbetrouwbaarheid. Alle authenticatie verloopt nu via onze eigen, hoog-beveiligde en versleutelde Supabase registers. Registratie is strikt dichtgetimmerd; enkel gewhitelisteerde e-mailadressen kunnen voortaan toetreden. Geniet van een naadloze onboarding zonder extra inlogschermen na registratie, en beheer je profiel sneller dan ooit met geïntegreerde ondersteuning voor imageurlgenerator.com links!",
    date: "2026-05-21",
    category: "Grote Update",
    version: "v2.1.0",
    readTime: "3 min leestijd",
    author: "FTJM Core Team"
  },
  {
    id: 6,
    title: "Nieuwe Gebruiksvoorwaarden (ToS)",
    content: "We hebben onze Gebruiksvoorwaarden bijgewerkt. Belangrijk om te weten: de eigenaar is niet verantwoordelijk voor het gedrag of de uitingen van gebruikers op dit platform. Elke gebruiker draagt zelf de volledige verantwoordelijkheid voor hun acties en geplaatste inhoud. Lees de volledige voorwaarden op de voorpagina.",
    date: "2026-04-15",
    category: "Regels & Beleid",
    readTime: "2 min leestijd",
    author: "Juridische Zaken"
  },
  {
    id: 5,
    title: "FTJM Forum Update v1.7.9.6",
    content: "In deze update hebben we de synchronisatie van geluidsinstellingen verbeterd. Oude instellingen worden nu automatisch opgeschoond en gemigreerd naar het nieuwe formaat om conflicten te voorkomen. Ook zijn de standaard geluiden bijgewerkt naar de nieuwe image2url links.",
    date: "2026-04-14",
    category: "Platform & UI",
    version: "v1.7.9.6",
    readTime: "2 min leestijd",
    author: "Platform Engineering"
  },
  {
    id: 4,
    title: "FTJM Forum Update v1.7.9.05",
    content: "In deze tussentijdse update hebben we diverse kritieke bugs opgelost die door de community zijn gemeld. Fixes: [MSG-01] Profielfoto's in chat header laden nu correct. [NOT-02] Meldingen voor gemiste berichten worden nu correct weergegeven. [UI-05] Dropdown menu z-index bug opgelost. [SYS-08] Berichtenlijst synchronisatie verbeterd. [NAV-03] Nieuwe visuele indicators voor menu en nieuws toegevoegd.",
    date: "2026-04-11",
    category: "Platform & UI",
    version: "v1.7.9.05",
    readTime: "2 min leestijd",
    author: "Platform Engineering"
  },
  {
    id: 1,
    title: "FTJM Forum Update v1.7.9",
    content: "We hebben zojuist versie 1.7.9 uitgerold. In deze update hebben we het rapportage-systeem verbeterd, de beveiliging aangescherpt met menselijke verificatie en diverse bugfixes doorgevoerd voor een stabielere ervaring.",
    date: "2026-04-10",
    category: "Platform & UI",
    version: "v1.7.9",
    readTime: "2 min leestijd",
    author: "Platform Engineering"
  },
  {
    id: 2,
    title: "Nieuwe Huisregels",
    content: "Zorg ervoor dat je de bijgewerkte huisregels leest in de instellingen sectie om een veilige en respectvolle omgeving voor iedereen te behouden. Respecteer elkaars privacy en vermijd spam.",
    date: "2026-04-07",
    category: "Regels & Beleid",
    readTime: "1 min leestijd",
    author: "Community Moderatie"
  },
  {
    id: 3,
    title: "Community Spotlight: Onze Meest Actieve Leden",
    content: "Deze week zetten we onze meest actieve forumleden in het zonnetje. Bedankt voor jullie waardevolle bijdragen, constructieve feedback en het levendig houden van de chat!",
    date: "2026-04-05",
    category: "Community",
    readTime: "2 min leestijd",
    author: "Community Moderatie"
  }
];

export const SOUND_OPTIONS = [
  { name: 'Fears to Fathom (Standaard)', url: '/audio/sounds/fears-to-fathom-notification-sound.mp3' },
  { name: 'Melding Chime', url: '/audio/sounds/notification_o14egLP.mp3' },
  { name: '007 Text Message', url: '/audio/sounds/007_Text_Message-3875438.mp3' },
  { name: 'Melding Tone', url: '/audio/sounds/yt1s_nijLeKo.mp3' },
  { name: 'Hangouts', url: '/audio/sounds/hangouts-message_vevolTt.mp3' },
  { name: 'Siri', url: '/audio/sounds/siri-message-ringtonesms-tone-hd.mp3' },
  { name: 'Classic MSN', url: '/audio/sounds/new-message-2002-2005.mp3' },
  { name: 'Message 2', url: '/audio/sounds/message_2.mp3' },
  { name: 'Bad To The Bone', url: '/audio/sounds/bad-to-the-bone-meme.mp3' },
  { name: 'Dexter Sound', url: '/audio/sounds/dexter-meme.mp3' },
  { name: 'Goofy Ahh', url: '/audio/sounds/goofy-ahh-ringtone.mp3' },
];

export const RINGTONE_OPTIONS = [
  { name: 'Skype Ringtone (New)', url: '/audio/ringtones/skype_ringtone_new.mp3' },
  { name: 'iPhone Ringtone Remix', url: '/audio/ringtones/iphone-ringtone-remix.mp3' },
  { name: 'iPhone Trap Remix', url: '/audio/ringtones/iphone_ringtone_trap_remixbigconverter.mp3' },
  { name: 'iPhone Reflection', url: '/audio/ringtones/iphone-reflection-ringtone.mp3' },
  { name: 'Dexter Ringtone', url: '/audio/ringtones/dexter-meme.mp3' },
  { name: 'Outro Song', url: '/audio/ringtones/outro-song_oqu8zAg.mp3' },
  { name: 'Samsung Chime', url: '/audio/ringtones/samsung-chime-ringtone.mp3' },
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
  'hamzaaljaradsyria963@gmail.com',
  'zwedenguy@gmail.com'
];

export interface VerifiedBadgeConfig {
  isVerified: boolean;
  bgClass: string;
  glowClass: string;
  title: string;
  badgeType: 'marko' | 'hamza' | 'default';
  iconClass: string;
}

export const getVerifiedBadgeConfig = (
  emailOrProfile?: string | { email?: string | null; is_verified?: boolean | null } | null,
  isVerifiedCol?: boolean | null
): VerifiedBadgeConfig => {
  const verified = isVerifiedEmail(emailOrProfile, isVerifiedCol);
  if (!verified) {
    return {
      isVerified: false,
      bgClass: '',
      glowClass: '',
      title: '',
      badgeType: 'default',
      iconClass: ''
    };
  }

  let email = '';
  if (typeof emailOrProfile === 'string') {
    email = emailOrProfile.toLowerCase().trim();
  } else if (emailOrProfile && typeof emailOrProfile === 'object' && emailOrProfile.email) {
    email = emailOrProfile.email.toLowerCase().trim();
  }

  // Hamza: custom verified badge with a distinct radiant gold/amber color
  if (email === 'hamzaaljaradsyria963@gmail.com') {
    return {
      isVerified: true,
      bgClass: 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black shadow-[0_0_10px_rgba(245,158,11,0.65)] border border-amber-300/40',
      glowClass: '',
      title: 'Geverifieerd Account (Hamza)',
      badgeType: 'hamza',
      iconClass: 'text-slate-950'
    };
  }

  // Marko: creator/admin cyan badge
  if (email === 'markohoksen@gmail.com') {
    return {
      isVerified: true,
      bgClass: 'bg-cyan-500 text-white shadow-[0_0_8px_rgba(6,182,212,0.6)]',
      glowClass: '',
      title: 'Geverifieerd Account (Marko)',
      badgeType: 'marko',
      iconClass: 'text-white'
    };
  }

  // Default verified badge (Cyan)
  return {
    isVerified: true,
    bgClass: 'bg-cyan-500 text-white shadow-[0_0_8px_rgba(6,182,212,0.5)]',
    glowClass: '',
    title: 'Geverifieerd Account',
    badgeType: 'default',
    iconClass: 'text-white'
  };
};

export const BETA_TESTER_EMAILS = [
  'samleeuw803@gmail.com'
];

export const DEVELOPER_EMAILS = [
  'markohoksen@gmail.com'
];

export const isDeveloper = (
  userOrEmail?: string | { email?: string | null; role?: string | null; display_name?: string | null; username?: string | null } | null
): boolean => {
  if (!userOrEmail) return false;
  if (typeof userOrEmail === 'object') {
    if (userOrEmail.email && DEVELOPER_EMAILS.includes(userOrEmail.email.toLowerCase().trim())) {
      return true;
    }
    const name = (userOrEmail.display_name || (userOrEmail as any).name || (userOrEmail as any).username || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (name === 'markohoksen') {
      return true;
    }
    return false;
  }
  const str = userOrEmail.toLowerCase().trim();
  if (DEVELOPER_EMAILS.includes(str)) return true;
  if (str.replace(/[^a-z0-9]/g, '') === 'markohoksen') return true;
  return false;
};

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


