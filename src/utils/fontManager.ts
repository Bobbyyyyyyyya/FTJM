import { CustomFontItem, CustomTheme } from '../types';

/**
 * Curated Preset Fonts for FTJM Forum Custom Theme
 * High quality, modern web fonts loaded on demand
 */
export const PRESET_FONTS: CustomFontItem[] = [
  // --- Modern Sans-Serif ---
  {
    id: 'sans',
    name: 'Standaard Normaal (Inter)',
    family: '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    source: 'preset',
    category: 'sans',
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
  },
  {
    id: 'inter',
    name: 'Inter',
    family: '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    source: 'preset',
    category: 'sans',
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
  },
  {
    id: 'plus_jakarta',
    name: 'Plus Jakarta Sans',
    family: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
    source: 'preset',
    category: 'sans',
    url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
  },
  {
    id: 'poppins',
    name: 'Poppins',
    family: '"Poppins", sans-serif',
    source: 'preset',
    category: 'sans',
    url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap'
  },
  {
    id: 'outfit',
    name: 'Outfit',
    family: '"Outfit", sans-serif',
    source: 'preset',
    category: 'sans',
    url: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap'
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    family: '"Montserrat", sans-serif',
    source: 'preset',
    category: 'sans',
    url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap'
  },
  {
    id: 'roboto',
    name: 'Roboto',
    family: '"Roboto", sans-serif',
    source: 'preset',
    category: 'sans',
    url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap'
  },
  {
    id: 'nunito',
    name: 'Nunito',
    family: '"Nunito", sans-serif',
    source: 'preset',
    category: 'sans',
    url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap'
  },

  // --- Editorial & Serif ---
  {
    id: 'playfair',
    name: 'Playfair Display',
    family: '"Playfair Display", Georgia, serif',
    source: 'preset',
    category: 'serif',
    url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,400&display=swap'
  },
  {
    id: 'cinzel',
    name: 'Cinzel (Regal)',
    family: '"Cinzel", serif',
    source: 'preset',
    category: 'serif',
    url: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&display=swap'
  },
  {
    id: 'merriweather',
    name: 'Merriweather',
    family: '"Merriweather", serif',
    source: 'preset',
    category: 'serif',
    url: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap'
  },
  {
    id: 'lora',
    name: 'Lora',
    family: '"Lora", serif',
    source: 'preset',
    category: 'serif',
    url: 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,700;1,400&display=swap'
  },
  {
    id: 'eb_garamond',
    name: 'EB Garamond',
    family: '"EB Garamond", Georgia, serif',
    source: 'preset',
    category: 'serif',
    url: 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,500;0,700;1,500&display=swap'
  },

  // --- Monospace & Code ---
  {
    id: 'jetbrains',
    name: 'JetBrains Mono',
    family: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
    source: 'preset',
    category: 'mono',
    url: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap'
  },
  {
    id: 'fira_code',
    name: 'Fira Code',
    family: '"Fira Code", monospace',
    source: 'preset',
    category: 'mono',
    url: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&display=swap'
  },
  {
    id: 'space_mono',
    name: 'Space Mono',
    family: '"Space Mono", monospace',
    source: 'preset',
    category: 'mono',
    url: 'https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap'
  },
  {
    id: 'courier_prime',
    name: 'Courier Prime',
    family: '"Courier Prime", monospace',
    source: 'preset',
    category: 'mono',
    url: 'https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap'
  },

  // --- Display & Futuristic ---
  {
    id: 'space_grotesk',
    name: 'Space Grotesk',
    family: '"Space Grotesk", sans-serif',
    source: 'preset',
    category: 'display',
    url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap'
  },
  {
    id: 'orbitron',
    name: 'Orbitron (Cyberpunk)',
    family: '"Orbitron", sans-serif',
    source: 'preset',
    category: 'display',
    url: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&display=swap'
  },
  {
    id: 'syne',
    name: 'Syne (Avant-Garde)',
    family: '"Syne", sans-serif',
    source: 'preset',
    category: 'display',
    url: 'https://fonts.googleapis.com/css2?family=Syne:wght@500;700;800&display=swap'
  },
  {
    id: 'bebas_neue',
    name: 'Bebas Neue (Poster)',
    family: '"Bebas Neue", sans-serif',
    source: 'preset',
    category: 'display',
    url: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap'
  },
  {
    id: 'comfortaa',
    name: 'Comfortaa (Rounded)',
    family: '"Comfortaa", cursive',
    source: 'preset',
    category: 'display',
    url: 'https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;600;700&display=swap'
  },
  {
    id: 'audiowide',
    name: 'Audiowide (Synthwave)',
    family: '"Audiowide", cursive',
    source: 'preset',
    category: 'display',
    url: 'https://fonts.googleapis.com/css2?family=Audiowide&display=swap'
  },
  {
    id: 'rajdhani',
    name: 'Rajdhani (Mecha)',
    family: '"Rajdhani", sans-serif',
    source: 'preset',
    category: 'display',
    url: 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap'
  },

  // --- Retro & Gaming ---
  {
    id: 'press_start',
    name: 'Press Start 2P (8-Bit)',
    family: '"Press Start 2P", monospace',
    source: 'preset',
    category: 'retro',
    url: 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'
  },
  {
    id: 'silkscreen',
    name: 'Silkscreen (Pixel)',
    family: '"Silkscreen", monospace',
    source: 'preset',
    category: 'retro',
    url: 'https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&display=swap'
  },
  {
    id: 'pixelify',
    name: 'Pixelify Sans',
    family: '"Pixelify Sans", sans-serif',
    source: 'preset',
    category: 'retro',
    url: 'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@500;700&display=swap'
  },
  {
    id: 'vt323',
    name: 'VT323 (Terminal CRT)',
    family: '"VT323", monospace',
    source: 'preset',
    category: 'retro',
    url: 'https://fonts.googleapis.com/css2?family=VT323&display=swap'
  },

  // --- Handwritten & Script ---
  {
    id: 'caveat',
    name: 'Caveat (Handwritten)',
    family: '"Caveat", cursive',
    source: 'preset',
    category: 'script',
    url: 'https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap'
  },
  {
    id: 'dancing_script',
    name: 'Dancing Script',
    family: '"Dancing Script", cursive',
    source: 'preset',
    category: 'script',
    url: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;700&display=swap'
  },
  {
    id: 'pacifico',
    name: 'Pacifico',
    family: '"Pacifico", cursive',
    source: 'preset',
    category: 'script',
    url: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap'
  }
];

