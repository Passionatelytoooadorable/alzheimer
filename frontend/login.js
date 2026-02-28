// login.js
document.addEventListener('DOMContentLoaded', function () {
    const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

    // Already logged in → dashboard
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

        loginBtn.textContent = 'Signing In...';
        loginBtn.disabled = true;

        try {
            var res = await fetch(API_BASE + '/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: username, password })
            });
            var result = await res.json();

            if (result.token) {
                var userData = {
                    name:     result.user?.name     || username,
                    email:    result.user?.email    || username,
                    username: result.user?.username || username,
                    phone:    result.user?.phone    || '',
                    id:       result.user?.id       || result.user?._id || ''
                };

                // Clear old session keys (but NOT scoped data keys)
                ['token','user','isLoggedIn','userName','userEmail','isNewUser','scanCompleted']
                    .forEach(k => localStorage.removeItem(k));

                localStorage.setItem('token',        result.token);
                localStorage.setItem('user',         JSON.stringify(userData));
                localStorage.setItem('isLoggedIn',   'true');
                localStorage.setItem('userName',     userData.name);
                localStorage.setItem('userEmail',    userData.email);
                localStorage.setItem('isNewUser',    'false');
                localStorage.setItem('scanCompleted','true');

                // Migrate any old unscoped data → user's scoped namespace
                UserStore.migrateOldData();

                // Ensure this user has a profileData entry
                var existing = UserStore.get('profileData', null);
                if (!existing) {
                    UserStore.set('profileData', {
                        name:          userData.name,
                        email:         userData.email,
                        phone:         userData.phone || '',
                        joinDate:      new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
                        joinTimestamp: Date.now()
                    });
                } else if (!existing.name) {
                    existing.name  = userData.name;
                    existing.email = userData.email;
                    UserStore.set('profileData', existing);
                }

                showMsg('Login successful! Redirecting...', 'success');
                setTimeout(() => window.location.href = 'dashboard.html', 1200);
            } else {
                loginBtn.textContent = 'Sign In';
                loginBtn.disabled = false;
                showMsg(result.message || 'Invalid username or password.', 'error');
                document.getElementById('password').value = '';
                document.getElementById('password').focus();
            }
        } catch (err) {
            loginBtn.textContent = 'Sign In';
            loginBtn.disabled = false;
            showMsg('Network error. Please try again.', 'error');
        }
    }

    function showMsg(msg, type) {
        document.querySelectorAll('.login-message').forEach(el => el.remove());
        var div = document.createElement('div');
        div.className = 'login-message';
        div.textContent = msg;
        Object.assign(div.style, {
            padding: '0.8rem 1rem', margin: '0.6rem 0', borderRadius: '8px',
            textAlign: 'center', fontWeight: '500', fontSize: '0.9rem',
            background: type === 'success' ? '#d4edda' : '#f8d7da',
            color:      type === 'success' ? '#155724' : '#721c24',
            border:     type === 'success' ? '1px solid #c3e6cb' : '1px solid #f5c6cb'
        });
        if (type !== 'success') setTimeout(() => div.remove && div.remove(), 5000);
        document.querySelector('.login-footer').insertAdjacentElement('beforebegin', div);
    }

    if (textSizeBtn) {
        var big = false;
        textSizeBtn.addEventListener('click', () => {
            document.body.classList.toggle('large-text'); big = !big;
            textSizeBtn.textContent = big ? 'Decrease Text Size' : 'Increase Text Size';
        });
    }
    if (highContrastBtn) {
        var hc = false;
        highContrastBtn.addEventListener('click', () => {
            document.body.classList.toggle('high-contrast'); hc = !hc;
            highContrastBtn.textContent = hc ? 'Normal Contrast' : 'High Contrast';
        });
    }
});
