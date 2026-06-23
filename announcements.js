/* ══════════════════════════════════════════
   JMGMS — Announcements Module
══════════════════════════════════════════ */

const Announcements = (() => {
  const TYPE_LABELS = {
    general: 'General',
    meeting: 'Meeting',
    eid:     'Eid Mubarak',
    ramzan:  'Ramzan',
    urgent:  'Urgent / Emergency',
    custom:  'Custom',
  };

  function render() {
    const db = DB.get();
    const list = document.getElementById('announcements-list');
    if (!list) return;

    if (db.announcements.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">📢</div><h3>No announcements yet</h3><p>Post your first announcement for the community</p></div>`;
      return;
    }

    list.innerHTML = [...db.announcements].reverse().map(a => `
      <div class="ann-card ${a.type}" id="ann-${a.id}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div class="ann-type">${TYPE_LABELS[a.type] || a.type}</div>
          ${Auth.isSuperAdmin() || Auth.role() === 'secretary' ? `
            <div style="display:flex;gap:6px">
              <button class="btn btn-outline btn-sm" onclick="Announcements.edit('${a.id}')">✏️</button>
              <button class="btn btn-outline btn-sm" onclick="Announcements.remove('${a.id}')">🗑</button>
            </div>` : ''}
        </div>
        <div class="ann-title">${a.title}</div>
        <div class="ann-body">${a.body}</div>
        <div class="ann-meta">
          <span>📅 ${fmtDate(a.date)}</span>
          ${a.postedBy ? `<span>👤 ${a.postedBy}</span>` : ''}
        </div>
      </div>`).join('');
  }

  function add() {
    const type  = document.getElementById('ann-type').value;
    const title = document.getElementById('ann-title').value.trim();
    const body  = document.getElementById('ann-body').value.trim();
    if (!title) { toast('Enter announcement title', 'error'); return; }
    if (!body)  { toast('Enter announcement message', 'error'); return; }

    const db = DB.get();
    db.announcements.push({
      id:       'ann-' + Date.now(),
      type, title, body,
      date:     todayISO(),
      postedBy: Auth.current()?.name || 'Committee',
    });
    DB.audit('ANN_ADD', `New announcement: ${title}`);
    DB.save();
    closeModal('modal-add-ann');
    document.getElementById('ann-title').value = '';
    document.getElementById('ann-body').value  = '';
    render();
    toast('Announcement published', 'success');
  }

  function edit(id) {
    const db = DB.get();
    const a = db.announcements.find(x => x.id === id);
    if (!a) return;
    document.getElementById('edit-ann-id').value    = a.id;
    document.getElementById('edit-ann-type').value  = a.type;
    document.getElementById('edit-ann-title').value = a.title;
    document.getElementById('edit-ann-body').value  = a.body;
    openModal('modal-edit-ann');
  }

  function saveEdit() {
    const db  = DB.get();
    const id  = document.getElementById('edit-ann-id').value;
    const ann = db.announcements.find(x => x.id === id);
    if (!ann) return;
    ann.type  = document.getElementById('edit-ann-type').value;
    ann.title = document.getElementById('edit-ann-title').value.trim();
    ann.body  = document.getElementById('edit-ann-body').value.trim();
    if (!ann.title || !ann.body) { toast('Title and body are required', 'error'); return; }
    DB.audit('ANN_EDIT', `Edited announcement: ${ann.title}`);
    DB.save();
    closeModal('modal-edit-ann');
    render();
    toast('Announcement updated', 'success');
  }

  function remove(id) {
    if (!confirm2('Delete this announcement?')) return;
    const db = DB.get();
    db.announcements = db.announcements.filter(a => a.id !== id);
    DB.audit('ANN_DELETE', `Deleted announcement ${id}`);
    DB.save();
    render();
    toast('Announcement deleted', 'info');
  }

  return { render, add, edit, saveEdit, remove };
})();
