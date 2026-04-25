// ═══════════════════════════════════════════════════════════
// ═══════════════════ UTILITY FUNCTIONS ═════════════════════
// ═══════════════════════════════════════════════════════════

import {
    RARITY_SCRAP_MULT, SIEGE_COST_TABLE, RARITY_DMG_MULT, SET_BONUSES
} from './data.js';

// ══════ COST HELPERS ══════

export function getSiegeCostPerLevel(rarity, level) {
    const tiers = SIEGE_COST_TABLE[rarity];
    const tierIdx = Math.min(Math.floor(level / 10), tiers.length - 1);
    return tiers[tierIdx];
}

export function getScrapGrowthRate(level) {
    if (level < 10) return 1.35;
    if (level < 25) return 1.25;
    if (level < 50) return 1.15;
    return 1.08;
}

export function getScrapCostForLevel(level, rarity, isEquipment) {
    let compound = 1;
    for (let i = 0; i < level; i++) {
        compound *= getScrapGrowthRate(i);
    }
    const base = 25;
    const rarityMult = RARITY_SCRAP_MULT[rarity];
    const eqDiscount = isEquipment ? 0.70 : 1.0;
    return Math.floor(base * compound * rarityMult * eqDiscount);
}

export function calcUpgradeCost(rarity, isEquipment, fromLevel, toLevel) {
    let totalScrap = 0;
    let totalSiege = 0;
    const details = [];
    for (let lvl = fromLevel; lvl < toLevel; lvl++) {
        const scrap = getScrapCostForLevel(lvl, rarity, isEquipment);
        const siege = getSiegeCostPerLevel(rarity, lvl);
        totalScrap += scrap;
        totalSiege += siege;
        details.push({ level: lvl + 1, scrap, siege, totalScrap, totalSiege });
    }
    return { totalScrap, totalSiege, details };
}

// ══════ STAT SCALING (iterative, matching game engine) ══════

export function scaleStatIterative(base, levels, isPercent) {
    let val = base;
    for (let i = 0; i < levels; i++) {
        if (isPercent) {
            val = Math.round(val * 1.10 * 10) / 10;
        } else {
            val = Math.max(Math.floor(val) + 1, Math.floor(val * 1.10));
        }
    }
    return isPercent ? Math.round(val * 10) / 10 : Math.floor(val);
}

export function findBaseStat(target, level, isPercent) {
    if (level === 0) return target;
    if (!isPercent) {
        let lo = 0, hi = target;
        while (lo <= hi) {
            const mid = Math.floor((lo + hi) / 2);
            const result = scaleStatIterative(mid, level, false);
            if (result === target) return mid;
            if (result < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return lo;
    } else {
        let lo = 0, hi = target;
        for (let iter = 0; iter < 100; iter++) {
            const mid = (lo + hi) / 2;
            const result = scaleStatIterative(mid, level, true);
            if (Math.abs(result - target) < 0.05) return Math.round(mid * 10) / 10;
            if (result < target) lo = mid;
            else hi = mid;
        }
        return Math.round(((lo + hi) / 2) * 10) / 10;
    }
}

export function scaleStatFromTo(stat, fromLevel, toLevel, isPercent) {
    if (fromLevel === 0) return scaleStatIterative(stat, toLevel, isPercent);
    const base = findBaseStat(stat, fromLevel, isPercent);
    return scaleStatIterative(base, toLevel, isPercent);
}

export function getDmgMult(rarity, level) {
    return RARITY_DMG_MULT[rarity] * (1 + 0.05 * level);
}

export function getSetBonuses(rarityCounts) {
    let totalDmgBonus = 0, totalHpBonus = 0;
    const activeBonuses = [];
    for (const rarity of ['mythical', 'legendary', 'epic']) {
        const count = rarityCounts[rarity] || 0;
        if (count < 1 || !SET_BONUSES[rarity]) continue;
        const tiers = SET_BONUSES[rarity];
        let best = null;
        for (const tier of tiers) {
            if (count >= tier.count) best = tier;
        }
        if (best) {
            totalDmgBonus += best.dmg;
            totalHpBonus += best.hp;
            activeBonuses.push({ rarity, count, dmg: best.dmg, hp: best.hp });
        }
    }
    return { totalDmgBonus, totalHpBonus, activeBonuses };
}

// ══════ FORMAT HELPERS ══════

export function fmt(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e4) return (n / 1e3).toFixed(1) + 'K';
    return Math.floor(n).toLocaleString();
}

export function fmtDec(n, d = 1) {
    return Number(n).toFixed(d);
}

// ══════ SHARED UI HELPERS ══════

export function parseNum(id) {
    const el = document.getElementById(id);
    const raw = el?.value?.replace(',', '.') || '0';
    return parseFloat(raw) || 0;
}
