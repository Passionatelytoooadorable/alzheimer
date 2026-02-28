// nav-shared.js — shared profile nav dropdown for all protected pages
// Usage: add <nav class="nav-links" id="sharedNav"></nav> + <script src="nav-shared.js">
// Then call initSharedNav() in your page's DOMContentLoaded

function buildProfileNav(user) {
    // ALWAYS read fresh from localStorage — never trust stale in-memory reference
    var stored = localStorage.getItem('user');
    var fresh  = stored ? JSON.parse(stored) : {};
    var name   = fresh.name || (user && user.name) || localStorage.getItem('userName') || 'User';
    // Also check profileData for updated name (user may have edited it)
    var profileStored = localStorage.getItem('profileData');
    if (profileStored) {
        var pd = JSON.parse(profileStored);
        if (pd.name) name = pd.name;
    }
    var initial   = name.charAt(0).toUpperCase();
    var firstName = name.split(' ')[0];

    return '<a href="dashboard.html" class="nav-home-link">Home</a>' +
           '<a href="resources.html">Resources</a>' +
           '<div class="profile-nav-wrap" id="profileNavWrap">' +
               '<button type="button" class="profile-nav-btn" id="profileNavBtn">' +
                   '<div class="profile-avatar-small">' + initial + '</div>' +
                   '<span class="profile-name-short">' + firstName + '</span>' +
                   '<span class="profile-caret">▾</span>' +
               '</button>' +
               '<div class="profile-dropdown" id="profileDropdown">' +
                   '<a href="profile.html" class="dropdown-item">👤 My Profile</a>' +
                   '<a href="#" class="dropdown-item" id="dropLogout">🚪 Logout</a>' +
               '</div>' +
           '</div>';
}

function initSharedNav(activePage) {
    var nav = document.getElementById('sharedNav');
    if (!nav) return;

    // Read user fresh every time nav is initialised
    var stored = localStorage.getItem('user');
    var user   = stored ? JSON.parse(stored) : {};

    nav.innerHTML = buildProfileNav(user);
    initProfileDropdown();

    // Highlight active link
    if (activePage) {
        var links = nav.querySelectorAll('a');
        links.forEach(function (a) {
            if (a.href && a.href.indexOf(activePage) !== -1) {
                a.style.background = 'rgba(255,255,255,0.25)';
                a.style.borderRadius = '4px';
            }
        });
    }
}

function initProfileDropdown() {
    var btn = document.getElementById('profileNavBtn');
    var dd  = document.getElementById('profileDropdown');
    if (!btn || !dd) return;

    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        dd.classList.toggle('open');
    });
    document.addEventListener('click', function () {
        if (dd) dd.classList.remove('open');
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
    ['token','user','isLoggedIn','userName','userEmail','isNewUser','scanCompleted'].forEach(function (k) {
        localStorage.removeItem(k);
    });
    window.location.href = 'signup.html';
}

// Inject profile.css dropdown styles if not already present
(function () {
    if (!document.querySelector('link[href="profile.css"]')) {
        var link  = document.createElement('link');
        link.rel  = 'stylesheet';
        link.href = 'profile.css';
        document.head.appendChild(link);
    }
})();
