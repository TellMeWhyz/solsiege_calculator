// ═══════════════════════════════════════════════════════════
// ══════════════ TAB: REVERSE CALCULATOR ════════════════════
// ═══════════════════════════════════════════════════════════

import {
    findBaseStat, scaleStatIterative, fmt, fmtDec, parseNum
} from '../utils.js';
import { toggleWeaponFields } from './forward.js';
import { CRIT_CAP, SPEED_CAP, BASE_STAT_RANGES } from '../data.js';

let currentAllowedStatsRev = { hp: [], dmg: [], crit: [], speed: [] };

export function syncReverseOptions() {
    const type = document.getElementById('rev-type').value;
    const rarity = document.getElementById('rev-rarity').value;
    const levelInput = document.getElementById('rev-level');
    
    if (!levelInput) return;
    
    const curLevel = parseInt(levelInput.value) || 0;

    // Update allowed stats based on type, rarity, curLevel
    const ranges = BASE_STAT_RANGES[type] && BASE_STAT_RANGES[type][rarity] ? BASE_STAT_RANGES[type][rarity] : {};
    
    ['hp', 'dmg', 'crit', 'speed'].forEach(stat => {
        if (!ranges[stat]) {
            currentAllowedStatsRev[stat] = [];
            return;
        }
        
        const isPercent = (stat === 'crit');
        
        // Calculate allowed values at curLevel
        const allowed = ranges[stat].map(base => {
            let val = scaleStatIterative(base, curLevel, isPercent);
            if (type === 'weapon') {
                if (stat === 'crit' && val > CRIT_CAP[rarity]) val = CRIT_CAP[rarity];
                if (stat === 'speed' && val > SPEED_CAP[rarity]) val = SPEED_CAP[rarity];
            }
            return isPercent ? Number(val.toFixed(1)) : Math.floor(val);
        });
        
        // Remove duplicates and sort
        currentAllowedStatsRev[stat] = [...new Set(allowed)].sort((a, b) => a - b);
        
        // Update slider attributes
        const slider = document.getElementById(`rev-${stat}-slider`);
        if (slider && currentAllowedStatsRev[stat].length > 0) {
            slider.min = 0;
            slider.max = currentAllowedStatsRev[stat].length - 1;
            
            // Re-sync slider and input based on current slider index (preserve roll position)
            const input = document.getElementById(`rev-${stat}`);
            const hint = document.getElementById(`rev-${stat}-hint`);
            if (input) {
                let currentIndex = parseInt(slider.value) || 0;
                if (currentIndex >= currentAllowedStatsRev[stat].length) {
                    currentIndex = currentAllowedStatsRev[stat].length - 1;
                }
                
                slider.value = currentIndex;
                input.value = currentAllowedStatsRev[stat][currentIndex];
                if (hint) hint.textContent = `(${currentIndex + 1}/${currentAllowedStatsRev[stat].length})`;
            }
        }
    });
    
    calcReverse();
}

export function updateStatFromSliderRev(stat) {
    const slider = document.getElementById(`rev-${stat}-slider`);
    const input = document.getElementById(`rev-${stat}`);
    const hint = document.getElementById(`rev-${stat}-hint`);
    
    if (!slider || !input || !currentAllowedStatsRev[stat] || currentAllowedStatsRev[stat].length === 0) return;
    
    const index = parseInt(slider.value) || 0;
    const val = currentAllowedStatsRev[stat][index];
    
    if (val !== undefined) {
        input.value = val;
        if (hint) hint.textContent = `(${index + 1}/${currentAllowedStatsRev[stat].length})`;
    }
    calcReverse();
}

