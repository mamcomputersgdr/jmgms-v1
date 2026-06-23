/* ══════════════════════════════════════════
   JMGMS — Accounts & Ledger Module
══════════════════════════════════════════ */

const Accounts = (() => {
  let _filterYear = String(currentYear());

  function render() {
    const db = DB.get();
    const totalInc = db.payments.reduce((s,p) => s + p.amount, 0);
    const totalExp = db.expenses.reduce((s,e) => s + e.amount, 0);
    const net = totalInc - totalExp;

    // Stats
    const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setEl('acc-income',  fmtCurrency(totalInc));
    setEl('acc-expense', fmtCurrency(totalExp));
    setEl('acc-net',     fmtCurrency(net));

    const netEl = document.getElementById('acc-net');
    if (netEl) netEl.style.color = net >= 0 ? 'var(--green-mid)' : 'var(--red)';

    renderLedger();
    renderCategoryBreakdown();
  }

  function renderLedger() {
    const db = DB.get();
    const yr = _filterYear;

    const income  = db.payments.filter(p => !yr || p.date.startsWith(yr)).map(p => ({ date: p.date, ref: p.id,  desc: `${p.category}${p.month ? ' — '+p.month : ''} — ${p.familyName}`, type: 'income',  amount: p.amount }));
    const expense = db.expenses.filter(e => !yr || e.date.startsWith(yr)).map(e => ({ date: e.date, ref: e.id,  desc: `${e.category} — ${e.desc}`, type: 'expense', amount: e.amount }));

    const all = [...income, ...expense].sort((a,b) => a.date.localeCompare(b.date));

    let running = 0;
    const tb = document.getElementById('ledger-tbody');
    if (!tb) return;

    if (all.length === 0) {
      tb.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--muted)">No transactions for ${yr}</td></tr>`;
      return;
    }

    tb.innerHTML = [...all].reverse().map(e => {
      // running total built in forward order, shown in reverse
      return null; // placeholder — recalculate below
    });

    // Rebuild with running balance in chronological order
    running = 0;
    const rows = all.map(e => {
      if (e.type === 'income') running += e.amount;
      else running -= e.amount;
      return { ...e, running };
    }).reverse();

    tb.innerHTML = rows.map(e => `<tr>
      <td>${fmtDate(e.date)}</td>
      <td><code class="fs-xs">${e.ref}</code></td>
      <td style="max-width:220px;font-size:13px">${e.desc}</td>
      <td>${badge(e.type === 'income' ? 'Income' : 'Expense', e.type === 'income' ? 'green' : 'red')}</td>
      <td>${e.type === 'income'  ? `<span class="credit">${fmtCurrency(e.amount)}</span>` : '—'}</td>
      <td>${e.type === 'expense' ? `<span class="debit">${fmtCurrency(e.amount)}</span>`  : '—'}</td>
      <td><strong style="color:${e.running>=0?'var(--green-mid)':'var(--red)'}">${fmtCurrency(e.running)}</strong></td>
    </tr>`).join('');
  }

  function renderCategoryBreakdown() {
    const db = DB.get();
    // Income by category
    const incCats = {};
    db.payments.forEach(p => { incCats[p.category] = (incCats[p.category] || 0) + p.amount; });
    const incEl = document.getElementById('income-breakdown');
    if (incEl) {
      const sorted = Object.entries(incCats).sort((a,b) => b[1]-a[1]);
      const total = Object.values(incCats).reduce((s,v) => s+v, 0);
      incEl.innerHTML = sorted.map(([cat, amt]) => {
        const pct = total ? Math.round((amt/total)*100) : 0;
        return `<div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
            <span>${cat}</span><span><strong>${fmtCurrency(amt)}</strong> <span class="text-muted">${pct}%</span></span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>`;
      }).join('');
    }

    // Expense by category
    const expCats = {};
    db.expenses.forEach(e => { expCats[e.category] = (expCats[e.category] || 0) + e.amount; });
    const expEl = document.getElementById('expense-breakdown');
    if (expEl) {
      const sorted = Object.entries(expCats).sort((a,b) => b[1]-a[1]);
      const total = Object.values(expCats).reduce((s,v) => s+v, 0);
      expEl.innerHTML = sorted.map(([cat, amt]) => {
        const pct = total ? Math.round((amt/total)*100) : 0;
        return `<div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
            <span>${cat}</span><span><strong>${fmtCurrency(amt)}</strong> <span class="text-muted">${pct}%</span></span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:linear-gradient(90deg,var(--red),#e74c3c)"></div></div>
        </div>`;
      }).join('');
    }
  }

  function setYear(yr) { _filterYear = yr; renderLedger(); }

  function exportLedger() {
    const db = DB.get();
    const rows = [
      ...db.payments.map(p => [p.date, p.id, p.familyName, p.category, p.month||'', 'Income', p.amount, p.mode]),
      ...db.expenses.map(e => [e.date, e.id, '', e.category, '', 'Expense', e.amount, e.mode]),
    ].sort((a,b) => a[0].localeCompare(b[0]));
    exportCSV(['Date','Ref#','Party','Category','Month','Type','Amount','Mode'], rows, 'JMGMS_Ledger');
    toast('Ledger exported as CSV', 'success');
  }

  return { render, renderLedger, setYear, exportLedger };
})();
