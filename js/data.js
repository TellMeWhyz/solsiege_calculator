// ═══════════════════════════════════════════════════════════
// ═══════════════════ GAME DATA FROM WIKI ═══════════════════
// ═══════════════════════════════════════════════════════════

export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical'];
export const RARITY_LABELS = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary', mythical: 'Mythical' };
export const RARITY_COLORS = { common: 'var(--r-common)', uncommon: 'var(--r-uncommon)', rare: 'var(--r-rare)', epic: 'var(--r-epic)', legendary: 'var(--r-legendary)', mythical: 'var(--r-mythical)' };
export const RARITY_BG = { common: 'var(--r-common-bg)', uncommon: 'var(--r-uncommon-bg)', rare: 'var(--r-rare-bg)', epic: 'var(--r-epic-bg)', legendary: 'var(--r-legendary-bg)', mythical: 'var(--r-mythical-bg)' };

// Scrap rarity multiplier
export const RARITY_SCRAP_MULT = { common: 1.0, uncommon: 1.1, rare: 1.3, epic: 1.6, legendary: 2.0, mythical: 3.0 };

// Weapon damage multiplier
export const RARITY_DMG_MULT = { common: 1.0, uncommon: 1.4, rare: 2.0, epic: 3.5, legendary: 6.0, mythical: 10.0 };

// Token drop multiplier (weapons only)
export const RARITY_TOKEN_MULT = { common: 1.00, uncommon: 1.10, rare: 1.25, epic: 1.50, legendary: 2.00, mythical: 2.50 };

// Crit & Speed caps per rarity (weapons only)
export const CRIT_CAP = { common: 10, uncommon: 15, rare: 25, epic: 40, legendary: 50, mythical: 100 };
export const SPEED_CAP = { common: 100, uncommon: 200, rare: 300, epic: 400, legendary: 500, mythical: 700 };

// Flat stat bonuses per equipped item rarity
export const FLAT_BONUS = {
    common: { hp: 0, dmg: 0, crit: 0, speed: 0 },
    uncommon: { hp: 10, dmg: 2, crit: 1, speed: -20 },
    rare: { hp: 25, dmg: 5, crit: 2, speed: -40 },
    epic: { hp: 50, dmg: 10, crit: 4, speed: -60 },
    legendary: { hp: 100, dmg: 20, crit: 7, speed: -80 },
    mythical: { hp: 200, dmg: 40, crit: 10, speed: -120 }
};

// $SIEGE cost per upgrade level by rarity
export const SIEGE_COST_TABLE = {
    common: [5, 5, 10, 15, 15, 25, 25, 50, 50, 50, 50],
    uncommon: [10, 15, 25, 50, 50, 75, 75, 150, 150, 150, 150],
    rare: [50, 50, 50, 100, 200, 250, 300, 350, 400, 1000, 1000],
    epic: [200, 200, 200, 400, 400, 1000, 1250, 1500, 1500, 1750, 2500],
    legendary: [1000, 1250, 1500, 2500, 2750, 5000, 7500, 10000, 15000, 20000, 30000],
    mythical: [5000, 5000, 6500, 7500, 12500, 15000, 17500, 20000, 25000, 40000, 75000]
};

// Class data
export const CLASSES = {
    warrior: { label: 'Warrior', dmgMult: 1.15, hpMult: 1.20, atkSpeed: 1100, critBonus: 0, tokenMult: 1.0, scrapMult: 1.0 },
    archer: { label: 'Archer', dmgMult: 1.00, hpMult: 0.90, atkSpeed: 900, critBonus: 5, tokenMult: 1.0, scrapMult: 1.15 },
    mage: { label: 'Mage', dmgMult: 1.00, hpMult: 1.00, atkSpeed: 1050, critBonus: 0, tokenMult: 1.2, scrapMult: 1.0 }
};

// Level-up auto gains
export const LEVEL_HP_BASE = 100;
export const LEVEL_HP_GROWTH = 0.36;  // +36% per level (verified vs lv.258 game data)
export const LEVEL_DMG_BASE = 10;
export const LEVEL_DMG_GROWTH = 0.284; // +28.4% per level (verified vs lv.258 game data)

// Set bonuses
export const SET_BONUSES = {
    epic: [{ count: 6, dmg: 3, hp: 3 }, { count: 7, dmg: 3, hp: 3 }],
    legendary: [{ count: 4, dmg: 3, hp: 3 }, { count: 5, dmg: 6, hp: 6 }, { count: 7, dmg: 8, hp: 8 }],
    mythical: [{ count: 1, dmg: 2, hp: 2 }, { count: 2, dmg: 4, hp: 4 }, { count: 3, dmg: 10, hp: 10 }, { count: 4, dmg: 15, hp: 15 }, { count: 5, dmg: 20, hp: 20 }, { count: 7, dmg: 50, hp: 50 }]
};

// Equipment slots definition
export const SLOTS = [
    { id: 'weapon', label: 'Weapon', icon: '⚔️', isWeapon: true },
    { id: 'helmet', label: 'Helmet', icon: '🪖', isWeapon: false },
    { id: 'armor', label: 'Armor', icon: '🛡️', isWeapon: false },
    { id: 'boots', label: 'Boots', icon: '👢', isWeapon: false },
    { id: 'shield', label: 'Shield', icon: '🔰', isWeapon: false },
    { id: 'accessory1', label: 'Accessory 1', icon: '💍', isWeapon: false },
    { id: 'accessory2', label: 'Accessory 2', icon: '💍', isWeapon: false },
];

// Helper for discrete ranges
function range(min, max, step = 1) {
  const arr = [];
  // For floats, avoid floating point precision issues
  if (step < 1) {
    const mult = Math.round(1 / step);
    for (let i = min * mult; i <= max * mult; i += Math.round(step * mult)) {
      arr.push(Number((i / mult).toFixed(1)));
    }
  } else {
    for (let i = min; i <= max; i += step) {
      arr.push(i);
    }
  }
  return arr.length > 0 ? arr : [0];
}

// Base Stat Ranges (+0) from WIKI
export const BASE_STAT_RANGES = {
  weapon: {
    common: { hp: range(0, 1), dmg: range(0, 1), crit: range(0.0, 0.3, 0.1), speed: range(0, 5) },
    uncommon: { hp: range(1, 4), dmg: range(0, 1), crit: range(0.2, 0.8, 0.1), speed: range(4, 10) },
    rare: { hp: range(4, 10), dmg: range(1, 4), crit: range(0.3, 1.2, 0.1), speed: range(8, 20) },
    epic: { hp: range(10, 25), dmg: range(4, 10), crit: range(1.0, 3.0, 0.1), speed: range(15, 40) },
    legendary: { hp: range(30, 70), dmg: range(12, 28), crit: range(3.0, 7.0, 0.1), speed: range(35, 75) },
    mythical: { hp: range(125, 250), dmg: range(50, 100), crit: range(6.0, 12.0, 0.1), speed: range(70, 130) }
  },
  equipment: {
    common: { hp: range(0, 4), dmg: [0] },
    uncommon: { hp: range(4, 12), dmg: [0] },
    rare: { hp: range(12, 30), dmg: range(0, 1) },
    epic: { hp: range(30, 75), dmg: range(1, 3) },
    legendary: { hp: range(90, 210), dmg: range(3, 8) },
    mythical: { hp: range(375, 750), dmg: range(15, 30) }
  }
};
