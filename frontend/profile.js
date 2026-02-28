/**
 * profile.js
 * All profile data is saved TO and loaded FROM the backend (Neon DB).
 * LocalStorage (UserStore) is used as an instant-load cache only.
 * This means data is the same on every device / browser / incognito.
 */
document.addEventListener('DOMContentLoaded', function () {

    if (!localStorage.getItem('token')) {
        window.location.replace('signup.html');
        return;
    }

    // Init nav
    var nav = document.getElementById('profilePageNav');
    if (nav) {
        nav.innerHTML = buildProfileNav(JSON.parse(localStorage.getItem('user') || '{}'));
        initProfileDropdown();
    }

    spawnConfetti();

    // Load from backend first, fall back to local cache while loading
    loadFromBackend();

    // ── Event listeners ──────────────────────────────────────────
    on('editToggleBtn', 'click',  function () { toggleForm('viewMode',    'editForm',    'editToggleBtn', '✏️ Edit Profile'); });
    on('cancelEditBtn', 'click',  function () { toggleForm('viewMode',    'editForm',    'editToggleBtn', '✏️ Edit Profile'); });
    on('editForm',      'submit', savePersonalInfo);

    on('editMedBtn',   'click',  function () { toggleForm('viewMedMode', 'editMedForm', 'editMedBtn',    '✏️ Edit Medical Info'); });
    on('cancelMedBtn', 'click',  function () { toggleForm('viewMedMode', 'editMedForm', 'editMedBtn',    '✏️ Edit Medical Info'); });
    on('editMedForm',  'submit', saveMedInfo);

    on('addReportBtn', 'click', openAddReportModal);

    // ── Backend sync ─────────────────────────────────────────────

    async function loadFromBackend() {
        // Show cached data instantly while we fetch from backend
        renderFromCache();

        try {
            // Load profile + reports in parallel
            var [profRes, repRes] = await Promise.all([
                API.get('/profile'),
                API.get('/reports')
            ]);

            var profData = await profRes.json();
            var repData  = await repRes.json();

            // Update local cache with fresh data from DB
            if (profData.profile) {
                UserStore.set('profileData', profData.profile);
            }
            if (profData.medical) {
                UserStore.set('medicalData', profData.medical);
            }
            if (repData.reports) {
                UserStore.set('userReports', repData.reports);
            }

            // Re-render with DB data
            renderAll();

        } catch (err) {
            console.warn('Could not load from backend, using cache:', err);
            // Already rendered from cache above — nothing more to do
        }
    }

    function renderAll() {
        renderProfile();
        renderStats();
        renderReports();
    }

    function renderFromCache() {
        renderProfile();
        renderStats();
        renderReports();
    }

    // ── Render functions ─────────────────────────────────────────

    function renderProfile() {
        var profile = UserStore.get('profileData', {});
        var user    = JSON.parse(localStorage.getItem('user') || '{}');
        var med     = UserStore.get('medicalData', {});

        var name  = profile.name  || user.name  || localStorage.getItem('userName') || 'User';
        var email = profile.email || user.email || '—';
        var phone = profile.phone || '—';

        // Ensure baseline profile saved locally
        if (!profile.name && user.name) {
            profile.name      = user.name;
            profile.email     = user.email || '';
            profile.joinDate  = profile.joinDate  || new Date().toLocaleDateString('en-US', { year:'numeric', month:'long' });
            profile.joinTimestamp = profile.joinTimestamp || Date.now();
            UserStore.set('profileData', profile);
        }

        setTxt('profileHeroName', name);
        var av = document.getElementById('profileAvatarBig');
        if (av) av.textContent = name.charAt(0).toUpperCase();
        setTxt('profileJoinDate', profile.joinDate || new Date().toLocaleDateString('en-US', { year:'numeric', month:'long' }));

        setTxt('view-name',      name);
        setTxt('view-age',       profile.age       || '—');
        setTxt('view-dob',       profile.dob       || '—');
        setTxt('view-gender',    profile.gender    || '—');
        setTxt('view-blood',     profile.blood     || '—');
        setTxt('view-email',     email);
        setTxt('view-phone',     phone !== '—' ? phone : '—');
        setTxt('view-address',   profile.address   || '—');
        setTxt('view-emergency', profile.emergency || '—');

        setTxt('view-doctor',    med.doctor    || '—');
        setTxt('view-hospital',  med.hospital  || '—');
        setTxt('view-diagnosis', med.diagnosis || '—');
        setTxt('view-meds',      med.meds      || '—');
        setTxt('view-allergies', med.allergies || '—');

        // Pre-fill edit forms
        setVal('edit-name',      name);
        setVal('edit-age',       profile.age       || '');
        setVal('edit-dob',       profile.dob       || '');
        setVal('edit-gender',    profile.gender    || '');
        setVal('edit-blood',     profile.blood     || '');
        setVal('edit-phone',     phone !== '—' ? phone : '');
        setVal('edit-address',   profile.address   || '');
        setVal('edit-emergency', profile.emergency || '');
        setVal('edit-doctor',    med.doctor    || '');
        setVal('edit-hospital',  med.hospital  || '');
        setVal('edit-diagnosis', med.diagnosis || '');
        setVal('edit-meds',      med.meds      || '');
        setVal('edit-allergies', med.allergies || '');
    }

    function renderStats() {
        var reports   = UserStore.get('userReports',    []);
        var je        = UserStore.get('journalEntries', []);
        if (!je.length) je = UserStore.get('journals', []);
        var reminders = UserStore.get('reminders',      []);
        var profile   = UserStore.get('profileData',    {});
        var joinTs    = profile.joinTimestamp || Date.now();
        var days      = Math.max(1, Math.floor((Date.now() - joinTs) / 86400000));

        setTxt('statReports',   reports.length);
        setTxt('statDays',      days);
        setTxt('statJournal',   je.length);
        setTxt('statReminders', reminders.length);

        var badge = document.getElementById('heroReportsBadge');
        if (badge) badge.textContent = '📋 ' + reports.length + ' Report' + (reports.length !== 1 ? 's' : '');
    }

    function renderReports() {
        var reports = UserStore.get('userReports', []);
        var list    = document.getElementById('reportsList');
        var badge   = document.getElementById('reportCountBadge');
        if (badge) badge.textContent = reports.length;
        if (!list) return;

        if (reports.length === 0) {
            list.innerHTML =
                '<div class="empty-reports">' +
                    '<div class="empty-icon">📋</div>' +
                    '<p>No reports yet. Upload a PDF scan to get started.</p>' +
                    '<a href="index.html" class="upload-report-link">Upload Report →</a>' +
                '</div>';
            return;
        }

        list.innerHTML = reports.map(function (r, idx) {
            return '<div class="report-item">' +
                '<div class="report-icon">' + (r.result === 'Positive' ? '⚠️' : '✅') + '</div>' +
                '<div class="report-info">' +
                    '<div class="report-name">📄 ' + esc(r.fileName) + '</div>' +
                    '<div class="report-date">🗓️ ' + esc(r.date) + '</div>' +
                    (r.result === 'Positive' ? '<div class="report-risk">Risk: ' + r.riskScore + '%</div>' : '') +
                    (r.notes ? '<div style="font-size:0.78rem;color:#888;margin-top:2px;">📝 ' + esc(r.notes) + '</div>' : '') +
                '</div>' +
                '<span class="report-badge ' + (r.result === 'Positive' ? 'positive' : 'negative') + '">' + r.result + '</span>' +
                '<button class="del-report-btn" data-idx="' + idx + '" data-id="' + (r.id || '') + '" ' +
                    'title="Delete" style="background:none;border:none;cursor:pointer;font-size:1.1rem;' +
                    'padding:4px 6px;color:#ddd;margin-left:4px;border-radius:4px;" ' +
                    'onmouseover="this.style.color=\'#e74c3c\';this.style.background=\'#fff0f0\'" ' +
                    'onmouseout="this.style.color=\'#ddd\';this.style.background=\'none\'">🗑️</button>' +
            '</div>';
        }).join('');

        list.querySelectorAll('.del-report-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var idx      = parseInt(this.getAttribute('data-idx'));
                var reportId = this.getAttribute('data-id');
                if (confirm('Delete this report?')) deleteReport(idx, reportId);
            });
        });
    }

    async function deleteReport(idx, reportId) {
        // Remove from local cache immediately (optimistic update)
        var reports = UserStore.get('userReports', []);
        reports.splice(idx, 1);
        UserStore.set('userReports', reports);
        renderReports();
        renderStats();

        // Then delete from backend
        if (reportId) {
            try {
                await API.del('/reports/' + reportId);
            } catch (err) {
                console.warn('Could not delete from backend:', err);
            }
        }
        showToast('Report deleted.');
    }

    // ── Save personal info ────────────────────────────────────────

    async function savePersonalInfo(e) {
        e.preventDefault();
        var profile = UserStore.get('profileData', {});
        var updates = {
            name:      getVal('edit-name'),
            age:       getVal('edit-age'),
            dob:       getVal('edit-dob'),
            gender:    getVal('edit-gender'),
            blood:     getVal('edit-blood'),
            phone:     getVal('edit-phone'),
            address:   getVal('edit-address'),
            emergency: getVal('edit-emergency')
        };

        // Merge & preserve join date
        Object.assign(profile, updates);
        if (!profile.joinDate) {
            profile.joinDate      = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long' });
            profile.joinTimestamp = Date.now();
        }

        // Save to local cache instantly
        UserStore.set('profileData', profile);

        // Update displayed name in nav
        var userData  = JSON.parse(localStorage.getItem('user') || '{}');
        userData.name = profile.name;
        localStorage.setItem('user',     JSON.stringify(userData));
        localStorage.setItem('userName', profile.name);

        renderProfile();
        toggleForm('viewMode', 'editForm', 'editToggleBtn', '✏️ Edit Profile');

        var nav = document.getElementById('profilePageNav');
        if (nav) { nav.innerHTML = buildProfileNav(userData); initProfileDropdown(); }

        showToast('💾 Saving…');

        // Save to backend (syncs across all devices)
        try {
            await API.post('/profile/personal', updates);
            showToast('✅ Profile saved!');
        } catch (err) {
            showToast('⚠️ Saved locally. Will sync when online.', 'warn');
        }
    }

    async function saveMedInfo(e) {
        e.preventDefault();
        var med = {
            doctor:    getVal('edit-doctor'),
            hospital:  getVal('edit-hospital'),
            diagnosis: getVal('edit-diagnosis'),
            meds:      getVal('edit-meds'),
            allergies: getVal('edit-allergies')
        };

        UserStore.set('medicalData', med);
        renderProfile();
        toggleForm('viewMedMode', 'editMedForm', 'editMedBtn', '✏️ Edit Medical Info');

        showToast('💾 Saving…');

        try {
            await API.post('/profile/medical', med);
            showToast('✅ Medical info saved!');
        } catch (err) {
            showToast('⚠️ Saved locally. Will sync when online.', 'warn');
        }
    }

    // ── Add Report Modal ─────────────────────────────────────────

    function openAddReportModal() {
        var old = document.getElementById('addReportModal');
        if (old) old.remove();

        var today = new Date().toISOString().split('T')[0];
        var m = document.createElement('div');
        m.id = 'addReportModal';
        m.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;padding:1rem;';

        m.innerHTML = [
            '<div style="background:#fff;border-radius:16px;padding:2rem;width:100%;max-width:460px;',
                        'box-shadow:0 20px 60px rgba(0,0,0,0.25);max-height:90vh;overflow-y:auto;">',
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.3rem;">',
                    '<h3 style="color:#374785;margin:0;font-size:1.15rem;">➕ Add Report Manually</h3>',
                    '<button id="closeAddModal" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#aaa;">✕</button>',
                '</div>',
                mField('Report Name *',  'text',   'mr-name',   'e.g. MRI Report Jan 2026'),
                mField('Date *',         'date',   'mr-date',   ''),
                mSelect(),
                '<div id="riskRow" style="display:none;">' + mField('Risk Score (0–100)', 'number', 'mr-risk', 'e.g. 72') + '</div>',
                mField('Doctor / Hospital', 'text', 'mr-doctor', 'Optional'),
                mField('Notes',           'text',   'mr-notes',  'Optional'),
                '<div id="mr-err" style="color:#e74c3c;font-size:0.83rem;margin-top:4px;display:none;"></div>',
                '<div style="display:flex;gap:0.8rem;margin-top:1.4rem;justify-content:flex-end;">',
                    '<button id="cancelAdd" style="background:#fff;border:2px solid #e2e8f0;color:#555;padding:0.6rem 1.3rem;border-radius:8px;font-weight:600;cursor:pointer;">Cancel</button>',
                    '<button id="saveAdd"   style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;padding:0.6rem 1.6rem;border-radius:8px;font-weight:600;cursor:pointer;">💾 Save</button>',
                '</div>',
            '</div>'
        ].join('');

        document.body.appendChild(m);
        document.getElementById('mr-date').value = today;

        document.getElementById('mr-result').addEventListener('change', function () {
            document.getElementById('riskRow').style.display = this.value === 'Positive' ? 'block' : 'none';
        });

        function close() { m.remove(); }
        on('closeAddModal', 'click', close);
        on('cancelAdd',     'click', close);
        on('saveAdd',       'click', doSave);
        m.addEventListener('click', function (e) { if (e.target === m) close(); });
        setTimeout(function () { var el = document.getElementById('mr-name'); if (el) el.focus(); }, 80);

        async function doSave() {
            var name   = document.getElementById('mr-name').value.trim();
            var date   = document.getElementById('mr-date').value;
            var result = document.getElementById('mr-result').value;
            var risk   = parseInt(document.getElementById('mr-risk').value) || 0;
            var doctor = document.getElementById('mr-doctor').value.trim();
            var notes  = document.getElementById('mr-notes').value.trim();
            var errEl  = document.getElementById('mr-err');
            errEl.style.display = 'none';

            if (!name)   { errEl.textContent = 'Report name is required.'; errEl.style.display = 'block'; return; }
            if (!date)   { errEl.textContent = 'Date is required.';        errEl.style.display = 'block'; return; }
            if (!result) { errEl.textContent = 'Result is required.';      errEl.style.display = 'block'; return; }

            var dateObj  = new Date(date + 'T00:00:00');
            var dateLabel = dateObj.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
            var report = {
                fileName:  name,
                date:      dateLabel,
                timestamp: dateObj.toISOString(),
                result:    result,
                riskScore: result === 'Positive' ? Math.max(0, Math.min(100, risk)) : 0,
                findings:  [],
                doctor:    doctor,
                notes:     notes,
                manual:    true
            };

            // Save to local cache instantly
            var reports = UserStore.get('userReports', []);
            reports.unshift(Object.assign({ id: 'local_' + Date.now() }, report));
            UserStore.set('userReports', reports);
            close();
            renderReports();
            renderStats();
            showToast('💾 Saving…');

            // Save to backend
            try {
                var res  = await API.post('/reports', report);
                var data = await res.json();
                // Update local cache with real DB id
                if (data.id) {
                    var r2 = UserStore.get('userReports', []);
                    if (r2[0] && r2[0].id && String(r2[0].id).startsWith('local_')) {
                        r2[0].id = data.id;
                        UserStore.set('userReports', r2);
                    }
                }
                showToast('✅ Report saved!');
            } catch (err) {
                showToast('⚠️ Saved locally. Will sync when online.', 'warn');
            }
        }
    }

    function mField(label, type, id, ph) {
        return '<div style="margin-bottom:0.85rem;">' +
            '<label style="display:block;font-size:0.8rem;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.3px;margin-bottom:4px;">' + label + '</label>' +
            '<input type="' + type + '" id="' + id + '" placeholder="' + ph + '"' + (type==='number'?' min="0" max="100"':'') +
            ' style="width:100%;padding:0.6rem 0.85rem;border:1.5px solid #e2e8f0;border-radius:8px;font-size:0.9rem;box-sizing:border-box;">' +
            '</div>';
    }

    function mSelect() {
        return '<div style="margin-bottom:0.85rem;">' +
            '<label style="display:block;font-size:0.8rem;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.3px;margin-bottom:4px;">Result *</label>' +
            '<select id="mr-result" style="width:100%;padding:0.6rem 0.85rem;border:1.5px solid #e2e8f0;border-radius:8px;font-size:0.9rem;box-sizing:border-box;">' +
                '<option value="">Select result…</option>' +
                '<option value="Positive">Positive — Indicators Found</option>' +
                '<option value="Negative">Negative — No Indicators</option>' +
            '</select></div>';
    }

    // ── Toggle edit forms ─────────────────────────────────────────

    function toggleForm(viewId, formId, btnId, offLabel) {
        var view   = document.getElementById(viewId);
        var form   = document.getElementById(formId);
        var btn    = document.getElementById(btnId);
        var isEdit = form && form.style.display !== 'none';
        if (view) view.style.display = isEdit ? 'block' : 'none';
        if (form) form.style.display = isEdit ? 'none'  : 'block';
        if (btn)  btn.textContent    = isEdit ? offLabel : '✕ Cancel';
    }

    // ── Helpers ──────────────────────────────────────────────────

    function showToast(msg, type) {
        var old = document.getElementById('_toast');
        if (old) old.remove();
        var t = document.createElement('div');
        t.id = '_toast';
        t.textContent = msg;
        var bg = type === 'warn' ? '#ffc107' : '#28a745';
        var co = type === 'warn' ? '#333'    : '#fff';
        Object.assign(t.style, {
            position:'fixed', bottom:'2rem', right:'2rem',
            background:bg, color:co,
            padding:'0.85rem 1.4rem', borderRadius:'10px',
            fontWeight:'600', fontSize:'0.92rem',
            boxShadow:'0 4px 20px rgba(0,0,0,0.2)', zIndex:'10000'
        });
        document.body.appendChild(t);
        setTimeout(function () { if (t.parentNode) t.remove(); }, 3500);
    }

    function spawnConfetti() {
        var c = document.getElementById('heroConfetti');
        if (!c) return;
        var colors = ['#ff6b9d','#ffd700','#00e5ff','#a8ff78','#ff9a52','#c44dff'];
        for (var i = 0; i < 18; i++) {
            var p = document.createElement('div');
            p.className = 'confetti-piece';
            p.style.left             = Math.random() * 100 + '%';
            p.style.top              = Math.random() * 100 + '%';
            p.style.background       = colors[Math.floor(Math.random() * colors.length)];
            p.style.animationDelay    = (Math.random() * 4) + 's';
            p.style.animationDuration = (3 + Math.random() * 3) + 's';
            p.style.transform        = 'rotate(' + Math.random() * 360 + 'deg)';
            c.appendChild(p);
        }
    }

    function on(id, ev, fn)   { var el = document.getElementById(id); if (el) el.addEventListener(ev, fn); }
    function setTxt(id, val)  { var el = document.getElementById(id); if (el) el.textContent = val; }
    function setVal(id, val)  { var el = document.getElementById(id); if (el) el.value = val; }
    function getVal(id)       { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
    function esc(s)           { return String(s || '').replace(/[<>&"]/g, function (c) {
        return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
});

// ── Global nav helpers ───────────────────────────────────────────

function buildProfileNav(user) {
    var pd   = window.UserStore ? UserStore.get('profileData', {}) : {};
    var name = pd.name || (user && user.name) || localStorage.getItem('userName') || 'User';
    var ini  = name.charAt(0).toUpperCase();
    return '<a href="dashboard.html" class="nav-link">Dashboard</a>' +
           '<a href="resources.html" class="nav-link">Resources</a>' +
           '<div class="profile-nav-wrap" id="profileNavWrap">' +
               '<button type="button" class="profile-nav-btn" id="profileNavBtn">' +
                   '<div class="profile-avatar-small">' + ini + '</div>' +
                   '<span class="profile-name-short">' + name.split(' ')[0] + '</span>' +
                   '<span class="profile-caret">&#9660;</span>' +
               '</button>' +
               '<div class="profile-dropdown" id="profileDropdown">' +
                   '<a href="profile.html" class="dropdown-item">&#128100; My Profile</a>' +
                   '<a href="#" class="dropdown-item" id="dropLogout">&#128682; Logout</a>' +
               '</div>' +
           '</div>';
}

function initProfileDropdown() {
    var btn = document.getElementById('profileNavBtn');
    if (!btn) return;
    var newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var d = document.getElementById('profileDropdown');
        if (d) d.classList.toggle('open');
    });
    document.addEventListener('click', function () {
        var d = document.getElementById('profileDropdown');
        if (d) d.classList.remove('open');
    });
    var logoutEl = document.getElementById('dropLogout');
    if (logoutEl) logoutEl.addEventListener('click', function (e) { e.preventDefault(); doLogout(); });
}

function doLogout() {
    ['token','user','isLoggedIn','userName','userEmail','isNewUser','scanCompleted']
        .forEach(function (k) { localStorage.removeItem(k); });
    window.location.href = 'signup.html';
}
