export interface Upgrade {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  type: 'click' | 'tps' | 'building' | 'crit' | 'synergy' | 'kitten';
  multiplier: number;
  buildingId?: string;
  synergyBuildingId?: string;
  description: string;
  purchased: boolean;
  requiredTreats: number;
  requiredBuildingId?: string;
  requiredBuildingCount?: number;
}

export const INITIAL_UPGRADES: Upgrade[] = [
  // --- KLIK UPGRADES (Diverse multipliers, geen eentonige +100%) ---
  { id: 'sharp_claws_1', name: 'Scherpere Nageltjes', emoji: '💅', cost: 100, type: 'click', multiplier: 1.5, description: 'Versterkt je nageltjes: +50% brokjes per klik.', purchased: false, requiredTreats: 50 },
  { id: 'sharp_claws_2', name: 'Diamanten Klauwtjes', emoji: '💎', cost: 1000, type: 'click', multiplier: 1.75, description: 'Scherpe diamanten puntjes: +75% extra klikkracht!', purchased: false, requiredTreats: 500 },
  { id: 'salmon_treats', name: 'Gourmet Zalm Snacks', emoji: '🍪', cost: 25000, type: 'click', multiplier: 1.8, description: 'Heerlijke Noorse zalmsnacks: +80% sterkere aaikliks!', purchased: false, requiredTreats: 15000 },
  { id: 'crit_claws', name: 'Gelukkige Kattenpoot', emoji: '🍀', cost: 150000, type: 'crit', multiplier: 3.5, description: '15% kans op een Kritieke Meow Klik (3.5x brokjeswaarde)!', purchased: false, requiredTreats: 100000 },
  { id: 'cat_massage', name: 'Shiatsu Kattenmassage', emoji: '💆', cost: 500000, type: 'click', multiplier: 2.2, description: 'Shiatsu massage kalmeert de kat diep: +120% klikkracht!', purchased: false, requiredTreats: 300000 },
  { id: 'quantum_click', name: 'Quantum Klik', emoji: '⚛️', cost: 5000000000000, type: 'click', multiplier: 2.5, description: 'Manipulatie van tijd en ruimte: 2.5x (+150%) klikkracht!', purchased: false, requiredTreats: 3000000000000 },
  { id: 'god_finger', name: 'Goddelijke Aaiende Vinger', emoji: '👆', cost: 100000000000000000, type: 'click', multiplier: 3.0, description: 'Goddelijke aanraking: 3x (+200%) permanente klikkracht!', purchased: false, requiredTreats: 50000000000000000 },
  { id: 'cosmic_claw', name: 'Kosmische Superklauw', emoji: '🌌', cost: 1000000000000000000000, type: 'click', multiplier: 3.5, description: 'Een klauw gesmeed uit sterrenstof: 3.5x (+250%) klikkracht!', purchased: false, requiredTreats: 500000000000000000000 },

  // --- GLOBALE PRODUCTIE (TPS) ---
  { id: 'box_paradise', name: 'Kartonnen Dozen Hemel', emoji: '📦', cost: 10000, type: 'tps', multiplier: 1.15, description: 'Alle katten zijn dol op dozen! +15% totale brokjesproductie.', purchased: false, requiredTreats: 6000 },
  { id: 'gold_bowl', name: 'Gouden Eetbakjes', emoji: '🥣', cost: 600000, type: 'tps', multiplier: 1.12, description: '+12% permanente bonus op alle passieve brokjesproductie.', purchased: false, requiredTreats: 400000 },
  { id: 'galaxy_collar', name: 'Kosmische Halsband', emoji: '🪐', cost: 150000000, type: 'tps', multiplier: 1.25, description: 'Kosmische Halsband straalt harmonie uit: +25% totale brokjesproductie.', purchased: false, requiredTreats: 100000000 },
  { id: 'cat_aura', name: 'Harmonieuze Meow-Aura', emoji: '✨', cost: 5000000000, type: 'tps', multiplier: 1.20, description: 'Een rustgevende meow-frequentie: +20% totale brokjesproductie.', purchased: false, requiredTreats: 3000000000 },
  { id: 'multiverse_cat', name: 'Kosmische Meow Transcendentie', emoji: '🌠', cost: 25000000000000000, type: 'tps', multiplier: 1.35, description: '+35% totale brokjesproductie van alle wezens in het multiversum!', purchased: false, requiredTreats: 15000000000000000 },
  { id: 'infinite_purr', name: 'Eeuwige Spinnende Resonantie', emoji: '🌟', cost: 10000000000000000000000, type: 'tps', multiplier: 1.45, description: 'De kosmos spint synchroon: +45% brokjesproductie overal.', purchased: false, requiredTreats: 5000000000000000000000 },

  // --- KITTEN HELPERS (Kitten Upgrades schalen met behaalde trofeeën - Cookie Clicker mechanic) ---
  { id: 'kitten_helpers', name: 'Kitten Hulpjes', emoji: '🐱', cost: 9000000, type: 'kitten', multiplier: 0.005, description: 'Kleine kittens helpen mee: +0.5% globale TPS per behaalde trofee!', purchased: false, requiredTreats: 5000000 },
  { id: 'kitten_workers', name: 'Kitten Arbeiders', emoji: '👷', cost: 900000000, type: 'kitten', multiplier: 0.008, description: 'Hardwerkende kittens: +0.8% globale TPS per behaalde trofee!', purchased: false, requiredTreats: 500000000 },
  { id: 'kitten_engineers', name: 'Kitten Ingenieurs', emoji: '🔬', cost: 90000000000, type: 'kitten', multiplier: 0.010, description: 'Geleerde katten: +1.0% globale TPS per behaalde trofee!', purchased: false, requiredTreats: 50000000000 },
  { id: 'kitten_overseers', name: 'Kitten Opzichters', emoji: '📋', cost: 9000000000000, type: 'kitten', multiplier: 0.012, description: 'Strenge maar lieve opzichters: +1.2% globale TPS per behaalde trofee!', purchased: false, requiredTreats: 5000000000000 },
  { id: 'kitten_managers', name: 'Kitten Managers', emoji: '💼', cost: 900000000000000, type: 'kitten', multiplier: 0.015, description: 'Katten in maatpak: +1.5% globale TPS per behaalde trofee!', purchased: false, requiredTreats: 500000000000000 },
  { id: 'kitten_angels', name: 'Kitten Engelen', emoji: '👼', cost: 90000000000000000, type: 'kitten', multiplier: 0.020, description: 'Hemelse gidsen: +2.0% globale TPS per behaalde trofee!', purchased: false, requiredTreats: 50000000000000000 },

  // --- SYNERGY UPGRADES (Gebouwen stimuleren elkaar) ---
  { id: 'synergy_farm_post', name: 'Klimkruid Harmonie', emoji: '🌿', cost: 500000, type: 'synergy', multiplier: 0.01, buildingId: 'scratching_post', synergyBuildingId: 'catnip_garden', description: 'Krabpalen krijgen +1% TPS per bezeten Kattenkruid Tuin.', purchased: false, requiredTreats: 300000 },
  { id: 'synergy_factory_milk', name: 'Zuivel Fabriekslijn', emoji: '🍶', cost: 20000000, type: 'synergy', multiplier: 0.01, buildingId: 'kibble_factory', synergyBuildingId: 'milk_bar', description: 'Visbrokjes Fabrieken krijgen +1% TPS per bezeten Romige Melk Bar.', purchased: false, requiredTreats: 15000000 },
  { id: 'synergy_temple_mines', name: 'Heilige Mijnwerkers', emoji: '🏛️', cost: 50000000000, type: 'synergy', multiplier: 0.01, buildingId: 'fish_mine', synergyBuildingId: 'cat_temple', description: 'Gouden Vismijnen krijgen +1% TPS per bezeten Katten Tempel.', purchased: false, requiredTreats: 30000000000 },
  { id: 'synergy_space_alien', name: 'Interstellaire Alliantie', emoji: '🛸', cost: 3000000000000, type: 'synergy', multiplier: 0.01, buildingId: 'space_station', synergyBuildingId: 'alien_cat', description: 'Kosmische Kattenstations krijgen +1% TPS per bezeten Buitenaardse Kat.', purchased: false, requiredTreats: 2000000000000 },
  { id: 'synergy_portal_ai', name: 'Quantum Dimensie Relais', emoji: '🌀', cost: 50000000000000, type: 'synergy', multiplier: 0.01, buildingId: 'dimension_portal', synergyBuildingId: 'ai_server', description: 'Dimensieportalen krijgen +1% TPS per bezeten Meow A.I. Server.', purchased: false, requiredTreats: 35000000000000 },

  // --- GEBOUWEN MIJLPALEN (10, 25, 50, 100) MET GEVARIEERDE PERCENTAGES ---

  // Kattenpootjes (kitten)
  { id: 'catnip_toys', name: 'Catnip Muisjes', emoji: '🐁', cost: 250, type: 'building', buildingId: 'kitten', multiplier: 1.5, description: 'Kattenpootjes spelen vrolijk met catnip muizen: +50% TPS!', purchased: false, requiredTreats: 50, requiredBuildingId: 'kitten', requiredBuildingCount: 1 },
  { id: 'mitten_gloves', name: 'Zijden Wantjes', emoji: '🧤', cost: 18000, type: 'building', buildingId: 'kitten', multiplier: 1.65, description: 'Zachte fluwelen wantjes: +65% Kattenpootjes opbrengst.', purchased: false, requiredTreats: 10000, requiredBuildingId: 'kitten', requiredBuildingCount: 10 },
  { id: 'kitten_agility', name: 'Kitten Behendigheid', emoji: '⚡', cost: 250000, type: 'building', buildingId: 'kitten', multiplier: 1.75, description: 'Lenige pootjes tikken sneller: +75% Kattenpootjes TPS.', purchased: false, requiredTreats: 150000, requiredBuildingId: 'kitten', requiredBuildingCount: 25 },
  { id: 'kitten_rollers', name: 'Kitten Rolschaatsen', emoji: '🛼', cost: 5000000, type: 'building', buildingId: 'kitten', multiplier: 1.85, description: 'Katten op rolschaatsen: +85% Kattenpootjes brokjes.', purchased: false, requiredTreats: 3000000, requiredBuildingId: 'kitten', requiredBuildingCount: 50 },
  { id: 'kitten_wings', name: 'Fluwelen Engelenpootjes', emoji: '🪽', cost: 100000000, type: 'building', buildingId: 'kitten', multiplier: 2.2, description: 'Goddelijke vleugeltjes aan elk pootje: +120% Kattenpootjes opbrengst!', purchased: false, requiredTreats: 60000000, requiredBuildingId: 'kitten', requiredBuildingCount: 100 },

  // Krabpaal Luxe (scratching_post)
  { id: 'cat_tree', name: 'Klimboom XXL', emoji: '🌳', cost: 3000, type: 'building', buildingId: 'scratching_post', multiplier: 1.6, description: 'Hoge klimpalen geven uitzicht: +60% krabpaal brokjes.', purchased: false, requiredTreats: 2000, requiredBuildingId: 'scratching_post', requiredBuildingCount: 1 },
  { id: 'sisal_rope', name: 'Extra Dik Sisaltouw', emoji: '🧶', cost: 45000, type: 'building', buildingId: 'scratching_post', multiplier: 1.7, description: 'Supersterk touw schraapt harder: +70% krabpaal opbrengst.', purchased: false, requiredTreats: 30000, requiredBuildingId: 'scratching_post', requiredBuildingCount: 10 },
  { id: 'scratch_castle', name: 'Krabpaal Kasteel', emoji: '🏰', cost: 650000, type: 'building', buildingId: 'scratching_post', multiplier: 1.8, description: 'Een heus fort van tapijt en hout: +80% krabpaal brokjes.', purchased: false, requiredTreats: 400000, requiredBuildingId: 'scratching_post', requiredBuildingCount: 25 },
  { id: 'scratch_skyscraper', name: 'Krab Wolkenkrabber', emoji: '🏙️', cost: 15000000, type: 'building', buildingId: 'scratching_post', multiplier: 1.9, description: 'Torenhoge verdiepingen vol krabstof: +90% krabpaal opbrengst.', purchased: false, requiredTreats: 10000000, requiredBuildingId: 'scratching_post', requiredBuildingCount: 50 },
  { id: 'titanium_post', name: 'Titanium Krabzuil', emoji: '🛡️', cost: 350000000, type: 'building', buildingId: 'scratching_post', multiplier: 2.3, description: 'Onverwoestbare zuilen schrapen non-stop: +130% krabpaal brokjes!', purchased: false, requiredTreats: 200000000, requiredBuildingId: 'scratching_post', requiredBuildingCount: 100 },

  // Kattenkruid Tuin (catnip_garden)
  { id: 'hydroponic_catnip', name: 'Hydroponisch Kattenkruid', emoji: '🧪', cost: 75000, type: 'building', buildingId: 'catnip_garden', multiplier: 1.65, description: 'Voedingsrijke watercultures: +65% oogst voor Kattenkruid Tuinen.', purchased: false, requiredTreats: 50000, requiredBuildingId: 'catnip_garden', requiredBuildingCount: 1 },
  { id: 'organic_fertilizer', name: 'Biologische Catnip Mest', emoji: '🌱', cost: 800000, type: 'building', buildingId: 'catnip_garden', multiplier: 1.75, description: 'Organische mineralen stimuleren bloei: +75% kruidentuin oogst.', purchased: false, requiredTreats: 500000, requiredBuildingId: 'catnip_garden', requiredBuildingCount: 10 },
  { id: 'valerian_extract', name: 'Valeriaan & Munt Extract', emoji: '🌿', cost: 12000000, type: 'building', buildingId: 'catnip_garden', multiplier: 1.85, description: 'Hypnotiserende kruidenmix: +85% Kattenkruid Tuin TPS.', purchased: false, requiredTreats: 8000000, requiredBuildingId: 'catnip_garden', requiredBuildingCount: 25 },
  { id: 'magic_catnip', name: 'Betoverd Meow Kruid', emoji: '✨', cost: 250000000, type: 'building', buildingId: 'catnip_garden', multiplier: 2.1, description: 'Lichtgevend kruid met magische glans: +110% Kattenkruid Tuin opbrengst.', purchased: false, requiredTreats: 150000000, requiredBuildingId: 'catnip_garden', requiredBuildingCount: 50 },

  // Romige Melk Bar (milk_bar)
  { id: 'milk_shake', name: 'Gourmet Kattenmilkshake', emoji: '🥤', cost: 8000000, type: 'building', buildingId: 'milk_bar', multiplier: 1.85, description: 'Romige Melk Bars serveren premium milkshakes: +85% opbrengst!', purchased: false, requiredTreats: 5000000, requiredBuildingId: 'milk_bar', requiredBuildingCount: 1 },
  { id: 'whipped_cream', name: 'Luchtige Slagroom Topping', emoji: '🍦', cost: 65000000, type: 'building', buildingId: 'milk_bar', multiplier: 1.8, description: 'Heerlijk toefje slagroom op elk schoteltje: +80% melk bar brokjes.', purchased: false, requiredTreats: 40000000, requiredBuildingId: 'milk_bar', requiredBuildingCount: 10 },
  { id: 'salmon_smoothie', name: 'Zalm-Melk Smoothie Bar', emoji: '🍶', cost: 950000000, type: 'building', buildingId: 'milk_bar', multiplier: 1.95, description: 'De favoriete cocktail van elke kat: +95% Romige Melk Bar opbrengst.', purchased: false, requiredTreats: 600000000, requiredBuildingId: 'milk_bar', requiredBuildingCount: 25 },
  { id: 'all_you_can_drink', name: 'Onbeperkt Melk Buffet', emoji: '🥛', cost: 15000000000, type: 'building', buildingId: 'milk_bar', multiplier: 2.2, description: 'Fonteinen van pure alpenmelk: +120% Romige Melk Bar TPS!', purchased: false, requiredTreats: 10000000000, requiredBuildingId: 'milk_bar', requiredBuildingCount: 50 },

  // Visbrokjes Fabriek (kibble_factory)
  { id: 'factory_upgrade', name: 'Hyper-Lopende Band', emoji: '⚙️', cost: 1000000, type: 'building', buildingId: 'kibble_factory', multiplier: 1.8, description: 'Geautomatiseerde lopende banden: +80% brokjesfabriek snelheid.', purchased: false, requiredTreats: 800000, requiredBuildingId: 'kibble_factory', requiredBuildingCount: 1 },
  { id: 'steam_turbine', name: 'Stoomturbine Brokjesoven', emoji: '💨', cost: 15000000, type: 'building', buildingId: 'kibble_factory', multiplier: 1.75, description: 'Gelijkmatige hitte bakt knapperige brokjes: +75% fabriek opbrengst.', purchased: false, requiredTreats: 10000000, requiredBuildingId: 'kibble_factory', requiredBuildingCount: 10 },
  { id: 'salmon_injector', name: 'Zalm Olie Injector', emoji: '🍣', cost: 200000000, type: 'building', buildingId: 'kibble_factory', multiplier: 1.85, description: 'Directe injectie van pure omega-3: +85% visbrokjes fabriek TPS.', purchased: false, requiredTreats: 120000000, requiredBuildingId: 'kibble_factory', requiredBuildingCount: 25 },
  { id: 'factory_automation', name: 'AI Lopende Band Robots', emoji: '🤖', cost: 3500000000, type: 'building', buildingId: 'kibble_factory', multiplier: 2.15, description: 'Volledig robotgestuurde fabricagelijn: +115% fabriek productie!', purchased: false, requiredTreats: 2000000000, requiredBuildingId: 'kibble_factory', requiredBuildingCount: 50 },

  // Laser Pointer Bot (laser_robot)
  { id: 'laser_ai', name: 'A.I. Laser Targeting', emoji: '🎯', cost: 2500000, type: 'building', buildingId: 'laser_robot', multiplier: 1.7, description: 'Slimme tracking algoritmes: Laserbots worden +70% effectiever.', purchased: false, requiredTreats: 1800000, requiredBuildingId: 'laser_robot', requiredBuildingCount: 1 },
  { id: 'laser_matrix', name: 'Laser Matrix Satelliet', emoji: '🛰️', cost: 120000000, type: 'building', buildingId: 'laser_robot', multiplier: 1.75, description: 'Satelliet laser-netwerk: Laserbots genereren +75% meer brokjes.', purchased: false, requiredTreats: 80000000, requiredBuildingId: 'laser_robot', requiredBuildingCount: 10 },
  { id: 'kaleidoscope_laser', name: 'Caleidoscopische Laserstralen', emoji: '💎', cost: 1500000000, type: 'building', buildingId: 'laser_robot', multiplier: 1.85, description: 'Tientallen stippen tegelijk laten katten vliegen: +85% laserbot opbrengst.', purchased: false, requiredTreats: 1000000000, requiredBuildingId: 'laser_robot', requiredBuildingCount: 25 },
  { id: 'supernova_laser', name: 'Supernova Laser Beam', emoji: '🔴', cost: 25000000000, type: 'building', buildingId: 'laser_robot', multiplier: 2.25, description: 'Onweerstaanbare rode bundel van kosmische proporties: +125% laserbot TPS!', purchased: false, requiredTreats: 18000000000, requiredBuildingId: 'laser_robot', requiredBuildingCount: 50 },

  // MeowTube Vlogger (cat_vlogger)
  { id: 'vlogger_ringlight', name: 'Premium Ringlight', emoji: '💡', cost: 45000000, type: 'building', buildingId: 'cat_vlogger', multiplier: 1.8, description: 'Kattenvloggers gaan viraal op MeowTube: +80% opbrengst.', purchased: false, requiredTreats: 20000000, requiredBuildingId: 'cat_vlogger', requiredBuildingCount: 1 },
  { id: 'meow_camera_4k', name: 'Ultra HD 8K Meow-Cam', emoji: '📷', cost: 450000000, type: 'building', buildingId: 'cat_vlogger', multiplier: 1.85, description: 'Kristalheldere aaikwaliteit trekt miljoenen abonnees: +85% vlogger TPS.', purchased: false, requiredTreats: 300000000, requiredBuildingId: 'cat_vlogger', requiredBuildingCount: 10 },
  { id: 'vlogger_merch', name: 'Meow Brokjes Merch Store', emoji: '👕', cost: 5000000000, type: 'building', buildingId: 'cat_vlogger', multiplier: 1.95, description: 'Knuffels en truien verkopen razendsnel uit: +95% vlogger brokjes.', purchased: false, requiredTreats: 3500000000, requiredBuildingId: 'cat_vlogger', requiredBuildingCount: 25 },
  { id: 'global_stream', name: 'Wereldwijde Katten Livestream', emoji: '📡', cost: 80000000000, type: 'building', buildingId: 'cat_vlogger', multiplier: 2.2, description: 'Elke huiskamer kijkt non-stop mee: +120% MeowTube Vlogger brokjes!', purchased: false, requiredTreats: 50000000000, requiredBuildingId: 'cat_vlogger', requiredBuildingCount: 50 },

  // Katten Tempel (cat_temple)
  { id: 'holy_catnip', name: 'Heilige Catnip', emoji: '🌿', cost: 800000000, type: 'building', buildingId: 'cat_temple', multiplier: 1.8, description: 'Tempels baden in heilig aroma: +80% kattentempel opbrengst.', purchased: false, requiredTreats: 500000000, requiredBuildingId: 'cat_temple', requiredBuildingCount: 1 },
  { id: 'temple_bells', name: 'Gouden Kattenbellen', emoji: '🔔', cost: 3500000000, type: 'building', buildingId: 'cat_temple', multiplier: 1.9, description: 'Gouden bellen klinken door de kosmos: +90% kattentempel productie.', purchased: false, requiredTreats: 2000000000, requiredBuildingId: 'cat_temple', requiredBuildingCount: 10 },
  { id: 'sphinx_statues', name: 'Monumentale Sfinx Beelden', emoji: '🗿', cost: 40000000000, type: 'building', buildingId: 'cat_temple', multiplier: 2.05, description: 'Eeuwenoude beelden stralen ontzag uit: +105% tempel TPS.', purchased: false, requiredTreats: 25000000000, requiredBuildingId: 'cat_temple', requiredBuildingCount: 25 },
  { id: 'hieroglyph_mysteries', name: 'Verborgen Katten Hiërogliefen', emoji: '📜', cost: 500000000000, type: 'building', buildingId: 'cat_temple', multiplier: 2.3, description: 'Geheime spreuken verhogen de opbrengst: +130% Katten Tempel brokjes!', purchased: false, requiredTreats: 300000000000, requiredBuildingId: 'cat_temple', requiredBuildingCount: 50 },

  // Gouden Vismijn (fish_mine)
  { id: 'pickaxe', name: 'Diamanten Houweel', emoji: '⛏️', cost: 6000000000, type: 'building', buildingId: 'fish_mine', multiplier: 1.7, description: 'Diamanten pikhouwelen delven dieper: +70% Gouden Vismijn opbrengst.', purchased: false, requiredTreats: 4000000000, requiredBuildingId: 'fish_mine', requiredBuildingCount: 1 },
  { id: 'deep_sea_drill', name: 'Diepzee Goudvis Boor', emoji: '🌊', cost: 50000000000, type: 'building', buildingId: 'fish_mine', multiplier: 1.85, description: 'Boort door abyssale zandlagen: +85% vismijn brokjes.', purchased: false, requiredTreats: 35000000000, requiredBuildingId: 'fish_mine', requiredBuildingCount: 10 },
  { id: 'magma_mine', name: 'Magma Visader', emoji: '🌋', cost: 600000000000, type: 'building', buildingId: 'fish_mine', multiplier: 2.0, description: 'Delven in gloeiend hete lagen van vloeibaar goud: +100% vismijn TPS.', purchased: false, requiredTreats: 400000000000, requiredBuildingId: 'fish_mine', requiredBuildingCount: 25 },
  { id: 'core_excavator', name: 'Planeetkern Vis Delver', emoji: '🌐', cost: 8000000000000, type: 'building', buildingId: 'fish_mine', multiplier: 2.3, description: 'Graaft rechtstreeks in het goudvis-hart van de planeet: +130% vismijn opbrengst!', purchased: false, requiredTreats: 5000000000000, requiredBuildingId: 'fish_mine', requiredBuildingCount: 50 },

  // Kosmisch Kattenstation (space_station)
  { id: 'space_fuel', name: 'Vis Olie Brandstof', emoji: '⛽', cost: 120000000000, type: 'building', buildingId: 'space_station', multiplier: 1.8, description: 'Hoogwaardige visoliebrandstof: +80% snelheid voor Kosmische Stations.', purchased: false, requiredTreats: 80000000000, requiredBuildingId: 'space_station', requiredBuildingCount: 1 },
  { id: 'star_telescope', name: 'Stellar Katten Observatorium', emoji: '🔭', cost: 900000000000, type: 'building', buildingId: 'space_station', multiplier: 1.9, description: 'Spoor verre brokjes-nevels op in deep space: +90% station brokjes.', purchased: false, requiredTreats: 600000000000, requiredBuildingId: 'space_station', requiredBuildingCount: 10 },
  { id: 'warp_drive', name: 'Sub-Licht Warp Aandrijving', emoji: '🚀', cost: 10000000000000, type: 'building', buildingId: 'space_station', multiplier: 2.15, description: 'Sneller dan het licht vissen vangen: +115% Kosmisch Station TPS!', purchased: false, requiredTreats: 7000000000000, requiredBuildingId: 'space_station', requiredBuildingCount: 25 },

  // Buitenaardse Kat (alien_cat)
  { id: 'alien_translator', name: 'Meow-Vertaler', emoji: '🗣️', cost: 2000000000000, type: 'building', buildingId: 'alien_cat', multiplier: 1.75, description: 'Naadloze communicatie: +75% opbrengst voor Alien Katten.', purchased: false, requiredTreats: 1000000000000, requiredBuildingId: 'alien_cat', requiredBuildingCount: 1 },
  { id: 'ufo_fleet', name: 'Buitenaardse Vliegende Schotels', emoji: '🛸', cost: 15000000000000, type: 'building', buildingId: 'alien_cat', multiplier: 1.95, description: 'Een armada van schoteltjes vol brokjes: +95% alien katten TPS.', purchased: false, requiredTreats: 10000000000000, requiredBuildingId: 'alien_cat', requiredBuildingCount: 10 },
  { id: 'telepathic_meow', name: 'Galactische Telepathie', emoji: '🧠', cost: 180000000000000, type: 'building', buildingId: 'alien_cat', multiplier: 2.2, description: 'Gedachtenkracht verzamelt brokjes door het sterrenstelsel: +120% alien opbrengst!', purchased: false, requiredTreats: 120000000000000, requiredBuildingId: 'alien_cat', requiredBuildingCount: 25 },

  // Meow Dimensieportaal (dimension_portal)
  { id: 'dimensional_matrix', name: 'Dimensionale Wolbreier', emoji: '🌀', cost: 45000000000000, type: 'building', buildingId: 'dimension_portal', multiplier: 1.85, description: 'Stabiele dimensiescheuren: +85% opbrengst uit parallelle werelden.', purchased: false, requiredTreats: 25000000000000, requiredBuildingId: 'dimension_portal', requiredBuildingCount: 1 },
  { id: 'portal_stabilizer', name: 'Kosmische Portaal Stabilisator', emoji: '🪐', cost: 350000000000000, type: 'building', buildingId: 'dimension_portal', multiplier: 2.05, description: 'Voorkomt dat brokjes verdwijnen in het niets: +105% portaal TPS.', purchased: false, requiredTreats: 200000000000000, requiredBuildingId: 'dimension_portal', requiredBuildingCount: 10 },
  { id: 'infinite_rift', name: 'Oneindige Dimensiescheur', emoji: '🌌', cost: 4000000000000000, type: 'building', buildingId: 'dimension_portal', multiplier: 2.3, description: 'Onuitputtelijke toevoer uit het Kattenmultiversum: +130% portaal opbrengst!', purchased: false, requiredTreats: 2500000000000000, requiredBuildingId: 'dimension_portal', requiredBuildingCount: 25 },

  // Meow A.I. Server (ai_server)
  { id: 'neural_cat_ai', name: 'Neurale Meow Netwerken', emoji: '🧠', cost: 600000000000000, type: 'building', buildingId: 'ai_server', multiplier: 1.9, description: 'Zelflerende Meow-algoritmes: +90% brokjesproductie van A.I. Servers.', purchased: false, requiredTreats: 300000000000000, requiredBuildingId: 'ai_server', requiredBuildingCount: 1 },
  { id: 'quantum_cat_chips', name: 'Quantum Meow Processors', emoji: '💻', cost: 5000000000000000, type: 'building', buildingId: 'ai_server', multiplier: 2.1, description: 'Supergeleidende rekenkracht berekent miljarden brokjes: +110% AI TPS.', purchased: false, requiredTreats: 3000000000000000, requiredBuildingId: 'ai_server', requiredBuildingCount: 10 },
  { id: 'ai_singularity', name: 'Meow Singulariteit Algoritme', emoji: '🤖', cost: 60000000000000000, type: 'building', buildingId: 'ai_server', multiplier: 2.4, description: 'Volledig bewust kattenbrein: +140% A.I. Server opbrengst!', purchased: false, requiredTreats: 40000000000000000, requiredBuildingId: 'ai_server', requiredBuildingCount: 25 },

  // Tijdreizende Kattenmachine (time_machine)
  { id: 'chronos_loop', name: 'Oneindige Katten Tijd-Loop', emoji: '🔁', cost: 5000000000000000, type: 'building', buildingId: 'time_machine', multiplier: 2.0, description: 'Tijdreizende Kattenmachines halen 2x brokjes uit de toekomst!', purchased: false, requiredTreats: 2500000000000000, requiredBuildingId: 'time_machine', requiredBuildingCount: 1 },
  { id: 'wormhole_dial', name: 'Wormgat Wijzerplaat', emoji: '⏳', cost: 45000000000000000, type: 'building', buildingId: 'time_machine', multiplier: 2.2, description: 'Nauwkeurige sprongen naar gouden epoques: +120% tijdreizende brokjes.', purchased: false, requiredTreats: 30000000000000000, requiredBuildingId: 'time_machine', requiredBuildingCount: 10 },
  { id: 'primeval_cat_era', name: 'Oer-Katten Eeuw Poort', emoji: '🦕', cost: 500000000000000000, type: 'building', buildingId: 'time_machine', multiplier: 2.5, description: 'Oogst brokjes uit het tijdperk van de sabeltandtijgers: +150% machine TPS!', purchased: false, requiredTreats: 350000000000000000, requiredBuildingId: 'time_machine', requiredBuildingCount: 25 },

  // Antimaterie Kattenstraler (antimatter_laser)
  { id: 'antiproton_accelerator', name: 'Antiprotonen Versneller', emoji: '⚛️', cost: 150000000000000000, type: 'building', buildingId: 'antimatter_laser', multiplier: 2.1, description: 'Botst deeltjes om pure zalmsmaken te synthetiseren: +110% opbrengst!', purchased: false, requiredTreats: 100000000000000000, requiredBuildingId: 'antimatter_laser', requiredBuildingCount: 1 },
  { id: 'blackhole_trap', name: 'Mini-Zwartgat Kattenval', emoji: '🕳️', cost: 2000000000000000000, type: 'building', buildingId: 'antimatter_laser', multiplier: 2.35, description: 'Zwaartekracht trekt overal brokjes naartoe: +135% antimaterie TPS.', purchased: false, requiredTreats: 1500000000000000000, requiredBuildingId: 'antimatter_laser', requiredBuildingCount: 10 },

  // Prismatische Regenboog Kat (rainbow_prism)
  { id: 'prism_crystals', name: 'Prismatische Kwarts Kristallen', emoji: '🌈', cost: 4500000000000000000, type: 'building', buildingId: 'rainbow_prism', multiplier: 2.2, description: 'Breekt zonlicht in duizenden brokjes: +120% regenboogkat TPS.', purchased: false, requiredTreats: 3000000000000000000, requiredBuildingId: 'rainbow_prism', requiredBuildingCount: 1 },

  // Maneki-Neko Fortuinkat (chancemaker_cat)
  { id: 'golden_coin_fortune', name: 'Koban Geluksmunt', emoji: '🧧', cost: 150000000000000000000, type: 'building', buildingId: 'chancemaker_cat', multiplier: 2.25, description: 'Elke slag van de gouden munt schept brokjes: +125% gelukskat TPS.', purchased: false, requiredTreats: 100000000000000000000, requiredBuildingId: 'chancemaker_cat', requiredBuildingCount: 1 },

  // Fractale Katten Generator (fractal_cat)
  { id: 'mandelbrot_snout', name: 'Mandelbrot Snuitje', emoji: '🌀', cost: 6000000000000000000000, type: 'building', buildingId: 'fractal_cat', multiplier: 2.3, description: 'Oneindige zelfgelijkvormigheid: +130% fractale brokjes!', purchased: false, requiredTreats: 4000000000000000000000, requiredBuildingId: 'fractal_cat', requiredBuildingCount: 1 },

  // Kosmisch Katten Multiversum (multiverse_nexus)
  { id: 'string_theory_paws', name: 'Snaartheorie Kattenpootjes', emoji: '🌐', cost: 250000000000000000000000, type: 'building', buildingId: 'multiverse_nexus', multiplier: 2.35, description: 'Trillingen in 11 dimensies vullen alle bakjes: +135% multiversum TPS.', purchased: false, requiredTreats: 150000000000000000000000, requiredBuildingId: 'multiverse_nexus', requiredBuildingCount: 1 },

  // Alwetend Kattenbrein (cortex_cat)
  { id: 'synapse_overdrive', name: 'Kosmische Synapsen Overdrive', emoji: '🧠', cost: 10000000000000000000000000, type: 'building', buildingId: 'cortex_cat', multiplier: 2.4, description: 'Gedachtensnelheid overtreft het heelal: +140% kattenbrein brokjes.', purchased: false, requiredTreats: 7000000000000000000000000, requiredBuildingId: 'cortex_cat', requiredBuildingCount: 1 },

  // De Opperste Katten God (supreme_cat_god)
  { id: 'supreme_decree', name: 'Het Allerheiligste Meow Decreet', emoji: '👑', cost: 500000000000000000000000000, type: 'building', buildingId: 'supreme_cat_god', multiplier: 2.6, description: 'Een goddelijk bevel dat het universum overspoelt met zalm: +160% TPS!', purchased: false, requiredTreats: 350000000000000000000000000, requiredBuildingId: 'supreme_cat_god', requiredBuildingCount: 1 }
];
