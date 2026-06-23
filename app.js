/* ══════════════════════════════════════════
   JMGMS — App Entry Point & Dashboard
══════════════════════════════════════════ */

// ── PAGE RENDERER MAP ──
const PAGE_RENDERERS = {
  dashboard:     updateDashboard,
  families:      () => Families.render(),
  payments:      () => Payments.render(),
  expenses:      () => Expenses.render(),
  funds:         () => Funds.render(),
  accounts:      () => Accounts.render(),
  reports:       () => Reports.render(),
  announcements: () => Announcements.render(),
  pending:       renderPending,
  settings:      () => Settings.render(),
};

// ── REFRESH ALL ──
function refreshAll() {
  updateDashboardStats();
  updatePendingBadge();
}

// ── DASHBOARD ──
function updateDashboard() {
  updateDashboardStats();

  const db = DB.get();
  const now = new Date();

  // Date
  const dateEl = document.getElementById('dashboard-date');
  if (dateEl) dateEl.textContent = now.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  // Recent payments
  const recent = [...db.payments].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 6);
  const rtb = document.getElementById('recent-payments-tbody');
  if (rtb) {
    rtb.innerHTML = recent.length === 0
      ? '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--muted)">No payments yet</td></tr>'
      : recent.map(p => `<tr>
          <td><strong>${p.familyName.split(' ').slice(0,2).join(' ')}</strong></td>
          <td>${badge(p.category, p.type==='monthly'?'green':'blue')}</td>
          <td><strong>${fmtCurrency(p.amount)}</strong></td>
          <td>${fmtDate(p.date)}</td>
        </tr>`).join('');
  }

  // Pending summary
  const ps = document.getElementById('pending-summary');
  if (ps) {
    ps.innerHTML = db.pending.length === 0
      ? `<div class="empty-state" style="padding:24px"><div class="empty-icon">✅</div><h3>No pending approvals</h3></div>`
      : db.pending.slice(0,4).map(p => `
          <div style="padding:10px 0;border-bottom:1px solid var(--cream-dark)">
            <div style="font-weight:600;font-size:13.5px">${p.name}</div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px">${p.mobile} · ${p.members} members · ${badge('Pending','yellow')}</div>
          </div>`).join('') + (db.pending.length > 4 ? `<p style="font-size:12px;color:var(--muted);padding-top:8px">+${db.pending.length-4} more</p>` : '');
  }

  // Monthly chanda overview
  const curMonth = currentMonth();
  const approved = db.families.filter(f => f.status === 'approved');
  const paidIds  = db.payments.filter(p => p.category==='Monthly Chanda' && p.month===curMonth).map(p => p.familyId);
  const moEl = document.getElementById('monthly-overview');
  if (moEl) {
    const pct = approved.length ? Math.round((paidIds.length / approved.length) * 100) : 0;
    moEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:10px">
        <span style="font-size:13px;color:var(--muted)">${curMonth} — <strong>${paidIds.length}</strong> of <strong>${approved.length}</strong> families paid</span>
        <span style="font-size:13px;font-weight:700;color:var(--green-mid)">${pct}%</span>
      </div>
      <div class="progress-bar" style="margin-bottom:14px"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${approved.map(f => {
          const paid = paidIds.includes(f.id);
          return `<div style="display:flex;align-items:center;gap:5px;padding:5px 10px;background:var(--cream);border-radius:var(--radius-sm);font-size:12px;font-weight:600;cursor:pointer"
            onclick="${paid ? '' : `Payments.quickMonthPay('${f.id}','${curMonth}')`}"
            title="${paid ? 'Paid' : 'Click to record payment'}">
            <span>${paid ? '✅' : '⭕'}</span>
            <span>${f.name.split(' ').slice(0,2).join(' ')}</span>
          </div>`;
        }).join('')}
      </div>`;
  }

  // Recent expenses
  const expTb = document.getElementById('recent-expenses-tbody');
  if (expTb) {
    const recentExp = [...db.expenses].sort((a,b) => b.date.localeCompare(a.date)).slice(0,4);
    expTb.innerHTML = recentExp.map(e => `<tr>
      <td>${badge(e.category,'red')}</td>
      <td>${fmtCurrency(e.amount)}</td>
      <td>${fmtDate(e.date)}</td>
    </tr>`).join('') || '<tr><td colspan="3" style="text-align:center;padding:16px;color:var(--muted)">No expenses</td></tr>';
  }
}

function updateDashboardStats() {
  const db = DB.get();
  const totalCollected = db.payments.reduce((s,p) => s + p.amount, 0);
  const totalExpenses  = db.expenses.reduce((s,e) => s + e.amount, 0);
  const balance        = totalCollected - totalExpenses;
  const approvedFams   = db.families.filter(f => f.status === 'approved').length;

  const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setEl('stat-collected', fmtCurrency(totalCollected));
  setEl('stat-families',  approvedFams);
  setEl('stat-expenses',  fmtCurrency(totalExpenses));
  setEl('stat-balance',   fmtCurrency(balance));

  const balEl = document.getElementById('stat-balance');
  if (balEl) balEl.style.color = balance >= 0 ? 'var(--ink)' : 'var(--red)';
}

// ── PENDING APPROVALS ──
function renderPending() {
  const db = DB.get();
  const tb = document.getElementById('pending-tbody');
  if (!tb) return;

  if (db.pending.length === 0) {
    tb.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">
      <div style="font-size:36px;margin-bottom:8px">✅</div>No pending registrations</td></tr>`;
    return;
  }

  tb.innerHTML = db.pending.map((p, i) => `<tr>
    <td><strong>${p.name}</strong></td>
    <td>${p.mobile}</td>
    <td style="font-size:13px">${p.address}</td>
    <td style="text-align:center">${p.members}</td>
    <td>${badge(p.doc,'gray')}</td>
    <td>${fmtDate(p.submitted)}</td>
    <td class="td-actions">
      <button class="btn btn-primary btn-sm" onclick="approveFamily(${i})">✅ Approve</button>
      <button class="btn btn-danger btn-sm"  onclick="rejectFamily(${i})">✕ Reject</button>
    </td>
  </tr>`).join('');
}

function approveFamily(i) {
  const db = DB.get();
  const p  = db.pending[i];
  if (!p) return;
  const id = DB.nextFamilyId();
  db.families.push({ id, name: p.name, mobile: p.mobile, mobile2: '', address: p.address, members: p.members, status: 'approved', doc: p.doc, regDate: todayISO(), notes: p.notes || '', password: p.password || 'family123' });
  db.pending.splice(i, 1);
  DB.audit('FAMILY_APPROVE', `Approved family ${id}: ${p.name}`);
  DB.save();
  renderPending();
  updatePendingBadge();
  updateDashboardStats();
  toast(`Family approved — ${id} 🎉`, 'success');
}

function rejectFamily(i) {
  if (!confirm2('Reject this registration? The applicant will need to re-apply.')) return;
  const db = DB.get();
  const p  = db.pending[i];
  DB.audit('FAMILY_REJECT', `Rejected registration: ${p.name}`);
  db.pending.splice(i, 1);
  DB.save();
  renderPending();
  updatePendingBadge();
  toast('Registration rejected', 'info');
}

function updatePendingBadge() {
  const db    = DB.get();
  const count = db.pending.length;
  const badge = document.getElementById('pending-badge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  DB.load();
  seedData();

  // Restore session if available
  const session = Auth.restoreSession();
  if (session) {
    renderAuthenticatedUI(session);
  }

  updatePendingBadge();
  console.log('🕌 JMGMS v1.0 loaded — Bismillah!');
});
