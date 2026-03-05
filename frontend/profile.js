/**
 * profile.js  (full version)
 *
 * Fixes:
 * 1. "Member since —" — calls /auth/me to get created_at reliably from users table
 * 2. Caregiver profile: shows patient reports instead of AI Companion quick link
 * 3. Caregiver nav: "Patients" link instead of "Dashboard"
 * 4. Patient and caregiver profiles look visually different
 */
document.addEventListener('DOMContentLoaded', function () {

    if (!localStorage.getItem('token')) {
        window.location.replace('signup.html');
        return;
    }

    var _currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    var _isCaregiver = _currentUser.role === 'caregiver';

    // ── Caregiver role adaptations ─────────────────────────────────────────────
    if (_isCaregiver) {
        // Hide patient-only sections
        ['pcard-medical', 'pcard-reports', 'pcard-links'].forEach(function (cls) {
            var el = document.querySelector('.' + cls);
            if (el) el.style.display = 'none';
        });
        // Hide patient-specific stat tiles (keep only Days Member)
        ['statReports', 'statJournal', 'statReminders'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el && el.closest('.stat-tile')) el.closest('.stat-tile').style.display = 'none';
        });
        // Tint hero banner to distinguish caregiver from patient (purple→teal)
        var hero = document.querySelector('.profile-hero');
        if (hero) hero.style.background = 'linear-gradient(135deg, #0891b2 0%, #0e7490 40%, #134e4a 100%)';

        // Replace hero subtitle
        var heroSub = document.getElementById('profileHeroSub');
        if (heroSub) heroSub.innerHTML = 'Caregiver &middot; Member since <span id="profileJoinDate">—</span>';

        // Replace hero badge
        var heroReports = document.getElementById('heroReportsBadge');
        if (heroReports) { heroReports.textContent = '👩‍⚕️ Caregiver'; heroReports.style.background = 'rgba(255,255,255,0.2)'; }

        // Add caregiver-specific sections to right column
        var rightCol = document.querySelector('.profile-right');
        if (rightCol) {
            // Quick links for caregiver (NO dashboard link — caregiver portal already IS their dashboard)
            var cgLinks = document.createElement('div');
            cgLinks.className = 'pcard pcard-links';
            cgLinks.innerHTML =
                '<div class="pcard-header"><span class="pcard-icon">🚀</span><h2>Quick Access</h2></div>' +
                '<div class="quick-links-grid">' +
                    '<a href="caregiver.html" class="qlink" style="background:linear-gradient(135deg,#0891b2,#0e7490)"><span>👥</span><span>My Patients</span></a>' +
                    '<a href="resources.html" class="qlink" style="background:linear-gradient(135deg,#a0e4f1,#0891b2)"><span>📚</span><span>Resources</span></a>' +
                    '<a href="ai-companion.html" class="qlink" style="background:linear-gradient(135deg,#ffd89b,#f9a825)"><span>🤖</span><span>AI Companion</span></a>' +
                '</div>';
            rightCol.appendChild(cgLinks);

            // Patient Reports section — shows reports of linked patient
            var cgReports = document.createElement('div');
            cgReports.className = 'pcard';
            cgReports.id = 'cgReportsCard';
            cgReports.style.display = 'none'; // shown after patient is loaded
            cgReports.innerHTML =
                '<div class="pcard-header">' +
                    '<span class="pcard-icon">🔬</span>' +
                    '<h2>Patient\'s Scan Reports</h2>' +
                    '<span class="report-count-badge" id="cgReportBadge">0</span>' +
                '</div>' +
                '<div id="cgPatientSelector" style="margin-bottom:0.75rem;font-size:0.85rem;color:#666;">' +
                    'Loading linked patients…' +
                '</div>' +
                '<div id="cgReportsList" class="reports-list">' +
                    '<div class="empty-reports"><div class="empty-icon">📋</div><p>Select a patient to view their reports.</p></div>' +
                '</div>';
            rightCol.appendChild(cgReports);
        }

        // Load linked patients for report viewer
        loadCgPatients();
    }

    // Init nav
    var nav = document.getElementById('profilePageNav');
    if (nav) { nav.innerHTML = buildProfileNav(_currentUser); initProfileDropdown(); }

    spawnConfetti();
    loadFromBackend();

    on('editToggleBtn', 'click',  function () { toggleForm('viewMode',    'editForm',    'editToggleBtn', '✏️ Edit Profile'); });
    on('cancelEditBtn', 'click',  function () { toggleForm('viewMode',    'editForm',    'editToggleBtn', '✏️ Edit Profile'); });
    on('editForm',      'submit', savePersonalInfo);
    on('editMedBtn',    'click',  function () { toggleForm('viewMedMode', 'editMedForm', 'editMedBtn',    '✏️ Edit Medical Info'); });
    on('cancelMedBtn',  'click',  function () { toggleForm('viewMedMode', 'editMedForm', 'editMedBtn',    '✏️ Edit Medical Info'); });
    on('editMedForm',   'submit', saveMedInfo);
    on('addReportBtn',  'click',  openAddReportModal);

    // ── Backend sync ──────────────────────────────────────────────────────────
    async function loadFromBackend() {
        renderFromCache();
        try {
            // Always fetch /auth/me — it reliably returns created_at from users table
            var meRes  = await API.get('/auth/me');
            var meData = await meRes.json();
            if (meData.user && meData.user.created_at) {
                var pd = UserStore.get('profileData', {});
                pd.createdAt = meData.user.created_at;
                pd.joinDate  = new Date(meData.user.created_at)
                    .toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                // Also update localStorage user object
                var lu = JSON.parse(localStorage.getItem('user') || '{}');
                lu.created_at = meData.user.created_at;
                localStorage.setItem('user', JSON.stringify(lu));
                UserStore.set('profileData', pd);
            }

            var reqs  = [API.get('/profile')];
            if (!_isCaregiver) reqs.push(API.get('/reports'));
            var resps    = await Promise.all(reqs);
            var profData = await resps[0].json();
            var repData  = (!_isCaregiver && resps[1]) ? await resps[1].json() : { reports: [] };

            if (profData.profile) {
                var existing = UserStore.get('profileData', {});
                var merged   = Object.assign({}, existing, profData.profile);
                // Preserve the createdAt we got from /auth/me — profile endpoint may not have it
                if (existing.createdAt) merged.createdAt = existing.createdAt;
                if (existing.joinDate)  merged.joinDate  = existing.joinDate;
                UserStore.set('profileData', merged);
            }
            if (profData.medical) UserStore.set('medicalData', profData.medical);
            if (repData.reports)  UserStore.set('userReports', repData.reports);
            renderAll();
        } catch (err) {
            console.warn('Backend unavailable, using cache:', err);
            var u = JSON.parse(localStorage.getItem('user') || '{}');
            if (u.email) {
                var pd2 = UserStore.get('profileData', {});
                if (!pd2.email) {
                    pd2.name  = pd2.name  || u.name  || '';
                    pd2.email = u.email;
                    // Try to use created_at from user object in localStorage
                    var ts = u.created_at || pd2.createdAt || null;
                    if (ts) {
                        pd2.createdAt = ts;
                        pd2.joinDate  = new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                    }
                    UserStore.set('profileData', pd2);
                    renderAll();
                }
            }
        }
    }

    function renderAll()       { renderProfile(); renderStats(); if (!_isCaregiver) renderReports(); }
    function renderFromCache() { renderProfile(); renderStats(); if (!_isCaregiver) renderReports(); }

    // ── renderProfile ─────────────────────────────────────────────────────────
    function renderProfile() {
        var profile = UserStore.get('profileData', {});
        var user    = JSON.parse(localStorage.getItem('user') || '{}');
        var med     = UserStore.get('medicalData', {});
        var name    = profile.name  || user.name  || localStorage.getItem('userName') || 'User';
        var email   = profile.email || user.email || '—';
        var phone   = profile.phone || '—';

        if (!profile.name && user.name) {
            profile.name = user.name; profile.email = user.email || '';
            UserStore.set('profileData', profile);
        }

        // Derive joinDate — check multiple sources in priority order
        var joinDateLabel = '';
        var ts = profile.createdAt || user.created_at || profile.joinTimestamp || null;
        if (ts) {
            joinDateLabel = new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        } else if (profile.joinDate) {
            joinDateLabel = profile.joinDate;
        }
        // Show dash only — never a hardcoded month
        joinDateLabel = joinDateLabel || '—';

        setTxt('profileHeroName', name);
        var av = document.getElementById('profileAvatarBig');
        if (av) av.textContent = name.charAt(0).toUpperCase();
        setTxt('profileJoinDate', joinDateLabel);

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

    // ── renderStats ───────────────────────────────────────────────────────────
    function renderStats() {
        var reports   = UserStore.get('userReports',    []);
        var je        = UserStore.get('journalEntries', []);
        if (!je.length) je = UserStore.get('journals', []);
        var reminders = UserStore.get('reminders',      []);
        var profile   = UserStore.get('profileData',    {});
        var user      = JSON.parse(localStorage.getItem('user') || '{}');

        var ts = profile.createdAt || user.created_at || profile.joinTimestamp || null;
        var days = 1;
        if (ts) {
            var origin    = new Date(ts);
            var today     = new Date();
            var originDay = new Date(origin.getFullYear(), origin.getMonth(), origin.getDate());
            var todayDay  = new Date(today.getFullYear(),  today.getMonth(),  today.getDate());
            days = Math.max(1, Math.round((todayDay - originDay) / 86400000) + 1);
        }

        setTxt('statReports',   reports.length);
        setTxt('statDays',      days);
        setTxt('statJournal',   je.length);
        setTxt('statReminders', reminders.length);

        var badge = document.getElementById('heroReportsBadge');
        if (badge && !_isCaregiver)
            badge.textContent = '📋 ' + reports.length + ' Report' + (reports.length !== 1 ? 's' : '');
    }

    // ── renderReports (patient only) ──────────────────────────────────────────
    function renderReports() {
        var reports = UserStore.get('userReports', []);
        var list    = document.getElementById('reportsList');
        var badge   = document.getElementById('reportCountBadge');
        if (badge) badge.textContent = reports.length;
        if (!list) return;
        if (!reports.length) {
            list.innerHTML = '<div class="empty-reports"><div class="empty-icon">📋</div><p>No reports yet. Upload a PDF scan to get started.</p><a href="index.html" class="upload-report-link">Upload Report →</a></div>';
            return;
        }
        list.innerHTML = reports.map(function (r, idx) {
            return '<div class="report-item">' +
                '<div class="report-icon">' + (r.result === 'Positive' ? '⚠️' : '✅') + '</div>' +
                '<div class="report-info">' +
                    '<div class="report-name">📄 ' + esc(r.fileName || r.file_name || '') + '</div>' +
                    '<div class="report-date">🗓️ ' + esc(r.date || r.report_date || '') + '</div>' +
                    (r.result === 'Positive' ? '<div class="report-risk">Risk: ' + (r.riskScore || r.risk_score || 0) + '%</div>' : '') +
                    (r.notes ? '<div style="font-size:0.78rem;color:#888;margin-top:2px;">📝 ' + esc(r.notes) + '</div>' : '') +
                '</div>' +
                '<span class="report-badge ' + (r.result === 'Positive' ? 'positive' : 'negative') + '">' + esc(r.result) + '</span>' +
                '<button class="del-report-btn" data-idx="' + idx + '" data-id="' + (r.id || '') + '" ' +
                    'title="Delete" style="background:none;border:none;cursor:pointer;font-size:1.1rem;padding:4px 6px;color:#ddd;margin-left:4px;border-radius:4px;" ' +
                    'onmouseover="this.style.color=\'#e74c3c\';this.style.background=\'#fff0f0\'" ' +
                    'onmouseout="this.style.color=\'#ddd\';this.style.background=\'none\'">🗑️</button>' +
            '</div>';
        }).join('');
        list.querySelectorAll('.del-report-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var idx = parseInt(this.getAttribute('data-idx'));
                var rid = this.getAttribute('data-id');
                if (confirm('Delete this report?')) deleteReport(idx, rid);
            });
        });
    }

    async function deleteReport(idx, reportId) {
        var reports = UserStore.get('userReports', []);
        reports.splice(idx, 1);
        UserStore.set('userReports', reports);
        renderReports(); renderStats();
        if (reportId) { try { await API.del('/reports/' + reportId); } catch (e) {} }
        showToast('Report deleted.');
    }

    // ── Caregiver: load patient list for report viewer ─────────────────────────
    async function loadCgPatients() {
        try {
            var res  = await API.get('/caregiver/patients');
            var data = await res.json();
            var pts  = (data.patients || []).filter(function (p) { return p.status === 'accepted'; });
            var card = document.getElementById('cgReportsCard');
            var sel  = document.getElementById('cgPatientSelector');
            if (!pts.length || !card || !sel) return;
            card.style.display = 'block';
            if (pts.length === 1) {
                sel.innerHTML = '<div style="font-weight:600;color:#0e7490;font-size:0.88rem;">👤 ' + esc(pts[0].name) + ' (' + esc(pts[0].email) + ')</div>';
                loadPatientReports(pts[0].patient_id);
            } else {
                sel.innerHTML =
                    '<label style="font-size:0.8rem;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.3px;">View reports for:</label>' +
                    '<select id="cgPatientPicker" style="margin-top:0.3rem;width:100%;padding:0.5rem 0.7rem;border:1.5px solid #ddd;border-radius:8px;font-size:0.88rem;">' +
                        '<option value="">— Select a patient —</option>' +
                        pts.map(function (p) { return '<option value="' + p.patient_id + '">' + esc(p.name) + ' (' + esc(p.email) + ')</option>'; }).join('') +
                    '</select>';
                var picker = document.getElementById('cgPatientPicker');
                if (picker) picker.addEventListener('change', function () {
                    if (this.value) loadPatientReports(parseInt(this.value));
                    else {
                        var rl = document.getElementById('cgReportsList');
                        if (rl) rl.innerHTML = '<div class="empty-reports"><div class="empty-icon">📋</div><p>Select a patient to view their reports.</p></div>';
                        setTxt('cgReportBadge', '0');
                    }
                });
            }
        } catch (e) { console.warn('Could not load caregiver patients:', e); }
    }

    async function loadPatientReports(patientId) {
        var list  = document.getElementById('cgReportsList');
        var badge = document.getElementById('cgReportBadge');
        if (!list) return;
        list.innerHTML = '<div style="text-align:center;color:#aaa;padding:1rem;font-size:0.85rem;">Loading…</div>';
        try {
            var res  = await API.get('/caregiver/patient/' + patientId + '/reports');
            var data = await res.json();
            var rpts = data.reports || [];
            if (badge) badge.textContent = rpts.length;
            if (!rpts.length) {
                list.innerHTML = '<div class="empty-reports"><div class="empty-icon">📋</div><p>No scan reports uploaded yet by this patient.</p></div>';
                return;
            }
            list.innerHTML = rpts.map(function (r) {
                var result    = r.result || 'Unknown';
                var fileName  = r.file_name || 'Scan Report';
                var dateLabel = r.report_date ? new Date(r.report_date).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) : (r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) : '—');
                return '<div class="report-item">' +
                    '<div class="report-icon">' + (result === 'Positive' ? '⚠️' : '✅') + '</div>' +
                    '<div class="report-info">' +
                        '<div class="report-name">📄 ' + esc(fileName) + '</div>' +
                        '<div class="report-date">🗓️ ' + esc(dateLabel) + '</div>' +
                        (result === 'Positive' ? '<div class="report-risk">Risk: ' + (r.risk_score || 0) + '%</div>' : '') +
                        (r.doctor ? '<div style="font-size:0.78rem;color:#888;margin-top:2px;">👨‍⚕️ ' + esc(r.doctor) + '</div>' : '') +
                        (r.notes  ? '<div style="font-size:0.78rem;color:#888;margin-top:2px;">📝 ' + esc(r.notes) + '</div>' : '') +
                    '</div>' +
                    '<span class="report-badge ' + (result === 'Positive' ? 'positive' : 'negative') + '">' + esc(result) + '</span>' +
                '</div>';
            }).join('');
        } catch (e) {
            list.innerHTML = '<div style="color:#e74c3c;font-size:0.85rem;padding:0.5rem;">Could not load reports.</div>';
        }
    }

    // ── Save personal info ────────────────────────────────────────────────────
    async function savePersonalInfo(e) {
        e.preventDefault();
        var profile = UserStore.get('profileData', {});
        var updates = {
            name: getVal('edit-name'), age: getVal('edit-age'), dob: getVal('edit-dob'),
            gender: getVal('edit-gender'), blood: getVal('edit-blood'), phone: getVal('edit-phone'),
            address: getVal('edit-address'), emergency: getVal('edit-emergency')
        };
        Object.assign(profile, updates);
        // Preserve createdAt — don't overwrite with local timestamp
        UserStore.set('profileData', profile);
        var userData = JSON.parse(localStorage.getItem('user') || '{}');
        userData.name = profile.name;
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userName', profile.name);
        renderProfile();
        toggleForm('viewMode', 'editForm', 'editToggleBtn', '✏️ Edit Profile');
        var nav = document.getElementById('profilePageNav');
        if (nav) { nav.innerHTML = buildProfileNav(userData); initProfileDropdown(); }
        showToast('💾 Saving…');
        try { await API.post('/profile/personal', updates); showToast('✅ Profile saved!'); }
        catch (err) { showToast('⚠️ Saved locally. Will sync when online.', 'warn'); }
    }

    async function saveMedInfo(e) {
        e.preventDefault();
        var med = { doctor: getVal('edit-doctor'), hospital: getVal('edit-hospital'),
            diagnosis: getVal('edit-diagnosis'), meds: getVal('edit-meds'), allergies: getVal('edit-allergies') };
        UserStore.set('medicalData', med);
        renderProfile();
        toggleForm('viewMedMode', 'editMedForm', 'editMedBtn', '✏️ Edit Medical Info');
        showToast('💾 Saving…');
        try { await API.post('/profile/medical', med); showToast('✅ Medical info saved!'); }
        catch (err) { showToast('⚠️ Saved locally. Will sync when online.', 'warn'); }
    }

    // ── Add Report Modal (patient only) ───────────────────────────────────────
    function openAddReportModal() {
        var old = document.getElementById('addReportModal'); if (old) old.remove();
        var today = new Date().toISOString().split('T')[0];
        var m = document.createElement('div');
        m.id = 'addReportModal';
        m.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;padding:1rem;';
        m.innerHTML = '<div style="background:#fff;border-radius:16px;padding:2rem;width:100%;max-width:460px;box-shadow:0 20px 60px rgba(0,0,0,0.25);max-height:90vh;overflow-y:auto;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.3rem;"><h3 style="color:#374785;margin:0;font-size:1.15rem;">➕ Add Report Manually</h3>' +
            '<button id="closeAddModal" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#aaa;">✕</button></div>' +
            mField('Report Name *','text','mr-name','e.g. MRI Report Jan 2026') +
            mField('Date *','date','mr-date','') +
            mSelect() +
            '<div id="riskRow" style="display:none;">' + mField('Risk Score (0–100)','number','mr-risk','e.g. 72') + '</div>' +
            mField('Doctor / Hospital','text','mr-doctor','Optional') +
            mField('Notes','text','mr-notes','Optional') +
            '<div id="mr-err" style="color:#e74c3c;font-size:0.83rem;margin-top:4px;display:none;"></div>' +
            '<div style="display:flex;gap:0.8rem;margin-top:1.4rem;justify-content:flex-end;">' +
            '<button id="cancelAdd" style="background:#fff;border:2px solid #e2e8f0;color:#555;padding:0.6rem 1.3rem;border-radius:8px;font-weight:600;cursor:pointer;">Cancel</button>' +
            '<button id="saveAdd" style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;padding:0.6rem 1.6rem;border-radius:8px;font-weight:600;cursor:pointer;">💾 Save</button>' +
            '</div></div>';
        document.body.appendChild(m);
        document.getElementById('mr-date').value = today;
        document.getElementById('mr-result').addEventListener('change', function () {
            document.getElementById('riskRow').style.display = this.value === 'Positive' ? 'block' : 'none';
        });
        function close() { m.remove(); }
        on('closeAddModal','click',close); on('cancelAdd','click',close); on('saveAdd','click',doSave);
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
            if (!name)   { errEl.textContent = 'Report name is required.'; errEl.style.display='block'; return; }
            if (!date)   { errEl.textContent = 'Date is required.';        errEl.style.display='block'; return; }
            if (!result) { errEl.textContent = 'Result is required.';      errEl.style.display='block'; return; }
            var dateObj   = new Date(date+'T00:00:00');
            var dateLabel = dateObj.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
            var report    = { fileName: name, date: dateLabel, timestamp: dateObj.toISOString(),
                result, riskScore: result==='Positive'?Math.max(0,Math.min(100,risk)):0,
                findings:[], doctor, notes, manual:true };
            var reports = UserStore.get('userReports',[]);
            reports.unshift(Object.assign({id:'local_'+Date.now()}, report));
            UserStore.set('userReports', reports); close(); renderReports(); renderStats(); showToast('💾 Saving…');
            try {
                var res  = await API.post('/reports', report);
                var data = await res.json();
                if (data.id) {
                    var r2 = UserStore.get('userReports',[]);
                    if (r2[0] && String(r2[0].id).startsWith('local_')) { r2[0].id = data.id; UserStore.set('userReports', r2); }
                }
                showToast('✅ Report saved!');
            } catch (err) { showToast('⚠️ Saved locally. Will sync when online.','warn'); }
        }
    }

    function mField(label,type,id,ph){ return '<div style="margin-bottom:0.85rem;"><label style="display:block;font-size:0.8rem;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.3px;margin-bottom:4px;">'+label+'</label><input type="'+type+'" id="'+id+'" placeholder="'+ph+'"'+(type==='number'?' min="0" max="100"':'')+' style="width:100%;padding:0.6rem 0.85rem;border:1.5px solid #e2e8f0;border-radius:8px;font-size:0.9rem;box-sizing:border-box;"></div>'; }
    function mSelect(){ return '<div style="margin-bottom:0.85rem;"><label style="display:block;font-size:0.8rem;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.3px;margin-bottom:4px;">Result *</label><select id="mr-result" style="width:100%;padding:0.6rem 0.85rem;border:1.5px solid #e2e8f0;border-radius:8px;font-size:0.9rem;box-sizing:border-box;"><option value="">Select result…</option><option value="Positive">Positive — Indicators Found</option><option value="Negative">Negative — No Indicators</option></select></div>'; }

    function toggleForm(viewId,formId,btnId,offLabel){ var view=document.getElementById(viewId),form=document.getElementById(formId),btn=document.getElementById(btnId),isEdit=form&&form.style.display!=='none'; if(view)view.style.display=isEdit?'block':'none'; if(form)form.style.display=isEdit?'none':'block'; if(btn)btn.textContent=isEdit?offLabel:'✕ Cancel'; }

    function showToast(msg,type){ var old=document.getElementById('_toast'); if(old)old.remove(); var t=document.createElement('div'); t.id='_toast'; t.textContent=msg; var bg=type==='warn'?'#ffc107':'#28a745',co=type==='warn'?'#333':'#fff'; Object.assign(t.style,{position:'fixed',bottom:'2rem',right:'2rem',background:bg,color:co,padding:'0.85rem 1.4rem',borderRadius:'10px',fontWeight:'600',fontSize:'0.92rem',boxShadow:'0 4px 20px rgba(0,0,0,0.2)',zIndex:'10000'}); document.body.appendChild(t); setTimeout(function(){ if(t.parentNode)t.remove(); },3500); }

    function spawnConfetti(){ var c=document.getElementById('heroConfetti'); if(!c)return; var colors=['#ff6b9d','#ffd700','#00e5ff','#a8ff78','#ff9a52','#c44dff']; for(var i=0;i<18;i++){ var p=document.createElement('div'); p.className='confetti-piece'; p.style.left=Math.random()*100+'%'; p.style.top=Math.random()*100+'%'; p.style.background=colors[Math.floor(Math.random()*colors.length)]; p.style.animationDelay=(Math.random()*4)+'s'; p.style.animationDuration=(3+Math.random()*3)+'s'; p.style.transform='rotate('+Math.random()*360+'deg)'; c.appendChild(p); } }

    function on(id,ev,fn){ var el=document.getElementById(id); if(el)el.addEventListener(ev,fn); }
    function setTxt(id,val){ var el=document.getElementById(id); if(el)el.textContent=val; }
    function setVal(id,val){ var el=document.getElementById(id); if(el)el.value=val; }
    function getVal(id){ var el=document.getElementById(id); return el?el.value.trim():''; }
    function esc(s){ return String(s||'').replace(/[<>&"]/g,function(c){ return{'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
});

// ── Global nav helpers ─────────────────────────────────────────────────────────
function buildProfileNav(user) {
    var pd   = window.UserStore ? UserStore.get('profileData', {}) : {};
    var name = pd.name || (user && user.name) || localStorage.getItem('userName') || 'User';
    var ini  = name.charAt(0).toUpperCase();
    var isCaregiver = user && user.role === 'caregiver';

    // Caregiver: "My Patients" link → caregiver.html   (no "Dashboard" — that's redundant)
    // Patient:   "Dashboard" link  → dashboard.html
    var mainLink = isCaregiver
        ? '<a href="caregiver.html" class="nav-link">My Patients</a>'
        : '<a href="dashboard.html" class="nav-link">Dashboard</a>';

    return mainLink +
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
    var btn = document.getElementById('profileNavBtn'); if (!btn) return;
    var newBtn = btn.cloneNode(true); btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', function (e) { e.stopPropagation(); var d=document.getElementById('profileDropdown'); if(d)d.classList.toggle('open'); });
    document.addEventListener('click', function () { var d=document.getElementById('profileDropdown'); if(d)d.classList.remove('open'); });
    var logoutEl = document.getElementById('dropLogout');
    if (logoutEl) logoutEl.addEventListener('click', function (e) { e.preventDefault(); doLogout(); });
}

function doLogout() {
    ['token','user','isLoggedIn','userName','userEmail','isNewUser','scanCompleted']
        .forEach(function (k) { localStorage.removeItem(k); });
    window.location.href = 'signup.html';
}