// In-memory cache of loaded stylesheet URLs
const loadedFontUrls = new Set<string>();

/**
 * Dynamically injects Google Font link tag if not already injected
 */
export const injectGoogleFont = (url: string) => {
  if (!url || typeof document === 'undefined') return;
  if (loadedFontUrls.has(url)) return;

  const existing = document.querySelector(`link[data-custom-font-url="${encodeURIComponent(url)}"]`);
  if (existing) {
    loadedFontUrls.add(url);
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  link.setAttribute('data-custom-font-url', encodeURIComponent(url));
  document.head.appendChild(link);
  loadedFontUrls.add(url);
};

/**
 * Helper to extract pure single font family name without quotes or fallbacks for @font-face
 */
export const getPureFamilyName = (family: string): string => {
  if (!family) return 'Inter';
  const firstPart = family.split(',')[0].trim();
  return firstPart.replace(/^["']|["']$/g, '').trim();
};

/**
 * Storage key for user uploaded / custom imported fonts in LocalStorage
 */
const LOCAL_FONTS_STORAGE_KEY = 'ftjm_local_custom_fonts';

/**
 * Retrieve all custom fonts saved locally by the user
 */
export const getLocalCustomFonts = (): CustomFontItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_FONTS_STORAGE_KEY) || (window as any).localStorage?.getItem(LOCAL_FONTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load local custom fonts:', e);
    return [];
  }
};

/**
 * Injects a global <style id="ftjm-custom-fonts-style"> containing all user uploaded fonts
 * and registers them via FontFace API if supported
 */
export const applyAllLocalCustomFontFaceStyles = () => {
  if (typeof document === 'undefined') return;

  const localFonts = getLocalCustomFonts();
  let styleEl = document.getElementById('ftjm-custom-fonts-style') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'ftjm-custom-fonts-style';
    document.head.appendChild(styleEl);
  }

  let cssRules = '';
  localFonts.forEach(font => {
    if (font.fontData && font.family) {
      const pureName = getPureFamilyName(font.family);
      const formatStr = font.format ? ` format('${font.format}')` : '';
      cssRules += `
@font-face {
  font-family: "${pureName}";
  src: url("${font.fontData}")${formatStr};
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
`;
      // Also register via FontFace API for instant availability
      try {
        if (typeof FontFace !== 'undefined' && 'fonts' in document) {
          const fontFace = new FontFace(pureName, `url("${font.fontData}")`);
          fontFace.load().then(loadedFace => {
            (document.fonts as any).add(loadedFace);
          }).catch(e => console.warn('FontFace API load notice:', e));
        }
      } catch (err) {
        // Fallback to stylesheet @font-face
      }
    } else if (font.url) {
      injectGoogleFont(font.url);
    }
  });

  styleEl.textContent = cssRules;
};

