// ═══════════════════════════════════════════════════════════
// ══════════════ TAB: CHARACTER BUILDER ═════════════════════
// ═══════════════════════════════════════════════════════════

import {
    RARITIES, RARITY_LABELS, RARITY_COLORS, RARITY_BG,
    RARITY_TOKEN_MULT, CRIT_CAP, SPEED_CAP, FLAT_BONUS,
    CLASSES, SLOTS, LEVEL_HP_BASE, LEVEL_HP_GROWTH, LEVEL_DMG_BASE, LEVEL_DMG_GROWTH
} from '../data.js';
import {
    scaleStatIterative, getDmgMult, calcUpgradeCost, getSetBonuses,
    fmt, fmtDec
} from '../utils.js';

// ══════ BOOKMARKLET ══════

const BOOKMARKLET_SRC = `(function(){
  var out={ls:{},pinia:null,raw:{}};
  // localStorage scan
  for(var i=0;i<localStorage.length;i++){
    var k=localStorage.key(i);
    try{out.ls[k]=JSON.parse(localStorage.getItem(k));}
    catch(e){out.ls[k]=localStorage.getItem(k);}
  }
  // Pinia store via Vue 3 devtools hook
  try{
    var el=document.querySelector('[data-v-app]')||document.querySelector('#root')||document.body;
    var app=el.__vue_app__;
    if(!app){var els=document.querySelectorAll('*');for(var j=0;j<els.length;j++){if(els[j].__vue_app__){app=els[j].__vue_app__;break;}}}
    if(app){
      var gp=app.config.globalProperties;
      if(gp.$pinia&&gp.$pinia.state){out.pinia=JSON.parse(JSON.stringify(gp.$pinia.state.value));}
    }
  }catch(e){out.piniaErr=e.message;}
  // window game keys
  out.windowKeys=Object.keys(window).filter(function(k){return/game|player|store|siege|character|equip|mastery|skill/i.test(k);});
  var json=JSON.stringify(out,null,2);
  // Show overlay
  var ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:sans-serif';
  ov.innerHTML='<div style="background:#0f0b1a;border:1px solid #c9a84c;border-radius:14px;padding:24px;width:560px;max-height:80vh;overflow:auto;color:#e2dcd0"><h3 style="color:#c9a84c;margin:0 0 12px;font-size:16px">Sol Siege — Export Data</h3><p style="font-size:13px;color:#aaa;margin:0 0 12px">Click <b style=color:#4ade80>Copy JSON</b> then go back to Sol Siege Calculator and paste.</p><textarea id="_ss_ta" style="width:100%;height:200px;background:#0a0710;color:#e2dcd0;border:1px solid #333;border-radius:6px;padding:8px;font-size:11px;font-family:monospace;resize:vertical">'+json.replace(/</g,'&lt;')+'</textarea><div style="display:flex;gap:8px;margin-top:12px"><button onclick="navigator.clipboard.writeText(document.getElementById(\\'_ss_ta\\').value);this.textContent=\\'✓ Copied!\\';this.style.background=\\'#166534\\'" style="padding:8px 18px;background:#c9a84c;border:none;border-radius:6px;cursor:pointer;font-weight:700;color:#0a0710">Copy JSON</button><button onclick="this.closest(\\'div[style*=inset]\\').remove()" style="padding:8px 18px;background:#222;border:none;border-radius:6px;cursor:pointer;color:#aaa">Close</button></div></div>';
  document.body.appendChild(ov);
})();`;

export function initBookmarklet() {
    const minified = 'javascript:' + encodeURIComponent(BOOKMARKLET_SRC);
    const link = document.getElementById('bookmarklet-link');
    const code = document.getElementById('bookmarklet-code');
    if (link) link.href = minified;
    if (code) code.textContent = 'javascript:' + BOOKMARKLET_SRC.replace(/\s+/g, ' ').trim();
}

// ══════ DEEP-GET HELPER ══════

function dg(obj, ...paths) {
    for (const path of paths) {
        let v = obj;
        for (const k of path.split('.')) {
            if (v == null) break;
            v = v[k];
        }
        if (v != null) return v;
    }
    return undefined;
}

// ══════ BUILDER INIT ══════

