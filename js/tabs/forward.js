// ═══════════════════════════════════════════════════════════
// ══════════════ TAB: FORWARD CALCULATOR ════════════════════
// ═══════════════════════════════════════════════════════════

import { CRIT_CAP, SPEED_CAP, RARITY_TOKEN_MULT, BASE_STAT_RANGES } from '../data.js';
import {
    scaleStatFromTo, scaleStatIterative, getDmgMult, calcUpgradeCost, fmtDec, fmt, parseNum
} from '../utils.js';

let currentAllowedStats = { hp: [], dmg: [], crit: [], speed: [] };

export function syncForwardLevels(changedField = 'from') {
    const fromLvlInput = document.getElementById('fwd-from');
    const toLvlInput = document.getElementById('fwd-to');
    
    if (!fromLvlInput || !toLvlInput) return;
    
    const fromLvl = parseInt(fromLvlInput.value) || 0;
    const toLvl = parseInt(toLvlInput.value) || 0;

    if (changedField === 'from' && fromLvl > toLvl) {
        toLvlInput.value = fromLvl;
        const toSlider = document.getElementById('fwd-to-slider');
        if (toSlider) toSlider.value = fromLvl;
    } else if (changedField === 'to' && toLvl < fromLvl) {
        fromLvlInput.value = toLvl;
        const fromSlider = document.getElementById('fwd-from-slider');
        if (fromSlider) fromSlider.value = toLvl;
    }
    
    syncForwardOptions();
}

export function syncForwardOptions() {
    const type = document.getElementById('fwd-type').value;
    const rarity = document.getElementById('fwd-rarity').value;
    const fromLvlInput = document.getElementById('fwd-from');
    
    if (!fromLvlInput) return;
    
    const fromLvl = parseInt(fromLvlInput.value) || 0;

    // Update allowed stats based on type, rarity, fromLvl
    const ranges = BASE_STAT_RANGES[type] && BASE_STAT_RANGES[type][rarity] ? BASE_STAT_RANGES[type][rarity] : {};
    
    ['hp', 'dmg', 'crit', 'speed'].forEach(stat => {
        if (!ranges[stat]) {
            currentAllowedStats[stat] = [];
            return;
        }
        
        const isPercent = (stat === 'crit');
        
        // Calculate allowed values at fromLvl
        const allowed = ranges[stat].map(base => {
            let val = scaleStatIterative(base, fromLvl, isPercent);
            if (type === 'weapon') {
                if (stat === 'crit' && val > CRIT_CAP[rarity]) val = CRIT_CAP[rarity];
                if (stat === 'speed' && val > SPEED_CAP[rarity]) val = SPEED_CAP[rarity];
            }
            return isPercent ? Number(val.toFixed(1)) : Math.floor(val);
        });
        
        // Remove duplicates and sort
        currentAllowedStats[stat] = [...new Set(allowed)].sort((a, b) => a - b);
        
        // Update slider attributes
        const slider = document.getElementById(`fwd-${stat}-slider`);
        if (slider && currentAllowedStats[stat].length > 0) {
            slider.min = 0;
            slider.max = currentAllowedStats[stat].length - 1;
            
            // Re-sync slider and input based on current slider index (preserve roll position)
            // But we don't want updateSliderFromStat to call calcForward inside the loop,
            // so we do it silently here.
            const input = document.getElementById(`fwd-${stat}`);
            const hint = document.getElementById(`fwd-${stat}-hint`);
            if (input) {
                let currentIndex = parseInt(slider.value) || 0;
                if (currentIndex >= currentAllowedStats[stat].length) {
                    currentIndex = currentAllowedStats[stat].length - 1;
                }
                
                slider.value = currentIndex;
                input.value = currentAllowedStats[stat][currentIndex];
                if (hint) hint.textContent = `(${currentIndex + 1}/${currentAllowedStats[stat].length})`;
            }
        }
    });
    
    calcForward();
}

export function updateStatFromSlider(stat) {
    const slider = document.getElementById(`fwd-${stat}-slider`);
    const input = document.getElementById(`fwd-${stat}`);
    const hint = document.getElementById(`fwd-${stat}-hint`);
    
    if (!slider || !input || !currentAllowedStats[stat] || currentAllowedStats[stat].length === 0) return;
    
    const index = parseInt(slider.value) || 0;
    const val = currentAllowedStats[stat][index];
    
    if (val !== undefined) {
        input.value = val;
        if (hint) hint.textContent = `(${index + 1}/${currentAllowedStats[stat].length})`;
    }
    calcForward();
}

export function updateSliderFromStat(stat) {
    const slider = document.getElementById(`fwd-${stat}-slider`);
    const input = document.getElementById(`fwd-${stat}`);
    const hint = document.getElementById(`fwd-${stat}-hint`);
    
    if (!slider || !input || !currentAllowedStats[stat] || currentAllowedStats[stat].length === 0) return;
    
    const val = Number(input.value);
    
    // Find closest index
    let closestIndex = 0;
    let minDiff = Infinity;
    
    currentAllowedStats[stat].forEach((v, i) => {
        const diff = Math.abs(v - val);
        if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
        }
    });
    
    slider.value = closestIndex;
    // Set the input value to the strictly allowed one, ensuring impossible values aren't manually retained
    input.value = currentAllowedStats[stat][closestIndex];
    if (hint) hint.textContent = `(${closestIndex + 1}/${currentAllowedStats[stat].length})`;
    
    calcForward();
}

