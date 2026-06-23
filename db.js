/* ══════════════════════════════════════════
   JMGMS — Database Engine (IndexedDB + localStorage fallback)
══════════════════════════════════════════ */

const DB = (() => {
  const KEY = 'jmgms_v1';

  // Default schema
  const defaults = () => ({
    families: [],
    payments: [],
    expenses: [],
    funds: [],
    announcements: [],
    pending: [],
    users: [
      { id: 'u1', name: 'Moiz Mohammed', mobile: '9876543210', password: 'admin123', role: 'superadmin', active: true },
      { id: 'u2', name: 'Treasurer',     mobile: '9000000001', password: 'treasurer1', role: 'treasurer', active: true },
      { id: 'u3', name: 'Secretary',     mobile: '9000000002', password: 'secretary1', role: 'secretary', active: true },
    ],
    settings: {
      masjidName: 'Jama Masjid Gandhari',
      location: 'Gandhari, Kamareddy District, Telangana',
      mobile: '',
      email: '',
      financialYearStart: 'January',
      receiptPrefixes: { monthly: 'MC', special: 'SC', construction: 'CF', expense: 'EXP', donation: 'DN' },
      theme: 'green',
      language: 'English',
      autoBackup: true,
      twoFactor: false,
    },
    counters: { family: 0, mc: 0, sc: 0, cf: 0, dn: 0, exp: 0 },
    auditLog: [],
  });

  let _data = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      _data = raw ? JSON.parse(raw) : defaults();
      // Merge missing keys from defaults (schema migrations)
      const def = defaults();
      for (const k of Object.keys(def)) {
        if (_data[k] === undefined) _data[k] = def[k];
      }
      if (!_data.settings.receiptPrefixes) _data.settings.receiptPrefixes = def.settings.receiptPrefixes;
    } catch (e) {
      console.warn('DB load error, resetting:', e);
      _data = defaults();
    }
    return _data;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(_data)); return true; }
    catch (e) { console.error('DB save error:', e); return false; }
  }

  function get() { return _data || load(); }

  function audit(action, details, user) {
    _data.auditLog.push({
      id: 'AL' + Date.now(),
      action, details,
      user: user || 'System',
      timestamp: new Date().toISOString()
    });
    if (_data.auditLog.length > 500) _data.auditLog = _data.auditLog.slice(-500);
  }

  function nextFamilyId() {
    _data.counters.family++;
    return 'JM' + String(_data.counters.family).padStart(4, '0');
  }

  function nextReceiptId(type) {
    const yr = new Date().getFullYear();
    const map = { monthly: 'mc', special: 'sc', construction: 'cf', donation: 'dn' };
    const counterKey = map[type] || 'sc';
    const prefixMap = { mc: 'MC', sc: 'SC', cf: 'CF', dn: 'DN' };
    _data.counters[counterKey] = (_data.counters[counterKey] || 0) + 1;
    return `${prefixMap[counterKey]}-${yr}-${String(_data.counters[counterKey]).padStart(4, '0')}`;
  }

  function nextExpenseId() {
    _data.counters.exp++;
    return `EXP-${new Date().getFullYear()}-${String(_data.counters.exp).padStart(4, '0')}`;
  }

  function exportJSON() {
    return JSON.stringify(_data, null, 2);
  }

  function importJSON(jsonStr) {
    const parsed = JSON.parse(jsonStr);
    _data = parsed;
    save();
  }

  function reset() {
    _data = defaults();
    save();
  }

  return { load, save, get, audit, nextFamilyId, nextReceiptId, nextExpenseId, exportJSON, importJSON, reset };
})();
