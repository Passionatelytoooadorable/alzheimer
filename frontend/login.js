/**
 * login.js
 * Uses API helper (api.js) which handles Render cold-start retries automatically.
 * Does NOT depend on user-store.js so no crash if it hasn't loaded.
 *
 * Redirect logic after login:
 *   caregiver  → caregiver.html  (always)
 *   patient (new / no reports yet) → index.html  (upload report first)
 *   patient (has reports) → dashboard.html
 */
document.addEventListener('DOMContentLoaded', function () {

    // Already logged in → send to correct place based on role
    if (localStorage.getItem('token')) {
        var _su = JSON.parse(localStorage.getItem('user') || '{}');
        if (_su.role === 'caregiver') {
            window.location.replace('caregiver.html');
        } else {
            // Patient: check if they've uploaded a report before
            var _hasReport = localStorage.getItem('scanCompleted') === 'true';
            window.location.replace(_hasReport ? 'dashboard.html' : 'index.html');
        }
        return;
    }

    var loginForm       = document.getElementById('loginForm');
    var loginBtn        = document.getElementById('loginBtn');
    var textSizeBtn     = document.getElementById('textSize');
    var highContrastBtn = document.getElementById('highContrast');

    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    async function handleLogin(e) {
        e.preventDefault();

        var username = document.getElementById('username').value.trim();
        var password = document.getElementById('password').value;
        var valid = true;
        if (!username) { fieldError('username', 'usernameError', true); valid = false; }
        if (!password)  { fieldError('password',  'passwordError',  true); valid = false; }
        if (!valid) return;

        setBtn('Signing In…', true);
        hideAlert('alertBanner');

        try {
            var res    = await API.post('/auth/signin', { email: username, password: password });
            var result = await res.json();

            if (!res.ok) {
                var msg = result.error || 'Login failed. Please try again.';
                if (res.status === 401) msg = '❌ Incorrect username or password. Please try again.';
                if (res.status === 429) msg = '⏳ Too many login attempts. Please wait a minute and try again.';
                if (res.status === 500) msg = '⚠️ Server error. Please try again shortly.';
                if (res.status === 0 || res.status >= 502) msg = '🌐 Cannot reach the server. It may be starting up — please wait 30 seconds and retry.';
                showAlert('alertBanner', msg, 'error');
                setBtn('Sign In', false);
                document.getElementById('password').value = '';
                document.getElementById('password').focus();
                return;
            }

            // Success — store token & user
            var u = result.user || {};
            localStorage.setItem('token',      result.token);
            localStorage.setItem('user',       JSON.stringify(u));
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userName',   u.name  || username);
            localStorage.setItem('userEmail',  u.email || username);

            showAlert('alertBanner', 'Signed in successfully! Redirecting…', 'success');

            setTimeout(async function () {
                var role = u.role || 'patient';

                // Caregivers always go to caregiver dashboard
                if (role === 'caregiver') {
                    window.location.replace('caregiver.html');
                    return;
                }

                // Patients: check if they have any reports on the backend
                // If no reports yet → send to index.html to upload first
                // If they have reports → send to dashboard
                try {
                    var repRes  = await API.get('/reports');
                    var repData = await repRes.json();
                    var hasReports = repData.reports && repData.reports.length > 0;
                    if (hasReports) {
                        localStorage.setItem('scanCompleted', 'true');
                        window.location.replace('dashboard.html');
                    } else {
                        localStorage.removeItem('scanCompleted');
                        window.location.replace('index.html');
                    }
                } catch (err) {
                    // If API call fails, fall back to scanCompleted flag
                    var _hasReport = localStorage.getItem('scanCompleted') === 'true';
                    window.location.replace(_hasReport ? 'dashboard.html' : 'index.html');
                }

            }, 600);

        } catch (err) {
            setBtn('Sign In', false);
            showAlert('alertBanner', '⚠️ Could not reach the server. Please check your internet connection and try again.', 'error');
        }
    }

    function setBtn(text, disabled) {
        if (!loginBtn) return;
        loginBtn.textContent = text;
        loginBtn.disabled    = disabled;
        if (disabled) { loginBtn.classList.add('loading'); }
        else          { loginBtn.classList.remove('loading'); }
    }

    function showAlert(id, msg, type) {
        var el = document.getElementById(id);
        if (!el) return;
        el.textContent = (type === 'error' ? '❌ ' : '✅ ') + msg;
        el.className   = 'alert-banner visible ' + type;
    }
    function hideAlert(id) {
        var el = document.getElementById(id);
        if (el) el.className = 'alert-banner';
    }
    function fieldError(inputId, errorId, show) {
        var inp = document.getElementById(inputId);
        var err = document.getElementById(errorId);
        if (!inp || !err) return;
        if (show) { inp.classList.add('invalid'); err.classList.add('visible'); }
        else      { inp.classList.remove('invalid'); err.classList.remove('visible'); }
    }

    ['username', 'password'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('input', function () {
            fieldError(id, id + 'Error', false);
            hideAlert('alertBanner');
        });
    });

    if (textSizeBtn) {
        textSizeBtn.addEventListener('click', function () {
            document.body.classList.toggle('large-text');
            this.classList.toggle('active');
            this.setAttribute('aria-pressed', document.body.classList.contains('large-text'));
        });
    }
    if (highContrastBtn) {
        highContrastBtn.addEventListener('click', function () {
            document.body.classList.toggle('high-contrast');
            this.classList.toggle('active');
            this.setAttribute('aria-pressed', document.body.classList.contains('high-contrast'));
        });
    }
});
