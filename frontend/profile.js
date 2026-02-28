// profile.js
document.addEventListener('DOMContentLoaded', function () {

    // Auth guard
    if (!localStorage.getItem('token')) {
        window.location.href = 'signup.html';
        return;
    }

    // Nav — always reads fresh user
    var nav = document.getElementById('profilePageNav');
    if (nav) {
        var stored = localStorage.getItem('user');
        var user   = stored ? JSON.parse(stored) : {};
        nav.innerHTML = buildProfileNav(user);
        initProfileDropdown();
    }

    spawnConfetti();
    loadProfileData();
    loadStats();
    loadReports();

    // Edit personal info
    var editToggle = document.getElementById('editToggleBtn');
    var cancelEdit = document.getElementById('cancelEditBtn');
    var editForm   = document.getElementById('editForm');
    if (editToggle) editToggle.addEventListener('click',   togglePersonalEdit);
    if (cancelEdit) cancelEdit.addEventListener('click',   togglePersonalEdit);
    if (editForm)   editForm.addEventListener('submit',    savePersonalInfo);

    // Edit medical info
    var editMedBtn  = document.getElementById('editMedBtn');
    var cancelMed   = document.getElementById('cancelMedBtn');
    var editMedForm = document.getElementById('editMedForm');
    if (editMedBtn)  editMedBtn.addEventListener('click',  toggleMedEdit);
    if (cancelMed)   cancelMed.addEventListener('click',   toggleMedEdit);
    if (editMedForm) editMedForm.addEventListener('submit', saveMedInfo);


    // ─── Functions ───────────────────────────────────────────────

    function loadProfileData() {
        var profile = JSON.parse(localStorage.getItem('profileData') || '{}');
        var userRaw = localStorage.getItem('user');
        var user    = userRaw ? JSON.parse(userRaw) : {};

        // Name: profileData first, then user object, then userName key
        var name  = profile.name  || user.name  || localStorage.getItem('userName') || 'User';
        var email = profile.email || user.email || localStorage.getItem('userEmail') || '—';
        var phone = profile.phone || user.phone || '—';

        // Hero section
        var heroName = document.getElementById('profileHeroName');
        var avatar   = document.getElementById('profileAvatarBig');
        var joinEl   = document.getElementById('profileJoinDate');
        if (heroName) heroName.textContent = name;
        if (avatar)   avatar.textContent   = name.charAt(0).toUpperCase();
        if (joinEl)   joinEl.textContent   = profile.joinDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

        // Ensure joinDate saved
        if (!profile.joinDate) {
            profile.joinDate      = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            profile.joinTimestamp = profile.joinTimestamp || Date.now();
            localStorage.setItem('profileData', JSON.stringify(profile));
        }

        // View fields
        setTxt('view-name',      name);
        setTxt('view-age',       profile.age      || '—');
        setTxt('view-dob',       profile.dob      || '—');
        setTxt('view-gender',    profile.gender   || '—');
        setTxt('view-blood',     profile.blood    || '—');
        setTxt('view-email',     email);
        setTxt('view-phone',     phone);
        setTxt('view-address',   profile.address  || '—');
        setTxt('view-emergency', profile.emergency|| '—');

        // Medical
        var med = JSON.parse(localStorage.getItem('medicalData') || '{}');
        setTxt('view-doctor',    med.doctor    || '—');
        setTxt('view-hospital',  med.hospital  || '—');
        setTxt('view-diagnosis', med.diagnosis || '—');
        setTxt('view-meds',      med.meds      || '—');
        setTxt('view-allergies', med.allergies || '—');

        // Pre-fill edit fields
        setVal('edit-name',      name);
        setVal('edit-age',       profile.age      || '');
        setVal('edit-dob',       profile.dob      || '');
        setVal('edit-gender',    profile.gender   || '');
        setVal('edit-blood',     profile.blood    || '');
        setVal('edit-phone',     phone !== '—' ? phone : '');
        setVal('edit-address',   profile.address  || '');
        setVal('edit-emergency', profile.emergency|| '');
        setVal('edit-doctor',    med.doctor    || '');
        setVal('edit-hospital',  med.hospital  || '');
        setVal('edit-diagnosis', med.diagnosis || '');
        setVal('edit-meds',      med.meds      || '');
        setVal('edit-allergies', med.allergies || '');
    }

    function loadStats() {
        var reports   = JSON.parse(localStorage.getItem('userReports')    || '[]');
        var je        = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        if (!je.length) je = JSON.parse(localStorage.getItem('journals')  || '[]');
        var reminders = JSON.parse(localStorage.getItem('reminders')      || '[]');
        var profile   = JSON.parse(localStorage.getItem('profileData')    || '{}');

        var joinTs = profile.joinTimestamp || Date.now();
        var days   = Math.max(1, Math.floor((Date.now() - joinTs) / 86400000));

        setTxt('statReports',   reports.length);
        setTxt('statDays',      days);
        setTxt('statJournal',   je.length);
        setTxt('statReminders', reminders.length);

        var badge = document.getElementById('heroReportsBadge');
        if (badge) badge.textContent = '📋 ' + reports.length + ' Report' + (reports.length !== 1 ? 's' : '');
    }

    function loadReports() {
        var reports = JSON.parse(localStorage.getItem('userReports') || '[]');
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

        list.innerHTML = reports.map(function (r) {
            return '<div class="report-item">' +
                '<div class="report-icon">' + (r.result === 'Positive' ? '⚠️' : '✅') + '</div>' +
                '<div class="report-info">' +
                    '<div class="report-name">📄 ' + r.fileName + '</div>' +
                    '<div class="report-date">🗓️ ' + r.date + '</div>' +
                    (r.result === 'Positive' ? '<div class="report-risk">Risk: ' + r.riskScore + '%</div>' : '') +
                '</div>' +
                '<span class="report-badge ' + (r.result === 'Positive' ? 'positive' : 'negative') + '">' + r.result + '</span>' +
            '</div>';
        }).join('');
    }

    function togglePersonalEdit() {
        var view   = document.getElementById('viewMode');
        var form   = document.getElementById('editForm');
        var btn    = document.getElementById('editToggleBtn');
        var isEdit = form && form.style.display !== 'none';
        if (view) view.style.display = isEdit ? 'block' : 'none';
        if (form) form.style.display = isEdit ? 'none'  : 'block';
        if (btn)  btn.textContent    = isEdit ? '✏️ Edit Profile' : '✕ Cancel';
    }

    function savePersonalInfo(e) {
        e.preventDefault();
        var profile = JSON.parse(localStorage.getItem('profileData') || '{}');
        profile.name      = getVal('edit-name');
        profile.age       = getVal('edit-age');
        profile.dob       = getVal('edit-dob');
        profile.gender    = getVal('edit-gender');
        profile.blood     = getVal('edit-blood');
        profile.phone     = getVal('edit-phone');
        profile.address   = getVal('edit-address');
        profile.emergency = getVal('edit-emergency');
        localStorage.setItem('profileData', JSON.stringify(profile));

        // Update user object and name keys so nav reflects new name
        var userRaw  = localStorage.getItem('user');
        var userData = userRaw ? JSON.parse(userRaw) : {};
        userData.name = profile.name;
        localStorage.setItem('user',     JSON.stringify(userData));
        localStorage.setItem('userName', profile.name);

        loadProfileData();
        loadStats();
        togglePersonalEdit();

        // Refresh nav to show updated name
        var nav = document.getElementById('profilePageNav');
        if (nav) {
            nav.innerHTML = buildProfileNav(userData);
            initProfileDropdown();
        }

        showToast('Profile updated! ✅');
    }

    function toggleMedEdit() {
        var view   = document.getElementById('viewMedMode');
        var form   = document.getElementById('editMedForm');
        var btn    = document.getElementById('editMedBtn');
        var isEdit = form && form.style.display !== 'none';
        if (view) view.style.display = isEdit ? 'block' : 'none';
        if (form) form.style.display = isEdit ? 'none'  : 'block';
        if (btn)  btn.textContent    = isEdit ? '✏️ Edit Medical Info' : '✕ Cancel';
    }

    function saveMedInfo(e) {
        e.preventDefault();
        var med = {
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

    function showToast(msg) {
        var t = document.createElement('div');
        t.textContent = msg;
        Object.assign(t.style, {
            position: 'fixed', bottom: '2rem', right: '2rem',
            background: '#28a745', color: 'white',
            padding: '0.85rem 1.4rem', borderRadius: '10px',
            fontWeight: '600', fontSize: '0.92rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: '9999'
        });
        document.body.appendChild(t);
        setTimeout(function () { if (t.parentNode) t.remove(); }, 3000);
    }

    function spawnConfetti() {
        var container = document.getElementById('heroConfetti');
        if (!container) return;
        var colors = ['#ff6b9d','#ffd700','#00e5ff','#a8ff78','#ff9a52','#c44dff'];
        for (var i = 0; i < 18; i++) {
            var piece     = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left             = Math.random() * 100 + '%';
            piece.style.top              = Math.random() * 100 + '%';
            piece.style.background       = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay    = (Math.random() * 4) + 's';
            piece.style.animationDuration = (3 + Math.random() * 3) + 's';
            piece.style.transform        = 'rotate(' + Math.random() * 360 + 'deg)';
            container.appendChild(piece);
        }
    }

    // Helpers
    function setTxt(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }
    function setVal(id, val) { var el = document.getElementById(id); if (el) el.value = val; }
    function getVal(id)      { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
});

// ── Global nav helpers (used by profile.html and scan.js) ──
function buildProfileNav(user) {
    var stored  = localStorage.getItem('user');
    var fresh   = stored ? JSON.parse(stored) : {};
    var pdRaw   = localStorage.getItem('profileData');
    var pd      = pdRaw ? JSON.parse(pdRaw) : {};
    var name    = pd.name || fresh.name || (user && user.name) || localStorage.getItem('userName') || 'User';
    var initial = name.charAt(0).toUpperCase();
    return '<a href="dashboard.html">Dashboard</a>' +
           '<a href="resources.html">Resources</a>' +
           '<div class="profile-nav-wrap" id="profileNavWrap">' +
               '<button type="button" class="profile-nav-btn" id="profileNavBtn">' +
                   '<div class="profile-avatar-small">' + initial + '</div>' +
                   '<span class="profile-name-short">' + name.split(' ')[0] + '</span>' +
                   '<span class="profile-caret">▾</span>' +
               '</button>' +
               '<div class="profile-dropdown" id="profileDropdown">' +
                   '<a href="profile.html" class="dropdown-item">👤 My Profile</a>' +
                   '<a href="#" class="dropdown-item" id="dropLogout">🚪 Logout</a>' +
               '</div>' +
           '</div>';
}

function initProfileDropdown() {
    var btn = document.getElementById('profileNavBtn');
    var dd  = document.getElementById('profileDropdown');
    if (!btn || !dd) return;
    btn.addEventListener('click', function (e) {
        e.stopPropagation(); dd.classList.toggle('open');
    });
    document.addEventListener('click', function () { if (dd) dd.classList.remove('open'); });
    var logoutEl = document.getElementById('dropLogout');
    if (logoutEl) {
        logoutEl.addEventListener('click', function (e) { e.preventDefault(); doLogout(); });
    }
}

function doLogout() {
    ['token','user','isLoggedIn','userName','userEmail','isNewUser','scanCompleted'].forEach(function (k) {
        localStorage.removeItem(k);
    });
    window.location.href = 'signup.html';
}
