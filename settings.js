/* ══════════════════════════════════════════
   JMGMS — Settings Module
══════════════════════════════════════════ */

const Settings = (() => {
  function render() {
    const db = DB.get();
    const s  = db.settings;
    const setVal = (id, v) => { const el = document.getElementById(id); if (el) { el.type === 'checkbox' ? (el.checked = !!v) : (el.value = v || ''); } };

    setVal('set-masjid-name',   s.masjidName);
    setVal('set-location',      s.location);
    setVal('set-mobile',        s.mobile);
    setVal('set-email',         s.email);
    setVal('set-fy-start',      s.financialYearStart);
    setVal('set-language',      s.language);
    setVal('set-auto-backup',   s.autoBackup);
    setVal('set-2fa',           s.twoFactor);
    setVal('set-prefix-mc',     s.receiptPrefixes?.monthly      || 'MC');
    setVal('set-prefix-sc',     s.receiptPrefixes?.special      || 'SC');
    setVal('set-prefix-cf',     s.receiptPrefixes?.construction || 'CF');
    setVal('set-prefix-dn',     s.receiptPrefixes?.donation     || 'DN');
    setVal('set-prefix-exp',    s.receiptPrefixes?.expense      || 'EXP');

    renderUsers();
  }

  function saveMasjidInfo() {
    const db = DB.get();
    db.settings.masjidName          = document.getElementById('set-masjid-name').value.trim();
    db.settings.location             = document.getElementById('set-location').value.trim();
    db.settings.mobile               = document.getElementById('set-mobile').value.trim();
    db.settings.email                = document.getElementById('set-email').value.trim();
    db.settings.financialYearStart   = document.getElementById('set-fy-start').value;
    db.settings.language             = document.getElementById('set-language').value;
    DB.audit('SETTINGS', 'Masjid info updated');
    DB.save();
    toast('Settings saved', 'success');
  }

  function savePreferences() {
    const db = DB.get();
    db.settings.autoBackup = document.getElementById('set-auto-backup').checked;
    db.settings.twoFactor  = document.getElementById('set-2fa').checked;
    DB.save();
    toast('Preferences saved', 'success');
  }

  function savePrefixes() {
    const db = DB.get();
    db.settings.receiptPrefixes = {
      monthly:      document.getElementById('set-prefix-mc').value.trim()  || 'MC',
      special:      document.getElementById('set-prefix-sc').value.trim()  || 'SC',
      construction: document.getElementById('set-prefix-cf').value.trim()  || 'CF',
      donation:     document.getElementById('set-prefix-dn').value.trim()  || 'DN',
      expense:      document.getElementById('set-prefix-exp').value.trim() || 'EXP',
    };
    DB.audit('SETTINGS', 'Receipt prefixes updated');
    DB.save();
    toast('Receipt prefixes saved', 'success');
  }

  function renderUsers() {
    const db  = DB.get();
    const tb  = document.getElementById('users-tbody');
    if (!tb) return;
    tb.innerHTML = db.users.map(u => `<tr>
      <td>${u.name}</td>
      <td>${u.mobile}</td>
      <td>${badge(Auth.ROLES[u.role]?.label || u.role, Auth.ROLES[u.role]?.color || 'gray')}</td>
      <td>${statusBadge(u.active ? 'active' : 'inactive')}</td>
      <td class="td-actions">
        <button class="btn btn-outline btn-sm" onclick="Settings.editUser('${u.id}')">✏️</button>
        ${u.id !== 'u1' ? `<button class="btn btn-outline btn-sm" onclick="Settings.toggleUser('${u.id}')">${u.active ? '🔒' : '🔓'}</button>` : ''}
      </td>
    </tr>`).join('');
  }

  function addUser() {
    const name   = document.getElementById('new-user-name').value.trim();
    const mobile = document.getElementById('new-user-mobile').value.trim();
    const role   = document.getElementById('new-user-role').value;
    const pass   = document.getElementById('new-user-pass').value;
    if (!name || !mobile || !pass) { toast('Fill all fields', 'error'); return; }

    const db = DB.get();
    if (db.users.find(u => u.mobile === mobile)) { toast('Mobile already registered', 'error'); return; }
    db.users.push({ id: 'u' + Date.now(), name, mobile, password: pass, role, active: true });
    DB.audit('USER_ADD', `Added user: ${name} (${role})`);
    DB.save();
    closeModal('modal-add-user');
    renderUsers();
    toast(`User ${name} added`, 'success');
  }

  function editUser(id) {
    const db = DB.get();
    const u  = db.users.find(x => x.id === id);
    if (!u) return;
    document.getElementById('edit-user-id').value     = u.id;
    document.getElementById('edit-user-name').value   = u.name;
    document.getElementById('edit-user-mobile').value = u.mobile;
    document.getElementById('edit-user-role').value   = u.role;
    document.getElementById('edit-user-pass').value   = '';
    openModal('modal-edit-user');
  }

  function saveEditUser() {
    const db = DB.get();
    const id = document.getElementById('edit-user-id').value;
    const u  = db.users.find(x => x.id === id);
    if (!u) return;
    u.name   = document.getElementById('edit-user-name').value.trim();
    u.mobile = document.getElementById('edit-user-mobile').value.trim();
    u.role   = document.getElementById('edit-user-role').value;
    const newPass = document.getElementById('edit-user-pass').value;
    if (newPass) u.password = newPass;
    DB.audit('USER_EDIT', `Edited user: ${u.name}`);
    DB.save();
    closeModal('modal-edit-user');
    renderUsers();
    toast('User updated', 'success');
  }

  function toggleUser(id) {
    const db = DB.get();
    const u  = db.users.find(x => x.id === id);
    if (!u) return;
    u.active = !u.active;
    DB.audit('USER_TOGGLE', `User ${u.name} ${u.active ? 'activated' : 'deactivated'}`);
    DB.save();
    renderUsers();
    toast(`User ${u.active ? 'activated' : 'deactivated'}`, 'info');
  }

  function backupData() {
    exportJSON(DB.get(), 'JMGMS_Backup');
    DB.audit('BACKUP', 'Manual backup exported');
    toast('Backup downloaded. Google Drive sync in v2.', 'success');
  }

  function importData(input) {
    const file = input.files[0];
    if (!file) return;
    if (!confirm2('This will replace ALL current data. Are you sure?')) { input.value = ''; return; }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        DB.importJSON(e.target.result);
        refreshAll();
        toast('Data restored successfully!', 'success');
      } catch { toast('Invalid backup file. Could not restore.', 'error'); }
    };
    reader.readAsText(file);
    input.value = '';
  }

  function resetApp() {
    if (!confirm2('⚠️ RESET ALL DATA? This cannot be undone!')) return;
    if (!confirm2('Are you absolutely sure? All families, payments and records will be deleted.')) return;
    DB.reset();
    seedData();
    refreshAll();
    toast('App reset to demo data', 'warn');
  }

  function viewAuditLog() {
    const db = DB.get();
    const tb = document.getElementById('audit-log-tbody');
    if (!tb) return;
    const logs = [...db.auditLog].reverse().slice(0, 100);
    tb.innerHTML = logs.map(l => `<tr>
      <td>${fmtDateTime(l.timestamp)}</td>
      <td>${badge(l.action,'blue')}</td>
      <td>${l.details}</td>
      <td>${l.user}</td>
    </tr>`).join('') || '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:24px">No audit logs yet</td></tr>';
    openModal('modal-audit-log');
  }

  return { render, saveMasjidInfo, savePreferences, savePrefixes, renderUsers, addUser, editUser, saveEditUser, toggleUser, backupData, importData, resetApp, viewAuditLog };
})();
