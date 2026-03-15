// ─────────────────────────────────────────────────────────────────────────────
// journal.js  —  Full rewrite for Alzheimer's Support Journal
// Matches the exact HTML at alzheimer-support.vercel.app/journal.html
// Features: DB-backed CRUD, working voice entry, search, writing prompts,
//           calendar, reminders, auto-save draft, word count, mood validation
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

class Journal {
    constructor() {
        this.entries             = [];
        this.reminders           = [];
        this.token               = localStorage.getItem('token');
        this.currentCalendarDate = new Date();
        this.isRecording         = false;
        this.recognition         = null;
        this.voiceTranscript     = '';
        this._searchTimer        = null;
        this._draftTimer         = null;

        if (!this.token) {
            window.location.href = 'login.html';
            return;
        }

        // DOM is already ready because <script> is at the bottom of <body>
        this._boot();
    }

    _boot() {
        this._injectExtras();
        this._injectStyles();
        this.setupEventListeners();
        this.loadReminders();
        this.updateCalendar(this.currentCalendarDate);
        this.fetchEntries();
        this._setupVoice();
        this.loadMoodChart();
        this._loadAIInsights();
    }

    // ── Inject new elements into the existing HTML ────────────────────────────
    _injectExtras() {
        // 1. Search bar above entriesList
        const entriesList = document.getElementById('entriesList');
        if (entriesList && !document.getElementById('searchInput')) {
            const wrap = document.createElement('div');
            wrap.className = 'search-bar-wrap';
            wrap.innerHTML = `<span class="search-icon">🔍</span>
                <input type="text" id="searchInput" class="search-input"
                    placeholder="Search entries by title or content…" autocomplete="off">`;
            entriesList.parentNode.insertBefore(wrap, entriesList);
        }

        // 2. Word count next to textarea label
        const contentLabel = document.querySelector('label[for="entryContent"]');
        if (contentLabel && !document.getElementById('wordCount')) {
            const span = document.createElement('span');
            span.id = 'wordCount';
            span.className = 'word-count';
            span.textContent = '0 words';
            contentLabel.appendChild(span);
        }

        // 3. Tags input before form-actions
        const formActions = document.querySelector('#journalForm .form-actions');
        if (formActions && !document.getElementById('entryTags')) {
            const group = document.createElement('div');
            group.className = 'form-group';
            group.innerHTML = `<label for="entryTags">Tags
                    <span class="optional-hint">(optional, comma separated)</span></label>
                <input type="text" id="entryTags" name="entryTags"
                    placeholder="e.g. Family, Health, Memories">`;
            formActions.parentNode.insertBefore(group, formActions);
        }

        // 4. Calendar legend
        const calSection = document.querySelector('.calendar-section');
        if (calSection && !document.querySelector('.calendar-legend')) {
            const p = document.createElement('p');
            p.className = 'calendar-legend';
            p.innerHTML = '<span class="legend-dot"></span> Day with an entry';
            calSection.appendChild(p);
        }

        // 5. Delete confirmation modal
        if (!document.getElementById('deleteModal')) {
            const m = document.createElement('div');
            m.id = 'deleteModal';
            m.className = 'modal';
            m.innerHTML = `
                <div class="modal-content" style="max-width:420px;text-align:center;">
                    <div style="font-size:3rem;margin-bottom:1rem;">&#128465;</div>
                    <h2 style="color:#374785;margin-bottom:.75rem;">Delete Entry?</h2>
                    <p style="color:#6c757d;margin-bottom:2rem;">This cannot be undone.</p>
                    <div style="display:flex;gap:1rem;">
                        <button id="cancelDeleteBtn"  class="btn-secondary" style="flex:1;">Keep It</button>
                        <button id="confirmDeleteBtn" class="btn-primary" data-id=""
                            style="flex:1;background:#ff6b6b;">Yes, Delete</button>
                    </div>
                </div>`;
            document.body.appendChild(m);
        }

        // 6. AI Weekly Insights panel
        if (!document.getElementById('aiInsightsPanel')) {
            const panel = document.createElement('div');
            panel.id = 'aiInsightsPanel';
            panel.className = 'ai-insights-panel';
            panel.innerHTML =
                '<div class="ai-insights-header">' +
                    '<div class="ai-insights-title">' +
                        '<span class="ai-insights-icon">&#129302;</span>' +
                        '<h3>Weekly AI Insights</h3>' +
                        '<span class="ai-insights-badge">Powered by AI</span>' +
                    '</div>' +
                    '<button class="ai-insights-refresh" id="aiInsightsRefreshBtn" title="Regenerate insights">&#8635; Refresh</button>' +
                '</div>' +
                '<div class="ai-insights-body" id="aiInsightsBody">' +
                    '<div class="ai-insights-placeholder" id="aiInsightsPlaceholder">' +
                        '<span class="ai-insights-placeholder-icon">&#10024;</span>' +
                        '<p>Your personalised weekly mood &amp; journal summary will appear here.</p>' +
                        '<button class="ai-insights-generate-btn" id="aiInsightsGenerateBtn">Generate Insights</button>' +
                    '</div>' +
                '</div>';
            const moodSection = document.getElementById('moodChartSection');
            const journalMain = document.querySelector('.journal-main') ||
                                document.querySelector('.entries-section') ||
                                document.getElementById('entriesSection');
            if (moodSection && moodSection.parentNode) {
                moodSection.parentNode.insertBefore(panel, moodSection.nextSibling);
            } else if (journalMain) {
                journalMain.appendChild(panel);
            } else {
                document.body.appendChild(panel);
            }
            document.getElementById('aiInsightsGenerateBtn').addEventListener('click', () => this._generateAIInsights());
            document.getElementById('aiInsightsRefreshBtn').addEventListener('click',  () => this._generateAIInsights(true));
        }
    }

