export function parseItemStats(text) {
    const stats = {
        rarity: 'common',
        type: 'equipment',
        level: 0,
        hp: 0,
        dmg: 0,
        crit: 0,
        speed: 0
    };

    text = text.trim();
    if (!text) return null;

    // 1. Rarity
    const rarityMatch = text.match(/(common|uncommon|rare|epic|legendary|mythical)/i);
    if (rarityMatch) {
        stats.rarity = rarityMatch[1].toLowerCase();
    }

    // 2. Type
    if (text.match(/weapon|axe|sword|bow|staff|dagger|mace/i)) {
        stats.type = 'weapon';
    } else if (text.match(/equipment|armor|helmet|boots|shield|accessory|ring|amulet/i)) {
        stats.type = 'equipment';
    }

    // 3. Level
    const lvlMatch = text.match(/(?:Upgrade Level)[\r\n]+\+?(\d+)/i) || 
                     text.match(/(?:Lv\.?|Level)\s*(\d+)/i);
    if (lvlMatch) {
        stats.level = parseInt(lvlMatch[1], 10);
    }

    // 4. HP
    const hpInline = text.match(/\+(\d+)[ \t]*HP/i);
    const hpBlock = text.match(/HP[\r\n]+(\d+)/i);
    if (hpInline) stats.hp = parseInt(hpInline[1], 10);
    else if (hpBlock) stats.hp = parseInt(hpBlock[1], 10);

    // 5. DMG
    const dmgInline = text.match(/\+(\d+)[ \t]*DMG/i);
    const dmgBlock = text.match(/(?:DMG|Damage)[\r\n]+(\d+)/i);
    if (dmgInline) stats.dmg = parseInt(dmgInline[1], 10);
    else if (dmgBlock) stats.dmg = parseInt(dmgBlock[1], 10);

    // 6. Crit
    const critInline = text.match(/\+(\d+(?:\.\d+)?)[ \t]*%[ \t]*CRIT/i);
    const critBlock = text.match(/Crit(?: Chance)?[\r\n]+(\d+(?:\.\d+)?)[ \t]*%/i);
    if (critInline) stats.crit = parseFloat(critInline[1]);
    else if (critBlock) stats.crit = parseFloat(critBlock[1]);

    // 7. Speed
    const spdInline = text.match(/\+(\d+)[ \t]*(?:ms)?[ \t]*SPD/i);
    const spdBlock = text.match(/Speed[\r\n]+(\d+)[ \t]*(?:ms)?/i);
    if (spdInline) stats.speed = parseInt(spdInline[1], 10);
    else if (spdBlock) stats.speed = parseInt(spdBlock[1], 10);

    return stats;
}

function highlightElement(el) {
    if (!el) return;
    el.classList.remove('highlight-success');
    void el.offsetWidth; // Trigger reflow to restart animation
    el.classList.add('highlight-success');
    setTimeout(() => {
        el.classList.remove('highlight-success');
    }, 1200);
}

export function applyImportedStats(stats, targetTabPrefix) {
    if (!stats) return false;

    const prefix = targetTabPrefix; // 'fwd' or 'rev'

    // Set Type & Rarity
    const typeEl = document.getElementById(`${prefix}-type`);
    const rarityEl = document.getElementById(`${prefix}-rarity`);
    if (typeEl) {
        typeEl.value = stats.type;
        highlightElement(typeEl);
    }
    if (rarityEl) {
        rarityEl.value = stats.rarity;
        rarityEl.dataset.rarity = stats.rarity;
        highlightElement(rarityEl);
    }

    // Toggle fields based on type
    if (window.toggleWeaponFields) {
        window.toggleWeaponFields(prefix);
    }

    // Set Level
    const levelEl = document.getElementById(prefix === 'fwd' ? 'fwd-from' : 'rev-level');
    const levelSlider = document.getElementById(prefix === 'fwd' ? 'fwd-from-slider' : 'rev-level-slider');
    if (levelEl) {
        levelEl.value = stats.level;
        highlightElement(levelEl);
    }
    if (levelSlider) levelSlider.value = stats.level;

    // VERY IMPORTANT: Sync options FIRST to calculate new allowed stat ranges based on new type/rarity/level
    if (prefix === 'fwd') {
        if (window.syncForwardLevels) window.syncForwardLevels('from');
        if (window.syncForwardOptions) window.syncForwardOptions();
    } else if (prefix === 'rev') {
        if (window.syncReverseOptions) window.syncReverseOptions();
    }

    // Now set the actual imported values
    const hpEl = document.getElementById(`${prefix}-hp`);
    if (hpEl) {
        hpEl.value = stats.hp;
        highlightElement(hpEl);
        if (prefix === 'fwd' && window.updateSliderFromStat) window.updateSliderFromStat('hp');
        if (prefix === 'rev' && window.updateSliderFromStatRev) window.updateSliderFromStatRev('hp');
    }

    const dmgEl = document.getElementById(`${prefix}-dmg`);
    if (dmgEl) {
        dmgEl.value = stats.dmg;
        highlightElement(dmgEl);
        if (prefix === 'fwd' && window.updateSliderFromStat) window.updateSliderFromStat('dmg');
        if (prefix === 'rev' && window.updateSliderFromStatRev) window.updateSliderFromStatRev('dmg');
    }

    if (stats.type === 'weapon') {
        const critEl = document.getElementById(`${prefix}-crit`);
        if (critEl) {
            critEl.value = stats.crit;
            highlightElement(critEl);
            if (prefix === 'fwd' && window.updateSliderFromStat) window.updateSliderFromStat('crit');
            if (prefix === 'rev' && window.updateSliderFromStatRev) window.updateSliderFromStatRev('crit');
        }

        const speedEl = document.getElementById(`${prefix}-speed`);
        if (speedEl) {
            speedEl.value = stats.speed;
            highlightElement(speedEl);
            if (prefix === 'fwd' && window.updateSliderFromStat) window.updateSliderFromStat('speed');
            if (prefix === 'rev' && window.updateSliderFromStatRev) window.updateSliderFromStatRev('speed');
        }
    }

    return true;
}
