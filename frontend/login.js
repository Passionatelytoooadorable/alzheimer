// login.js — Returning users: login → dashboard
document.addEventListener('DOMContentLoaded', function () {
    const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

    // Already logged in → dashboard
    if (localStorage.getItem('token')) {
        window.location.href = 'dashboard.html';
        return;
    }

    const loginForm       = document.getElementById('loginForm');
    const loginBtn        = document.getElementById('loginBtn');
    const textSizeBtn     = document.getElementById('textSize');
    const highContrastBtn = document.getElementById('highContrast');

    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    async function handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        if (!username || !password) { showMsg('Please fill in all fields.', 'error'); return; }

        loginBtn.textContent = 'Signing In...';
        loginBtn.disabled = true;

        try {
            const res = await fetch(API_BASE + '/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: username, password })
            });
            const result = await res.json();

            if (result.token) {
                const userData = {
                    name:     result.user?.name     || username,
                    email:    result.user?.email    || username,
                    username: result.user?.username || username,
                    phone:    result.user?.phone    || '',
                    id:       result.user?.id       || result.user?._id || ''
                };

                // CRITICAL: Clear ALL stale data so old user info doesn't persist
                ['token','user','isLoggedIn','userName','userEmail','isNewUser','scanCompleted'].forEach(k => localStorage.removeItem(k));
                // Keep profileData/medicalData/userReports/etc only if same user
                // (In production you'd check user ID — here we clear to be safe)
                const storedProfile = JSON.parse(localStorage.getItem('profileData') || '{}');
                if (storedProfile.email && storedProfile.email !== userData.email) {
                    localStorage.removeItem('profileData');
                    localStorage.removeItem('medicalData');
                    localStorage.removeItem('userReports');
                    localStorage.removeItem('journalEntries');
                    localStorage.removeItem('memories');
                    localStorage.removeItem('reminders');
                }

                localStorage.setItem('token',        result.token);
                localStorage.setItem('user',         JSON.stringify(userData));
                localStorage.setItem('isLoggedIn',   'true');
                localStorage.setItem('userName',     userData.name);
                localStorage.setItem('userEmail',    userData.email);
                localStorage.setItem('isNewUser',    'false');
                localStorage.setItem('scanCompleted','true');

                // Ensure profileData has current user's name
                const profile = JSON.parse(localStorage.getItem('profileData') || '{}');
                if (!profile.name) {
                    profile.name  = userData.name;
                    profile.email = userData.email;
                    profile.phone = userData.phone || '';
                    profile.joinDate      = profile.joinDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                    profile.joinTimestamp = profile.joinTimestamp || Date.now();
                    localStorage.setItem('profileData', JSON.stringify(profile));
                }

                showMsg('Login successful! Redirecting...', 'success');
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
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
        const div = document.createElement('div');
        div.className = 'login-message';
        div.textContent = msg;
        Object.assign(div.style, {
            padding: '0.8rem 1rem', margin: '0.6rem 0', borderRadius: '8px',
            textAlign: 'center', fontWeight: '500', fontSize: '0.9rem',
            background: type === 'success' ? '#d4edda' : '#f8d7da',
            color:      type === 'success' ? '#155724' : '#721c24',
            border:     type === 'success' ? '1px solid #c3e6cb' : '1px solid #f5c6cb'
        });
        if (type !== 'success') setTimeout(() => { if (div.parentNode) div.remove(); }, 5000);
        document.querySelector('.login-footer').insertAdjacentElement('beforebegin', div);
    }

    // Accessibility
    if (textSizeBtn) {
        let big = false;
        textSizeBtn.addEventListener('click', () => {
            document.body.classList.toggle('large-text'); big = !big;
            textSizeBtn.textContent = big ? 'Decrease Text Size' : 'Increase Text Size';
        });
    }
    if (highContrastBtn) {
        let hc = false;
        highContrastBtn.addEventListener('click', () => {
            document.body.classList.toggle('high-contrast'); hc = !hc;
            highContrastBtn.textContent = hc ? 'Normal Contrast' : 'High Contrast';
        });
    }
});
