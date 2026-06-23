/* ══════════════════════════════════════════
   JMGMS — Funds Module
══════════════════════════════════════════ */

const Funds = (() => {
  function render() {
    const db = DB.get();
    const grid = document.getElementById('funds-grid');
    if (!grid) return;

    if (db.funds.length === 0) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🏦</div><h3>No funds created yet</h3><p>Create your first fund to start tracking collections</p></div>`;
      return;
    }

    // Recalculate collected from payments
    db.funds.forEach(f => {
      f.collected = db.payments.filter(p => p.category === f.name && p.type === 'special').reduce((s,p) => s + p.amount, 0);
    });

    grid.innerHTML = db.funds.map(f => {
      const pct = f.target ? Math.min(100, Math.round((f.collected / f.target) * 100)) : 0;
      const bal = f.collected - f.spent;
      return `<div class="fund-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
          <div class="fund-name">${f.name}</div>
          ${Auth.isTreasurer() ? `<button class="btn btn-outline btn-sm" onclick="Funds.edit('${f.id}')">✏️</button>` : ''}
        </div>
        <div class="fund-desc">${f.desc}</div>
        ${f.target ? `
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div class="fund-amounts">
            <span class="fund-collected">${fmtCurrency(f.collected)} collected</span>
            <span class="fund-balance">Target: ${fmtCurrency(f.target)}</span>
          </div>
          <div class="fund-pct">${pct}% of target · Balance: ${fmtCurrency(bal)}</div>` :
        `<div class="fund-amounts">
            <span class="fund-collected">${fmtCurrency(f.collected)} collected</span>
            <span class="fund-balance">Balance: ${fmtCurrency(bal)}</span>
          </div>`}
        <div style="margin-top:12px;display:flex;gap:8px">
          <button class="btn btn-primary btn-sm" onclick="Funds.recordPayment('${f.name}')">+ Collect</button>
          <button class="btn btn-ghost btn-sm" onclick="Funds.recordExpense('${f.id}')">- Expense</button>
        </div>
      </div>`;
    }).join('');
  }

  function add() {
    const name   = document.getElementById('fund-name').value.trim();
    const target = parseFloat(document.getElementById('fund-target').value) || 0;
    const desc   = document.getElementById('fund-desc').value.trim();
    if (!name) { toast('Enter a fund name', 'error'); return; }

    const db = DB.get();
    if (db.funds.find(f => f.name === name)) { toast('A fund with this name already exists', 'error'); return; }

    db.funds.push({ id: 'fund-' + Date.now(), name, desc, target, collected: 0, spent: 0 });
    DB.audit('FUND_ADD', `Created fund: ${name}`);
    DB.save();
    closeModal('modal-add-fund');
    document.getElementById('fund-name').value   = '';
    document.getElementById('fund-target').value = '';
    document.getElementById('fund-desc').value   = '';
    render();
    // Also refresh payment category dropdown
    toast(`Fund "${name}" created`, 'success');
  }

  function edit(fundId) {
    const db = DB.get();
    const f = db.funds.find(x => x.id === fundId);
    if (!f) return;
    document.getElementById('edit-fund-id').value     = f.id;
    document.getElementById('edit-fund-name').value   = f.name;
    document.getElementById('edit-fund-target').value = f.target || '';
    document.getElementById('edit-fund-desc').value   = f.desc  || '';
    document.getElementById('edit-fund-spent').value  = f.spent || 0;
    openModal('modal-edit-fund');
  }

  function saveEdit() {
    const db = DB.get();
    const id = document.getElementById('edit-fund-id').value;
    const f  = db.funds.find(x => x.id === id);
    if (!f) return;
    f.name   = document.getElementById('edit-fund-name').value.trim();
    f.target = parseFloat(document.getElementById('edit-fund-target').value) || 0;
    f.desc   = document.getElementById('edit-fund-desc').value.trim();
    f.spent  = parseFloat(document.getElementById('edit-fund-spent').value)  || 0;
    DB.audit('FUND_EDIT', `Edited fund: ${f.name}`);
    DB.save(); closeModal('modal-edit-fund'); render();
    toast('Fund updated', 'success');
  }

  function remove(fundId) {
    if (!confirm2('Delete this fund?')) return;
    const db = DB.get();
    db.funds = db.funds.filter(f => f.id !== fundId);
    DB.save(); render();
    toast('Fund deleted', 'info');
  }

  function recordPayment(fundName) {
    Payments.populateFamilyDropdown();
    const sel = document.getElementById('pay-category');
    if (sel) sel.value = fundName;
    Payments.onCategoryChange();
    openModal('modal-add-payment');
  }

  function recordExpense(fundId) {
    const db = DB.get();
    const f = db.funds.find(x => x.id === fundId);
    if (!f) return;
    const catSel = document.getElementById('exp-category');
    if (catSel) catSel.value = f.name.includes('Construction') ? 'Construction' : f.name;
    openModal('modal-add-expense');
  }

  function getSummary() {
    const db = DB.get();
    return db.funds.map(f => ({
      name: f.name,
      collected: db.payments.filter(p => p.category === f.name).reduce((s,p) => s + p.amount, 0),
      spent: f.spent,
      target: f.target,
    }));
  }

  return { render, add, edit, saveEdit, remove, recordPayment, recordExpense, getSummary };
})();