export function updateSliderFromStatRev(stat) {
    const slider = document.getElementById(`rev-${stat}-slider`);
    const input = document.getElementById(`rev-${stat}`);
    const hint = document.getElementById(`rev-${stat}-hint`);
    
    if (!slider || !input || !currentAllowedStatsRev[stat] || currentAllowedStatsRev[stat].length === 0) return;
    
    const val = Number(input.value);
    
    let closestIndex = 0;
    let minDiff = Infinity;
    
    currentAllowedStatsRev[stat].forEach((v, i) => {
        const diff = Math.abs(v - val);
        if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
        }
    });
    
    slider.value = closestIndex;
    input.value = currentAllowedStatsRev[stat][closestIndex];
    if (hint) hint.textContent = `(${closestIndex + 1}/${currentAllowedStatsRev[stat].length})`;
    
    calcReverse();
}

export function calcReverse() {
    const type = document.getElementById('rev-type').value;
    const rarity = document.getElementById('rev-rarity').value;
    const curHp = parseNum('rev-hp');
    const curDmg = parseNum('rev-dmg');
    const curCrit = parseNum('rev-crit');
    const curSpeed = parseNum('rev-speed');
    const level = parseInt(document.getElementById('rev-level').value) || 0;

    const baseHp = findBaseStat(curHp, level, false);
    const baseDmg = findBaseStat(curDmg, level, false);
    const baseCrit = findBaseStat(curCrit, level, true);
    const baseSpeed = findBaseStat(curSpeed, level, false);

    const verifyHp = scaleStatIterative(baseHp, level, false);
    const verifyDmg = scaleStatIterative(baseDmg, level, false);

    const res = document.getElementById('rev-results');
    res.classList.remove('hidden');
    res.innerHTML = `
    <div class="results-title">🔍 Base Stats (before +${level})</div>
    <div class="stat-row">
      <span class="stat-label">❤️ Base HP</span>
      <span class="stat-value"><span class="base-val">${baseHp}</span> <span class="arrow">→</span> ${fmt(verifyHp)} ${verifyHp !== curHp ? '<span class="cap-warn">(≈' + fmt(curHp) + ')</span>' : '✓'}</span>
    </div>
    ${!(type === 'equipment' && (rarity === 'common' || rarity === 'uncommon')) ? `
    <div class="stat-row">
      <span class="stat-label">⚔️ Base DMG</span>
      <span class="stat-value"><span class="base-val">${baseDmg}</span> <span class="arrow">→</span> ${fmt(verifyDmg)} ${verifyDmg !== curDmg ? '<span class="cap-warn">(≈' + fmt(curDmg) + ')</span>' : '✓'}</span>
    </div>` : ''}
    ${type === 'weapon' ? `
    <div class="stat-row">
      <span class="stat-label">🎯 Base Crit</span>
      <span class="stat-value"><span class="base-val">${fmtDec(baseCrit, 1)}%</span> <span class="arrow">→</span> ${fmtDec(curCrit)}%</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">⚡ Base Speed</span>
      <span class="stat-value"><span class="base-val">${baseSpeed}ms</span> <span class="arrow">→</span> ${fmt(curSpeed)}ms</span>
    </div>` : ''}
    <div style="margin-top:14px;padding:12px;background:rgba(0,0,0,0.2);border-radius:8px;font-size:0.75rem;color:var(--text-muted)">
      💡 These are the original base stats at +0. Use them in Forward Calculator to plan upgrades.
    </div>
    <button class="btn btn-secondary" style="margin-top:12px" onclick="window.transferToForward('${type}','${rarity}',${baseHp},${baseDmg},${fmtDec(baseCrit, 1)},${baseSpeed})">⚔️ Use in Forward Calculator</button>
  `;
}

export function transferToForward(type, rarity, hp, dmg, crit, speed) {
    document.getElementById('fwd-type').value = type;
    const rarSel = document.getElementById('fwd-rarity');
    rarSel.value = rarity;
    rarSel.dataset.rarity = rarity;
    document.getElementById('fwd-hp').value = hp;
    document.getElementById('fwd-dmg').value = dmg;
    document.getElementById('fwd-crit').value = crit;
    document.getElementById('fwd-speed').value = speed;
    document.getElementById('fwd-from').value = 0;
    toggleWeaponFields('fwd');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('[data-tab="forward"]').classList.add('active');
    document.getElementById('tab-forward').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
