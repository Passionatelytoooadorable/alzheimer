/**
 * nav-shared.js  —  Shared navigation for all protected pages
 * Include AFTER user-store.js
 */

function buildProfileNav(user) {
    // Always read freshest data
    var stored = localStorage.getItem('user');
    var fresh  = stored ? JSON.parse(stored) : {};
    // Check scoped profileData for updated name
    var pd   = UserStore ? UserStore.get('profileData', {}) : {};
    var name = pd.name || fresh.name || (user && user.name) || localStorage.getItem('userName') || 'User';
    var initial   = name.charAt(0).toUpperCase();
    var firstName = name.split(' ')[0];

    // Role-aware Home: caregivers go to caregiver.html, patients to dashboard.html
    var role     = fresh.role || (user && user.role) || 'patient';
    var homeHref = (role === 'caregiver') ? 'caregiver.html' : 'dashboard.html';

    return [
        '<a href="' + homeHref + '" class="nav-link">Home</a>',
        '<a href="resources.html" class="nav-link">Resources</a>',
        '<div class="profile-nav-wrap" id="profileNavWrap">',
            '<button type="button" class="profile-nav-btn" id="profileNavBtn">',
                '<div class="profile-avatar-small">' + initial + '</div>',
                '<span class="profile-name-short">' + firstName + '</span>',
                '<span class="profile-caret">&#9660;</span>',
            '</button>',
            '<div class="profile-dropdown" id="profileDropdown">',
                '<a href="profile.html" class="dropdown-item">&#128100; My Profile</a>',
                '<a href="#" class="dropdown-item" id="dropLogout">&#128682; Logout</a>',
            '</div>',
        '</div>'
    ].join('');
}

function initSharedNav(activePage) {
    var nav = document.getElementById('sharedNav');
    if (!nav) return;
    var stored = localStorage.getItem('user');
    var user   = stored ? JSON.parse(stored) : {};
    nav.innerHTML = buildProfileNav(user);
    initProfileDropdown();

    if (activePage) {
        nav.querySelectorAll('a.nav-link').forEach(function (a) {
            if (a.href && a.href.indexOf(activePage) !== -1) {
                a.style.background    = 'rgba(255,255,255,0.25)';
                a.style.borderRadius  = '4px';
            }
        });
    }
}

function initProfileDropdown() {
    var btn = document.getElementById('profileNavBtn');
    var dd  = document.getElementById('profileDropdown');
    if (!btn || !dd) return;

    // Remove old listeners by cloning
    var newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    btn = newBtn;

    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var d = document.getElementById('profileDropdown');
        if (d) d.classList.toggle('open');
    });
    document.addEventListener('click', function () {
        var d = document.getElementById('profileDropdown');
        if (d) d.classList.remove('open');
    });
    var logoutEl = document.getElementById('dropLogout');
    if (logoutEl) {
        logoutEl.addEventListener('click', function (e) {
            e.preventDefault();
            doLogout();
        });
    }
}

function doLogout() {
    ['token','user','isLoggedIn','userName','userEmail','isNewUser','scanCompleted']
        .forEach(function (k) { localStorage.removeItem(k); });
    window.location.href = 'landing.html';
}

// Auto-inject profile.css for dropdown styles if needed
(function () {
    if (!document.querySelector('link[href="profile.css"]')) {
        var link = document.createElement('link');
        link.rel  = 'stylesheet';
        link.href = 'profile.css';
        document.head.appendChild(link);
    }
})();

// ── Accessibility: restore large-text and high-contrast from localStorage ──
(function () {
    if (localStorage.getItem('largText')  === '1') document.documentElement.classList.add('large-text-pending');
    if (localStorage.getItem('hiContrast') === '1') document.documentElement.classList.add('high-contrast-pending');

    document.addEventListener('DOMContentLoaded', function () {
        if (localStorage.getItem('largText')  === '1') document.body.classList.add('large-text');
        if (localStorage.getItem('hiContrast') === '1') document.body.classList.add('high-contrast');

        // Sync any a11y toolbar buttons that exist on this page
        var sizeBtn = document.getElementById('a11yTextSize');
        var contBtn = document.getElementById('a11yContrast');
        if (sizeBtn && localStorage.getItem('largText')  === '1') { sizeBtn.classList.add('active'); sizeBtn.setAttribute('aria-pressed', 'true'); }
        if (contBtn && localStorage.getItem('hiContrast') === '1') { contBtn.classList.add('active'); contBtn.setAttribute('aria-pressed', 'true'); }
    });
})();
