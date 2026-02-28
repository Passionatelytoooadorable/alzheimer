// login.js — Returning users: login → dashboard
document.addEventListener('DOMContentLoaded', function () {
    const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

    // Already logged in → dashboard
    if (localStorage.getItem('token')) {
        window.location.href = 'dashboard.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const loginBtn  = document.getElementById('loginBtn');
    const textSizeBtn    = document.getElementById('textSize');
    const highContrastBtn = document.getElementById('highContrast');

    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    async function handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        if (!username || !password) { showMsg('Please fill in all fields', 'error'); return; }

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
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userName', result.user.name);
                localStorage.setItem('userEmail', result.user.email);
                localStorage.setItem('isNewUser', 'false');
                localStorage.setItem('scanCompleted', 'true'); // returning user

                showMsg('Login successful! Redirecting to dashboard...', 'success');
                // Returning users → dashboard directly
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
            } else {
                loginBtn.textContent = 'Sign In';
                loginBtn.disabled = false;
                showMsg(result.message || 'Invalid username or password', 'error');
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
            padding: '0.85rem 1rem', margin: '0.75rem 0', borderRadius: '8px',
            textAlign: 'center', fontWeight: '500', fontSize: '0.9rem',
            background: type === 'success' ? '#d4edda' : '#f8d7da',
            color: type === 'success' ? '#155724' : '#721c24',
            border: type === 'success' ? '1px solid #c3e6cb' : '1px solid #f5c6cb'
        });
        setTimeout(() => { if (div.parentNode) div.remove(); }, 5000);
        document.querySelector('.login-footer').insertAdjacentElement('beforebegin', div);
    }

    // Accessibility
    if (textSizeBtn) {
        let big = false;
        textSizeBtn.addEventListener('click', () => {
            document.body.classList.toggle('large-text');
            big = !big;
            textSizeBtn.textContent = big ? 'Decrease Text Size' : 'Increase Text Size';
        });
    }
    if (highContrastBtn) {
        let hc = false;
        highContrastBtn.addEventListener('click', () => {
            document.body.classList.toggle('high-contrast');
            hc = !hc;
            highContrastBtn.textContent = hc ? 'Normal Contrast' : 'High Contrast';
        });
    }
    document.querySelectorAll('input').forEach(inp => {
        inp.addEventListener('focus', () => inp.parentElement.classList.add('focused'));
        inp.addEventListener('blur',  () => inp.parentElement.classList.remove('focused'));
    });
});
