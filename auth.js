/* ══════════════════════════════════════════
   JMGMS — Authentication & Session
══════════════════════════════════════════ */

const Auth = (() => {
  let _session = null;

  const ROLES = {
    superadmin: { label: 'Super Admin',  color: 'gold',  pages: ['dashboard','families','payments','expenses','funds','accounts','reports','announcements','pending','users','settings'] },
    treasurer:  { label: 'Treasurer',    color: 'blue',  pages: ['dashboard','payments','expenses','funds','accounts','reports','announcements'] },
    secretary:  { label: 'Secretary',    color: 'green', pages: ['dashboard','families','announcements','pending'] },
    sadar:      { label: 'Sadar Sahab',  color: 'purple',pages: ['dashboard','families','expenses','reports','announcements','pending'] },
    family:     { label: 'Family User',  color: 'gray',  pages: ['my-profile','my-payments','announcements'] },
  };

  function login(mobile, password, roleHint) {
    const db = DB.get();
    // Super admin shortcut
    if (mobile === db.users[0].mobile && password === db.users[0].password) {
      _session = { ...db.users[0] };
      _saveSession();
      return { ok: true, user: _session };
    }
    const user = db.users.find(u => u.mobile === mobile && u.password === password && u.active);
    if (!user) return { ok: false, msg: 'Invalid mobile or password' };

    // Role hint for family users (they log in with family mobile too)
    if (roleHint === 'family') {
      const fam = db.families.find(f => f.mobile === mobile);
      if (!fam) return { ok: false, msg: 'Family not found or not approved' };
      if (fam.status !== 'approved') return { ok: false, msg: 'Your registration is pending approval' };
      _session = { id: fam.id, name: fam.name, mobile, role: 'family', familyId: fam.id };
      _saveSession();
      return { ok: true, user: _session };
    }

    _session = { ...user };
    _saveSession();
    return { ok: true, user: _session };
  }

  function loginFamily(mobile, password) {
    const db = DB.get();
    const fam = db.families.find(f => f.mobile === mobile && f.password === password && f.status === 'approved');
    if (!fam) return { ok: false, msg: 'Invalid credentials or not approved' };
    _session = { id: fam.id, name: fam.name, mobile, role: 'family', familyId: fam.id };
    _saveSession();
    return { ok: true, user: _session };
  }

  function logout() { _session = null; sessionStorage.removeItem('jmgms_session'); }

  function _saveSession() { sessionStorage.setItem('jmgms_session', JSON.stringify(_session)); }

  function restoreSession() {
    try {
      const s = sessionStorage.getItem('jmgms_session');
      if (s) _session = JSON.parse(s);
    } catch { _session = null; }
    return _session;
  }

  function current()    { return _session; }
  function isLoggedIn() { return !!_session; }
  function role()       { return _session?.role || null; }
  function roleInfo()   { return ROLES[role()] || ROLES.family; }
  function can(page)    { return roleInfo().pages.includes(page); }
  function isSuperAdmin() { return role() === 'superadmin'; }
  function isTreasurer()  { return ['superadmin','treasurer'].includes(role()); }

  return { login, loginFamily, logout, restoreSession, current, isLoggedIn, role, roleInfo, can, isSuperAdmin, isTreasurer, ROLES };
})();

/* ── AUTH UI ── */
let _loginRole = 'admin';

function setLoginRole(r, btn) {
  _loginRole = r;
  document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const mobileLabel = document.getElementById('login-mobile-label');
  if (mobileLabel) mobileLabel.textContent = r === 'family' ? 'Family Mobile Number' : 'Mobile Number';
}

function doLogin() {
  const mobile = document.getElementById('login-mobile').value.trim();
  const pass   = document.getElementById('login-password').value;
  if (!mobile || !pass) { toast('Enter mobile number and password', 'error'); return; }

  let result;
  if (_loginRole === 'family') {
    // Try family login first, then regular user
    const db = DB.get();
    const fam = db.families.find(f => f.mobile === mobile);
    if (fam) {
      if (fam.status !== 'approved') { toast('Your registration is pending committee approval', 'warn'); return; }
      if (fam.password !== pass)     { toast('Incorrect password', 'error'); return; }
      result = { ok: true, user: { id: fam.id, name: fam.name, mobile, role: 'family', familyId: fam.id } };
      Auth.loginFamily(mobile, pass);
    } else {
      result = Auth.login(mobile, pass, 'family');
    }
  } else {
    result = Auth.login(mobile, pass, _loginRole);
  }

  if (!result.ok) { toast(result.msg || 'Login failed', 'error'); return; }

  renderAuthenticatedUI(result.user);
}

function doLogout() {
  Auth.logout();
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('app-shell').classList.remove('visible');
  document.getElementById('login-password').value = '';
  toast('Logged out. Assalamualaikum!', 'info');
}

function renderAuthenticatedUI(user) {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-shell').classList.add('visible');

  // Set topbar info
  document.getElementById('topbar-name').textContent  = user.name.split(' ').slice(0,2).join(' ');
  document.getElementById('topbar-role').textContent  = Auth.roleInfo().label;
  document.getElementById('topbar-avatar').textContent = user.name[0].toUpperCase();

  // Show/hide nav items based on role
  document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    const page = btn.dataset.page;
    btn.style.display = Auth.can(page) ? 'flex' : 'none';
  });

  // Hide restricted settings sections
  const usersNav = document.querySelector('.nav-item[data-page="users"]');
  if (usersNav) usersNav.style.display = Auth.isSuperAdmin() ? 'flex' : 'none';

  refreshAll();
  showPage('dashboard');
  toast(`Assalamualaikum, ${user.name.split(' ')[0]}! 🕌`, 'success');
}

function showRegisterPanel() {
  const p = document.getElementById('register-panel');
  p.style.display = p.style.display === 'none' ? 'block' : 'none';
}

function showForgotPanel() {
  toast('OTP password recovery — coming in v1.1', 'info');
}

function submitRegistration() {
  const name    = document.getElementById('reg-name').value.trim();
  const mobile  = document.getElementById('reg-mobile').value.trim();
  const addr    = document.getElementById('reg-address').value.trim();
  const members = parseInt(document.getElementById('reg-members').value);
  const doc     = document.getElementById('reg-doc-type').value;
  const pass    = document.getElementById('reg-password').value;

  if (!name || !mobile || !addr || !members || !doc || !pass) {
    toast('Please fill all required fields', 'error'); return;
  }
  if (mobile.length !== 10) { toast('Enter a valid 10-digit mobile number', 'error'); return; }

  const db = DB.get();
  if (db.families.find(f => f.mobile === mobile) || db.pending.find(p => p.mobile === mobile)) {
    toast('This mobile number is already registered', 'error'); return;
  }

  db.pending.push({ name, mobile, address: addr, members, doc, password: pass, submitted: todayISO(), notes: '' });
  DB.audit('REGISTRATION', `New family registration: ${name} (${mobile})`);
  DB.save();

  document.getElementById('register-panel').style.display = 'none';
  toast('Registration submitted! Pending committee approval. جزاك الله خيرا', 'success');
  updatePendingBadge();
}
