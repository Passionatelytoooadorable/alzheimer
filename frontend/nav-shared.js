// nav-shared.js — inject profile nav into any page with id="sharedNav"
// Include this script on dashboard, memory-vault, journal, ai-companion, resources, location-tracker

function buildProfileNav(user) {
    const name    = (user && user.name) || localStorage.getItem('userName') || 'User';
    const initial = name.charAt(0).toUpperCase();
    return `
        <a href="dashboard.html" id="navHome">Home</a>
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

function initSharedNav(activePage) {
    const nav  = document.getElementById('sharedNav');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!nav) return;
    nav.innerHTML = buildProfileNav(user);

    // Highlight active page
    if (activePage) {
        const links = nav.querySelectorAll('a');
        links.forEach(a => {
            if (a.href.includes(activePage)) a.classList.add('active');
        });
    }

    initProfileDropdown();
}

function initProfileDropdown() {
    const btn = document.getElementById('profileNavBtn');
    const dd  = document.getElementById('profileDropdown');
    if (!btn || !dd) return;
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        dd.classList.toggle('open');
    });
    document.addEventListener('click', function() { dd.classList.remove('open'); });
    const logoutEl = document.getElementById('dropLogout');
    if (logoutEl) {
        logoutEl.addEventListener('click', function(e) {
            e.preventDefault();
            doLogout();
        });
    }
}

function doLogout() {
    ['token','user','isLoggedIn','userName','userEmail','isNewUser','scanCompleted'].forEach(k => localStorage.removeItem(k));
    window.location.href = 'signup.html';
}

// Add profile nav CSS to head if not already linked
(function injectNavCss() {
    if (!document.querySelector('link[href="profile.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'profile.css';
        document.head.appendChild(link);
    }
})();
