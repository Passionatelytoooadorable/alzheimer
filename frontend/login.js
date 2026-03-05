/**
 * login.js
 * Uses API helper (api.js) which handles Render cold-start retries automatically.
 * Does NOT depend on user-store.js so no crash if it hasn't loaded.
 */
document.addEventListener('DOMContentLoaded', function () {

    // Already logged in → redirect based on stored role
    if (localStorage.getItem('token')) {
        var storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        window.location.replace(storedUser.role === 'caregiver' ? 'caregiver.html' : 'dashboard.html');
        return;
    }

    var loginForm       = document.getElementById('loginForm');
    var loginBtn        = document.getElementById('loginBtn');
    var textSizeBtn     = document.getElementById('textSize');
    var highContrastBtn = document.getElementById('highContrast');

    // ── Forgot password UI toggle ─────────────────────────────────────────────
    var forgotBtn   = document.getElementById('forgotPasswordBtn');
    var forgotForm  = document.getElementById('forgotForm');
    var backBtn     = document.getElementById('backToLogin');
    var sendResetBtn = document.getElementById('sendResetBtn');

    if (forgotBtn) {
        forgotBtn.addEventListener('click', function () {
            loginForm.classList.add('hidden');
            forgotForm.classList.add('visible');
        });
    }
    if (backBtn) {
        backBtn.addEventListener('click', function () {
            forgotForm.classList.remove('visible');
            loginForm.classList.remove('hidden');
        });
    }
    if (sendResetBtn) {
        sendResetBtn.addEventListener('click', async function () {
            var email = document.getElementById('resetEmail').value.trim();
            if (!email) { showAlert('forgotAlert', 'Please enter your email address.', 'error'); return; }
            this.textContent = 'Sending…'; this.disabled = true;
            try {
                var res = await API.post('/auth/forgot-password', { email });
                var result = await res.json();
                showAlert('forgotAlert', result.message || 'Reset link sent if email exists.', 'success');
            } catch (err) {
                showAlert('forgotAlert', 'Could not send reset link. Please try again.', 'error');
            } finally {
                this.textContent = 'Send Reset Link'; this.disabled = false;
            }
        });
    }

    // ── Password toggle ───────────────────────────────────────────────────────
    var togglePwBtn = document.getElementById('togglePassword');
    var pwInput     = document.getElementById('password');
    if (togglePwBtn && pwInput) {
        togglePwBtn.addEventListener('click', function () {
            var isText = pwInput.type === 'text';
            pwInput.type = isText ? 'password' : 'text';
            this.textContent = isText ? '👁' : '🙈';
            this.setAttribute('aria-label', isText ? 'Show password' : 'Hide password');
        });
    }

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
                if (res.status === 401) msg = 'Incorrect username or password. Please try again.';
                if (res.status === 429) msg = 'Too many attempts. Please wait a moment and try again.';
                showAlert('alertBanner', msg, 'error');
                setBtn('Sign In', false);
                document.getElementById('password').value = '';
                document.getElementById('password').focus();
                return;
            }

            // Success — store token & user (role is now included in result.user)
            var u = result.user || {};
            var userRole = u.role || 'patient';

            localStorage.setItem('token',      result.token || 'cookie'); // 'cookie' sentinel if using httpOnly cookies
            localStorage.setItem('user',       JSON.stringify({ ...u, role: userRole }));
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userName',   u.name     || username);
            localStorage.setItem('userEmail',  u.email    || username);

            showAlert('alertBanner', 'Signed in successfully! Redirecting…', 'success');

            // Role-based redirect — the core of this feature
            setTimeout(function () {
                window.location.replace(userRole === 'caregiver' ? 'caregiver.html' : 'dashboard.html');
            }, 600);

        } catch (err) {
            setBtn('Sign In', false);
            showAlert('alertBanner', '⚠️ Could not reach server. Please check your internet and try again.', 'error');
            console.error('Login error:', err);
        }
    }

    function setBtn(text, disabled) {
        if (!loginBtn) return;
        loginBtn.childNodes[0].textContent = text + ' ';
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

    // ── Accessibility toggles ─────────────────────────────────────────────────
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
