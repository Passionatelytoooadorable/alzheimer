// login.js — Smart Auth Routing
document.addEventListener('DOMContentLoaded', function () {
    const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

    // KEY FIX: Already logged-in → go straight to dashboard, never show login page
    if (localStorage.getItem('token')) {
        window.location.href = 'dashboard.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const textSizeBtn = document.getElementById('textSize');
    const highContrastBtn = document.getElementById('highContrast');

    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    function handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        if (!username || !password) { showMessage('Please fill in all fields', 'error'); return; }
        attemptLogin(username, password);
    }

    async function attemptLogin(username, password) {
        const btn = loginForm.querySelector('.login-button');
        const orig = btn.textContent;
        btn.textContent = 'Signing In...';
        btn.disabled = true;

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
                showMessage('Login successful! Redirecting...', 'success');
                // Registered user always goes to dashboard
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
            } else {
                btn.textContent = orig;
                btn.disabled = false;
                showMessage(result.message || 'Invalid username or password', 'error');
                document.getElementById('password').value = '';
                document.getElementById('password').focus();
            }
        } catch (err) {
            btn.textContent = orig;
            btn.disabled = false;
            showMessage('Network error. Please try again later.', 'error');
        }
    }

    function showMessage(message, type) {
        const existing = document.querySelector('.login-message');
        if (existing) existing.remove();
        const div = document.createElement('div');
        div.className = 'login-message';
        div.textContent = message;
        Object.assign(div.style, {
            padding: '1rem', margin: '1rem 0', borderRadius: '8px',
            textAlign: 'center', fontWeight: '500', fontSize: '0.9rem',
            background: type === 'success' ? '#d4edda' : '#f8d7da',
            color: type === 'success' ? '#155724' : '#721c24',
            border: type === 'success' ? '1px solid #c3e6cb' : '1px solid #f5c6cb'
        });
        setTimeout(() => { if (div.parentNode) div.remove(); }, 5000);
        const footer = document.querySelector('.login-footer');
        if (footer) footer.insertAdjacentElement('beforebegin', div);
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
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('focus', () => input.parentElement.classList.add('focused'));
        input.addEventListener('blur', () => input.parentElement.classList.remove('focused'));
    });
});
