/* ══════════════════════════════════════════
   JMGMS — Utilities
══════════════════════════════════════════ */

// ── TOAST ──
function toast(msg, type = 'success') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span>${icons[type] || ''}</span><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.style.opacity = '0', 3000);
  setTimeout(() => el.remove(), 3400);
}

// ── DATE / TIME ──
function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
}
function fmtDateTime(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return d; }
}
function todayISO() { return new Date().toISOString().split('T')[0]; }
function currentMonth() { return new Date().toLocaleString('default', { month: 'long' }); }
function currentYear()  { return new Date().getFullYear(); }
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── CURRENCY ──
function fmtCurrency(n) {
  if (isNaN(n)) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN');
}

// ── MODALS ──
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
function closeAllModals() { document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open')); }

// Close on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});
// Close on Escape
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllModals(); });

// ── TABS ──
function switchTab(btn, panelId) {
  const tabGroup = btn.closest('.tabs');
  tabGroup.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // find all sibling tab panels
  const container = tabGroup.parentElement;
  container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add('active');
}

// ── PAGE NAVIGATION ──
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(btn => {
    if (btn.dataset.page === pageId) btn.classList.add('active');
  });
  // Refresh page data
  if (typeof PAGE_RENDERERS === 'object' && PAGE_RENDERERS[pageId]) {
    PAGE_RENDERERS[pageId]();
  }
}

// ── SIDEBAR TOGGLE ──
function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('collapsed');
}

// ── CONFIRM DIALOG ──
function confirm2(msg) { return window.confirm(msg); }

// ── FORM RESET ──
function resetForm(formOrId) {
  const el = typeof formOrId === 'string' ? document.getElementById(formOrId) : formOrId;
  if (!el) return;
  el.querySelectorAll('input, select, textarea').forEach(f => {
    if (f.type === 'checkbox') f.checked = false;
    else if (f.type === 'date') f.value = todayISO();
    else f.value = '';
  });
}

// ── SET DEFAULT DATES ──
function setDefaultDates() {
  document.querySelectorAll('input[type="date"]').forEach(el => {
    if (!el.value) el.value = todayISO();
  });
  // Set current month in month selects
  document.querySelectorAll('select.month-select').forEach(sel => {
    if (!sel.value) sel.value = currentMonth();
  });
}

// ── POPULATE SELECT ──
function populateSelect(selectId, options, valueKey, labelKey, placeholder) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = placeholder ? `<option value="">${placeholder}</option>` : '';
  options.forEach(opt => {
    const val = valueKey ? opt[valueKey] : opt;
    const lbl = labelKey ? opt[labelKey] : opt;
    sel.innerHTML += `<option value="${val}">${lbl}</option>`;
  });
  if (prev) sel.value = prev;
}

// ── NUMBER TO WORDS (for receipts) ──
function numToWords(num) {
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  if (num === 0) return 'Zero';
  if (num < 20) return a[num];
  if (num < 100) return b[Math.floor(num/10)] + (num%10 ? ' ' + a[num%10] : '');
  if (num < 1000) return a[Math.floor(num/100)] + ' Hundred' + (num%100 ? ' ' + numToWords(num%100) : '');
  if (num < 100000) return numToWords(Math.floor(num/1000)) + ' Thousand' + (num%1000 ? ' ' + numToWords(num%1000) : '');
  if (num < 10000000) return numToWords(Math.floor(num/100000)) + ' Lakh' + (num%100000 ? ' ' + numToWords(num%100000) : '');
  return numToWords(Math.floor(num/10000000)) + ' Crore' + (num%10000000 ? ' ' + numToWords(num%10000000) : '');
}

// ── EXPORT CSV ──
function exportCSV(headers, rows, filename) {
  const lines = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename + '_' + todayISO() + '.csv';
  a.click();
}

// ── EXPORT JSON ──
function exportJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename + '_' + todayISO() + '.json';
  a.click();
}

// ── PRINT SECTION ──
function printSection(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>JMGMS Print</title>
    <link rel="stylesheet" href="css/base.css">
    <link rel="stylesheet" href="css/components.css">
    <link rel="stylesheet" href="css/print.css">
    </head><body style="padding:20px">${el.outerHTML}</body></html>`);
  win.document.close();
  win.onload = () => { win.print(); win.close(); };
}

// ── SEARCH FILTER ──
function filterTable(query, rows, fields) {
  const q = query.toLowerCase().trim();
  if (!q) return rows;
  return rows.filter(row => fields.some(f => String(row[f] || '').toLowerCase().includes(q)));
}

// ── BADGE HTML ──
function badge(text, color) { return `<span class="badge badge-${color}">${text}</span>`; }

// ── STATUS BADGE ──
function statusBadge(status) {
  const map = {
    approved: ['green','Approved'], pending: ['yellow','Pending'],
    rejected: ['red','Rejected'], paid: ['green','Paid'],
    unpaid: ['red','Unpaid'], active: ['green','Active'], inactive: ['gray','Inactive']
  };
  const [color, label] = map[status?.toLowerCase()] || ['gray', status];
  return badge(label, color);
}
