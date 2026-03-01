// ─── journal.js ───────────────────────────────────────────────────────────────
// Full rewrite: DB-backed entries, working voice, search, mood chart, all fixes
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

class Journal {
  constructor() {
    this.entries     = [];
    this.reminders   = [];
    this.token       = localStorage.getItem('token');
    this.user        = JSON.parse(localStorage.getItem('user') || '{}');
    this.isRecording = false;
    this.recognition = null;
    this.transcript  = '';
    this.draftTimer  = null;
    this.currentCalendarDate = new Date();

    if (!this.token) {
      window.location.replace('login.html');
      return;
    }

    document.addEventListener('DOMContentLoaded', () => this.init());
  }

  // ─── INIT ────────────────────────────────────────────────────────────────
  async init() {
    this.setupEventListeners();
    this.loadReminders();
    this.updateCalendar(this.currentCalendarDate);
    await this.fetchEntries();
    this.setupVoiceRecognition();
    this.restoreDraft();
  }

  // ─── API HELPERS ─────────────────────────────────────────────────────────
  async apiFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...(options.headers || {})
      }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  // ─── FETCH ENTRIES FROM DB ────────────────────────────────────────────────
  async fetchEntries(filter = 'all', search = '') {
    this.showListLoader();
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('filter', filter);
      if (search)           params.set('search', search);

      const data = await this.apiFetch(`/journals?${params.toString()}`);
      this.entries = data.journals || [];

      this.updateStats(data.stats || {});
      this.updateDashboardStats();
      this.displayEntries(this.entries);
      this.updateCalendar(this.currentCalendarDate);
    } catch (err) {
      this.showNotification('Could not load journal entries. Please try again.', 'error');
      this.displayEntries([]);
    }
  }

  // ─── CREATE / UPDATE ENTRY ────────────────────────────────────────────────
  async saveEntry(entryData, editingId = null) {
    const btn = document.querySelector('#journalForm .btn-primary');
    btn.textContent = 'Saving…';
    btn.disabled    = true;

    try {
      if (editingId) {
        await this.apiFetch(`/journals/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(entryData)
        });
        this.showNotification('Entry updated! ✨', 'success');
      } else {
        await this.apiFetch('/journals', {
          method: 'POST',
          body: JSON.stringify(entryData)
        });
        this.showNotification('Entry saved! 📝', 'success');
      }

      this.clearDraft();
      this.closeNewEntryForm();
      const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
      await this.fetchEntries(activeFilter);
    } catch (err) {
      this.showNotification(err.message || 'Could not save entry. Please try again.', 'error');
    } finally {
      btn.textContent = 'Save Entry';
      btn.disabled    = false;
    }
  }

  // ─── DELETE ENTRY ─────────────────────────────────────────────────────────
  async deleteEntry(id) {
    this.showDeleteModal(id);
  }

  async confirmDelete(id) {
    this.closeDeleteModal();
    try {
      await this.apiFetch(`/journals/${id}`, { method: 'DELETE' });
      this.showNotification('Entry deleted.', 'success');
      const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
      await this.fetchEntries(activeFilter);
    } catch (err) {
      this.showNotification('Could not delete entry. Try again.', 'error');
    }
  }

  // ─── EVENT LISTENERS ──────────────────────────────────────────────────────
  setupEventListeners() {
    // Action buttons
    this.on('newEntryBtn',    'click', () => this.openNewEntryForm());
    this.on('voiceEntryBtn',  'click', () => this.toggleVoiceEntry());
    this.on('promptsBtn',     'click', () => this.openPrompts());
    this.on('closeFormBtn',   'click', () => this.closeNewEntryForm());
    this.on('closePromptsBtn','click', () => this.closePrompts());
    this.on('cancelEntry',    'click', () => this.closeNewEntryForm());
    this.on('cancelReminder', 'click', () => this.closeReminderModal());
    this.on('addReminderBtn', 'click', () => this.openReminderModal());

    // Form submissions
    this.on('journalForm',  'submit', e => this.handleJournalSubmit(e));
    this.on('reminderForm', 'submit', e => this.handleReminderSubmit(e));

    // Search
    this.on('searchInput', 'input', () => this.handleSearch());

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const search = document.getElementById('searchInput')?.value || '';
        this.fetchEntries(btn.dataset.filter, search);
      });
    });

    // Mood buttons (event delegation on the form)
    document.addEventListener('click', e => {
      const moodBtn = e.target.closest('.mood-btn');
      if (moodBtn) {
        e.preventDefault();
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
        moodBtn.classList.add('active');
        const el = document.getElementById('selectedMood');
        if (el) el.value = moodBtn.dataset.mood;
      }

      // Writing prompt use
      const promptBtn = e.target.closest('.use-prompt-btn');
      if (promptBtn) {
        this.usePrompt(promptBtn.dataset.prompt);
      }

      // Delete confirmation
      if (e.target.id === 'confirmDeleteBtn') {
        const id = parseInt(e.target.dataset.id);
        this.confirmDelete(id);
      }
      if (e.target.id === 'cancelDeleteBtn') {
        this.closeDeleteModal();
      }

      // Modal backdrop close
      if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
      }
    });

    // Mood nudge on save attempt
    this.on('journalForm', 'submit', () => {
      if (!document.getElementById('selectedMood')?.value) {
        document.querySelector('.mood-selector')?.classList.add('mood-nudge');
        setTimeout(() => document.querySelector('.mood-selector')?.classList.remove('mood-nudge'), 1200);
      }
    });

    // Modal close (×) buttons
    document.querySelectorAll('.modal .close').forEach(btn => {
      btn.addEventListener('click', () => btn.closest('.modal').style.display = 'none');
    });

    // Calendar navigation
    this.on('prevMonth', 'click', () => this.navigateCalendar(-1));
    this.on('nextMonth', 'click', () => this.navigateCalendar(1));

    // Auto-save draft every 30s
    this.on('entryContent', 'input', () => {
      clearTimeout(this.draftTimer);
      this.draftTimer = setTimeout(() => this.saveDraft(), 30000);
    });
  }

  on(id, event, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  }

  // ─── DISPLAY ENTRIES ──────────────────────────────────────────────────────
  displayEntries(entries) {
    const list = document.getElementById('entriesList');
    if (!list) return;

    list.innerHTML = '';

    if (!entries || entries.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>No journal entries found</h3>
          <p>Start writing your first journal entry!</p>
          <button class="action-btn primary" id="emptyStateBtn" style="margin-top:1rem;max-width:220px;">
            ✏️ Write Your First Entry
          </button>
        </div>`;
      this.on('emptyStateBtn', 'click', () => this.openNewEntryForm());
      return;
    }

    entries.forEach(entry => list.appendChild(this.createEntryCard(entry)));
  }

  createEntryCard(entry) {
    const card = document.createElement('div');
    card.className = 'entry-card';
    card.dataset.id = entry.id;

    const preview = entry.content.length > 160
      ? entry.content.slice(0, 160) + '…'
      : entry.content;

    const voiceBadge = entry.is_voice_entry
      ? `<span class="voice-badge">🎤 Voice</span>` : '';

    const tags = (entry.tags || []).length > 0
      ? `<div class="entry-tags">${entry.tags.map(t => `<span class="tag">${this.escapeHtml(t)}</span>`).join('')}</div>`
      : '';

    card.innerHTML = `
      <div class="entry-header">
        <div>
          <h3 class="entry-title">${this.escapeHtml(entry.title)} ${voiceBadge}</h3>
          ${tags}
        </div>
        <div class="entry-date">${this.formatDate(entry.entry_date)}</div>
      </div>
      <div class="entry-preview">${this.escapeHtml(preview)}</div>
      <div class="entry-footer">
        <div class="entry-mood" title="Mood">${entry.mood || '😊'}</div>
        <div class="entry-actions">
          <button class="entry-btn edit"   data-action="edit"   data-id="${entry.id}">Edit</button>
          <button class="entry-btn delete" data-action="delete" data-id="${entry.id}">Delete</button>
        </div>
      </div>`;

    // Event delegation on the card
    card.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) { this.viewEntry(entry.id); return; }
      e.stopPropagation();
      if (btn.dataset.action === 'edit')   this.editEntry(entry.id);
      if (btn.dataset.action === 'delete') this.deleteEntry(entry.id);
    });

    return card;
  }

  // ─── FORM OPEN / CLOSE ────────────────────────────────────────────────────
  openNewEntryForm(promptText = '') {
    this.showSection('journalFormSection');
    this.hideSection('entriesSection');
    this.hideSection('promptsSection');

    const form  = document.getElementById('journalForm');
    const title = document.getElementById('formTitle');

    form.reset();
    delete form.dataset.editingId;
    form.querySelectorAll('input, textarea').forEach(el => el.disabled = false);
    document.querySelectorAll('.mood-btn').forEach(b => { b.classList.remove('active'); b.disabled = false; });
    document.getElementById('selectedMood').value = '';
    document.getElementById('entryDate').value = new Date().toISOString().split('T')[0];
    document.querySelector('#journalForm .btn-primary').style.display = '';
    document.getElementById('cancelEntry').textContent = 'Cancel';
    document.getElementById('wordCount').textContent = '0 words';
    title.textContent = 'New Journal Entry';

    if (promptText) {
      document.getElementById('entryContent').value = promptText;
      this.updateWordCount();
    }

    this.restoreDraft();
    document.getElementById('entryTitle').focus();

    // Word count live update
    document.getElementById('entryContent').oninput = () => this.updateWordCount();
  }

  closeNewEntryForm() {
    this.showSection('entriesSection');
    this.hideSection('journalFormSection');
    this.hideSection('promptsSection');
    this.stopVoiceRecording();
  }

  openPrompts() {
    this.showSection('promptsSection');
    this.showSection('entriesSection');
    this.hideSection('journalFormSection');
  }

  closePrompts() {
    this.hideSection('promptsSection');
  }

  usePrompt(text) {
    this.openNewEntryForm(text);
  }

  // ─── FORM SUBMIT ─────────────────────────────────────────────────────────
  async handleJournalSubmit(e) {
    e.preventDefault();

    const form      = document.getElementById('journalForm');
    const editingId = form.dataset.editingId || null;
    const mood      = document.getElementById('selectedMood').value;

    if (!mood) {
      document.querySelector('.mood-selector').classList.add('mood-nudge');
      setTimeout(() => document.querySelector('.mood-selector').classList.remove('mood-nudge'), 1200);
      this.showNotification('Please pick a mood before saving 😊', 'info');
      return;
    }

    const tagsRaw = (document.getElementById('entryTags')?.value || '')
      .split(',').map(t => t.trim()).filter(Boolean);

    const entryData = {
      title:          document.getElementById('entryTitle').value.trim(),
      content:        document.getElementById('entryContent').value.trim(),
      mood,
      tags:           tagsRaw,
      entry_date:     document.getElementById('entryDate').value,
      is_voice_entry: form.dataset.voiceEntry === 'true'
    };

    await this.saveEntry(entryData, editingId ? parseInt(editingId) : null);
  }

  // ─── VIEW / EDIT ENTRY ────────────────────────────────────────────────────
  viewEntry(id) {
    const entry = this.entries.find(e => e.id === id);
    if (!entry) return;

    this.openNewEntryForm();
    document.getElementById('formTitle').textContent = 'View Journal Entry';
    this.fillForm(entry);
    document.getElementById('journalForm').querySelectorAll('input, textarea').forEach(el => el.disabled = true);
    document.querySelectorAll('.mood-btn').forEach(b => b.disabled = true);
    document.querySelector('#journalForm .btn-primary').style.display = 'none';
    document.getElementById('cancelEntry').textContent = 'Close';
  }

  editEntry(id) {
    const entry = this.entries.find(e => e.id === id);
    if (!entry) return;

    this.openNewEntryForm();
    document.getElementById('formTitle').textContent = 'Edit Entry';
    document.getElementById('journalForm').dataset.editingId = id;
    this.fillForm(entry);
  }

  fillForm(entry) {
    document.getElementById('entryDate').value    = entry.entry_date?.split('T')[0] || entry.entry_date;
    document.getElementById('entryTitle').value   = entry.title;
    document.getElementById('entryContent').value = entry.content;
    document.getElementById('selectedMood').value = entry.mood;
    if (document.getElementById('entryTags'))
      document.getElementById('entryTags').value = (entry.tags || []).join(', ');

    document.querySelectorAll('.mood-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mood === entry.mood);
    });

    this.updateWordCount();
  }

  // ─── WORD COUNT ───────────────────────────────────────────────────────────
  updateWordCount() {
    const text  = document.getElementById('entryContent')?.value || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const el    = document.getElementById('wordCount');
    if (el) el.textContent = `${words} word${words !== 1 ? 's' : ''}`;
  }

  // ─── DRAFT AUTO-SAVE ─────────────────────────────────────────────────────
  saveDraft() {
    const title   = document.getElementById('entryTitle')?.value;
    const content = document.getElementById('entryContent')?.value;
    if (!title && !content) return;

    localStorage.setItem('journalDraft', JSON.stringify({
      title, content,
      mood: document.getElementById('selectedMood')?.value,
      savedAt: new Date().toISOString()
    }));
    this.showNotification('Draft auto-saved 💾', 'info');
  }

  restoreDraft() {
    const raw = localStorage.getItem('journalDraft');
    if (!raw) return;

    try {
      const draft = JSON.parse(raw);
      const savedAt = new Date(draft.savedAt);
      const ageMin  = (Date.now() - savedAt) / 60000;
      if (ageMin > 60) { this.clearDraft(); return; } // discard drafts older than 1h

      const titleEl   = document.getElementById('entryTitle');
      const contentEl = document.getElementById('entryContent');
      if (!titleEl || !contentEl) return;

      // Only restore if fields are empty (new form)
      if (!titleEl.value && !contentEl.value) {
        titleEl.value   = draft.title   || '';
        contentEl.value = draft.content || '';
        if (draft.mood) {
          document.getElementById('selectedMood').value = draft.mood;
          document.querySelectorAll('.mood-btn').forEach(b => b.classList.toggle('active', b.dataset.mood === draft.mood));
        }
        this.updateWordCount();
        this.showNotification('Draft restored from ' + savedAt.toLocaleTimeString() + ' 📄', 'info');
      }
    } catch (_) {}
  }

  clearDraft() {
    localStorage.removeItem('journalDraft');
    clearTimeout(this.draftTimer);
  }

  // ─── SEARCH ───────────────────────────────────────────────────────────────
  handleSearch() {
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      const search = document.getElementById('searchInput')?.value || '';
      const filter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
      this.fetchEntries(filter, search);
    }, 400);
  }

  // ─── STATS ────────────────────────────────────────────────────────────────
  updateStats(stats) {
    const s = stats || {};
    this.setText('totalEntries', s.total || this.entries.length);
    this.setText('thisWeek',     s.this_week || 0);
    this.setText('remindersCount', this.reminders.filter(r => {
      const today = new Date().toISOString().split('T')[0];
      return r.date === today && !r.completed;
    }).length);
  }

  updateDashboardStats() {
    localStorage.setItem('journalCount',  this.entries.length);
    localStorage.setItem('weeklyCount',   this.entries.filter(e => {
      const d = new Date(e.entry_date || e.date);
      return (Date.now() - d) < 7 * 86400000;
    }).length);
    localStorage.setItem('reminderCount', this.reminders.filter(r => {
      return r.date === new Date().toISOString().split('T')[0] && !r.completed;
    }).length);
    window.dispatchEvent(new Event('storage'));
  }

  setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // ─── VOICE ENTRY ─────────────────────────────────────────────────────────
  setupVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const btn = document.getElementById('voiceEntryBtn');
      if (btn) {
        btn.title   = 'Voice entry not supported in your browser';
        btn.style.opacity = '0.5';
        btn.style.cursor  = 'not-allowed';
      }
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous      = true;
    this.recognition.interimResults  = true;
    this.recognition.lang            = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.isRecording = true;
      this.updateVoiceUI(true);
    };

    this.recognition.onresult = e => {
      let interim = '';
      let final   = '';

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        e.results[i].isFinal ? (final += t) : (interim += t);
      }

      if (final) this.transcript += final + ' ';

      const preview = document.getElementById('voicePreview');
      if (preview) {
        preview.textContent = (this.transcript + interim).trim() || 'Listening…';
      }
    };

    this.recognition.onerror = e => {
      const msgs = {
        'not-allowed':   'Microphone access was denied. Please allow microphone access in your browser settings.',
        'no-speech':     'No speech detected. Please try again.',
        'audio-capture': 'No microphone found. Please connect a microphone.',
        'network':       'Network error during speech recognition.'
      };
      this.showNotification(msgs[e.error] || `Voice error: ${e.error}`, 'error');
      this.stopVoiceRecording();
    };

    this.recognition.onend = () => {
      if (this.isRecording) {
        // Auto-restart if user didn't manually stop
        try { this.recognition.start(); } catch (_) {}
      }
    };
  }

  toggleVoiceEntry() {
    if (!this.recognition) {
      this.showNotification('Voice entry is not supported in your browser. Try Chrome or Edge.', 'error');
      return;
    }

    if (this.isRecording) {
      this.stopVoiceRecording();
    } else {
      this.startVoiceRecording();
    }
  }

  startVoiceRecording() {
    this.transcript = '';

    // Open the form first, then show voice panel
    const formSection = document.getElementById('journalFormSection');
    if (!formSection || formSection.style.display === 'none') {
      this.openNewEntryForm();
    }

    this.showVoicePanel();

    try {
      this.recognition.start();
    } catch (e) {
      this.showNotification('Could not start microphone. Please try again.', 'error');
    }
  }

  stopVoiceRecording() {
    this.isRecording = false;
    if (this.recognition) {
      try { this.recognition.stop(); } catch (_) {}
    }
    this.updateVoiceUI(false);
  }

  showVoicePanel() {
    let panel = document.getElementById('voicePanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id        = 'voicePanel';
      panel.className = 'voice-panel';
      panel.innerHTML = `
        <div class="voice-panel-inner">
          <div class="voice-indicator">
            <div class="voice-pulse"></div>
            <span class="voice-label">🎤 Listening…</span>
          </div>
          <div id="voicePreview" class="voice-preview">Start speaking…</div>
          <div class="voice-panel-actions">
            <button class="voice-stop-btn" id="voiceStopBtn">⏹ Stop & Use Text</button>
            <button class="voice-cancel-btn" id="voiceCancelBtn">✕ Cancel</button>
          </div>
        </div>`;

      // Insert before the form
      const form = document.getElementById('journalForm');
      form.parentNode.insertBefore(panel, form);

      document.getElementById('voiceStopBtn').addEventListener('click', () => {
        this.stopVoiceRecording();
        const final = this.transcript.trim();
        if (final) {
          const content = document.getElementById('entryContent');
          content.value += (content.value ? '\n\n' : '') + final;
          document.getElementById('journalForm').dataset.voiceEntry = 'true';
          this.updateWordCount();
          this.showNotification('Voice text added to your entry! ✅', 'success');
        }
        panel.remove();
      });

      document.getElementById('voiceCancelBtn').addEventListener('click', () => {
        this.stopVoiceRecording();
        this.transcript = '';
        panel.remove();
      });
    }
  }

  updateVoiceUI(recording) {
    const btn   = document.getElementById('voiceEntryBtn');
    const panel = document.getElementById('voicePanel');

    if (btn) {
      btn.innerHTML = recording
        ? '<span class="btn-icon">⏹</span> Stop Recording'
        : '<span class="btn-icon">🎤</span> Voice Entry';
      btn.classList.toggle('recording', recording);
    }

    if (panel) {
      const label = panel.querySelector('.voice-label');
      const pulse = panel.querySelector('.voice-pulse');
      if (label) label.textContent = recording ? '🎤 Listening…' : '⏸ Paused';
      if (pulse) pulse.classList.toggle('active', recording);
    }
  }

  // ─── REMINDERS (localStorage) ─────────────────────────────────────────────
  loadReminders() {
    try {
      this.reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
    } catch (_) {
      this.reminders = [];
    }
    this.displayReminders();
  }

  displayReminders() {
    const today    = new Date().toISOString().split('T')[0];
    const todayR   = this.reminders.filter(r => r.date === today);
    const list     = document.getElementById('remindersList');
    const countEl  = document.getElementById('remindersCount');

    if (countEl) countEl.textContent = todayR.length;
    if (!list)   return;

    if (todayR.length === 0) {
      list.innerHTML = `<div class="empty-state" style="padding:1.5rem;"><div class="empty-icon">⏰</div><p>No reminders for today</p></div>`;
      return;
    }

    list.innerHTML = '';
    todayR.sort((a, b) => a.time.localeCompare(b.time)).forEach(r => {
      const item = document.createElement('div');
      item.className = `reminder-item ${r.completed ? 'done' : ''}`;
      item.innerHTML = `
        <div class="reminder-check">${r.completed ? '✅' : '⬜'}</div>
        <div class="reminder-body">
          <div class="reminder-time">${this.formatTime(r.time)}</div>
          <div class="reminder-text">${this.escapeHtml(r.title)}</div>
        </div>
        <div class="reminder-status ${r.completed ? 'completed' : 'pending'}">
          ${r.completed ? 'Done' : 'Pending'}
        </div>`;
      item.addEventListener('click', () => this.toggleReminder(r.id));
      list.appendChild(item);
    });
  }

  toggleReminder(id) {
    const r = this.reminders.find(x => x.id === id);
    if (r) {
      r.completed = !r.completed;
      localStorage.setItem('reminders', JSON.stringify(this.reminders));
      this.displayReminders();
      this.updateStats({});
      this.updateDashboardStats();
    }
  }

  handleReminderSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    this.reminders.push({
      id:        Date.now(),
      title:     fd.get('reminderTitle'),
      date:      fd.get('reminderDate'),
      time:      fd.get('reminderTime'),
      repeat:    fd.get('reminderRepeat'),
      completed: false
    });
    localStorage.setItem('reminders', JSON.stringify(this.reminders));
    this.closeReminderModal();
    this.displayReminders();
    this.updateDashboardStats();
    this.showNotification('Reminder added! ⏰', 'success');
  }

  openReminderModal() {
    const modal = document.getElementById('reminderModal');
    document.getElementById('reminderForm').reset();
    document.getElementById('reminderDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('reminderTime').value = '09:00';
    modal.style.display = 'block';
  }

  closeReminderModal() {
    document.getElementById('reminderModal').style.display = 'none';
  }

  // ─── CALENDAR ─────────────────────────────────────────────────────────────
  initializeCalendar() {
    this.currentCalendarDate = new Date();
    this.updateCalendar(this.currentCalendarDate);
  }

  navigateCalendar(dir) {
    this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + dir);
    this.updateCalendar(this.currentCalendarDate);
  }

  updateCalendar(date) {
    const monthNames = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];

    this.setText('currentMonth', `${monthNames[date.getMonth()]} ${date.getFullYear()}`);

    const grid      = document.getElementById('calendarGrid');
    if (!grid) return;
    grid.innerHTML  = '';

    const firstDay   = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const today       = new Date().toISOString().split('T')[0];

    // Headers
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
      const el = document.createElement('div');
      el.className   = 'calendar-day header';
      el.textContent = d;
      grid.appendChild(el);
    });

    // Empty leading cells
    for (let i = 0; i < firstDay; i++) {
      const el = document.createElement('div');
      el.className = 'calendar-day empty';
      grid.appendChild(el);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const el      = document.createElement('div');
      el.className  = 'calendar-day';
      el.textContent= day;

      if (dateStr === today) el.classList.add('today');

      // Check for entries on this date
      const hasEntry = this.entries.some(e => (e.entry_date || e.date || '').startsWith(dateStr));
      if (hasEntry) el.classList.add('has-entry');

      el.addEventListener('click', () => this.showEntriesForDate(dateStr));
      grid.appendChild(el);
    }
  }

  showEntriesForDate(date) {
    const has = this.entries.some(e => (e.entry_date || e.date || '').startsWith(date));
    if (has) {
      // Reset filters, fetch for that day
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      document.querySelector('[data-filter="all"]')?.classList.add('active');
      this.fetchEntries('all').then(() => {
        setTimeout(() => {
          const cards = document.querySelectorAll('.entry-card');
          cards.forEach(c => {
            const entryDate = this.entries.find(e => e.id == c.dataset.id)?.entry_date;
            if (entryDate?.startsWith(date)) {
              c.style.outline = '3px solid #96ceb4';
              c.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => c.style.outline = '', 3000);
            }
          });
        }, 200);
      });
    } else {
      if (confirm(`No entries for ${this.formatDate(date)}. Create one?`)) {
        this.openNewEntryForm();
        document.getElementById('entryDate').value = date;
      }
    }
  }

  // ─── DELETE MODAL ─────────────────────────────────────────────────────────
  showDeleteModal(id) {
    let modal = document.getElementById('deleteModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id        = 'deleteModal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content" style="max-width:420px;text-align:center;">
          <div style="font-size:3rem;margin-bottom:1rem;">🗑️</div>
          <h2 style="color:#374785;margin-bottom:0.75rem;">Delete Entry?</h2>
          <p style="color:#6c757d;margin-bottom:2rem;">This cannot be undone. Your journal entry will be permanently removed.</p>
          <div style="display:flex;gap:1rem;">
            <button id="cancelDeleteBtn" class="btn-secondary" style="flex:1;">Keep It</button>
            <button id="confirmDeleteBtn" class="btn-primary" style="flex:1;background:#ff6b6b;">Yes, Delete</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
    }
    document.getElementById('confirmDeleteBtn').dataset.id = id;
    modal.style.display = 'block';
  }

  closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) modal.style.display = 'none';
  }

  // ─── LOADING STATE ────────────────────────────────────────────────────────
  showListLoader() {
    const list = document.getElementById('entriesList');
    if (list) {
      list.innerHTML = `
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading your entries…</p>
        </div>`;
    }
  }

  // ─── SECTION HELPERS ─────────────────────────────────────────────────────
  showSection(id) { const el = document.getElementById(id); if (el) el.style.display = 'block'; }
  hideSection(id) { const el = document.getElementById(id); if (el) el.style.display = 'none';  }

  // ─── FORMATTERS ───────────────────────────────────────────────────────────
  formatDate(dateStr) {
    if (!dateStr) return '';
    // entry_date from DB comes as "2025-11-18T00:00:00.000Z" or "2025-11-18"
    const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  }

  formatTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2,'0')} ${ampm}`;
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
              .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  // ─── NOTIFICATIONS ────────────────────────────────────────────────────────
  showNotification(message, type = 'info') {
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const colors = { success:'#4CAF50', error:'#f44336', info:'#2196F3' };
    const icons  = { success:'✅', error:'❌', info:'💡' };

    const el = document.createElement('div');
    el.className = 'notification';
    el.innerHTML = `
      <div class="notif-inner">
        <span class="notif-icon">${icons[type] || '💡'}</span>
        <span class="notif-msg">${message}</span>
        <button class="notif-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>`;

    Object.assign(el.style, {
      position:'fixed', top:'20px', right:'20px',
      background: colors[type] || colors.info,
      color:'white', borderRadius:'10px',
      boxShadow:'0 4px 16px rgba(0,0,0,0.18)',
      zIndex:'10000', minWidth:'300px', maxWidth:'420px',
      animation:'slideInRight 0.3s ease'
    });

    if (!document.getElementById('notifStyle')) {
      const s = document.createElement('style');
      s.id = 'notifStyle';
      s.textContent = `
        @keyframes slideInRight { from{transform:translateX(110%);opacity:0} to{transform:translateX(0);opacity:1} }
        .notif-inner{display:flex;align-items:center;gap:.75rem;padding:1rem 1.25rem;}
        .notif-icon{font-size:1.2rem;flex-shrink:0;}
        .notif-msg{flex:1;font-weight:600;font-size:.95rem;line-height:1.4;}
        .notif-close{background:none;border:none;color:white;font-size:1.4rem;cursor:pointer;padding:0;line-height:1;}
      `;
      document.head.appendChild(s);
    }

    document.body.appendChild(el);
    setTimeout(() => el.parentElement && el.remove(), 5000);
  }
}

// ─── BOOT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  window.journal = new Journal();
});
