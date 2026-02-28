// signup.js
const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

// Already logged in → dashboard
if (localStorage.getItem('token')) {
    window.location.href = 'dashboard.html';
}

// Password strength meter
document.getElementById('password').addEventListener('input', function () {
    const val = this.value;
    let s = 0;
    if (val.length >= 8) s++;
    if (/[A-Z]/.test(val)) s++;
    if (/[0-9]/.test(val)) s++;
    if (/[^A-Za-z0-9]/.test(val)) s++;
    const levels = [
        { w: '0%',   c: '#dee2e6', l: 'Password strength' },
        { w: '25%',  c: '#e74c3c', l: 'Weak' },
        { w: '50%',  c: '#ffc107', l: 'Fair' },
        { w: '75%',  c: '#17a2b8', l: 'Good' },
        { w: '100%', c: '#28a745', l: 'Strong' }
    ];
    const bar  = document.getElementById('strengthBar');
    const text = document.getElementById('strengthText');
    bar.style.width      = levels[s].w;
    bar.style.background = levels[s].c;
    text.textContent     = levels[s].l;
    text.style.color     = levels[s].c;
});

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('signupForm');
    const btn  = document.getElementById('submitBtn');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const name     = document.getElementById('fullName').value.trim();
        const email    = document.getElementById('email').value.trim();
        const username = document.getElementById('username').value.trim();
        const phone    = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;
        const confirm  = document.getElementById('confirmPassword').value;
        const terms    = document.getElementById('terms').checked;

        if (!name || !email || !username || !phone || !password) {
            showMsg('Please fill in all fields.', 'error'); return;
        }
        if (password !== confirm) { showMsg('Passwords do not match!', 'error'); return; }
        if (!terms) { showMsg('Please accept the Terms and Conditions.', 'error'); return; }

        btn.textContent = 'Creating Account...';
        btn.disabled = true;

        try {
            const res = await fetch(API_BASE + '/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, username, password, phone_number: phone })
            });
            const result = await res.json();

            if (res.ok && result.token) {
                // Build a clean user object — always use what the API returns
                const userData = {
                    name:     result.user?.name     || name,
                    email:    result.user?.email    || email,
                    username: result.user?.username || username,
                    phone:    result.user?.phone    || phone,
                    id:       result.user?.id       || result.user?._id || ''
                };

                // Clear any stale session first
                ['token','user','isLoggedIn','userName','userEmail','isNewUser','scanCompleted','profileData','medicalData'].forEach(k => localStorage.removeItem(k));

                localStorage.setItem('token',       result.token);
                localStorage.setItem('user',        JSON.stringify(userData));
                localStorage.setItem('isLoggedIn',  'true');
                localStorage.setItem('userName',    userData.name);
                localStorage.setItem('userEmail',   userData.email);
                localStorage.setItem('isNewUser',   'true');
                localStorage.setItem('scanCompleted','false');

                // Pre-populate profileData with signup info
                localStorage.setItem('profileData', JSON.stringify({
                    name:  userData.name,
                    email: userData.email,
                    phone: userData.phone,
                    joinDate:      new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
                    joinTimestamp: Date.now()
                }));

                showMsg('Account created! Redirecting to scan...', 'success');
                setTimeout(() => { window.location.href = 'index.html'; }, 1400);
            } else {
                btn.textContent = 'Create Account';
                btn.disabled = false;
                showMsg(result.error || result.message || 'Signup failed. Please try again.', 'error');
            }
        } catch (err) {
            btn.textContent = 'Create Account';
            btn.disabled = false;
            showMsg('Network error. Please check your connection.', 'error');
        }
    });

    function showMsg(msg, type) {
        document.querySelectorAll('.form-msg').forEach(el => el.remove());
        const div = document.createElement('div');
        div.className = 'form-msg';
        div.textContent = msg;
        Object.assign(div.style, {
            padding: '0.8rem 1rem', margin: '0.6rem 0', borderRadius: '8px',
            textAlign: 'center', fontWeight: '500', fontSize: '0.9rem',
            background: type === 'success' ? '#d4edda' : '#f8d7da',
            color:      type === 'success' ? '#155724' : '#721c24',
            border:     type === 'success' ? '1px solid #c3e6cb' : '1px solid #f5c6cb'
        });
        document.querySelector('.login-footer').insertAdjacentElement('beforebegin', div);
        if (type !== 'success') setTimeout(() => div.remove(), 5000);
    }
});