export function toggleWeaponFields(prefix) {
    const type = document.getElementById(prefix + '-type').value;
    const fields = document.getElementById(prefix + '-weapon-fields');
    if (fields) fields.style.display = type === 'weapon' ? '' : 'none';

    // Hide DMG field for common/uncommon equipment
    const raritySel = document.getElementById(prefix + '-rarity');
    const dmgGroup = document.getElementById(prefix + '-dmg-group');
    if (raritySel && dmgGroup) {
        const rarity = raritySel.value;
        if (type === 'equipment' && (rarity === 'common' || rarity === 'uncommon')) {
            dmgGroup.style.display = 'none';
        } else {
            dmgGroup.style.display = '';
        }
    }
}

export function calcForward() {
    const type = document.getElementById('fwd-type').value;
    const rarity = document.getElementById('fwd-rarity').value;
    const baseHp = parseNum('fwd-hp');
    const baseDmg = parseNum('fwd-dmg');
    const baseCrit = parseNum('fwd-crit');
    const baseSpeed = parseNum('fwd-speed');
    const fromLvl = parseInt(document.getElementById('fwd-from').value) || 0;
    const toLvl = parseInt(document.getElementById('fwd-to').value) || 0;
    const isWeapon = type === 'weapon';
    const isEquip = type === 'equipment';

    let finalHp = scaleStatFromTo(baseHp, fromLvl, toLvl, false);
    let finalDmg = scaleStatFromTo(baseDmg, fromLvl, toLvl, false);
    let finalCrit = scaleStatFromTo(baseCrit, fromLvl, toLvl, true);
    let finalSpeed = scaleStatFromTo(baseSpeed, fromLvl, toLvl, false);

    let critCap = null, speedCap = null;
    if (isWeapon) {
        critCap = CRIT_CAP[rarity];
        speedCap = SPEED_CAP[rarity];
        if (finalCrit > critCap) finalCrit = critCap;
        if (finalSpeed > speedCap) finalSpeed = speedCap;
    }

    const dmgMultFrom = isWeapon ? getDmgMult(rarity, fromLvl) : null;
    const dmgMultTo = isWeapon ? getDmgMult(rarity, toLvl) : null;
    const costs = calcUpgradeCost(rarity, isEquip, fromLvl, toLvl);

    const res = document.getElementById('fwd-results');
    res.classList.remove('hidden');
    res.innerHTML = `
    <div class="results-title">📊 Stats at +${toLvl}</div>
    ${isWeapon ? `<div class="stat-row">
      <span class="stat-label">🗡️ DMG MULT</span>
      <span class="stat-value">×${fmtDec(dmgMultFrom, 2)} <span class="arrow">→</span> <span class="upgraded">×${fmtDec(dmgMultTo, 2)}</span>
      <span class="cap-warn">(+${fmtDec(dmgMultTo - dmgMultFrom, 2)})</span></span>
    </div>
    <div class="stat-row">
      <span class="stat-label">🪙 TKN Bonus</span>
      <span class="stat-value" style="color:var(--r-legendary)">+${Math.round((RARITY_TOKEN_MULT[rarity] - 1) * 100)}%</span>
    </div>` : ''}
    <div class="stat-row">
      <span class="stat-label">❤️ HP</span>
      <span class="stat-value">${fmt(baseHp)} <span class="arrow">→</span> <span class="upgraded">${fmt(finalHp)}</span></span>
    </div>
    ${!(isEquip && (rarity === 'common' || rarity === 'uncommon')) ? `
    <div class="stat-row">
      <span class="stat-label">⚔️ DMG</span>
      <span class="stat-value">${fmt(baseDmg)} <span class="arrow">→</span> <span class="upgraded">${fmt(finalDmg)}</span></span>
    </div>` : ''}
    ${isWeapon ? `
    <div class="stat-row">
      <span class="stat-label">🎯 Crit</span>
      <span class="stat-value">${fmtDec(baseCrit)}% <span class="arrow">→</span> <span class="upgraded">${fmtDec(finalCrit)}%</span>
      ${finalCrit >= critCap ? `<span class="cap-warn">(cap ${critCap}%)</span>` : ''}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">⚡ Speed</span>
      <span class="stat-value">${fmt(baseSpeed)}ms <span class="arrow">→</span> <span class="upgraded">${fmt(finalSpeed)}ms</span>
      ${finalSpeed >= speedCap ? `<span class="cap-warn">(cap ${speedCap}ms)</span>` : ''}</span>
    </div>
    ` : ''}
    <div class="cost-summary">
      <div class="cost-box">
        <div class="cost-label">🔩 Scrap Metal</div>
        <div class="cost-val" style="color:var(--r-uncommon)">${fmt(costs.totalScrap)}</div>
      </div>
      <div class="cost-box">
        <div class="cost-label">💎 $SIEGE</div>
        <div class="cost-val" style="color:var(--r-legendary)">${fmt(costs.totalSiege)}</div>
      </div>
    </div>
  `;
}