export function initBuilder() {
    const grid = document.getElementById('builder-slots');
    if (!grid) return;
    grid.innerHTML = SLOTS.map(slot => `
    <div class="slot-card" id="slot-${slot.id}">
      <div class="slot-header">${slot.icon} ${slot.label}</div>
      <div class="form-row">
        <div class="form-group">
          <label>Rarity</label>
          <select id="b-${slot.id}-rarity" class="rarity-select" onchange="this.dataset.rarity=this.value;window.updateBuilder()">
            ${RARITIES.map(r => `<option value="${r}" ${r === 'epic' ? 'selected' : ''}>${RARITY_LABELS[r]}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Level</label>
          <input type="number" id="b-${slot.id}-level" value="30" min="0" max="125" onchange="window.updateBuilder()">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>HP</label><input type="number" id="b-${slot.id}-hp" value="${slot.isWeapon ? '20' : '40'}" min="0" onchange="window.updateBuilder()"></div>
        <div class="form-group"><label>DMG</label><input type="number" id="b-${slot.id}-dmg" value="${slot.isWeapon ? '8' : '2'}" min="0" onchange="window.updateBuilder()"></div>
      </div>
      ${slot.isWeapon ? `
      <div class="form-row">
        <div class="form-group"><label>Crit %</label><input type="number" id="b-${slot.id}-crit" value="2" min="0" step="0.1" onchange="window.updateBuilder()"></div>
        <div class="form-group"><label>Speed (ms)</label><input type="number" id="b-${slot.id}-speed" value="25" min="0" onchange="window.updateBuilder()"></div>
      </div>` : ''}
    </div>
  `).join('');
    document.querySelectorAll('.rarity-select').forEach(el => { el.dataset.rarity = el.value; });
    updateBuilder();
}

// ══════ CATCH-UP STATE ══════

let catchupBonus = 0;

export function setCatchup(val) {
    catchupBonus = val;
    document.querySelectorAll('#catchup-btns .catchup-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.val) === val);
    });
    updateBuilder();
}

export function stepRune(id, step) {
    const el = document.getElementById(id);
    const cur = parseFloat(el.value) || 0;
    el.value = Math.max(0, Math.round((cur + step * 0.5) * 10) / 10);
    updateBuilder();
}

// ══════ SKILL POINT STEPPERS ══════

export function stepSp(id, minStep) {
    const el = document.getElementById(id);
    const cur = parseInt(el.value) || 0;
    const charLevel = parseInt(document.getElementById('b-level')?.value) || 1;
    const totalSP = Math.max(0, charLevel - 1);

    const spDmg = parseInt(document.getElementById('sp-dmg').value) || 0;
    const spCrit = parseInt(document.getElementById('sp-crit').value) || 0;
    const spSpeed = parseInt(document.getElementById('sp-speed').value) || 0;
    const spHp = parseInt(document.getElementById('sp-hp').value) || 0;
    const spToken = parseInt(document.getElementById('sp-token').value) || 0;
    const usedSP = spDmg + spCrit + spSpeed + spHp + spToken;

    if (minStep > 0 && usedSP >= totalSP) return; // Cap
    el.value = Math.max(0, cur + minStep);
    updateBuilder();
}

export function stepM(id, minStep, maxVal) {
    const el = document.getElementById(id);
    const cur = parseInt(el.value) || 0;
    el.value = Math.max(0, Math.min(maxVal, cur + minStep));
    updateBuilder();
}

export function resetSkills() {
    ['sp-dmg', 'sp-crit', 'sp-speed', 'sp-hp', 'sp-token'].forEach(id => document.getElementById(id).value = 0);
    updateBuilder();
}

export function resetMastery() {
    ['m-lifesteal', 'm-doublestrike', 'm-armorpen', 'm-bossslayer', 'm-finisher', 'm-armor', 'm-thorns', 'm-fortify', 'm-secondwind', 'm-tokensurge'].forEach(id => document.getElementById(id).value = 0);
    updateBuilder();
}

export function applyBulkEq() {
    const rarity = document.getElementById('bulk-rarity').value;
    const level = document.getElementById('bulk-level').value;
    SLOTS.forEach(slot => {
        const rEl = document.getElementById(`b-${slot.id}-rarity`);
        if (rEl) { rEl.value = rarity; rEl.dataset.rarity = rarity; }
        const lEl = document.getElementById(`b-${slot.id}-level`);
        if (lEl) lEl.value = level;
    });
    updateBuilder();
}

export function fillDefaultStats() {
    SLOTS.forEach(slot => {
        document.getElementById(`b-${slot.id}-hp`).value = slot.isWeapon ? 20 : 40;
        document.getElementById(`b-${slot.id}-dmg`).value = slot.isWeapon ? 8 : 2;
        if (slot.isWeapon) {
            document.getElementById(`b-${slot.id}-crit`).value = 2;
            document.getElementById(`b-${slot.id}-speed`).value = 25;
        }
    });
    updateBuilder();
}

// ══════ IMPORT FROM GAME ══════

export function doImport() {
    const status = document.getElementById('import-status');
    const raw = document.getElementById('import-json').value.trim();
    if (!raw) { status.className = 'import-status err'; status.textContent = '⚠ Paste JSON from the bookmarklet first.'; return; }

    let data;
    try { data = JSON.parse(raw); } catch (e) { status.className = 'import-status err'; status.textContent = '✗ Invalid JSON: ' + e.message; return; }

    const pinia = data.pinia || data;
    const ls = data.ls || data.localStorage || {};

    let filled = 0;
    const set = (id, val) => {
        if (val == null) return;
        const el = document.getElementById(id);
        if (el) { el.value = val; filled++; }
    };

    const playerStore = pinia.player || pinia.character || pinia.game || pinia.gameStore || {};
    const charLevel = dg(playerStore, 'level', 'playerLevel', 'charLevel')
        || dg(pinia, 'player.level', 'game.level', 'character.level');
    const charClass = dg(playerStore, 'class', 'charClass', 'heroClass', 'selectedClass')
        || dg(pinia, 'player.class', 'game.class');
    set('b-level', charLevel);
    if (charClass) {
        const cls = String(charClass).toLowerCase();
        const clsMap = { warrior: 'warrior', fighter: 'warrior', knight: 'warrior', archer: 'archer', ranger: 'archer', hunter: 'archer', mage: 'mage', wizard: 'mage', sorcerer: 'mage' };
        set('b-class', clsMap[cls] || cls);
    }

    const skills = dg(playerStore, 'skills', 'statTree', 'skillPoints', 'stats')
        || dg(pinia, 'player.skills', 'character.skills', 'game.skills') || {};
    set('sp-dmg', dg(skills, 'damage', 'dmg', 'attack', 'Damage'));
    set('sp-crit', dg(skills, 'critical', 'crit', 'Critical'));
    set('sp-speed', dg(skills, 'speed', 'attackSpeed', 'Speed'));
    set('sp-hp', dg(skills, 'health', 'hp', 'vitality', 'Health'));
    set('sp-token', dg(skills, 'tokenDrop', 'token', 'tokens', 'TokenDrop'));

    const mastery = dg(playerStore, 'mastery', 'masteries', 'masteryPoints')
        || dg(pinia, 'player.mastery', 'mastery.points', 'game.mastery') || {};
    set('m-lifesteal', dg(mastery, 'lifeSteal', 'lifesteal', 'vamp', 'Lifesteal'));
    set('m-doublestrike', dg(mastery, 'doubleStrike', 'doubleHit', 'twinStrike', 'DoubleStrike'));
    set('m-armorpen', dg(mastery, 'armorPenetration', 'armorPen', 'penetration', 'ArmorPen'));
    set('m-bossslayer', dg(mastery, 'bossSlayer', 'boss', 'BossSlayer'));
    set('m-finisher', dg(mastery, 'finisher', 'execute', 'Finisher'));
    set('m-armor', dg(mastery, 'armor', 'defense', 'damageReduction', 'Armor'));
    set('m-thorns', dg(mastery, 'thorns', 'reflect', 'Thorns'));
    set('m-fortify', dg(mastery, 'fortify', 'shield', 'Fortify'));
    set('m-secondwind', dg(mastery, 'secondWind', 'revive', 'SecondWind'));
    set('m-tokensurge', dg(mastery, 'tokenSurge', 'TokenSurge'));

    const SLOT_KEYS = {
        weapon: ['weapon', 'sword', 'mainhand', 'Weapon'],
        helmet: ['helmet', 'head', 'helm', 'Helmet'],
        armor: ['armor', 'chest', 'body', 'Armor'],
        gloves: ['gloves', 'hands', 'gauntlets', 'Gloves'],
        boots: ['boots', 'feet', 'shoes', 'Boots'],
        ring: ['ring', 'accessory', 'Ring'],
        amulet: ['amulet', 'necklace', 'neck', 'pendant', 'Amulet']
    };
    const equipment = dg(playerStore, 'equipment', 'items', 'gear', 'loadout')
        || dg(pinia, 'inventory.equipped', 'player.equipment', 'game.equipment') || {};

    for (const [slotId, aliases] of Object.entries(SLOT_KEYS)) {
        let item = null;
        for (const alias of aliases) { item = equipment[alias]; if (item) break; }
        if (!item) continue;
        const rarity = dg(item, 'rarity', 'tier', 'quality');
        const level = dg(item, 'level', 'upgradeLevel', 'lvl', 'stars');
        const hp = dg(item, 'stats.hp', 'hp', 'health', 'stats.health', 'baseHp');
        const dmg = dg(item, 'stats.dmg', 'stats.damage', 'dmg', 'damage', 'attack', 'baseDmg');
        const crit = dg(item, 'stats.crit', 'crit', 'critChance', 'stats.critChance');
        const speed = dg(item, 'stats.speed', 'speed', 'attackSpeed', 'stats.attackSpeed');
        if (rarity) {
            const rEl = document.getElementById(`b-${slotId}-rarity`);
            if (rEl) { rEl.value = String(rarity).toLowerCase(); rEl.dataset.rarity = rEl.value; filled++; }
        }
        set(`b-${slotId}-level`, level);
        set(`b-${slotId}-hp`, hp);
        set(`b-${slotId}-dmg`, dmg);
        if (slotId === 'weapon') { set(`b-${slotId}-crit`, crit); set(`b-${slotId}-speed`, speed); }
    }

    if (filled === 0) {
        for (const [, v] of Object.entries(ls)) {
            if (typeof v === 'object' && v) {
                const level = dg(v, 'level', 'playerLevel');
                if (level) { set('b-level', level); break; }
            }
        }
    }

    updateBuilder();

    if (filled > 0) {
        status.className = 'import-status ok';
        status.textContent = `✓ Imported ${filled} field(s). Review and adjust as needed.`;
    } else {
        status.className = 'import-status err';
        status.textContent = '⚠ No recognizable game data found. Open dev console on game page and check the pinia state structure.';
    }
}

// ══════ MAIN UPDATE ══════

export function updateBuilder() {
    const charLevel = parseInt(document.getElementById('b-level')?.value) || 1;
    const charClass = document.getElementById('b-class')?.value || 'warrior';
    const cls = CLASSES[charClass];

    const totalSP = Math.max(0, charLevel - 1);
    const spDmg = Math.min(parseInt(document.getElementById('sp-dmg')?.value) || 0, totalSP);
    const spCrit = parseInt(document.getElementById('sp-crit')?.value) || 0;
    const spSpeed = parseInt(document.getElementById('sp-speed')?.value) || 0;
    const spHp = parseInt(document.getElementById('sp-hp')?.value) || 0;
    const spToken = parseInt(document.getElementById('sp-token')?.value) || 0;
    const usedSP = spDmg + spCrit + spSpeed + spHp + spToken;

    const spInfo = document.getElementById('b-sp-info');
    const spCounter = document.getElementById('sp-counter');
    if (spInfo) spInfo.textContent = totalSP;
    if (spCounter) {
        spCounter.textContent = `${usedSP} / ${totalSP}`;
        spCounter.style.color = usedSP > totalSP ? 'var(--danger)' : usedSP === totalSP ? 'var(--success)' : 'var(--gold)';
    }

    const mLifesteal = parseFloat(document.getElementById('m-lifesteal')?.value) || 0;
    const mDoubleStrike = parseFloat(document.getElementById('m-doublestrike')?.value) || 0;
    const mArmorPen = parseFloat(document.getElementById('m-armorpen')?.value) || 0;
    const mBossSlayer = parseFloat(document.getElementById('m-bossslayer')?.value) || 0;
    const mFinisher = parseFloat(document.getElementById('m-finisher')?.value) || 0;
    const mArmor = parseFloat(document.getElementById('m-armor')?.value) || 0;
    const mThorns = parseFloat(document.getElementById('m-thorns')?.value) || 0;
    const mFortify = parseFloat(document.getElementById('m-fortify')?.value) || 0;
    const mSecondWind = parseInt(document.getElementById('m-secondwind')?.value) || 0;
    const mTokenSurge = parseFloat(document.getElementById('m-tokensurge')?.value) || 0;
    const totalMastery = mLifesteal + mDoubleStrike + mArmorPen + mBossSlayer + mFinisher + mArmor + mThorns + mFortify + mSecondWind + mTokenSurge;
    const mCounter = document.getElementById('m-total-counter');
    if (mCounter) mCounter.textContent = totalMastery;

    const charBaseHp = LEVEL_HP_BASE * (1 + LEVEL_HP_GROWTH * charLevel) * cls.hpMult;
    const charBaseDmg = LEVEL_DMG_BASE * (1 + LEVEL_DMG_GROWTH * charLevel) * cls.dmgMult;

    let equipHp = 0, equipDmg = 0, equipCrit = 0, equipSpeed = 0;
    let totalScrap = 0, totalSiege = 0;
    const rarityCounts = {};
    let weaponRarity = 'common';
    let weaponUpgradeLevel = 0;

    SLOTS.forEach(slot => {
        const rarity = document.getElementById(`b-${slot.id}-rarity`)?.value || 'epic';
        const level = parseInt(document.getElementById(`b-${slot.id}-level`)?.value) || 0;
        const baseHp = parseFloat(document.getElementById(`b-${slot.id}-hp`)?.value) || 0;
        const baseDmg = parseFloat(document.getElementById(`b-${slot.id}-dmg`)?.value) || 0;

        rarityCounts[rarity] = (rarityCounts[rarity] || 0) + 1;

        let hp = scaleStatIterative(baseHp, level, false);
        let dmg = scaleStatIterative(baseDmg, level, false);
        equipHp += hp;
        equipDmg += dmg;

        if (slot.isWeapon) {
            weaponRarity = rarity;
            weaponUpgradeLevel = level;
            const baseCrit = parseFloat(document.getElementById(`b-${slot.id}-crit`)?.value) || 0;
            const baseSpeed = parseFloat(document.getElementById(`b-${slot.id}-speed`)?.value) || 0;
            let crit = scaleStatIterative(baseCrit, level, true);
            let speed = scaleStatIterative(baseSpeed, level, false);
            if (crit > CRIT_CAP[rarity]) crit = CRIT_CAP[rarity];
            if (speed > SPEED_CAP[rarity]) speed = SPEED_CAP[rarity];
            equipCrit += crit;
            equipSpeed += speed;
        }

        const flat = FLAT_BONUS[rarity];
        equipHp += flat.hp;
        equipDmg += flat.dmg;
        equipCrit += flat.crit;
        equipSpeed += flat.speed;

        const costs = calcUpgradeCost(rarity, !slot.isWeapon, 0, level);
        totalScrap += costs.totalScrap;
        totalSiege += costs.totalSiege;
    });

    const { totalDmgBonus, totalHpBonus, activeBonuses } = getSetBonuses(rarityCounts);

    const statDmgMult = 1 + spDmg * 0.05;
    const statHpMult = 1 + spHp * 0.08;
    const statCritAdd = spCrit * 1;
    const statSpeedReduce = spSpeed * 10;

    const weaponDmgMult = getDmgMult(weaponRarity, weaponUpgradeLevel);
    const charDmgComponent = charBaseDmg * statDmgMult * weaponDmgMult;
    const totalDmgRaw = charDmgComponent + equipDmg;
    const totalDmg = totalDmgRaw * (1 + totalDmgBonus / 100);

    const totalHpRaw = charBaseHp * statHpMult + equipHp;
    const totalHp = totalHpRaw * (1 + totalHpBonus / 100);

    const totalCrit = Math.min(95, equipCrit + cls.critBonus + statCritAdd);
    const totalAtkSpeed = Math.max(400, cls.atkSpeed - equipSpeed - statSpeedReduce);

    const critMultiplier = 1 + (totalCrit / 100) * 0.5;
    const attacksPerSec = 1000 / totalAtkSpeed;
    const doubleStrikeMult = 1 + mDoubleStrike * 0.005;
    const dps = totalDmg * critMultiplier * attacksPerSec * doubleStrikeMult;

    const damageReduction = Math.min(75, mArmor * 0.1);
    const fortifyShield = totalHp * mFortify * 0.0375;
    const effectiveHp = ((totalHp + fortifyShield) / (1 - damageReduction / 100)) * (1 + mSecondWind * 0.20);
    const lifestealPerSec = dps * mLifesteal * 0.0025;

    const tokenBonus = Math.round(
        (RARITY_TOKEN_MULT[weaponRarity] - 1) * 100
        + spToken * 2.5
        + mTokenSurge * 0.75
    );

    const runeDmgPct = parseFloat(document.getElementById('rune-dmg')?.value) || 0;
    const runeHpPct = parseFloat(document.getElementById('rune-hp')?.value) || 0;
    const runeVampPct = parseFloat(document.getElementById('rune-vamp')?.value) || 0;

    const finalDmg = totalDmg * (1 + runeDmgPct / 100) * (1 + catchupBonus / 100);
    const finalHp = totalHp * (1 + runeHpPct / 100) * (1 + catchupBonus / 100);

    const finalFortifyShield = finalHp * mFortify * 0.0375;
    const finalEffectiveHp = ((finalHp + finalFortifyShield) / (1 - damageReduction / 100)) * (1 + mSecondWind * 0.20);

    const finalDps = finalDmg * critMultiplier * attacksPerSec * doubleStrikeMult;
    const totalVampPct = mLifesteal * 0.25 + runeVampPct;
    const finalLifestealPerSec = finalDps * totalVampPct / 100;

    const summary = document.getElementById('builder-summary');
    if (!summary) return;

    const buffLabels = [];
    if (catchupBonus > 0) buffLabels.push(`⚡+${catchupBonus}%`);
    if (runeDmgPct > 0 || runeHpPct > 0 || runeVampPct > 0) buffLabels.push(`🔮 Rune`);
    const buffStr = buffLabels.length
        ? ` <span style="font-size:0.65rem;color:var(--r-rare);font-family:Inter;font-weight:500;margin-left:6px">[${buffLabels.join(' · ')}]</span>`
        : '';

    summary.innerHTML = `
    <div class="results-title" style="margin-bottom:16px">📊 ${cls.label} — Level ${charLevel}${buffStr}</div>

    <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:8px">⚔️ Combat</div>
    <div class="summary-grid" style="margin-bottom:16px">
      <div class="summary-stat">
        <div class="s-label">💥 DPS</div>
        <div class="s-value" style="color:var(--danger)">${fmt(finalDps)}</div>
        <div class="s-detail">${fmtDec(attacksPerSec, 2)} atk/s</div>
      </div>
      <div class="summary-stat">
        <div class="s-label">⚔️ DMG/Hit</div>
        <div class="s-value" style="color:var(--r-mythical)">${fmt(finalDmg)}</div>
        <div class="s-detail">${(runeDmgPct > 0 || catchupBonus > 0) ? `base ${fmt(totalDmg)}` : `×${fmtDec(weaponDmgMult, 2)} mult`}</div>
      </div>
      <div class="summary-stat">
        <div class="s-label">🎯 Crit</div>
        <div class="s-value" style="color:var(--r-epic)">${fmtDec(totalCrit)}%</div>
        <div class="s-detail">${totalCrit >= 95 ? 'CAPPED' : ''}</div>
      </div>
      <div class="summary-stat">
        <div class="s-label">⚡ Atk Speed</div>
        <div class="s-value" style="color:var(--r-uncommon)">${totalAtkSpeed}ms</div>
        <div class="s-detail">${totalAtkSpeed <= 400 ? 'MIN' : ''}</div>
      </div>
    </div>

    <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:8px">🛡️ Survival</div>
    <div class="summary-grid" style="margin-bottom:16px">
      <div class="summary-stat">
        <div class="s-label">❤️ Total HP</div>
        <div class="s-value" style="color:var(--r-rare)">${fmt(finalHp)}</div>
        <div class="s-detail">${(runeHpPct > 0 || catchupBonus > 0) ? `base ${fmt(totalHp)}` : `${fmt(charBaseHp * statHpMult)} char + ${fmt(equipHp)} eq`}</div>
      </div>
      <div class="summary-stat">
        <div class="s-label">🛡️ eHP</div>
        <div class="s-value" style="color:var(--r-legendary)">${fmt(finalEffectiveHp)}</div>
        <div class="s-detail">${fmtDec(damageReduction)}% DR${finalFortifyShield > 0 ? ` +${fmt(finalFortifyShield)} shield` : ''}</div>
      </div>
      <div class="summary-stat">
        <div class="s-label">💚 Lifesteal</div>
        <div class="s-value" style="color:var(--success)">${fmt(finalLifestealPerSec)}/s</div>
        <div class="s-detail">${fmtDec(totalVampPct, 2)}%${runeVampPct > 0 ? ` (${fmtDec(mLifesteal * 0.25)}+${fmtDec(runeVampPct)} rune)` : ''}</div>
      </div>
      <div class="summary-stat">
        <div class="s-label">💫 Second Wind</div>
        <div class="s-value" style="color:var(--r-epic)">${mSecondWind}x</div>
        <div class="s-detail">${mSecondWind > 0 ? `${mSecondWind}×${fmt(finalHp * 0.2)} HP` : 'none'}</div>
      </div>
    </div>

    ${mDoubleStrike + mArmorPen + mBossSlayer + mFinisher + mThorns > 0 ? `
    <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:8px">🌟 Mastery Effects</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px">
      ${mDoubleStrike > 0 ? `<span class="set-bonus-tag" style="background:var(--r-epic-bg);color:var(--r-epic)">Double Strike ${fmtDec(mDoubleStrike * 0.5)}%</span>` : ''}
      ${mArmorPen > 0 ? `<span class="set-bonus-tag" style="background:var(--r-mythical-bg);color:var(--r-mythical)">Armor Pen ${fmtDec(mArmorPen * 0.75)}%</span>` : ''}
      ${mBossSlayer > 0 ? `<span class="set-bonus-tag" style="background:var(--r-legendary-bg);color:var(--r-legendary)">Boss Slayer ${fmtDec(mBossSlayer * 0.1)}%</span>` : ''}
      ${mFinisher > 0 ? `<span class="set-bonus-tag" style="background:var(--r-rare-bg);color:var(--r-rare)">Finisher ${fmtDec(mFinisher * 0.2)}%</span>` : ''}
      ${mThorns > 0 ? `<span class="set-bonus-tag" style="background:var(--r-uncommon-bg);color:var(--r-uncommon)">Thorns ${fmtDec(mThorns * 0.25)}%</span>` : ''}
    </div>` : ''}

    ${activeBonuses.length > 0 ? `
    <div class="set-bonuses">
      <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:6px">🎴 Set Bonuses</div>
      ${activeBonuses.map(b => `
        <span class="set-bonus-tag" style="background:${RARITY_BG[b.rarity]};color:${RARITY_COLORS[b.rarity]}">
          ${RARITY_LABELS[b.rarity]} ${b.count}pc: +${b.dmg}% DMG & HP
        </span>
      `).join('')}
    </div>` : ''}

    <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin:16px 0 8px">💰 Equipment Upgrade Cost</div>
    <div class="summary-grid">
      <div class="summary-stat">
        <div class="s-label">🔩 Scrap</div>
        <div class="s-value" style="color:var(--r-uncommon)">${fmt(totalScrap)}</div>
      </div>
      <div class="summary-stat">
        <div class="s-label">💎 $SIEGE</div>
        <div class="s-value" style="color:var(--r-legendary)">${fmt(totalSiege)}</div>
      </div>
    </div>
  `;
}
