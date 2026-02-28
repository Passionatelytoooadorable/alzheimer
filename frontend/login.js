/**
 * login.js
 * Uses API helper (api.js) which handles Render cold-start retries automatically.
 * Does NOT depend on user-store.js so no crash if it hasn't loaded.
 */
document.addEventListener('DOMContentLoaded', function () {

    // Already logged in → go to dashboard
    if (localStorage.getItem('token')) {
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
        if (!username || !password) { showMsg('Please fill in all fields.', 'error'); return; }

        setBtn('Signing In…', true);
        showMsg('Connecting to server… (first load may take up to 30 seconds)', 'info');

        try {
            // API.post handles Render cold-start retries automatically
            var res    = await API.post('/auth/signin', { email: username, password: password });
            var result = await res.json();

            if (result.token) {
                var u = result.user || {};
                var userData = {
                    id:       u.id       || u._id      || '',
                    name:     u.name     || username,
                    email:    u.email    || username,
                    username: u.username || username,
                    phone:    u.phone_number || u.phone || ''
                };

                // Clear any old session keys
                ['token','user','isLoggedIn','userName','userEmail','isNewUser','scanCompleted']
                    .forEach(function (k) { localStorage.removeItem(k); });

                localStorage.setItem('token',        result.token);
                localStorage.setItem('user',         JSON.stringify(userData));
                localStorage.setItem('isLoggedIn',   'true');
                localStorage.setItem('userName',     userData.name);
                localStorage.setItem('userEmail',    userData.email);
                localStorage.setItem('isNewUser',    'false');
                localStorage.setItem('scanCompleted','true');

                showMsg('✅ Login successful! Redirecting…', 'success');
                setTimeout(function () {
                    window.location.href = 'dashboard.html';
                }, 1000);

            } else {
                setBtn('Sign In', false);
                showMsg(result.error || result.message || 'Invalid username or password.', 'error');
                document.getElementById('password').value = '';
                document.getElementById('password').focus();
            }

        } catch (err) {
            setBtn('Sign In', false);
            showMsg('⚠️ Could not reach server. Please check your internet and try again.', 'error');
            console.error('Login error:', err);
        }
    }

    function setBtn(text, disabled) {
        if (!loginBtn) return;
        loginBtn.textContent = text;
        loginBtn.disabled    = disabled;
    }

    function showMsg(msg, type) {
        document.querySelectorAll('.login-message').forEach(function (el) { el.remove(); });
        var div = document.createElement('div');
        div.className = 'login-message';
        div.textContent = msg;
        var colors = {
            success: { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
            error:   { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' },
            info:    { bg: '#fff3cd', color: '#856404', border: '#ffeeba' }
        };
        var c = colors[type] || colors.info;
        Object.assign(div.style, {
            padding: '0.8rem 1rem', margin: '0.6rem 0', borderRadius: '8px',
            textAlign: 'center', fontWeight: '500', fontSize: '0.88rem',
            background: c.bg, color: c.color, border: '1px solid ' + c.border
        });
        var footer = document.querySelector('.login-footer');
        if (footer) footer.insertAdjacentElement('beforebegin', div);
        if (type !== 'success' && type !== 'info') {
            setTimeout(function () { if (div.parentNode) div.remove(); }, 6000);
        }
    }

    // Accessibility toggles
    if (textSizeBtn) {
        var big = false;
        textSizeBtn.addEventListener('click', function () {
            document.body.classList.toggle('large-text');
            big = !big;
            textSizeBtn.textContent = big ? 'Decrease Text Size' : 'Increase Text Size';
        });
    }
    if (highContrastBtn) {
        var hc = false;
        highContrastBtn.addEventListener('click', function () {
            document.body.classList.toggle('high-contrast');
            hc = !hc;
            highContrastBtn.textContent = hc ? 'Normal Contrast' : 'High Contrast';
        });
    }
});