/**
 * Save or update a custom font in LocalStorage and inject its @font-face style
 */
export const saveLocalCustomFont = (font: CustomFontItem): CustomFontItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getLocalCustomFonts();
    const filtered = existing.filter(f => f.id !== font.id && f.family !== font.family);
    const updated = [font, ...filtered];
    localStorage.setItem(LOCAL_FONTS_STORAGE_KEY, JSON.stringify(updated));
    
    // Immediately inject @font-face definition
    applyAllLocalCustomFontFaceStyles();
    return updated;
  } catch (e) {
    console.error('Failed to save custom font:', e);
    return getLocalCustomFonts();
  }
};

/**
 * Delete a custom imported font from LocalStorage
 */
export const deleteLocalCustomFont = (fontId: string): CustomFontItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getLocalCustomFonts();
    const updated = existing.filter(f => f.id !== fontId);
    localStorage.setItem(LOCAL_FONTS_STORAGE_KEY, JSON.stringify(updated));
    applyAllLocalCustomFontFaceStyles();
    return updated;
  } catch (e) {
    console.error('Failed to delete custom font:', e);
    return getLocalCustomFonts();
  }
};

/**
 * Reads an uploaded file (.ttf, .otf, .woff, .woff2) and returns a CustomFontItem with base64 Data URL
 */
export const processUploadedFontFile = async (file: File): Promise<CustomFontItem> => {
  const allowedExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
  const fileName = file.name;
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    throw new Error(`Niet-ondersteund lettertypeformaat (${ext}). Gebruik .ttf, .otf, .woff of .woff2`);
  }

  // Max 8MB font file size check to avoid excessive storage usage
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Lettertypebestand is groter dan 8MB. Kies een geoptimaliseerd fontbestand.');
  }

  let format: CustomFontItem['format'] = 'truetype';
  if (ext === '.otf') format = 'opentype';
  else if (ext === '.woff') format = 'woff';
  else if (ext === '.woff2') format = 'woff2';

  // Derive a clean display name and font family
  const baseName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const cleanName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
  const cleanFamily = `Custom_${cleanName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now().toString(36)}`;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const fontData = reader.result as string;
        const fontItem: CustomFontItem = {
          id: `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: cleanName,
          family: `"${cleanFamily}", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`,
          source: 'upload',
          fontData,
          format,
          category: 'custom',
          createdAt: new Date().toISOString(),
          fileSize: file.size
        };

        // Also register via FontFace API if supported
        try {
          if (typeof FontFace !== 'undefined' && 'fonts' in document) {
            const fontFace = new FontFace(cleanFamily, `url("${fontData}")`);
            const loadedFace = await fontFace.load();
            (document.fonts as any).add(loadedFace);
          }
        } catch (err) {
          console.warn('FontFace API registration fallback:', err);
        }

        saveLocalCustomFont(fontItem);
        resolve(fontItem);
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Kon het lettertypebestand niet inlezen.'));
    reader.readAsDataURL(file);
  });
};

/**
 * Creates a custom font item from a Google Font name or URL
 */
export const createGoogleFontItem = (input: string): CustomFontItem => {
  let fontName = input.trim();
  let url = '';

  if (input.includes('fonts.googleapis.com')) {
    // Extract family from URL
    try {
      const parsedUrl = new URL(input);
      const familyParam = parsedUrl.searchParams.get('family');
      if (familyParam) {
        fontName = familyParam.split(':')[0].replace(/\+/g, ' ');
        url = input;
      } else {
        url = input;
      }
    } catch {
      url = input;
    }
  } else {
    // Generate clean Google Fonts URL from name
    const encoded = encodeURIComponent(fontName.replace(/\s+/g, '+'));
    url = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700;800&display=swap`;
  }

  const cleanFamily = `"${fontName}", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
  const fontItem: CustomFontItem = {
    id: `google_${fontName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    name: fontName,
    family: cleanFamily,
    source: 'google',
    url,
    category: 'custom',
    createdAt: new Date().toISOString()
  };

  injectGoogleFont(url);
  saveLocalCustomFont(fontItem);
  return fontItem;
};

