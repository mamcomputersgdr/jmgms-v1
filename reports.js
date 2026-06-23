/* ══════════════════════════════════════════
   JMGMS — Reports Module
══════════════════════════════════════════ */

const Reports = (() => {
  function render() {
    document.getElementById('report-output')?.classList.add('hidden');
  }

  function generate(type) {
    const box = document.getElementById('report-output');
    const titleEl = document.getElementById('report-title');
    const content = document.getElementById('report-content');
    if (!box || !titleEl || !content) return;
    box.classList.remove('hidden');

    const db = DB.get();
    const yr = document.getElementById('report-year')?.value || currentYear();
    const mo = document.getElementById('report-month-sel')?.value || currentMonth();

    switch (type) {
      case 'monthly':    _monthly(db, mo, yr, titleEl, content); break;
      case 'yearly':     _yearly(db, yr, titleEl, content);  break;
      case 'pending':    _pending(db, mo, titleEl, content);  break;
      case 'expense':    _expense(db, yr, titleEl, content);  break;
      case 'fund':       _fund(db, titleEl, content);          break;
      case 'audit':      _audit(db, titleEl, content);         break;
      case 'family':     _family(db, titleEl, content);        break;
    }
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function _monthly(db, month, year, titleEl, content) {
    titleEl.textContent = `Monthly Chanda — ${month} ${year}`;
    const pays = db.payments.filter(p => p.category === 'Monthly Chanda' && p.month === month && p.date.startsWith(String(year)));
    const paidIds = pays.map(p => p.familyId);
    const approved = db.families.filter(f => f.status === 'approved');
    const unpaid = approved.filter(f => !paidIds.includes(f.id));
    const total = pays.reduce((s,p) => s+p.amount, 0);

    content.innerHTML = `
      <div style="display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap">
        <div class="stat-card" style="flex:1;min-width:120px"><div class="stat-icon">✅</div><div class="stat-value">${pays.length}</div><div class="stat-label">Paid</div></div>
        <div class="stat-card red" style="flex:1;min-width:120px"><div class="stat-icon">⭕</div><div class="stat-value">${unpaid.length}</div><div class="stat-label">Unpaid</div></div>
        <div class="stat-card gold" style="flex:1;min-width:120px"><div class="stat-icon">💰</div><div class="stat-value">${fmtCurrency(total)}</div><div class="stat-label">Collected</div></div>
      </div>
      <h4 style="margin-bottom:10px;color:var(--green-deep)">✅ Paid Families</h4>
      <div class="table-wrap"><table>
        <thead><tr><th>Family ID</th><th>Name</th><th>Amount</th><th>Date</th><th>Mode</th><th>Receipt</th></tr></thead>
        <tbody>${pays.map(p => `<tr>
          <td><code>${p.familyId}</code></td><td>${p.familyName}</td>
          <td>${fmtCurrency(p.amount)}</td><td>${fmtDate(p.date)}</td><td>${p.mode}</td>
          <td><code class="fs-xs">${p.id}</code></td>
        </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--muted)">None</td></tr>'}
        </tbody>
        <tfoot><tr><td colspan="2"><strong>Total</strong></td><td><strong>${fmtCurrency(total)}</strong></td><td colspan="3"></td></tr></tfoot>
      </table></div>
      ${unpaid.length ? `<h4 style="margin:20px 0 10px;color:var(--red)">⭕ Unpaid Families (${unpaid.length})</h4>
      <div class="table-wrap"><table>
        <thead><tr><th>Family ID</th><th>Name</th><th>Mobile</th><th>Members</th></tr></thead>
        <tbody>${unpaid.map(f => `<tr><td><code>${f.id}</code></td><td>${f.name}</td><td>${f.mobile}</td><td>${f.members}</td></tr>`).join('')}
        </tbody>
      </table></div>` : ''}`;
  }

  function _yearly(db, year, titleEl, content) {
    titleEl.textContent = `Yearly Summary — ${year}`;
    const pays = db.payments.filter(p => p.date.startsWith(String(year)));
    const exps = db.expenses.filter(e => e.date.startsWith(String(year)));
    const totalInc = pays.reduce((s,p) => s+p.amount, 0);
    const totalExp = exps.reduce((s,e) => s+e.amount, 0);
    const net = totalInc - totalExp;

    // Monthly breakdown
    const monthData = MONTHS.map(m => {
      const inc = pays.filter(p => p.month === m || (p.date && new Date(p.date).toLocaleString('default',{month:'long'}) === m)).reduce((s,p) => s+p.amount, 0);
      const exp = exps.filter(e => new Date(e.date).toLocaleString('default',{month:'long'}) === m).reduce((s,e) => s+e.amount, 0);
      return { month: m, income: inc, expense: exp, net: inc - exp };
    });

    content.innerHTML = `
      <div style="display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap">
        <div class="stat-card gold" style="flex:1"><div class="stat-icon">⬇️</div><div class="stat-value">${fmtCurrency(totalInc)}</div><div class="stat-label">Total Income</div></div>
        <div class="stat-card red"  style="flex:1"><div class="stat-icon">⬆️</div><div class="stat-value">${fmtCurrency(totalExp)}</div><div class="stat-label">Total Expense</div></div>
        <div class="stat-card"      style="flex:1"><div class="stat-icon">💵</div><div class="stat-value" style="color:${net>=0?'var(--green-mid)':'var(--red)'}">${fmtCurrency(net)}</div><div class="stat-label">Net Balance</div></div>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Month</th><th>Income</th><th>Expense</th><th>Net</th></tr></thead>
        <tbody>${monthData.map(m => `<tr>
          <td>${m.month}</td>
          <td class="credit">${m.income ? fmtCurrency(m.income) : '—'}</td>
          <td class="debit">${m.expense ? fmtCurrency(m.expense) : '—'}</td>
          <td style="color:${m.net>=0?'var(--green-mid)':'var(--red)'}"><strong>${(m.income||m.expense) ? fmtCurrency(m.net) : '—'}</strong></td>
        </tr>`).join('')}
        </tbody>
        <tfoot><tr><td><strong>Total</strong></td><td class="credit"><strong>${fmtCurrency(totalInc)}</strong></td><td class="debit"><strong>${fmtCurrency(totalExp)}</strong></td><td><strong style="color:${net>=0?'var(--green-mid)':'var(--red)'}">${fmtCurrency(net)}</strong></td></tr></tfoot>
      </table></div>`;
  }

  function _pending(db, month, titleEl, content) {
    titleEl.textContent = `Pending Chanda — ${month} ${currentYear()}`;
    const paidIds = db.payments.filter(p => p.category === 'Monthly Chanda' && p.month === month).map(p => p.familyId);
    const unpaid  = db.families.filter(f => f.status === 'approved' && !paidIds.includes(f.id));
    content.innerHTML = `
      <p style="margin-bottom:16px;color:var(--muted)">${unpaid.length} of ${db.families.filter(f=>f.status==='approved').length} families yet to pay for ${month}</p>
      <div class="table-wrap"><table>
        <thead><tr><th>Family ID</th><th>Name</th><th>Mobile</th><th>Members</th><th>Action</th></tr></thead>
        <tbody>${unpaid.map(f => `<tr>
          <td><code>${f.id}</code></td><td>${f.name}</td><td>${f.mobile}</td><td>${f.members}</td>
          <td><button class="btn btn-primary btn-sm" onclick="Payments.quickMonthPay('${f.id}','${month}');closeModal('modal-report-filters')">Pay Now</button></td>
        </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--green-mid);padding:24px">✅ All families paid!</td></tr>'}
        </tbody>
      </table></div>`;
  }

  function _expense(db, year, titleEl, content) {
    titleEl.textContent = `Expense Report — ${year}`;
    const exps = db.expenses.filter(e => !year || e.date.startsWith(String(year)));
    const cats = {};
    exps.forEach(e => { cats[e.category] = (cats[e.category] || 0) + e.amount; });
    const total = exps.reduce((s,e) => s+e.amount, 0);
    content.innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr><th>Category</th><th>Total Amount</th><th>Share</th></tr></thead>
        <tbody>${Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([cat,amt]) => `<tr>
          <td>${badge(cat,'red')}</td>
          <td><strong>${fmtCurrency(amt)}</strong></td>
          <td>${total ? Math.round((amt/total)*100) : 0}%</td>
        </tr>`).join('')}
        </tbody>
        <tfoot><tr><td><strong>Grand Total</strong></td><td><strong>${fmtCurrency(total)}</strong></td><td>100%</td></tr></tfoot>
      </table></div>
      <h4 style="margin:20px 0 10px;color:var(--green-deep)">All Transactions</h4>
      <div class="table-wrap"><table>
        <thead><tr><th>Voucher</th><th>Category</th><th>Description</th><th>Amount</th><th>Date</th><th>Mode</th></tr></thead>
        <tbody>${exps.sort((a,b)=>b.date.localeCompare(a.date)).map(e => `<tr>
          <td><code class="fs-xs">${e.id}</code></td><td>${e.category}</td><td>${e.desc}</td>
          <td>${fmtCurrency(e.amount)}</td><td>${fmtDate(e.date)}</td><td>${e.mode}</td>
        </tr>`).join('')}
        </tbody>
      </table></div>`;
  }

  function _fund(db, titleEl, content) {
    titleEl.textContent = 'Fund Report';
    const funds = db.funds.map(f => ({
      ...f,
      collected: db.payments.filter(p => p.category === f.name && p.type === 'special').reduce((s,p)=>s+p.amount,0)
    }));
    content.innerHTML = funds.map(f => {
      const bal = f.collected - f.spent;
      const pct = f.target ? Math.min(100, Math.round((f.collected/f.target)*100)) : 0;
      return `<div class="fund-card" style="margin-bottom:16px">
        <div class="fund-name">${f.name}</div>
        <div class="fund-desc">${f.desc}</div>
        ${f.target ? `<div class="progress-bar" style="margin:10px 0"><div class="progress-fill" style="width:${pct}%"></div></div>` : ''}
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:10px;text-align:center">
          <div><div style="font-size:11px;color:var(--muted)">TARGET</div><div style="font-weight:700">${f.target ? fmtCurrency(f.target) : '—'}</div></div>
          <div><div style="font-size:11px;color:var(--muted)">COLLECTED</div><div style="font-weight:700;color:var(--green-mid)">${fmtCurrency(f.collected)}</div></div>
          <div><div style="font-size:11px;color:var(--muted)">SPENT</div><div style="font-weight:700;color:var(--red)">${fmtCurrency(f.spent)}</div></div>
          <div><div style="font-size:11px;color:var(--muted)">BALANCE</div><div style="font-weight:700;color:${bal>=0?'var(--green-mid)':'var(--red)'}">${fmtCurrency(bal)}</div></div>
        </div>
      </div>`;
    }).join('') || '<p class="text-muted">No funds created yet</p>';
  }

  function _audit(db, titleEl, content) {
    titleEl.textContent = 'Audit Report — All Transactions';
    const all = [
      ...db.payments.map(p => ({ date: p.date, ref: p.id, type: 'Income',  party: p.familyName, desc: `${p.category}${p.month?' — '+p.month:''}`, amount: p.amount })),
      ...db.expenses.map(e => ({ date: e.date, ref: e.id, type: 'Expense', party: '',            desc: `${e.category} — ${e.desc}`,                 amount: e.amount })),
    ].sort((a,b) => b.date.localeCompare(a.date));
    content.innerHTML = `<p style="margin-bottom:12px;color:var(--muted)">${all.length} total transactions</p>
      <div class="table-wrap"><table>
        <thead><tr><th>Date</th><th>Ref#</th><th>Type</th><th>Party</th><th>Description</th><th>Amount</th></tr></thead>
        <tbody>${all.map(x => `<tr>
          <td>${fmtDate(x.date)}</td>
          <td><code class="fs-xs">${x.ref}</code></td>
          <td>${badge(x.type, x.type==='Income'?'green':'red')}</td>
          <td>${x.party || '—'}</td>
          <td style="font-size:13px">${x.desc}</td>
          <td><strong>${fmtCurrency(x.amount)}</strong></td>
        </tr>`).join('')}
        </tbody>
      </table></div>`;
  }

  function _family(db, titleEl, content) {
    titleEl.textContent = 'Family Directory Report';
    const families = db.families.sort((a,b) => a.id.localeCompare(b.id));
    content.innerHTML = `<div class="table-wrap"><table>
      <thead><tr><th>Family ID</th><th>Head Name</th><th>Mobile</th><th>Address</th><th>Members</th><th>Status</th><th>Reg. Date</th></tr></thead>
      <tbody>${families.map(f => `<tr>
        <td><code>${f.id}</code></td><td>${f.name}</td><td>${f.mobile}</td>
        <td>${f.address}</td><td>${f.members}</td>
        <td>${statusBadge(f.status)}</td><td>${fmtDate(f.regDate)}</td>
      </tr>`).join('')}
      </tbody>
    </table></div>`;
  }

  function doExportCSV() {
    const db = DB.get();
    const rows = [
      ...db.payments.map(p => [p.date, p.id, 'Income',  p.familyName, p.category, p.month||'', p.amount, p.mode]),
      ...db.expenses.map(e => [e.date, e.id, 'Expense', '',           e.category, '',          e.amount, e.mode]),
    ].sort((a,b) => a[0].localeCompare(b[0]));
    exportCSV(['Date','Ref#','Type','Party','Category','Month','Amount','Mode'], rows, 'JMGMS_Report');
    toast('Report exported as CSV', 'success');
  }

  return { render, generate, doExportCSV };
})();
