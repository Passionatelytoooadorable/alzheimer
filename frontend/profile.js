// profile.js
document.addEventListener('DOMContentLoaded', function () {

    // Auth guard
    if (!localStorage.getItem('token')) {
        window.location.href = 'signup.html';
        return;
    }

    // Nav
    const nav = document.getElementById('profilePageNav');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    nav.innerHTML = buildProfileNav(user);
    initProfileDropdown();

    // ── Confetti ──
    spawnConfetti();

    // ── Load data ──
    loadProfileData();
    loadStats();
    loadReports();

    // ── Edit Personal Info ──
    document.getElementById('editToggleBtn').addEventListener('click', toggleEdit);
    document.getElementById('cancelEditBtn').addEventListener('click', toggleEdit);
    document.getElementById('editForm').addEventListener('submit', savePersonalInfo);

    // ── Edit Medical Info ──
    document.getElementById('editMedBtn').addEventListener('click', toggleMedEdit);
    document.getElementById('cancelMedBtn').addEventListener('click', toggleMedEdit);
    document.getElementById('editMedForm').addEventListener('submit', saveMedInfo);

    // ── Functions ──

    function loadProfileData() {
        const profile = JSON.parse(localStorage.getItem('profileData') || '{}');
        const user    = JSON.parse(localStorage.getItem('user') || '{}');

        const name  = profile.name  || user.name  || localStorage.getItem('userName') || '—';
        const email = profile.email || user.email || localStorage.getItem('userEmail') || '—';
        const phone = profile.phone || '—';

        // Hero
        document.getElementById('profileHeroName').textContent = name;
        document.getElementById('profileAvatarBig').textContent = name.charAt(0).toUpperCase();

        // Join date from user token or stored
        const joinDate = profile.joinDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        document.getElementById('profileJoinDate').textContent = joinDate;
        if (!profile.joinDate) saveField('joinDate', joinDate);

        // View mode
        setText('view-name',      profile.name      || user.name || '—');
        setText('view-age',       profile.age        || '—');
        setText('view-dob',       profile.dob        || '—');
        setText('view-gender',    profile.gender     || '—');
        setText('view-blood',     profile.blood      || '—');
        setText('view-email',     email);
        setText('view-phone',     phone);
        setText('view-address',   profile.address    || '—');
        setText('view-emergency', profile.emergency  || '—');

        // Medical
        const med = JSON.parse(localStorage.getItem('medicalData') || '{}');
        setText('view-doctor',    med.doctor    || '—');
        setText('view-hospital',  med.hospital  || '—');
        setText('view-diagnosis', med.diagnosis || '—');
        setText('view-meds',      med.meds      || '—');
        setText('view-allergies', med.allergies || '—');

        // Pre-fill edit fields
        setVal('edit-name',      profile.name      || user.name || '');
        setVal('edit-age',       profile.age        || '');
        setVal('edit-dob',       profile.dob        || '');
        setVal('edit-gender',    profile.gender     || '');
        setVal('edit-blood',     profile.blood      || '');
        setVal('edit-phone',     phone !== '—' ? phone : (user.phone || ''));
        setVal('edit-address',   profile.address    || '');
        setVal('edit-emergency', profile.emergency  || '');

        setVal('edit-doctor',    med.doctor    || '');
        setVal('edit-hospital',  med.hospital  || '');
        setVal('edit-diagnosis', med.diagnosis || '');
        setVal('edit-meds',      med.meds      || '');
        setVal('edit-allergies', med.allergies || '');
    }

    function loadStats() {
        const reports  = JSON.parse(localStorage.getItem('userReports') || '[]');
        const journals = JSON.parse(localStorage.getItem('journalEntries') || '[]').length
                      || JSON.parse(localStorage.getItem('journals') || '[]').length || 0;
        const reminders = JSON.parse(localStorage.getItem('reminders') || '[]').length || 0;
        const profile   = JSON.parse(localStorage.getItem('profileData') || '{}');

        // Days member
        const joinTs = profile.joinTimestamp || Date.now();
        if (!profile.joinTimestamp) {
            const p = JSON.parse(localStorage.getItem('profileData') || '{}');
            p.joinTimestamp = Date.now();
            localStorage.setItem('profileData', JSON.stringify(p));
        }
        const days = Math.max(1, Math.floor((Date.now() - joinTs) / 86400000));

        document.getElementById('statReports').textContent   = reports.length;
        document.getElementById('statDays').textContent      = days;
        document.getElementById('statJournal').textContent   = journals;
        document.getElementById('statReminders').textContent = reminders;

        document.getElementById('heroReportsBadge').textContent = '📋 ' + reports.length + ' Report' + (reports.length !== 1 ? 's' : '');
    }

    function loadReports() {
        const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
        const list    = document.getElementById('reportsList');
        const badge   = document.getElementById('reportCountBadge');
        badge.textContent = reports.length;

        if (reports.length === 0) {
            list.innerHTML = `
                <div class="empty-reports">
                    <div class="empty-icon">📋</div>
                    <p>No reports yet. Upload a PDF scan to get started.</p>
                    <a href="index.html" class="upload-report-link">Upload Report →</a>
                </div>`;
            return;
        }

        list.innerHTML = reports.map(r => `
            <div class="report-item">
                <div class="report-icon">${r.result === 'Positive' ? '⚠️' : '✅'}</div>
                <div class="report-info">
                    <div class="report-name">📄 ${r.fileName}</div>
                    <div class="report-date">🗓️ ${r.date}</div>
                    ${r.result === 'Positive' ? `<div class="report-risk">Risk: ${r.riskScore}%</div>` : ''}
                </div>
                <span class="report-badge ${r.result === 'Positive' ? 'positive' : 'negative'}">${r.result}</span>
            </div>
        `).join('');
    }

    function toggleEdit() {
        const view = document.getElementById('viewMode');
        const form = document.getElementById('editForm');
        const btn  = document.getElementById('editToggleBtn');
        const editing = form.style.display !== 'none';
        view.style.display = editing ? 'block' : 'none';
        form.style.display = editing ? 'none'  : 'block';
        btn.textContent = editing ? '✏️ Edit Profile' : '✕ Cancel';
    }

    function savePersonalInfo(e) {
        e.preventDefault();
        const profile = JSON.parse(localStorage.getItem('profileData') || '{}');
        profile.name      = getVal('edit-name');
        profile.age       = getVal('edit-age');
        profile.dob       = getVal('edit-dob');
        profile.gender    = getVal('edit-gender');
        profile.blood     = getVal('edit-blood');
        profile.phone     = getVal('edit-phone');
        profile.address   = getVal('edit-address');
        profile.emergency = getVal('edit-emergency');
        localStorage.setItem('profileData', JSON.stringify(profile));

        // Also update stored user name
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.name = profile.name;
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userName', profile.name);

        loadProfileData();
        toggleEdit();
        showToast('Profile updated successfully! ✅');
    }

    function toggleMedEdit() {
        const view = document.getElementById('viewMedMode');
        const form = document.getElementById('editMedForm');
        const btn  = document.getElementById('editMedBtn');
        const editing = form.style.display !== 'none';
        view.style.display = editing ? 'block' : 'none';
        form.style.display = editing ? 'none'  : 'block';
        btn.textContent = editing ? '✏️ Edit Medical Info' : '✕ Cancel';
    }

    function saveMedInfo(e) {
        e.preventDefault();
        const med = {
            doctor:    getVal('edit-doctor'),
            hospital:  getVal('edit-hospital'),
            diagnosis: getVal('edit-diagnosis'),
            meds:      getVal('edit-meds'),
            allergies: getVal('edit-allergies')
        };
        localStorage.setItem('medicalData', JSON.stringify(med));
        loadProfileData();
        toggleMedEdit();
        showToast('Medical info updated! ✅');
    }

    function saveField(key, val) {
        const p = JSON.parse(localStorage.getItem('profileData') || '{}');
        p[key] = val;
        localStorage.setItem('profileData', JSON.stringify(p));
    }

    function showToast(msg) {
        const t = document.createElement('div');
        t.textContent = msg;
        Object.assign(t.style, {
            position: 'fixed', bottom: '2rem', right: '2rem',
            background: '#28a745', color: 'white',
            padding: '0.85rem 1.4rem', borderRadius: '10px',
            fontWeight: '600', fontSize: '0.92rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            zIndex: '9999', animation: 'card-slide 0.3s ease'
        });
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }

    function spawnConfetti() {
        const container = document.getElementById('heroConfetti');
        const colors = ['#ff6b9d','#ffd700','#00e5ff','#a8ff78','#ff9a52','#c44dff'];
        for (let i = 0; i < 18; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.top  = Math.random() * 100 + '%';
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = (Math.random() * 4) + 's';
            piece.style.animationDuration = (3 + Math.random() * 3) + 's';
            piece.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
            container.appendChild(piece);
        }
    }

    // Helpers
    function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
    function setVal(id, val)  { const el = document.getElementById(id); if (el) el.value = val; }
    function getVal(id)       { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
});

// ── Shared nav helpers (also used in scan.js) ──
function buildProfileNav(user) {
    const name    = (user && user.name) || localStorage.getItem('userName') || 'User';
    const initial = name.charAt(0).toUpperCase();
    return `
        <a href="dashboard.html">Dashboard</a>
        <a href="resources.html">Resources</a>
        <div class="profile-nav-wrap" id="profileNavWrap">
            <button class="profile-nav-btn" id="profileNavBtn">
                <div class="profile-avatar-small">${initial}</div>
                <span class="profile-name-short">${name.split(' ')[0]}</span>
                <span class="profile-caret">▾</span>
            </button>
            <div class="profile-dropdown" id="profileDropdown">
                <a href="profile.html" class="dropdown-item">👤 My Profile</a>
                <a href="#" class="dropdown-item" id="dropLogout">🚪 Logout</a>
            </div>
        </div>`;
}

function initProfileDropdown() {
    const btn = document.getElementById('profileNavBtn');
    const dd  = document.getElementById('profileDropdown');
    if (!btn || !dd) return;
    btn.addEventListener('click', (e) => { e.stopPropagation(); dd.classList.toggle('open'); });
    document.addEventListener('click', () => dd.classList.remove('open'));
    const logoutEl = document.getElementById('dropLogout');
    if (logoutEl) logoutEl.addEventListener('click', (e) => { e.preventDefault(); doLogout(); });
}

function doLogout() {
    ['token','user','isLoggedIn','userName','userEmail','isNewUser','scanCompleted'].forEach(k => localStorage.removeItem(k));
    window.location.href = 'signup.html';
}
