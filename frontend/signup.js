// signup.js — New user flow: signup → scan page (index.html)
const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

// Password strength indicator
document.getElementById('password').addEventListener('input', function () {
    const val = this.value;
    const bar = document.getElementById('strengthBar');
    const text = document.getElementById('strengthText');
    let strength = 0;
    if (val.length >= 8) strength++;
    if (/[A-Z]/.test(val)) strength++;
    if (/[0-9]/.test(val)) strength++;
    if (/[^A-Za-z0-9]/.test(val)) strength++;
    const levels = [
        { width: '0%', color: '#dee2e6', label: 'Password strength' },
        { width: '25%', color: '#e74c3c', label: 'Weak' },
        { width: '50%', color: '#ffc107', label: 'Fair' },
        { width: '75%', color: '#17a2b8', label: 'Good' },
        { width: '100%', color: '#28a745', label: 'Strong' },
    ];
    const level = levels[strength];
    bar.style.width = level.width;
    bar.style.background = level.color;
    text.textContent = level.label;
    text.style.color = level.color;
});

document.addEventListener('DOMContentLoaded', function () {
    const signupForm = document.getElementById('signupForm');
    const submitBtn = document.getElementById('submitBtn');
    if (!signupForm) return;

    signupForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const name = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const username = document.getElementById('username').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const termsAccepted = document.getElementById('terms').checked;

        if (password !== confirmPassword) { showMsg('Passwords do not match!', 'error'); return; }
        if (!termsAccepted) { showMsg('Please accept the Terms and Conditions', 'error'); return; }

        submitBtn.textContent = 'Creating Account...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(API_BASE + '/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, username, password, phone_number: phone })
            });

            const result = await response.json();

            if (response.ok && result.token) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userName', result.user.name);
                localStorage.setItem('userEmail', result.user.email);

                showMsg('Account created! Taking you to scan your medical report...', 'success');

                // NEW USER → Scan/Prediction page (index.html)
                setTimeout(() => { window.location.href = 'index.html'; }, 1500);
            } else {
                submitBtn.textContent = 'Create Account';
                submitBtn.disabled = false;
                showMsg(result.error || result.message || 'Signup failed. Please try again.', 'error');
            }
        } catch (error) {
            submitBtn.textContent = 'Create Account';
            submitBtn.disabled = false;
            showMsg('Network error. Please try again.', 'error');
        }
    });

    function showMsg(message, type) {
        const existing = document.querySelector('.signup-msg');
        if (existing) existing.remove();
        const div = document.createElement('div');
        div.className = 'signup-msg';
        div.textContent = message;
        Object.assign(div.style, {
            padding: '1rem', margin: '1rem 0', borderRadius: '8px',
            textAlign: 'center', fontWeight: '500', fontSize: '0.9rem',
            background: type === 'success' ? '#d4edda' : '#f8d7da',
            color: type === 'success' ? '#155724' : '#721c24',
            border: type === 'success' ? '1px solid #c3e6cb' : '1px solid #f5c6cb'
        });
        document.querySelector('.login-footer').insertAdjacentElement('beforebegin', div);
    }
});