// Normal clean default font string
export const NORMAL_DEFAULT_FONT = '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/**
 * Resolves the CSS font-family string from any font ID or preset or custom uploaded font
 */
export const resolveFontFamilyString = (fontIdOrFamily?: string, customFontsList?: CustomFontItem[]): string => {
  if (!fontIdOrFamily || fontIdOrFamily === 'sans' || fontIdOrFamily === 'default' || fontIdOrFamily === 'normal' || fontIdOrFamily === 'inter') {
    return NORMAL_DEFAULT_FONT;
  }

  // 1. Check user custom fonts FIRST (so local uploaded/imported fonts have top priority)
  const userFonts = customFontsList && customFontsList.length > 0 ? customFontsList : getLocalCustomFonts();
  const custom = userFonts.find(f => 
    f.id === fontIdOrFamily || 
    f.family === fontIdOrFamily || 
    f.name.toLowerCase() === fontIdOrFamily.toLowerCase()
  );
  if (custom) {
    if (custom.url) injectGoogleFont(custom.url);
    applyAllLocalCustomFontFaceStyles();
    const pureName = getPureFamilyName(custom.family);
    return `"${pureName}", ${NORMAL_DEFAULT_FONT}`;
  }

  // 2. Check legacy aliases
  if (fontIdOrFamily === 'serif') return 'ui-serif, Georgia, "Playfair Display", serif';
  if (fontIdOrFamily === 'mono') return '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace';
  if (fontIdOrFamily === 'display') return '"Plus Jakarta Sans", "Space Grotesk", sans-serif';

  // 3. Check built-in preset fonts
  const preset = PRESET_FONTS.find(f => f.id === fontIdOrFamily || f.name.toLowerCase() === fontIdOrFamily.toLowerCase());
  if (preset) {
    if (preset.url) injectGoogleFont(preset.url);
    return preset.family;
  }

  // 4. Fallback if user passed raw font family string directly
  if (fontIdOrFamily.includes(',') || fontIdOrFamily.startsWith('"')) {
    return fontIdOrFamily;
  }

  return `"${fontIdOrFamily}", ${NORMAL_DEFAULT_FONT}`;
};

/**
 * Primary Engine: Applies custom font to CSS variables and document body
 */
export const applyThemeFont = (customTheme?: CustomTheme) => {
  if (typeof document === 'undefined') return;

  // Make sure all user local fonts are registered in <style>
  applyAllLocalCustomFontFaceStyles();

  const fontChoice = customTheme?.font_family;
  const customFontsList = customTheme?.custom_fonts && customTheme.custom_fonts.length > 0
    ? customTheme.custom_fonts
    : getLocalCustomFonts();
  const cssFontFamily = resolveFontFamilyString(fontChoice, customFontsList);

  const root = document.documentElement;
  root.style.setProperty('--custom-font', cssFontFamily);
  root.style.setProperty('--font-sans', cssFontFamily);

  // Set directly on body for deep inheritance
  if (document.body) {
    document.body.style.fontFamily = cssFontFamily;
  }
};

// Immediate automatic initialization on script load
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  try {
    applyAllLocalCustomFontFaceStyles();
  } catch (e) {
    console.warn('Auto-init font styles notice:', e);
  }
}
