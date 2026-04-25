// ═══════════════════════════════════════════════════════════
// ════════════════════ ENTRY POINT ══════════════════════════
// ═══════════════════════════════════════════════════════════

import { calcForward, toggleWeaponFields, syncForwardOptions, syncForwardLevels, updateStatFromSlider, updateSliderFromStat } from './tabs/forward.js';
import { calcReverse, transferToForward, syncReverseOptions, updateStatFromSliderRev, updateSliderFromStatRev } from './tabs/reverse.js';
import { calcCosts } from './tabs/costs.js';
import {
    initBuilder, updateBuilder, initBookmarklet, doImport,
    stepSp, stepM, resetSkills, resetMastery,
    applyBulkEq, fillDefaultStats,
    setCatchup, stepRune
} from './tabs/builder.js';

// ══════ EXPOSE TO WINDOW (for inline onclick= handlers) ══════
window.calcForward = calcForward;
window.calcReverse = calcReverse;
window.calcCosts = calcCosts;
window.transferToForward = transferToForward;
window.updateBuilder = updateBuilder;
window.stepSp = stepSp;
window.stepM = stepM;
window.resetSkills = resetSkills;
window.resetMastery = resetMastery;
window.applyBulkEq = applyBulkEq;
window.fillDefaultStats = fillDefaultStats;
window.setCatchup = setCatchup;
window.stepRune = stepRune;
window.doImport = doImport;
window.syncForwardOptions = syncForwardOptions;
window.syncForwardLevels = syncForwardLevels;
window.updateStatFromSlider = updateStatFromSlider;
window.updateSliderFromStat = updateSliderFromStat;
window.toggleWeaponFields = toggleWeaponFields;
window.syncReverseOptions = syncReverseOptions;
window.updateStatFromSliderRev = updateStatFromSliderRev;
window.updateSliderFromStatRev = updateSliderFromStatRev;

window.stepSliderBtn = function (sliderId, amount) {
    const slider = document.getElementById(sliderId);
    if (!slider) return;
    const newVal = (parseFloat(slider.value) || 0) + amount;
    if (newVal < parseFloat(slider.min) || newVal > parseFloat(slider.max)) return;
    slider.value = newVal;
    if (slider.oninput) slider.oninput();
};

window.step = function (id, amount) {
    const el = document.getElementById(id);
    if (!el) return;
    const step = parseFloat(el.step) || 1;
    const val = (parseFloat(el.value) || 0) + (amount * step);
    if (el.min !== "" && val < parseFloat(el.min)) return;
    if (el.max !== "" && val > parseFloat(el.max)) return;
    el.value = step < 1 ? val.toFixed(1) : val;
    if (el.onchange) el.onchange();
    if (el.oninput) el.oninput();
};

// ══════ TAB SWITCHING ══════
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
});

// ══════ TOGGLE WEAPON FIELDS ══════
toggleWeaponFields('fwd');
toggleWeaponFields('rev');
if (window.syncForwardOptions) window.syncForwardOptions();
if (window.syncReverseOptions) window.syncReverseOptions();

// ══════ RARITY SELECT COLOR INIT ══════
document.querySelectorAll('.rarity-select').forEach(el => { el.dataset.rarity = el.value; });

// ══════ TIP MODAL ══════
window.openTipModal = function () {
    document.getElementById('tip-modal-overlay').classList.add('open');
};
window.closeTipModal = function () {
    document.getElementById('tip-modal-overlay').classList.remove('open');
};
window.copyToClipboard = async function (text, el) {
    try {
        await navigator.clipboard.writeText(text);
        const originalText = el.textContent;
        el.textContent = '✓ Copied to clipboard!';
        el.style.color = 'var(--success)';
        setTimeout(() => {
            el.textContent = originalText;
            el.style.color = '';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
};

// ══════ BUILDER INIT (when tab is enabled) ══════
// initBuilder();
// initBookmarklet();