    // ── Inject CSS for new elements only ─────────────────────────────────────
    _injectStyles() {
        if (document.getElementById('_jStyles')) return;
        const s = document.createElement('style');
        s.id = '_jStyles';
        s.textContent = `
        .search-bar-wrap{display:flex;align-items:center;gap:.75rem;background:#f8f9fa;
            border:2px solid #e9ecef;border-radius:10px;padding:.6rem 1rem;
            margin-bottom:1.25rem;transition:border-color .25s;}
        .search-bar-wrap:focus-within{border-color:#96ceb4;}
        .search-icon{opacity:.5;flex-shrink:0;}
        .search-input{flex:1;border:none;background:transparent;font-size:.95rem;
            color:#374785;outline:none;font-family:inherit;}
        .search-input::placeholder{color:#adb5bd;}
        .word-count{font-size:.75rem;font-weight:400;color:#adb5bd;margin-left:.5rem;}
        .optional-hint{font-size:.76rem;color:#adb5bd;font-weight:400;}
        .entry-preview{color:#495057;line-height:1.6;margin-bottom:1rem;font-size:.93rem;}
        .voice-badge{display:inline-block;background:linear-gradient(135deg,#ec7cab,#f1736c);
            color:#fff;font-size:.66rem;font-weight:700;padding:.1rem .45rem;
            border-radius:20px;margin-left:.4rem;vertical-align:middle;}
        .entry-tags{margin-top:.3rem;display:flex;flex-wrap:wrap;gap:.3rem;}
        .entry-tag{background:#e8f4fd;color:#374785;font-size:.7rem;font-weight:600;
            padding:.12rem .5rem;border-radius:20px;border:1px solid #a8d0e6;}
        .loading-state{display:flex;flex-direction:column;align-items:center;
            justify-content:center;padding:3rem 1rem;gap:1rem;color:#6c757d;}
        .spinner{width:34px;height:34px;border:4px solid #e9ecef;
            border-top-color:#96ceb4;border-radius:50%;
            animation:_sp .75s linear infinite;}
        @keyframes _sp{to{transform:rotate(360deg)}}
        .voice-panel{background:linear-gradient(135deg,#fff5f7,#fff0f6);
            border:2px solid #f8c8d4;border-radius:12px;padding:1.4rem;
            margin-bottom:1.5rem;}
        .voice-indicator{display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem;}
        .voice-pulse{width:14px;height:14px;background:#ff4444;border-radius:50%;flex-shrink:0;}
        .voice-pulse.active{animation:_vp 1s ease-in-out infinite;}
        @keyframes _vp{0%,100%{box-shadow:0 0 0 0 rgba(255,68,68,.4)}
            50%{box-shadow:0 0 0 8px rgba(255,68,68,0)}}
        .voice-label{font-weight:700;color:#c0392b;font-size:.93rem;}
        .voice-preview{background:#fff;border:1.5px solid #f8c8d4;border-radius:8px;
            padding:.8rem 1rem;min-height:54px;font-size:.9rem;color:#374785;
            line-height:1.6;font-style:italic;margin-bottom:.75rem;}
        .voice-panel-actions{display:flex;gap:.75rem;}
        .voice-stop-btn,.voice-cancel-btn{padding:.7rem 1rem;border:none;border-radius:8px;
            font-size:.88rem;font-weight:600;cursor:pointer;transition:all .2s;
            flex:1;font-family:inherit;}
        .voice-stop-btn{background:#4ecdc4;color:#fff;}
        .voice-cancel-btn{background:#e9ecef;color:#555;}
        .action-btn.recording{background:linear-gradient(135deg,#ff4444,#cc0000) !important;
            animation:_rec 1s ease-in-out infinite;}
        @keyframes _rec{0%,100%{box-shadow:0 0 0 0 rgba(255,68,68,.4)}
            50%{box-shadow:0 0 0 10px rgba(255,68,68,0)}}
        .mood-nudge{border:2px solid #ff6b6b !important;border-radius:10px;
            animation:_nd .4s ease;}
        @keyframes _nd{0%,100%{transform:translateX(0)}
            25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
        .calendar-legend{display:flex;align-items:center;gap:.5rem;margin-top:.7rem;
            font-size:.76rem;color:#6c757d;}
        .legend-dot{width:7px;height:7px;background:#4ecdc4;border-radius:50%;flex-shrink:0;}
        @keyframes _sir{from{transform:translateX(110%);opacity:0}
            to{transform:translateX(0);opacity:1}}
        .jn-notif{position:fixed;top:20px;right:20px;color:#fff;border-radius:10px;
            box-shadow:0 4px 16px rgba(0,0,0,.2);z-index:10000;
            min-width:280px;max-width:400px;animation:_sir .3s ease;}
        .jn-inner{display:flex;align-items:center;gap:.7rem;padding:.9rem 1.2rem;}
        .jn-msg{flex:1;font-weight:600;font-size:.9rem;line-height:1.4;}
        .jn-close{background:none;border:none;color:#fff;font-size:1.4rem;
            cursor:pointer;padding:0;line-height:1;}
        .reminder-item.done{opacity:.65;}
        .modal{backdrop-filter:blur(2px);}

        /* ── AI Weekly Insights panel ── */
        .ai-insights-panel{background:#fff;border-radius:14px;
            border:1.5px solid #e0e7ff;padding:1.5rem;margin:1.5rem 0;
            box-shadow:0 2px 12px rgba(74,134,232,.08);}
        .ai-insights-header{display:flex;align-items:center;justify-content:space-between;
            margin-bottom:1rem;flex-wrap:wrap;gap:.5rem;}
        .ai-insights-title{display:flex;align-items:center;gap:.6rem;}
        .ai-insights-title h3{margin:0;font-size:1rem;color:#374785;font-weight:700;}
        .ai-insights-icon{font-size:1.3rem;}
        .ai-insights-badge{background:#e0e7ff;color:#374785;font-size:.68rem;font-weight:700;
            padding:.15rem .55rem;border-radius:20px;text-transform:uppercase;letter-spacing:.04em;}
        .ai-insights-refresh{background:#f0f4ff;border:1px solid #c7d7f8;color:#374785;
            border-radius:8px;padding:.35rem .85rem;font-size:.82rem;font-weight:600;
            cursor:pointer;transition:all .2s;}
        .ai-insights-refresh:hover{background:#e0e7ff;}
        .ai-insights-refresh:disabled{opacity:.55;cursor:not-allowed;}
        .ai-insights-body{min-height:80px;}
        .ai-insights-placeholder{text-align:center;padding:1.5rem 1rem;color:#6c757d;}
        .ai-insights-placeholder-icon{font-size:2rem;display:block;margin-bottom:.6rem;}
        .ai-insights-placeholder p{font-size:.9rem;margin-bottom:1rem;}
        .ai-insights-generate-btn{background:linear-gradient(135deg,#374785,#6a85e8);
            color:#fff;border:none;border-radius:8px;padding:.6rem 1.4rem;
            font-size:.88rem;font-weight:600;cursor:pointer;transition:transform .15s;}
        .ai-insights-generate-btn:hover{transform:translateY(-1px);}
        .ai-insights-loading{display:flex;align-items:center;gap:.75rem;padding:.5rem 0;
            color:#374785;font-size:.9rem;font-weight:600;}
        .ai-insights-spinner{width:20px;height:20px;border:3px solid #e0e7ff;
            border-top-color:#374785;border-radius:50%;
            animation:_aisp .7s linear infinite;flex-shrink:0;}
        @keyframes _aisp{to{transform:rotate(360deg)}}
        .ai-insights-content{font-size:.93rem;color:#374785;line-height:1.75;}
        .ai-insights-content h4{font-size:.95rem;color:#374785;margin:1rem 0 .4rem;
            font-weight:700;}
        .ai-insights-content p{margin:0 0 .65rem;color:#495057;}
        .ai-insights-content ul{margin:.3rem 0 .65rem 1.2rem;padding:0;}
        .ai-insights-content li{margin-bottom:.3rem;color:#495057;}
        .ai-insights-section{background:#f8faff;border-radius:10px;padding:1rem 1.1rem;
            margin-bottom:.85rem;border-left:3px solid #96ceb4;}
        .ai-insights-section.mood{border-left-color:#f9ca24;}
        .ai-insights-section.patterns{border-left-color:#6a85e8;}
        .ai-insights-section.tips{border-left-color:#4ecdc4;}
        .ai-insights-footer{display:flex;align-items:center;justify-content:space-between;
            margin-top:.8rem;padding-top:.8rem;border-top:1px solid #e9ecef;
            font-size:.76rem;color:#adb5bd;flex-wrap:wrap;gap:.4rem;}
        .ai-insights-timestamp{font-style:italic;}
        `;
        document.head.appendChild(s);
    }

    // ── API ───────────────────────────────────────────────────────────────────
    async _api(path, opts = {}) {
        // 35s timeout — enough to survive a Render cold start (~25s)
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 35000);

