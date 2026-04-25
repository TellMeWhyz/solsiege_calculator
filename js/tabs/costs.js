// ═══════════════════════════════════════════════════════════
// ══════════════ TAB: UPGRADE COSTS ═════════════════════════
// ═══════════════════════════════════════════════════════════

import { RARITY_LABELS } from '../data.js';
import { calcUpgradeCost, fmt } from '../utils.js';

export function calcCosts() {
    const type = document.getElementById('cost-type').value;
    const rarity = document.getElementById('cost-rarity').value;
    const target = parseInt(document.getElementById('cost-target').value) || 50;
    const isEquip = type === 'equipment';
    const costs = calcUpgradeCost(rarity, isEquip, 0, target);

    const milestones = [];
    for (let i = 0; i < costs.details.length; i++) {
        if ((i + 1) % 5 === 0 || i === costs.details.length - 1 || i < 5) {
            milestones.push(costs.details[i]);
        }
    }

    const res = document.getElementById('cost-results');
    res.classList.remove('hidden');
    res.innerHTML = `
    <div class="results-title">📋 Cost: +0 → +${target} (${RARITY_LABELS[rarity]} ${isEquip ? 'Equipment' : 'Weapon'})</div>
    <div style="overflow-x:auto">
    <table class="cost-table">
      <thead><tr>
        <th>Level</th>
        <th>Scrap/lvl</th>
        <th>$SIEGE/lvl</th>
        <th>Total Scrap</th>
        <th>Total $SIEGE</th>
      </tr></thead>
      <tbody>
        ${milestones.map(d => `<tr>
          <td style="color:var(--gold)">+${d.level}</td>
          <td>${fmt(d.scrap)}</td>
          <td>${fmt(d.siege)}</td>
          <td style="color:var(--r-uncommon)">${fmt(d.totalScrap)}</td>
          <td style="color:var(--r-legendary)">${fmt(d.totalSiege)}</td>
        </tr>`).join('')}
        <tr class="total-row">
          <td>TOTAL</td>
          <td></td>
          <td></td>
          <td>${fmt(costs.totalScrap)}</td>
          <td>${fmt(costs.totalSiege)}</td>
        </tr>
      </tbody>
    </table>
    </div>
    ${target > 100 ? `<div style="margin-top:12px;padding:10px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;font-size:0.75rem;color:var(--danger)">
      ⚠️ Levels above +100 have a <strong>50% burn chance</strong> per upgrade. Use Upgrade Scrolls (100K $SIEGE each) to protect your items.
    </div>` : ''}
  `;
}
