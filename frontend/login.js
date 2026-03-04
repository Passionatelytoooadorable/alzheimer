/**
 * login.js
 * Uses API helper (api.js) which handles Render cold-start retries automatically.
 *
 * Security update: JWT is now stored in an httpOnly cookie set by the server.
 * We no longer store the token in localStorage — the browser manages the cookie.
 * On successful login, only non-sensitive user info (name, email) goes to localStorage.
 */
document.addEventListener('DOMContentLoaded', async function () {

    // ── Already logged in? Fast check via localStorage ───────────────────────
    // isLoggedIn is set on successful login and cleared on logout.
    // This is instant — no server call needed on the login page.
    // The httpOnly cookie still protects all actual API calls.
    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.replace('dashboard.html');
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

        // Client-side validation
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
                if (res.status === 401) msg = 'Incorrect username or password. Please try again.';
                if (res.status === 429) msg = 'Too many attempts. Please wait a moment and try again.';
                showAlert('alertBanner', msg, 'error');
                setBtn('Sign In', false);
                document.getElementById('password').value = '';
                document.getElementById('password').focus();
                return;
            }

            // ── Success ───────────────────────────────────────────────────────
            // The server has already set the httpOnly cookie — we don't handle the token.
            // Only store non-sensitive user info in localStorage for display purposes.
            var u = result.user || {};
            localStorage.setItem('user',       JSON.stringify(u));
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userName',   u.name     || username);
            localStorage.setItem('userEmail',  u.email    || username);

            showAlert('alertBanner', 'Signed in successfully! Redirecting…', 'success');
            setTimeout(function () {
                window.location.replace('dashboard.html');
            }, 600);

        } catch (err) {
            setBtn('Sign In', false);
            showAlert('alertBanner', '⚠️ Could not reach server. Please check your internet and try again.', 'error');
            console.error('Login error:', err);
        }
    }

    function setBtn(text, disabled) {
        if (!loginBtn) return;
        loginBtn.textContent = text;
        loginBtn.disabled    = disabled;
        if (disabled) {
            loginBtn.classList.add('loading');
        } else {
            loginBtn.classList.remove('loading');
        }
    }

    function showAlert(id, msg, type) {
        var el = document.getElementById(id);
        if (!el) return;
        el.textContent = (type === 'error' ? '❌ ' : '✅ ') + msg;
        el.className = 'alert-banner visible ' + type;
    }
    function hideAlert(id) {
        var el = document.getElementById(id);
        if (el) el.className = 'alert-banner';
    }
    function fieldError(inputId, errorId, show) {
        var inp = document.getElementById(inputId);
        var err = document.getElementById(errorId);
        if (!inp || !err) return;
        if (show) {
            inp.classList.add('invalid');
            err.classList.add('visible');
        } else {
            inp.classList.remove('invalid');
            err.classList.remove('visible');
        }
    }

    // Clear errors on typing
    ['username', 'password'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('input', function () {
            fieldError(id, id + 'Error', false);
            hideAlert('alertBanner');
        });
    });

    // Accessibility toggles
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