        try {
            const res = await fetch(`${API_BASE}${path}`, {
                ...opts,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`,
                    ...(opts.headers || {})
                }
            });
            clearTimeout(timer);

            // ── Session expired / unauthorised ───────────────────────────────
            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                this.showNotification('Your session has expired. Redirecting to login…', 'error');
                setTimeout(() => window.location.href = 'login.html', 2200);
                throw new Error('SESSION_EXPIRED');
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
            return data;

        } catch (err) {
            clearTimeout(timer);
            // AbortController fired → request timed out
            if (err.name === 'AbortError') throw new Error('TIMEOUT');
            throw err;
        }
    }

    // ── Fetch entries from DB ─────────────────────────────────────────────────
    async fetchEntries(filter = 'all', search = '') {
        this._showLoader();
        try {
            const q = new URLSearchParams();
            if (filter !== 'all')  q.set('filter', filter);
            if (search.trim())     q.set('search', search.trim());
            const data = await this._api(`/journals?${q}`);
            this.entries = data.journals || [];
            this._updateStats(data.stats || {});
            this._updateDashboardStats();
            this._renderEntries(this.entries);
            this.updateCalendar(this.currentCalendarDate);
        } catch (err) {
            // Session expired — _api already shows notification + redirects
            if (err.message === 'SESSION_EXPIRED') return;

            // Show entries from localStorage while explaining what happened
            this._localFallback(search);

            const msg = err.message === 'TIMEOUT'
                ? '⏳ Server is waking up — showing local entries. Refresh in ~30 seconds.'
                : '⚠️ Could not reach server — showing locally saved entries.';
            this.showNotification(msg, 'info');
        }
    }

    _localFallback(search = '') {
        try {
            const saved = JSON.parse(localStorage.getItem('journalEntries') || '[]');
            this.entries = saved.map(e => ({ ...e, entry_date: e.entry_date || e.date }));
        } catch (_) { this.entries = []; }
        this._updateStats({});
        const list = search.trim() ? this._clientSearch(this.entries, search.trim()) : this.entries;
        this._renderEntries(list);
        this.updateCalendar(this.currentCalendarDate);
    }

    // Client-side search — used for offline fallback; tags, mood, title, content all searchable
    _clientSearch(entries, query) {
        const q = query.toLowerCase();
        return entries.filter(e =>
            (e.title   || '').toLowerCase().includes(q) ||
            (e.content || '').toLowerCase().includes(q) ||
            (Array.isArray(e.tags) ? e.tags.join(' ') : (e.tags || '')).toLowerCase().includes(q) ||
            (e.mood    || '').toLowerCase().includes(q)
        );
    }

    // ── Render entry cards ────────────────────────────────────────────────────
    _renderEntries(list) {
        const c = document.getElementById('entriesList');
        if (!c) return;
        c.innerHTML = '';

        const searchVal = (document.getElementById('searchInput')?.value || '').trim();

        if (!list || list.length === 0) {
            if (searchVal) {
                c.innerHTML =
                    '<div class="empty-state">' +
                        '<div class="empty-icon">🔍</div>' +
                        '<h3>No entries match &ldquo;' + searchVal.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '&rdquo;</h3>' +
                        '<p>Try a different keyword, or clear the search to see all entries.</p>' +
                        '<button class="action-btn primary" id="clearSearchBtn" style="margin-top:1rem;max-width:220px;">✕ Clear Search</button>' +
                    '</div>';
                document.getElementById('clearSearchBtn')?.addEventListener('click', () => {
                    const si = document.getElementById('searchInput');
                    if (si) { si.value = ''; si.dispatchEvent(new Event('input')); }
                });
            } else {
                c.innerHTML =
                    '<div class="empty-state">' +
                        '<div class="empty-icon">📝</div>' +
                        '<h3>No journal entries found</h3>' +
                        '<p>Start writing your first entry!</p>' +
                        '<button class="action-btn primary" id="emptyBtn" style="margin-top:1rem;max-width:220px;">✏️ Write First Entry</button>' +
                    '</div>';
                document.getElementById('emptyBtn')?.addEventListener('click', () => this.openNewEntryForm());
            }
            return;
        }

        list.forEach(e => c.appendChild(this._makeCard(e)));
    }

    _makeCard(entry) {
        const card = document.createElement('div');
        card.className = 'entry-card';
        card.dataset.id = entry.id;

        const dateStr = entry.entry_date || entry.date || '';
        const preview = (entry.content || '').length > 160
            ? entry.content.slice(0, 160) + '…' : entry.content;
        const voiceBadge = entry.is_voice_entry ? `<span class="voice-badge">🎤 Voice</span>` : '';
        const tagsHtml   = (entry.tags || []).length
            ? `<div class="entry-tags">${entry.tags.map(t =>
                `<span class="entry-tag">${this._esc(t)}</span>`).join('')}</div>` : '';

        card.innerHTML = `
            <div class="entry-header">
                <div>
                    <h3 class="entry-title">${this._esc(entry.title)}${voiceBadge}</h3>
                    ${tagsHtml}
                </div>
                <div class="entry-date">${this._fmtDate(dateStr)}</div>
            </div>
            <div class="entry-preview">${this._esc(preview)}</div>
            <div class="entry-footer">
                <div class="entry-mood">${entry.mood || '😊'}</div>
                <div class="entry-actions">
                    <button class="entry-btn edit"   data-action="edit"   data-id="${entry.id}">Edit</button>
                    <button class="entry-btn delete" data-action="delete" data-id="${entry.id}">Delete</button>
                </div>
            </div>`;

        card.addEventListener('click', e => {
            const btn = e.target.closest('[data-action]');
            if (!btn) { this._viewEntry(entry.id); return; }
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            btn.dataset.action === 'edit'   ? this._editEntry(id)      :
            btn.dataset.action === 'delete' ? this._showDeleteModal(id) : null;
        });

        return card;
    }

    _showLoader() {
        const c = document.getElementById('entriesList');
        if (c) c.innerHTML = `<div class="loading-state">
            <div class="spinner"></div><p>Loading your entries…</p></div>`;
    }

    // ── Event listeners ───────────────────────────────────────────────────────
    setupEventListeners() {
        this._on('newEntryBtn',    'click', () => this.openNewEntryForm());
        this._on('voiceEntryBtn',  'click', () => this._toggleVoice());
        this._on('promptsBtn',     'click', () => this._openPrompts());
        this._on('closeFormBtn',   'click', () => this._closeForm());
        this._on('closePromptsBtn','click', () => this._closePrompts());
        this._on('cancelEntry',    'click', () => this._closeForm());
        this._on('cancelReminder', 'click', () => this.closeReminderModal());
        this._on('addReminderBtn', 'click', () => this.openReminderModal());
        this._on('journalForm',    'submit', e => this._handleJournalSubmit(e));
        this._on('reminderForm',   'submit', e => this._handleReminderSubmit(e));

        // Search
        this._on('searchInput', 'input', () => {
            clearTimeout(this._searchTimer);
            this._searchTimer = setTimeout(() => {
                const val    = document.getElementById('searchInput')?.value || '';
                const filter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
                this.fetchEntries(filter, val);
            }, 380);
        });

        // Word count + draft autosave
        this._on('entryContent', 'input', () => {
            this._updateWordCount();
            clearTimeout(this._draftTimer);
            this._draftTimer = setTimeout(() => this._saveDraft(), 30000);
        });

        // Filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const search = document.getElementById('searchInput')?.value || '';
                this.fetchEntries(btn.dataset.filter, search);
            });
        });

        // Mood buttons
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.preventDefault();
                document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const el = document.getElementById('selectedMood');
                if (el) el.value = btn.dataset.mood;
            });
        });

        // Event delegation for dynamic elements (prompts, delete modal)
        document.addEventListener('click', e => {
            const pBtn = e.target.closest('.use-prompt-btn');
            if (pBtn) { this._usePrompt(pBtn.dataset.prompt || ''); return; }

            if (e.target.id === 'confirmDeleteBtn') {
                this._confirmDelete(parseInt(e.target.dataset.id));
            }
            if (e.target.id === 'cancelDeleteBtn') {
                this._closeDeleteModal();
            }
        });

        // Modal × buttons
        document.querySelectorAll('.modal .close').forEach(btn => {
            btn.addEventListener('click', () => btn.closest('.modal').style.display = 'none');
        });

        // Modal backdrop
        window.addEventListener('click', e => {
            if (e.target.classList.contains('modal')) e.target.style.display = 'none';
        });

        // Calendar navigation
        this._on('prevMonth', 'click', () => {
            this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
            this.updateCalendar(this.currentCalendarDate);
        });
        this._on('nextMonth', 'click', () => {
            this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
            this.updateCalendar(this.currentCalendarDate);
        });
    }

    _on(id, evt, fn) {
        const el = document.getElementById(id);
        if (el) el.addEventListener(evt, fn);
    }

    // ── Form open / close ─────────────────────────────────────────────────────
    openNewEntryForm(promptText = '') {
        this._show('journalFormSection');
        this._hide('entriesSection');
        this._hide('promptsSection');

        const form = document.getElementById('journalForm');
        if (!form) return;

        form.reset();
        delete form.dataset.editingId;
        delete form.dataset.voiceEntry;

        form.querySelectorAll('input,textarea,select').forEach(el => el.disabled = false);
        document.querySelectorAll('.mood-btn').forEach(b => { b.classList.remove('active'); b.disabled = false; });

        const selMood = document.getElementById('selectedMood');
        if (selMood) selMood.value = '';

        document.getElementById('entryDate').value = new Date().toISOString().split('T')[0];

        const ft = document.getElementById('formTitle');
        if (ft) ft.textContent = 'New Journal Entry';

        const saveBtn = form.querySelector('.btn-primary');
        if (saveBtn) { saveBtn.style.display = ''; saveBtn.textContent = 'Save Entry'; saveBtn.disabled = false; }

        const cancelBtn = document.getElementById('cancelEntry');
        if (cancelBtn) cancelBtn.textContent = 'Cancel';

        const tagsEl = document.getElementById('entryTags');
        if (tagsEl) tagsEl.value = '';

        if (promptText) {
            const ce = document.getElementById('entryContent');
            if (ce) { ce.value = promptText; this._updateWordCount(); }
        } else {
            this._restoreDraft();
        }

        this._updateWordCount();
        setTimeout(() => document.getElementById('entryTitle')?.focus(), 60);
    }

    _closeForm() {
        this._show('entriesSection');
        this._hide('journalFormSection');
        this._hide('promptsSection');
        this._stopVoice();
        document.getElementById('_voicePanel')?.remove();
    }

    _openPrompts() {
        this._show('promptsSection');
        this._show('entriesSection');
        this._hide('journalFormSection');
    }

    _closePrompts() { this._hide('promptsSection'); }

    _usePrompt(text) { this.openNewEntryForm(text); }

    // ── Journal form submit ───────────────────────────────────────────────────
    async _handleJournalSubmit(e) {
        e.preventDefault();

        const mood = document.getElementById('selectedMood')?.value;
        if (!mood) {
            const sel = document.querySelector('.mood-selector');
            if (sel) { sel.classList.add('mood-nudge'); setTimeout(() => sel.classList.remove('mood-nudge'), 800); }
            this.showNotification('Please pick a mood before saving 😊', 'info');
            return;
        }

        const form      = document.getElementById('journalForm');
        const editingId = form.dataset.editingId ? parseInt(form.dataset.editingId) : null;

        const tagsRaw = (document.getElementById('entryTags')?.value || '')
            .split(',').map(t => t.trim()).filter(Boolean);

        const payload = {
            title:          document.getElementById('entryTitle').value.trim(),
            content:        document.getElementById('entryContent').value.trim(),
            mood,
            tags:           tagsRaw,
            entry_date:     document.getElementById('entryDate').value,
            is_voice_entry: form.dataset.voiceEntry === 'true'
        };

        if (!payload.title || !payload.content) {
            this.showNotification('Please fill in title and content.', 'error');
            return;
        }

        const saveBtn = form.querySelector('.btn-primary');
        if (saveBtn) { saveBtn.textContent = 'Saving…'; saveBtn.disabled = true; }

        try {
            if (editingId) {
                await this._api(`/journals/${editingId}`, { method:'PUT', body: JSON.stringify(payload) });
                this.showNotification('Entry updated! ✨', 'success');
            } else {
                await this._api('/journals', { method:'POST', body: JSON.stringify(payload) });
                this.showNotification('Entry saved! 📝', 'success');
            }
            this._clearDraft();
            this._closeForm();
            await this.fetchEntries(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
            this.loadMoodChart(); // refresh chart with new entry's mood
        } catch (_) {
            // Offline — save locally
            try {
                let saved = JSON.parse(localStorage.getItem('journalEntries') || '[]');
                if (editingId) {
                    saved = saved.map(x => x.id === editingId ? { ...x, ...payload, date: payload.entry_date } : x);
                } else {
                    saved.unshift({ id: Date.now(), ...payload, date: payload.entry_date });
                }
                localStorage.setItem('journalEntries', JSON.stringify(saved));
            } catch (_) {}
            this.showNotification('Saved locally (server offline).', 'info');
            this._clearDraft();
            this._closeForm();
            this._localFallback();
        } finally {
            if (saveBtn) { saveBtn.textContent = 'Save Entry'; saveBtn.disabled = false; }
        }
    }

    // ── View / Edit ───────────────────────────────────────────────────────────
    _viewEntry(id) {
        const entry = this.entries.find(e => e.id === id);
        if (!entry) return;
        this.openNewEntryForm();
        document.getElementById('formTitle').textContent = 'View Entry';
        this._fillForm(entry);
        document.getElementById('journalForm')?.querySelectorAll('input,textarea,select')
            .forEach(el => el.disabled = true);
        document.querySelectorAll('.mood-btn').forEach(b => b.disabled = true);
        const sb = document.querySelector('#journalForm .btn-primary');
        if (sb) sb.style.display = 'none';
        const cb = document.getElementById('cancelEntry');
        if (cb) cb.textContent = 'Close';
    }

    _editEntry(id) {
        const entry = this.entries.find(e => e.id === id);
        if (!entry) return;
        this.openNewEntryForm();
        document.getElementById('formTitle').textContent = 'Edit Entry';
        document.getElementById('journalForm').dataset.editingId = id;
        this._fillForm(entry);
    }

    _fillForm(entry) {
        const dateStr = (entry.entry_date || entry.date || '').split('T')[0];
        document.getElementById('entryDate').value    = dateStr;
        document.getElementById('entryTitle').value   = entry.title || '';
        document.getElementById('entryContent').value = entry.content || '';
        const sm = document.getElementById('selectedMood');
        if (sm) sm.value = entry.mood || '';
        document.querySelectorAll('.mood-btn').forEach(b =>
            b.classList.toggle('active', b.dataset.mood === entry.mood));
        const te = document.getElementById('entryTags');
        if (te) te.value = (entry.tags || []).join(', ');
        this._updateWordCount();
    }

    // ── Delete modal ──────────────────────────────────────────────────────────
    _showDeleteModal(id) {
        const modal = document.getElementById('deleteModal');
        if (!modal) return;
        const btn = document.getElementById('confirmDeleteBtn');
        if (btn) btn.dataset.id = id;
        modal.style.display = 'block';
    }

    _closeDeleteModal() {
        const m = document.getElementById('deleteModal');
        if (m) m.style.display = 'none';
    }

    async _confirmDelete(id) {
        this._closeDeleteModal();
        try {
            await this._api(`/journals/${id}`, { method:'DELETE' });
        } catch (_) {
            try {
                const saved = JSON.parse(localStorage.getItem('journalEntries') || '[]');
                localStorage.setItem('journalEntries', JSON.stringify(saved.filter(e => e.id !== id)));
            } catch (_) {}
        }
        this.showNotification('Entry deleted.', 'success');
        await this.fetchEntries(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
        this.loadMoodChart(); // refresh chart after deletion
    }

    // ── Voice entry ───────────────────────────────────────────────────────────
    _setupVoice() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            const btn = document.getElementById('voiceEntryBtn');
            if (btn) { btn.title = 'Voice not supported — use Chrome or Edge'; btn.style.opacity = '.55'; }
            return;
        }

        this.recognition = new SR();
        this.recognition.continuous     = true;
        this.recognition.interimResults = true;
        this.recognition.lang           = 'en-US';

        this.recognition.onstart = () => { this.isRecording = true; this._updateVoiceUI(true); };

        this.recognition.onresult = e => {
            let final = '', interim = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const t = e.results[i][0].transcript;
                e.results[i].isFinal ? (final += t) : (interim += t);
            }
            if (final) this.voiceTranscript += final + ' ';
            const prev = document.getElementById('_voicePreview');
            if (prev) prev.textContent = (this.voiceTranscript + interim).trim() || 'Listening…';
        };

        this.recognition.onerror = e => {
            const msgs = {
                'not-allowed':   'Microphone access denied. Please allow it in your browser settings.',
                'no-speech':     'No speech detected. Please speak clearly.',
                'audio-capture': 'No microphone found.',
                'network':       'Network error during speech recognition.'
            };
            this.showNotification(msgs[e.error] || `Voice error: ${e.error}`, 'error');
            this._stopVoice();
        };

        this.recognition.onend = () => {
            if (this.isRecording) { try { this.recognition.start(); } catch (_) {} }
        };
    }

    _toggleVoice() {
        if (!this.recognition) {
            this.showNotification('Voice entry requires Chrome or Edge browser.', 'error');
            return;
        }
        this.isRecording ? this._stopVoice() : this._startVoice();
    }

    _startVoice() {
        this.voiceTranscript = '';

        // Open form if not visible
        const fs = document.getElementById('journalFormSection');
        if (!fs || fs.style.display === 'none' || fs.style.display === '') {
            this.openNewEntryForm();
        }

        if (!document.getElementById('_voicePanel')) {
            const panel = document.createElement('div');
            panel.id = '_voicePanel';
            panel.className = 'voice-panel';
            panel.innerHTML = `
                <div class="voice-indicator">
                    <div class="voice-pulse active" id="_voicePulse"></div>
                    <span class="voice-label" id="_voiceLabel">🎤 Listening… speak now</span>
                </div>
                <div class="voice-preview" id="_voicePreview">Start speaking…</div>
                <div class="voice-panel-actions">
                    <button class="voice-stop-btn"   id="_voiceStop">⏹ Stop &amp; Use Text</button>
                    <button class="voice-cancel-btn" id="_voiceCancel">✕ Cancel</button>
                </div>`;
            const form = document.getElementById('journalForm');
            if (form) form.parentNode.insertBefore(panel, form);

            document.getElementById('_voiceStop').addEventListener('click', () => {
                this._stopVoice();
                const text = this.voiceTranscript.trim();
                if (text) {
                    const ce = document.getElementById('entryContent');
                    if (ce) {
                        ce.value += (ce.value ? '\n\n' : '') + text;
                        document.getElementById('journalForm').dataset.voiceEntry = 'true';
                        this._updateWordCount();
                    }
                    this.showNotification('Voice text added! ✅', 'success');
                }
                panel.remove();
            });

            document.getElementById('_voiceCancel').addEventListener('click', () => {
                this._stopVoice();
                this.voiceTranscript = '';
                panel.remove();
            });
        }

        try { this.recognition.start(); }
        catch (err) { this.showNotification('Could not start microphone. Please try again.', 'error'); }
    }

    _stopVoice() {
        this.isRecording = false;
        try { if (this.recognition) this.recognition.stop(); } catch (_) {}
        this._updateVoiceUI(false);
    }

    _updateVoiceUI(on) {
        const btn   = document.getElementById('voiceEntryBtn');
        const pulse = document.getElementById('_voicePulse');
        const label = document.getElementById('_voiceLabel');
        if (btn) {
            btn.innerHTML = on
                ? '<span class="btn-icon">⏹</span> Stop Recording'
                : '<span class="btn-icon">🎤</span> Voice Entry';
            on ? btn.classList.add('recording') : btn.classList.remove('recording');
        }
        if (pulse) pulse.classList.toggle('active', on);
        if (label) label.textContent = on ? '🎤 Listening… speak now' : '⏸ Paused';
    }

    // ── Reminders ─────────────────────────────────────────────────────────────
    // ── Load reminders from DB ────────────────────────────────────────────────
    async loadReminders() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const data  = await this._api(`/reminders?date=${today}`);
            this.reminders = data.reminders || [];
            // Sync localStorage for dashboard stats
            localStorage.setItem('reminders', JSON.stringify(this.reminders));
        } catch (err) {
            if (err.message === 'SESSION_EXPIRED') return;
            // Offline fallback
            try { this.reminders = JSON.parse(localStorage.getItem('reminders') || '[]'); }
            catch (_) { this.reminders = []; }
        }
        this.displayReminders();
    }

    displayReminders() {
        const today  = new Date().toISOString().split('T')[0];
        // Support both DB field (reminder_date) and legacy localStorage field (date)
        const todayR = this.reminders.filter(r =>
            (r.reminder_date || r.date || '').toString().startsWith(today));
        const list   = document.getElementById('remindersList');
        const cEl    = document.getElementById('remindersCount');

        const pendingCount = todayR.filter(r => !r.completed).length;
        if (cEl) cEl.textContent = pendingCount;
        if (!list) return;

        if (todayR.length === 0) {
            list.innerHTML = `<div class="empty-state" style="padding:1.5rem;">
                <div class="empty-icon">⏰</div><p>No reminders for today</p></div>`;
            return;
        }

        list.innerHTML = '';
        // Sort by time (nulls last)
        todayR.sort((a, b) => {
            const ta = a.reminder_time || a.time || '99:99';
            const tb = b.reminder_time || b.time || '99:99';
            return ta.localeCompare(tb);
        }).forEach(r => {
            const timeStr = r.reminder_time || r.time || '';
            const item = document.createElement('div');
            item.className = `reminder-item${r.completed ? ' done' : ''}`;
            item.style.cursor = 'pointer';

            // Priority colour strip
            const priorityColor = r.priority === 'high' ? '#ff6b6b'
                : r.priority === 'low' ? '#96ceb4' : '#f9ca24';

            item.innerHTML = `
                <div style="font-size:1rem;flex-shrink:0;">${r.completed ? '✅' : '⬜'}</div>
                <div style="flex:1;min-width:0;">
                    <div class="reminder-time">${timeStr ? this._fmtTime(timeStr) : 'All day'}</div>
                    <div class="reminder-text">${this._esc(r.title)}</div>
                </div>
                <div style="display:flex;align-items:center;gap:.5rem;">
                    <span style="width:8px;height:8px;border-radius:50%;background:${priorityColor};flex-shrink:0;"
                          title="${r.priority || 'medium'} priority"></span>
                    <div class="reminder-status ${r.completed ? 'completed' : 'pending'}">
                        ${r.completed ? 'Done' : 'Pending'}
                    </div>
                    <button class="entry-btn delete" data-del-reminder="${r.id}"
                        style="padding:.25rem .6rem;font-size:.7rem;">✕</button>
                </div>`;

            // Toggle complete on click (but not on delete button)
            item.addEventListener('click', e => {
                if (e.target.dataset.delReminder) {
                    e.stopPropagation();
                    this._deleteReminder(parseInt(e.target.dataset.delReminder));
                    return;
                }
                this._toggleReminder(r.id);
            });

            list.appendChild(item);
        });
    }

    async _toggleReminder(id) {
        try {
            const data = await this._api(`/reminders/${id}/complete`, { method: 'PATCH' });
            // Update local copy
            const idx = this.reminders.findIndex(x => x.id === id);
            if (idx !== -1) this.reminders[idx] = data.reminder;
            this.displayReminders();
            this._updateDashboardStats();
            this.showNotification(
                data.reminder.completed ? 'Reminder completed ✅' : 'Reminder marked as pending',
                'success'
            );
        } catch (err) {
            if (err.message === 'SESSION_EXPIRED') return;
            // Offline fallback — toggle locally
            const r = this.reminders.find(x => x.id === id);
            if (r) {
                r.completed = !r.completed;
                localStorage.setItem('reminders', JSON.stringify(this.reminders));
                this.displayReminders();
                this.showNotification(`Reminder ${r.completed ? 'completed ✅' : 'pending'} (offline)`, 'info');
            }
        }
    }

    async _deleteReminder(id) {
        try {
            await this._api(`/reminders/${id}`, { method: 'DELETE' });
            this.reminders = this.reminders.filter(r => r.id !== id);
            this.displayReminders();
            this._updateDashboardStats();
            this.showNotification('Reminder deleted.', 'success');
        } catch (err) {
            if (err.message === 'SESSION_EXPIRED') return;
            this.showNotification('Could not delete reminder. Try again.', 'error');
        }
    }

    openReminderModal() {
        const modal = document.getElementById('reminderModal');
        if (!modal) return;
        document.getElementById('reminderForm')?.reset();
        const de = document.getElementById('reminderDate');
        const te = document.getElementById('reminderTime');
        if (de) de.value = new Date().toISOString().split('T')[0];
        if (te) te.value = '09:00';
        modal.style.display = 'block';
    }

    closeReminderModal() {
        const m = document.getElementById('reminderModal');
        if (m) m.style.display = 'none';
    }

    async _handleReminderSubmit(e) {
        e.preventDefault();
        const fd = new FormData(e.target);

        const payload = {
            title:         fd.get('reminderTitle'),
            reminder_date: fd.get('reminderDate'),
            reminder_time: fd.get('reminderTime') || null,
            repeat_type:   fd.get('reminderRepeat') || 'none',
            priority:      fd.get('reminderPriority') || 'medium'
        };

        if (!payload.title) {
            this.showNotification('Please enter a reminder title.', 'error');
            return;
        }

        const saveBtn = document.querySelector('#reminderForm .btn-primary');
        if (saveBtn) { saveBtn.textContent = 'Saving…'; saveBtn.disabled = true; }

        try {
            const data = await this._api('/reminders', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            this.reminders.push(data.reminder);
            localStorage.setItem('reminders', JSON.stringify(this.reminders));
            this.closeReminderModal();
            this.displayReminders();
            this._updateDashboardStats();
            this.showNotification('Reminder added! ⏰', 'success');
        } catch (err) {
            if (err.message === 'SESSION_EXPIRED') return;
            // Offline fallback — save locally
            const local = {
                id: Date.now(),
                title:         payload.title,
                reminder_date: payload.reminder_date,
                reminder_time: payload.reminder_time,
                date:          payload.reminder_date,
                time:          payload.reminder_time,
                repeat_type:   payload.repeat_type,
                priority:      payload.priority,
                completed:     false
            };
            this.reminders.push(local);
            localStorage.setItem('reminders', JSON.stringify(this.reminders));
            this.closeReminderModal();
            this.displayReminders();
            this._updateDashboardStats();
            this.showNotification('Reminder saved locally (server offline).', 'info');
        } finally {
            if (saveBtn) { saveBtn.textContent = 'Save Reminder'; saveBtn.disabled = false; }
        }
    }

    // ── Calendar ──────────────────────────────────────────────────────────────
    updateCalendar(date) {
        const names = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];
        const mel = document.getElementById('currentMonth');
        if (mel) mel.textContent = `${names[date.getMonth()]} ${date.getFullYear()}`;

        const grid = document.getElementById('calendarGrid');
        if (!grid) return;
        grid.innerHTML = '';

        const firstDay    = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        const todayStr    = new Date().toISOString().split('T')[0];

        ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
            const el = document.createElement('div');
            el.className = 'calendar-day header';
            el.textContent = d;
            grid.appendChild(el);
        });

        for (let i = 0; i < firstDay; i++) {
            const el = document.createElement('div');
            el.className = 'calendar-day empty';
            grid.appendChild(el);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const ds = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const el = document.createElement('div');
            el.className = 'calendar-day';
            el.textContent = day;
            if (ds === todayStr) el.classList.add('today');
            if (this.entries.some(e => (e.entry_date || e.date || '').startsWith(ds)))
                el.classList.add('has-entry');
            el.addEventListener('click', () => this._calendarClick(ds));
            grid.appendChild(el);
        }
    }

    _calendarClick(ds) {
        const has = this.entries.some(e => (e.entry_date || e.date || '').startsWith(ds));
        if (has) {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('[data-filter="all"]')?.classList.add('active');
            this._show('entriesSection');
            this._hide('journalFormSection');
            this._hide('promptsSection');
            setTimeout(() => {
                document.querySelectorAll('.entry-card').forEach(card => {
                    const entry = this.entries.find(x => x.id == card.dataset.id);
                    if (entry && (entry.entry_date || entry.date || '').startsWith(ds)) {
                        card.style.outline = '3px solid #96ceb4';
                        card.scrollIntoView({ behavior:'smooth', block:'center' });
                        setTimeout(() => card.style.outline = '', 2800);
                    }
                });
            }, 150);
        } else {
            if (confirm(`No entries for ${this._fmtDate(ds)}.\nCreate one?`)) {
                this.openNewEntryForm();
                const de = document.getElementById('entryDate');
                if (de) de.value = ds;
            }
        }
    }

    // ── Mood Chart ────────────────────────────────────────────────────────────
    async loadMoodChart() {
        try {
            const data  = await this._api('/journals/stats/moods');
            const moods = data.moods || [];

            const moodScore = { '😊': 5, '😌': 4, '😐': 3, '😴': 3, '😢': 2, '😠': 2 };
            const moodColors = {
                5: 'rgba(76,175,80,0.85)',
                4: 'rgba(74,134,232,0.85)',
                3: 'rgba(158,158,158,0.75)',
                2: 'rgba(244,67,54,0.8)'
            };

            const days = [], scores = [], colors = [], borderColors = [];

            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const key = d.toISOString().split('T')[0];
                days.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));

                const dayMoods = moods.filter(m => (m.entry_date || '').startsWith(key));
                if (dayMoods.length) {
                    const avg     = dayMoods.reduce((s, m) => s + (moodScore[m.mood] || 3), 0) / dayMoods.length;
                    const rounded = Math.round(avg);
                    scores.push(rounded);
                    colors.push(moodColors[rounded] || 'rgba(158,158,158,0.75)');
                    borderColors.push((moodColors[rounded] || 'rgba(158,158,158,0.75)').replace('0.85','1').replace('0.75','1').replace('0.8','1'));
                } else {
                    scores.push(null);
                    colors.push('rgba(200,200,200,0.35)');
                    borderColors.push('rgba(200,200,200,0.5)');
                }
            }

            const section = document.getElementById('moodChartSection');
            if (section) section.style.display = 'block';

            const ctx = document.getElementById('moodTrendChart');
            if (!ctx) return;

            // Destroy previous instance if re-rendering after a new entry
            if (this._moodChart) { this._moodChart.destroy(); }

            this._moodChart = new Chart(ctx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: days,
                    datasets: [{
                        label: 'Mood Score',
                        data: scores,
                        backgroundColor: colors,
                        borderColor: borderColors,
                        borderWidth: 1.5,
                        borderRadius: 7,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(55,71,133,0.92)',
                            titleColor: '#fff',
                            bodyColor: '#e0e7ff',
                            padding: 12,
                            cornerRadius: 8,
                            callbacks: {
                                label: ctx => {
                                    const map = { 5:'😊 Happy', 4:'😌 Calm', 3:'😐 Neutral / Tired', 2:'😢 Sad / Frustrated' };
                                    return ctx.raw !== null ? map[ctx.raw] || 'No entry' : 'No entry';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            min: 0, max: 5,
                            ticks: {
                                stepSize: 1,
                                color: '#6c757d',
                                font: { size: 11 },
                                callback: v => ({ 1:'😢', 2:'😐', 3:'😌', 4:'😊', 5:'🤩' }[v] || '')
                            },
                            grid: { color: '#f0f2f5' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#6c757d', font: { size: 10 } }
                        }
                    }
                }
            });
        } catch (err) {
            if (err.message === 'SESSION_EXPIRED') return;
            // Silently hide chart section if API fails — don't break page
        }
    }

    // ── Stats ─────────────────────────────────────────────────────────────────
    _updateStats(stats) {
        const total = stats.total !== undefined ? stats.total : this.entries.length;
        const week  = stats.this_week !== undefined ? stats.this_week :
            this.entries.filter(e => {
                const d = new Date((e.entry_date || e.date || '').split('T')[0] + 'T12:00:00');
                return (Date.now() - d) < 7 * 86400000;
            }).length;
        const todayPending = this.reminders.filter(r =>
            r.date === new Date().toISOString().split('T')[0] && !r.completed).length;

        const g = id => document.getElementById(id);
        if (g('totalEntries'))  g('totalEntries').textContent  = total;
        if (g('thisWeek'))      g('thisWeek').textContent      = week;
        if (g('remindersCount')) g('remindersCount').textContent = todayPending;
    }

    _updateDashboardStats() {
        const week = this.entries.filter(e => {
            const d = new Date((e.entry_date || e.date || '').split('T')[0] + 'T12:00:00');
            return (Date.now() - d) < 7 * 86400000;
        }).length;
        const todayPending = this.reminders.filter(r =>
            r.date === new Date().toISOString().split('T')[0] && !r.completed).length;
        localStorage.setItem('journalCount',  this.entries.length);
        localStorage.setItem('weeklyCount',   week);
        localStorage.setItem('reminderCount', todayPending);
        window.dispatchEvent(new Event('storage'));
    }

    // ── Word count ────────────────────────────────────────────────────────────
    _updateWordCount() {
        const text  = document.getElementById('entryContent')?.value || '';
        const count = text.trim() ? text.trim().split(/\s+/).length : 0;
        const el    = document.getElementById('wordCount');
        if (el) el.textContent = `${count} word${count !== 1 ? 's' : ''}`;
    }

    // ── Draft ─────────────────────────────────────────────────────────────────
    _saveDraft() {
        const t = document.getElementById('entryTitle')?.value;
        const c = document.getElementById('entryContent')?.value;
        if (!t && !c) return;
        localStorage.setItem('_jDraft', JSON.stringify({
            title: t, content: c,
            mood: document.getElementById('selectedMood')?.value,
            tags: document.getElementById('entryTags')?.value,
            at: Date.now()
        }));
        this.showNotification('Draft auto-saved 💾', 'info');
    }

    _restoreDraft() {
        try {
            const raw = localStorage.getItem('_jDraft');
            if (!raw) return;
            const d = JSON.parse(raw);
            if (Date.now() - d.at > 3600000) { this._clearDraft(); return; }
            const tEl = document.getElementById('entryTitle');
            const cEl = document.getElementById('entryContent');
            if (!tEl || !cEl || tEl.value || cEl.value) return;
            tEl.value = d.title   || '';
            cEl.value = d.content || '';
            const sm = document.getElementById('selectedMood');
            const te = document.getElementById('entryTags');
            if (sm && d.mood) { sm.value = d.mood; document.querySelectorAll('.mood-btn').forEach(b => b.classList.toggle('active', b.dataset.mood === d.mood)); }
            if (te && d.tags) te.value = d.tags;
            this._updateWordCount();
            this.showNotification(`Draft restored from ${new Date(d.at).toLocaleTimeString()} 📄`, 'info');
        } catch (_) {}
    }

    _clearDraft() {
        localStorage.removeItem('_jDraft');
        clearTimeout(this._draftTimer);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    _show(id) { const el = document.getElementById(id); if (el) el.style.display = 'block'; }
    _hide(id) { const el = document.getElementById(id); if (el) el.style.display = 'none';  }

    _fmtDate(str) {
        if (!str) return '';
        const d = new Date(str.includes('T') ? str : str + 'T12:00:00');
        return d.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
    }

    _fmtTime(t) {
        if (!t) return '';
        const [h, m] = t.split(':').map(Number);
        return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
    }

    _esc(s) {
        if (!s) return '';
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
    }

    // ── Notifications ─────────────────────────────────────────────────────────
    showNotification(msg, type = 'info') {
        document.querySelectorAll('.jn-notif').forEach(n => n.remove());
        const colors = { success:'#4CAF50', error:'#f44336', info:'#2196F3' };
        const icons  = { success:'✅', error:'❌', info:'💡' };
        const el = document.createElement('div');
        el.className = 'jn-notif';
        el.style.background = colors[type] || colors.info;
        el.innerHTML = `<div class="jn-inner">
            <span>${icons[type]||'💡'}</span>
            <span class="jn-msg">${this._esc(msg)}</span>
            <button class="jn-close" onclick="this.closest('.jn-notif').remove()">×</button>
        </div>`;
        document.body.appendChild(el);
        setTimeout(() => el.parentElement && el.remove(), 5000);
    }

    // ── AI Weekly Insights (#10) ──────────────────────────────────────────────
    // Loads cached insights or generates fresh ones on first visit each day.
    async _loadAIInsights() {
        try {
            const cached = JSON.parse(localStorage.getItem('_aiInsights') || 'null');
            const today  = new Date().toISOString().split('T')[0];
            if (cached && cached.date === today && cached.text) {
                this._renderAIInsights(cached.text, cached.generatedAt);
                return;
            }
        } catch (_) {}
        // Don't auto-generate on load — wait for user to click Generate
    }

    async _generateAIInsights(force = false) {
        const body    = document.getElementById('aiInsightsBody');
        const genBtn  = document.getElementById('aiInsightsGenerateBtn');
        const refBtn  = document.getElementById('aiInsightsRefreshBtn');
        if (!body) return;

        // Show loading state
        body.innerHTML =
            '<div class="ai-insights-loading">' +
                '<div class="ai-insights-spinner"></div>' +
                '<span>Analysing your week… this may take a moment</span>' +
            '</div>';
        if (refBtn) { refBtn.disabled = true; refBtn.textContent = '... Generating'; }

        try {
            // Gather the last 7 days of entries
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recent = this.entries.filter(e => {
                const d = new Date((e.entry_date || e.date || '').split('T')[0] + 'T12:00:00');
                return d >= sevenDaysAgo;
            });

            if (recent.length === 0) {
                body.innerHTML =
                    '<div class="ai-insights-placeholder">' +
                        '<span class="ai-insights-placeholder-icon">📭</span>' +
                        '<p>No journal entries found for the past 7 days. Write a few entries first, then come back for your insights!</p>' +
                    '</div>';
                if (refBtn) { refBtn.disabled = false; refBtn.textContent = '↻ Refresh'; }
                return;
            }

            // Build a compact summary for the AI prompt
            const entrySummaries = recent.map(e =>
                'Date: ' + (e.entry_date || e.date || '').split('T')[0] +
                ' | Mood: ' + (e.mood || 'not set') +
                ' | Title: ' + (e.title || '') +
                ' | Excerpt: ' + (e.content || '').slice(0, 200)
            ).join('\n');

            const moodList  = recent.map(e => e.mood).filter(Boolean);
            const moodCounts = {};
            moodList.forEach(m => { moodCounts[m] = (moodCounts[m] || 0) + 1; });
            const moodSummary = Object.entries(moodCounts)
                .map(([m, c]) => m + ' x' + c).join(', ');

            const prompt =
                'You are a warm, empathetic mental wellness assistant on an Alzheimer\'s support app. ' +
                'A patient or caregiver has written ' + recent.length + ' journal entries this week.\n\n' +
                'ENTRIES:\n' + entrySummaries + '\n\n' +
                'MOOD SUMMARY: ' + moodSummary + '\n\n' +
                'Please provide a concise weekly insights report with these EXACT sections (use these headings):\n' +
                '## Mood Overview\n(2-3 sentences on their emotional patterns this week)\n\n' +
                '## Key Themes\n(2-3 bullet points of topics or themes recurring in their entries)\n\n' +
                '## Positive Highlights\n(1-2 encouraging things noticed)\n\n' +
                '## Gentle Suggestions\n(2-3 brief, kind, practical tips based on what you saw)\n\n' +
                'Keep the tone warm, supportive and non-clinical. ' +
                'Do NOT mention specific names from entries. Keep each section brief.';

            const response = await fetch(API_BASE + '/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.token
                },
                body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
            });

            if (!response.ok) throw new Error('AI service error ' + response.status);
            const data = await response.json();
            const text = data.reply || '';
            if (!text) throw new Error('Empty AI response');

            // Cache for today
            localStorage.setItem('_aiInsights', JSON.stringify({
                date: new Date().toISOString().split('T')[0],
                text,
                generatedAt: new Date().toISOString()
            }));

            this._renderAIInsights(text, new Date().toISOString());

        } catch (err) {
            if (err.message === 'SESSION_EXPIRED') return;
            body.innerHTML =
                '<div class="ai-insights-placeholder">' +
                    '<span class="ai-insights-placeholder-icon">⚠️</span>' +
                    '<p>Could not generate insights right now. Please try again in a moment.</p>' +
                    '<button class="ai-insights-generate-btn" id="aiInsightsRetryBtn">Try Again</button>' +
                '</div>';
            document.getElementById('aiInsightsRetryBtn')?.addEventListener('click', () => this._generateAIInsights(true));
        } finally {
            if (refBtn) { refBtn.disabled = false; refBtn.textContent = '↻ Refresh'; }
        }
    }

    _renderAIInsights(text, generatedAt) {
        const body = document.getElementById('aiInsightsBody');
        if (!body) return;

        // Parse the markdown-style sections from AI response into styled HTML
        const sectionMap = {
            'Mood Overview':       { cls: 'mood',     icon: '💭' },
            'Key Themes':          { cls: 'patterns',  icon: '🔍' },
            'Positive Highlights': { cls: 'tips',      icon: '✨' },
            'Gentle Suggestions':  { cls: 'tips',      icon: '💡' }
        };

        let html = '<div class="ai-insights-content">';

        // Split on ## headings
        const sections = text.split(/^##\s*/m).filter(Boolean);
        sections.forEach(section => {
            const lines     = section.split('\n').filter(Boolean);
            const heading   = lines[0].trim().replace(/^\*+|\*+$/g, '');
            const bodyLines = lines.slice(1);

            const meta = sectionMap[heading] || { cls: '', icon: '📌' };

            html += '<div class="ai-insights-section ' + meta.cls + '">';
            html += '<h4>' + meta.icon + ' ' + this._esc(heading) + '</h4>';

            bodyLines.forEach(line => {
                const clean = line.trim();
                if (!clean) return;
                if (clean.startsWith('-') || clean.startsWith('*')) {
                    // It's a bullet list item
                    html += '<ul><li>' + this._esc(clean.replace(/^[-*]\s*/, '')) + '</li></ul>';
                } else {
                    html += '<p>' + this._esc(clean) + '</p>';
                }
            });

            html += '</div>';
        });

        // If parsing produced nothing (AI responded differently), show raw
        if (sections.length === 0) {
            html += '<p>' + this._esc(text) + '</p>';
        }

        const ts = generatedAt
            ? 'Generated ' + new Date(generatedAt).toLocaleString('en-US', { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
            : '';

        html += '</div>';
        html += '<div class="ai-insights-footer">' +
                    '<span class="ai-insights-timestamp">' + this._esc(ts) + '</span>' +
                    '<span>Based on your last 7 days of entries</span>' +
                '</div>';

        body.innerHTML = html;
    }
}

// ── Boot ──────────────────────────────────────────────────────────────────────
window.journal = new Journal();
