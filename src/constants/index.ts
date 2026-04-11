export const NEWS_ITEMS = [
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
  { name: 'Standaard (2354)', url: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3' },
  { name: 'Melding (2358)', url: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3' },
  { name: 'Ping (2360)', url: 'https://image2url.com/r2/default/audio/1775756671546-6f36bf87-4347-477b-a2da-1af03009fdcf.mp3' },
  { name: 'Chime (2362)', url: 'https://image2url.com/r2/default/audio/1775756302748-a840da24-e9d3-47a0-9e14-2a582fc0e093.mp3' },
  { name: 'Alert (2364)', url: 'https://image2url.com/r2/default/audio/1775754319337-0525bbd3-8adb-4c26-ae70-842ba5769e7f.wav' },
  { name: 'Success (2366)', url: 'https://assets.mixkit.co/active_storage/sfx/2366/2366-preview.mp3' },
  { name: 'Notification (2368)', url: 'https://image2url.com/r2/default/audio/1775755636867-f3aa78d1-03e7-48c2-b75a-a5f990f517e9.mp3' },
  { name: 'Pop (2370)', url: 'https://image2url.com/r2/default/audio/1775755973661-157bd979-8f6e-4d86-9e32-74761db166d9.mp3' },
  { name: 'Bling (2372)', url: 'https://assets.mixkit.co/active_storage/sfx/2372/2372-preview.mp3' },
];

export const PATTERNS = [
  { id: 'none', name: 'Geen', style: '' },
  { id: 'dots', name: 'Stippen', style: 'radial-gradient(var(--custom-accent) 1px, transparent 1px)', size: '20px 20px' },
  { id: 'grid', name: 'Raster', style: 'linear-gradient(var(--custom-accent) 1px, transparent 1px), linear-gradient(90deg, var(--custom-accent) 1px, transparent 1px)', size: '20px 20px' },
  { id: 'stripes', name: 'Strepen', style: 'linear-gradient(45deg, var(--custom-accent) 25%, transparent 25%, transparent 50%, var(--custom-accent) 50%, var(--custom-accent) 75%, transparent 75%, transparent)', size: '20px 20px' },
  { id: 'waves', name: 'Golven', style: 'radial-gradient(circle at 100% 50%, transparent 20%, var(--custom-accent) 21%, var(--custom-accent) 34%, transparent 35%, transparent), radial-gradient(circle at 0% 50%, transparent 20%, var(--custom-accent) 21%, var(--custom-accent) 34%, transparent 35%, transparent)', size: '40px 40px' },
  { id: 'diagonal', name: 'Diagonaal', style: 'repeating-linear-gradient(45deg, transparent, transparent 10px, var(--custom-accent) 10px, var(--custom-accent) 11px)', size: 'auto' },
];
