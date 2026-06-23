/* ══════════════════════════════════════════
   JMGMS — Expenses Module
══════════════════════════════════════════ */

const Expenses = (() => {
  let _filter = { search: '', category: '' };

  const CATEGORIES = ['Electricity','Water','Internet','Imam Salary','Muazzin Salary','Cleaner Salary','Maintenance','CCTV','Construction','Ramzan','Stationery','Miscellaneous'];

  function render() {
    setDefaultDates();
    populateCategoryFilter();
    renderList();
  }

  function populateCategoryFilter() {
    const sel = document.getElementById('exp-cat-filter');
    if (!sel || sel.options.length > 1) return;
    CATEGORIES.forEach(c => sel.innerHTML += `<option>${c}</option>`);
  }

  function renderList() {
    const db = DB.get();
    let list = db.expenses.filter(e => {
      const q = _filter.search.toLowerCase();
      const matchQ = !q || e.id.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || (e.desc||'').toLowerCase().includes(q);
      const matchC = !_filter.category || e.category === _filter.category;
      return matchQ && matchC;
    }).sort((a,b) => b.date.localeCompare(a.date));

    const tb = document.getElementById('expenses-tbody');
    if (!tb) return;

    if (list.length === 0) {
      tb.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--muted)">No expenses found</td></tr>`;
      return;
    }

    tb.innerHTML = list.map(e => `<tr>
      <td><code class="fs-xs">${e.id}</code></td>
      <td>${badge(e.category, 'red')}</td>
      <td>${e.desc || '—'}</td>
      <td>${e.mode}</td>
      <td><strong>${fmtCurrency(e.amount)}</strong></td>
      <td>${fmtDate(e.date)}</td>
      <td class="td-actions">
        <button class="btn btn-ghost btn-sm" onclick="Expenses.viewVoucher('${e.id}')">📄</button>
        ${Auth.isTreasurer() ? `<button class="btn btn-outline btn-sm" onclick="Expenses.remove('${e.id}')">🗑</button>` : ''}
      </td>
    </tr>`).join('');

    const total = list.reduce((s,e) => s + e.amount, 0);
    const sumEl = document.getElementById('expenses-total');
    if (sumEl) sumEl.textContent = fmtCurrency(total);
  }

  function add() {
    const db = DB.get();
    const cat    = document.getElementById('exp-category').value;
    const amount = parseFloat(document.getElementById('exp-amount').value);
    const date   = document.getElementById('exp-date').value || todayISO();
    const mode   = document.getElementById('exp-mode').value;
    const desc   = document.getElementById('exp-desc').value.trim();

    if (!cat)                 { toast('Select a category', 'error'); return; }
    if (!amount || amount<=0) { toast('Enter a valid amount', 'error'); return; }

    const id = DB.nextExpenseId();
    db.expenses.push({ id, category: cat, desc: desc || cat, amount, date, mode });
    DB.audit('EXPENSE_ADD', `Expense ${id}: ${cat} — ${fmtCurrency(amount)}`);
    DB.save();

    closeModal('modal-add-expense');
    document.getElementById('exp-amount').value = '';
    document.getElementById('exp-desc').value   = '';
    renderList();
    updateDashboardStats();
    Accounts.render();
    toast(`Expense ${id} recorded`, 'success');
  }

  function remove(id) {
    if (!confirm2(`Delete expense ${id}?`)) return;
    const db = DB.get();
    db.expenses = db.expenses.filter(e => e.id !== id);
    DB.audit('EXPENSE_DELETE', `Deleted expense ${id}`);
    DB.save(); renderList(); updateDashboardStats(); Accounts.render();
    toast('Expense deleted', 'info');
  }

  function viewVoucher(expId) {
    const db = DB.get();
    const e = db.expenses.find(x => x.id === expId);
    if (!e) return;
    document.getElementById('voucher-content').innerHTML = `
      <div class="receipt-header">
        <div class="receipt-bismillah arabic">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</div>
        <h2>🕌 Jama Masjid Gandhari</h2>
        <p>Gandhari, Kamareddy District, Telangana</p>
        <div class="receipt-num">Expense Voucher: <strong>${e.id}</strong></div>
      </div>
      <div class="receipt-row"><span class="rkey">Category</span><span class="rval">${e.category}</span></div>
      <div class="receipt-row"><span class="rkey">Description</span><span class="rval">${e.desc}</span></div>
      <div class="receipt-row"><span class="rkey">Payment Mode</span><span class="rval">${e.mode}</span></div>
      <div class="receipt-row"><span class="rkey">Date</span><span class="rval">${fmtDate(e.date)}</span></div>
      <div class="receipt-total" style="background:var(--red)">
        <div style="font-size:12px;opacity:.75;margin-bottom:4px">Amount Paid</div>
        <div class="amount">${fmtCurrency(e.amount)}</div>
        <div style="font-size:12px;opacity:.7;margin-top:2px">${numToWords(e.amount)} Rupees Only</div>
      </div>
      <div class="receipt-footer" style="margin-top:32px;display:flex;justify-content:space-between;padding-top:12px;border-top:1px solid var(--cream-dark)">
        <span>Authorized By: ________________</span>
        <span>Received By: ________________</span>
      </div>
      <div class="receipt-footer">Generated by JMGMS v1.0 · ${fmtDateTime(new Date().toISOString())}</div>`;
    openModal('modal-voucher');
  }

  function setFilter(key, val) { _filter[key] = val; renderList(); }
  function getCategories() { return CATEGORIES; }

  return { render, renderList, add, remove, viewVoucher, setFilter, getCategories };
})();
