/* ══════════════════════════════════════════
   JMGMS — Payments & Receipts Module
══════════════════════════════════════════ */

const Payments = (() => {
  let _filter = { search: '', month: '', category: '' };

  function render() {
    populateFamilyDropdown();
    setDefaultDates();
    document.querySelector('select.month-select') && (document.querySelector('select.month-select').value = currentMonth());
    renderAll();
    renderMonthlyGrid();
    renderSpecial();
  }

  function renderAll() {
    const db = DB.get();
    let list = db.payments.filter(p => {
      const q = _filter.search.toLowerCase();
      const matchQ = !q || p.id.toLowerCase().includes(q) || p.familyName.toLowerCase().includes(q) || String(p.amount).includes(q);
      const matchM = !_filter.month    || p.month === _filter.month;
      const matchC = !_filter.category || p.category === _filter.category;
      return matchQ && matchM && matchC;
    }).sort((a,b) => b.date.localeCompare(a.date));

    const tb = document.getElementById('payments-tbody');
    if (!tb) return;
    if (list.length === 0) {
      tb.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--muted)">No payments found</td></tr>`;
      return;
    }
    tb.innerHTML = list.map(p => `<tr>
      <td><code class="fs-xs">${p.id}</code></td>
      <td>${p.familyName}</td>
      <td>${badge(p.category, p.type==='monthly'?'green':'blue')}</td>
      <td>${p.month || '—'}</td>
      <td><strong>${fmtCurrency(p.amount)}</strong></td>
      <td>${fmtDate(p.date)}</td>
      <td class="td-actions">
        <button class="btn btn-gold btn-sm" onclick="Payments.viewReceipt('${p.id}')">🧾</button>
        ${Auth.isTreasurer() ? `<button class="btn btn-outline btn-sm" onclick="Payments.remove('${p.id}')">🗑</button>` : ''}
      </td>
    </tr>`).join('');

    // Total row
    const total = list.reduce((s,p) => s + p.amount, 0);
    const sumEl = document.getElementById('payments-total');
    if (sumEl) sumEl.textContent = fmtCurrency(total);
  }

  function renderMonthlyGrid() {
    const db = DB.get();
    const grid = document.getElementById('monthly-chanda-grid');
    if (!grid) return;
    const approved = db.families.filter(f => f.status === 'approved');
    grid.innerHTML = `<div class="table-wrap"><table>
      <thead><tr><th>Family</th>${MONTHS.map(m => `<th style="text-align:center">${m.slice(0,3)}</th>`).join('')}</tr></thead>
      <tbody>${approved.map(f => `<tr>
        <td>
          <strong style="font-size:13px">${f.name.split(' ').slice(0,2).join(' ')}</strong>
          <span class="fs-xs text-muted ml-4">${f.id}</span>
        </td>
        ${MONTHS.map(m => {
          const paid = db.payments.find(p => p.familyId === f.id && p.category === 'Monthly Chanda' && p.month === m);
          return `<td style="text-align:center;cursor:${paid?'pointer':'default'}" onclick="${paid ? `Payments.viewReceipt('${paid.id}')` : `Payments.quickMonthPay('${f.id}','${m}')`}" title="${paid ? 'Click to view receipt' : 'Click to record payment'}">
            ${paid ? `<span title="${fmtCurrency(paid.amount)} — ${fmtDate(paid.date)}">✅</span>` : `<span style="color:var(--cream-dark);font-size:18px">○</span>`}
          </td>`;
        }).join('')}
      </tr>`).join('')}
      </tbody>
    </table></div>`;
  }

  function renderSpecial() {
    const db = DB.get();
    const list = db.payments.filter(p => p.type === 'special').sort((a,b) => b.date.localeCompare(a.date));
    const tb = document.getElementById('special-payments-tbody');
    if (!tb) return;
    tb.innerHTML = list.map(p => `<tr>
      <td><code class="fs-xs">${p.id}</code></td>
      <td>${p.familyName}</td>
      <td>${badge(p.category,'blue')}</td>
      <td><strong>${fmtCurrency(p.amount)}</strong></td>
      <td>${fmtDate(p.date)}</td>
      <td class="td-actions">
        <button class="btn btn-gold btn-sm" onclick="Payments.viewReceipt('${p.id}')">🧾</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted)">No special payments</td></tr>`;
  }

  function populateFamilyDropdown() {
    const db = DB.get();
    const sel = document.getElementById('pay-family');
    if (!sel) return;
    const prev = sel.value;
    const approved = db.families.filter(f => f.status === 'approved');
    sel.innerHTML = '<option value="">— Select Family —</option>' +
      approved.map(f => `<option value="${f.id}">${f.id} — ${f.name}</option>`).join('');
    if (prev) sel.value = prev;
  }

  function prefillFamily(famId) {
    populateFamilyDropdown();
    const sel = document.getElementById('pay-family');
    if (sel) sel.value = famId;
    onCategoryChange();
  }

  function quickMonthPay(famId, month) {
    prefillFamily(famId);
    document.getElementById('pay-category').value = 'Monthly Chanda';
    document.getElementById('pay-month-sel').value = month;
    onCategoryChange();
    openModal('modal-add-payment');
  }

  function onCategoryChange() {
    const cat = document.getElementById('pay-category')?.value;
    const mg  = document.getElementById('month-row');
    if (mg) mg.style.display = cat === 'Monthly Chanda' ? '' : 'none';
  }

  function add() {
    const db = DB.get();
    const famId  = document.getElementById('pay-family').value;
    const cat    = document.getElementById('pay-category').value;
    const month  = document.getElementById('pay-month-sel').value;
    const amount = parseFloat(document.getElementById('pay-amount').value);
    const date   = document.getElementById('pay-date').value || todayISO();
    const mode   = document.getElementById('pay-mode').value;
    const notes  = document.getElementById('pay-notes').value.trim();

    if (!famId)            { toast('Select a family', 'error'); return; }
    if (!amount || amount <= 0) { toast('Enter a valid amount', 'error'); return; }

    const fam = db.families.find(f => f.id === famId);
    const isMonthly = cat === 'Monthly Chanda';

    // Duplicate check for monthly chanda
    if (isMonthly) {
      const dup = db.payments.find(p => p.familyId === famId && p.category === cat && p.month === month);
      if (dup) { toast(`${fam.name} already paid for ${month} (${dup.id})`, 'warn'); return; }
    }

    const typeMap = { 'Monthly Chanda': 'monthly', 'Construction Fund': 'special', 'Water Tank Fund': 'special', 'Ramzan Fund': 'special', 'Madrasa Fund': 'special', 'CCTV Fund': 'special', 'Zakat': 'special', 'Fitra': 'special', 'General Donation': 'special' };
    const type = typeMap[cat] || 'special';
    const counterMap = { 'Monthly Chanda': 'monthly', 'Construction Fund': 'construction', 'General Donation': 'donation' };
    const receiptType = counterMap[cat] || 'special';

    const id = DB.nextReceiptId(receiptType);
    const payment = { id, familyId: famId, familyName: fam.name, category: cat, month: isMonthly ? month : '', amount, date, mode, notes, type };
    db.payments.push(payment);

    // Update fund collected
    const fund = db.funds.find(f => f.name === cat);
    if (fund) fund.collected += amount;

    DB.audit('PAYMENT_ADD', `Payment ${id}: ${fam.name} — ${cat} — ${fmtCurrency(amount)}`);
    DB.save();

    closeModal('modal-add-payment');
    document.getElementById('pay-amount').value = '';
    document.getElementById('pay-notes').value  = '';
    renderAll(); renderMonthlyGrid(); renderSpecial();
    updateDashboardStats();
    Accounts.render();
    Funds.render();
    toast(`Payment recorded — ${id}`, 'success');
    setTimeout(() => viewReceipt(id), 500);
  }

  function remove(id) {
    if (!confirm2(`Delete payment ${id}? This cannot be undone.`)) return;
    const db = DB.get();
    db.payments = db.payments.filter(p => p.id !== id);
    DB.audit('PAYMENT_DELETE', `Deleted payment ${id}`);
    DB.save(); renderAll(); renderMonthlyGrid(); updateDashboardStats();
    toast('Payment deleted', 'info');
  }

  function viewReceipt(payId) {
    const db = DB.get();
    const p = db.payments.find(x => x.id === payId);
    if (!p) return;
    const fam = db.families.find(f => f.id === p.familyId);

    document.getElementById('receipt-content').innerHTML = `
      <div class="receipt-header">
        <div class="receipt-bismillah arabic">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</div>
        <h2>🕌 Jama Masjid Gandhari</h2>
        <p>Gandhari, Kamareddy District, Telangana</p>
        <div class="receipt-num">Receipt No: <strong>${p.id}</strong></div>
      </div>
      <div class="receipt-row"><span class="rkey">Family ID</span><span class="rval">${p.familyId}</span></div>
      <div class="receipt-row"><span class="rkey">Family Name</span><span class="rval">${p.familyName}</span></div>
      <div class="receipt-row"><span class="rkey">Category</span><span class="rval">${p.category}</span></div>
      ${p.month ? `<div class="receipt-row"><span class="rkey">Month</span><span class="rval">${p.month} ${new Date(p.date).getFullYear()}</span></div>` : ''}
      <div class="receipt-row"><span class="rkey">Payment Mode</span><span class="rval">${p.mode}</span></div>
      <div class="receipt-row"><span class="rkey">Date</span><span class="rval">${fmtDate(p.date)}</span></div>
      ${fam?.members ? `<div class="receipt-row"><span class="rkey">Family Members</span><span class="rval">${fam.members}</span></div>` : ''}
      ${p.notes ? `<div class="receipt-row"><span class="rkey">Notes</span><span class="rval">${p.notes}</span></div>` : ''}
      <div class="receipt-total">
        <div style="font-size:12px;opacity:.75;margin-bottom:4px">Amount Received</div>
        <div class="amount">${fmtCurrency(p.amount)}</div>
        <div style="font-size:12px;opacity:.7;margin-top:2px">${numToWords(p.amount)} Rupees Only</div>
        <div class="receipt-dua">Jazakallah Khair — جزاك الله خيرا</div>
      </div>
      <div class="qr-placeholder">QR Code<br><span style="font-size:9px">${p.id}</span></div>
      <div class="receipt-footer">
        Generated by JMGMS v1.0 · ${fmtDateTime(new Date().toISOString())}<br>
        Authorized by: Jama Masjid Gandhari Committee
      </div>`;
    openModal('modal-receipt');
  }

  function setFilter(key, val) { _filter[key] = val; renderAll(); }

  return { render, renderAll, renderMonthlyGrid, populateFamilyDropdown, prefillFamily, quickMonthPay, onCategoryChange, add, remove, viewReceipt, setFilter };
})();
