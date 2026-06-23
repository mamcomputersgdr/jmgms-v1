/* ══════════════════════════════════════════
   JMGMS — Families Module
══════════════════════════════════════════ */

const Families = (() => {
  let _filter = { search: '', status: 'all' };

  function render() {
    const db = DB.get();
    let list = db.families.filter(f => {
      const q = _filter.search.toLowerCase();
      const matchQ = !q || f.name.toLowerCase().includes(q) || f.mobile.includes(q) || f.id.toLowerCase().includes(q) || (f.address||'').toLowerCase().includes(q);
      const matchS = _filter.status === 'all' || f.status === _filter.status;
      return matchQ && matchS;
    });

    const curMonth = currentMonth();
    const tb = document.getElementById('families-tbody');
    if (!tb) return;

    if (list.length === 0) {
      tb.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--muted)">No families found</td></tr>`;
      return;
    }

    tb.innerHTML = list.map(f => {
      const paid = db.payments.find(p => p.familyId === f.id && p.category === 'Monthly Chanda' && p.month === curMonth);
      const totalPaid = db.payments.filter(p => p.familyId === f.id).reduce((s,p) => s + p.amount, 0);
      return `<tr>
        <td><code>${f.id}</code></td>
        <td>
          <strong>${f.name}</strong><br>
          <span class="fs-xs text-muted">${f.address || ''}</span>
        </td>
        <td>${f.mobile}${f.mobile2 ? `<br><span class="fs-xs text-muted">${f.mobile2}</span>` : ''}</td>
        <td style="text-align:center">${f.members}</td>
        <td>${statusBadge(f.status)}</td>
        <td>${paid ? badge('Paid ✓','green') : badge('Unpaid','red')}</td>
        <td>${fmtCurrency(totalPaid)}</td>
        <td class="td-actions">
          <button class="btn btn-ghost btn-sm" onclick="Families.view('${f.id}')">👁</button>
          <button class="btn btn-primary btn-sm" onclick="Families.quickPay('${f.id}')">💰 Pay</button>
          ${Auth.isSuperAdmin() ? `<button class="btn btn-outline btn-sm" onclick="Families.edit('${f.id}')">✏️</button>` : ''}
        </td>
      </tr>`;
    }).join('');

    // Summary
    const summaryEl = document.getElementById('families-summary');
    if (summaryEl) {
      const total = db.families.length;
      const approved = db.families.filter(f => f.status==='approved').length;
      summaryEl.textContent = `${total} families · ${approved} approved · ${total - approved} pending`;
    }
  }

  function view(id) {
    const db = DB.get();
    const f = db.families.find(x => x.id === id);
    if (!f) return;
    const payments = db.payments.filter(p => p.familyId === id);
    const total = payments.reduce((s,p) => s + p.amount, 0);
    const paidMonths = payments.filter(p => p.category === 'Monthly Chanda').map(p => p.month);

    document.getElementById('view-fam-id').textContent      = f.id;
    document.getElementById('view-fam-name').textContent    = f.name;
    document.getElementById('view-fam-mobile').textContent  = f.mobile + (f.mobile2 ? ` / ${f.mobile2}` : '');
    document.getElementById('view-fam-address').textContent = f.address || '—';
    document.getElementById('view-fam-members').textContent = f.members;
    document.getElementById('view-fam-status').innerHTML    = statusBadge(f.status);
    document.getElementById('view-fam-doc').textContent     = f.doc || '—';
    document.getElementById('view-fam-regdate').textContent = fmtDate(f.regDate);
    document.getElementById('view-fam-total').textContent   = fmtCurrency(total);
    document.getElementById('view-fam-notes').textContent   = f.notes || '—';

    // Payments list
    const pl = document.getElementById('view-fam-payments');
    if (pl) {
      pl.innerHTML = payments.length === 0
        ? '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:16px">No payments yet</td></tr>'
        : [...payments].reverse().map(p => `<tr>
            <td><code class="fs-xs">${p.id}</code></td>
            <td>${p.category}</td>
            <td>${p.month || '—'}</td>
            <td>${fmtCurrency(p.amount)}</td>
            <td>${fmtDate(p.date)}</td>
          </tr>`).join('');
    }

    openModal('modal-view-family');
  }

  function edit(id) {
    const db = DB.get();
    const f = db.families.find(x => x.id === id);
    if (!f) return;
    document.getElementById('edit-fam-id').value      = f.id;
    document.getElementById('edit-fam-name').value    = f.name;
    document.getElementById('edit-fam-mobile').value  = f.mobile;
    document.getElementById('edit-fam-mobile2').value = f.mobile2 || '';
    document.getElementById('edit-fam-address').value = f.address || '';
    document.getElementById('edit-fam-members').value = f.members;
    document.getElementById('edit-fam-status').value  = f.status;
    document.getElementById('edit-fam-notes').value   = f.notes || '';
    openModal('modal-edit-family');
  }

  function saveEdit() {
    const db = DB.get();
    const id = document.getElementById('edit-fam-id').value;
    const f  = db.families.find(x => x.id === id);
    if (!f) return;
    f.name    = document.getElementById('edit-fam-name').value.trim();
    f.mobile  = document.getElementById('edit-fam-mobile').value.trim();
    f.mobile2 = document.getElementById('edit-fam-mobile2').value.trim();
    f.address = document.getElementById('edit-fam-address').value.trim();
    f.members = parseInt(document.getElementById('edit-fam-members').value) || 1;
    f.status  = document.getElementById('edit-fam-status').value;
    f.notes   = document.getElementById('edit-fam-notes').value.trim();
    DB.audit('FAMILY_EDIT', `Edited family ${id}`);
    DB.save(); closeModal('modal-edit-family'); render();
    toast('Family record updated', 'success');
  }

  function add() {
    const db = DB.get();
    const name    = document.getElementById('fam-name').value.trim();
    const mobile  = document.getElementById('fam-mobile').value.trim();
    const mobile2 = document.getElementById('fam-mobile2').value.trim();
    const addr    = document.getElementById('fam-address').value.trim();
    const members = parseInt(document.getElementById('fam-members').value) || 1;
    const doc     = document.getElementById('fam-doc').value;
    const status  = document.getElementById('fam-status-add').value;
    const notes   = document.getElementById('fam-notes-add').value.trim();

    if (!name || !mobile) { toast('Name and mobile number are required', 'error'); return; }
    if (mobile.length !== 10) { toast('Enter a valid 10-digit mobile number', 'error'); return; }
    if (db.families.find(f => f.mobile === mobile)) { toast('This mobile number is already registered', 'error'); return; }

    const id = DB.nextFamilyId();
    db.families.push({ id, name, mobile, mobile2, address: addr, members, status, doc, regDate: todayISO(), notes, password: 'family123' });
    DB.audit('FAMILY_ADD', `Added family ${id}: ${name}`);
    DB.save();
    closeModal('modal-add-family');
    resetForm('form-add-family');
    render();
    updateDashboardStats();
    toast(`Family ${id} added successfully! جزاك الله خيرا`, 'success');
  }

  function quickPay(famId) {
    Payments.prefillFamily(famId);
    openModal('modal-add-payment');
  }

  function setFilter(key, val) { _filter[key] = val; render(); }

  return { render, view, edit, saveEdit, add, quickPay, setFilter };
})();
