document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Demo credentials
    if (email === "demo@pehchaan.com" && password === "demo123") {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', email);
        window.location.href = 'index.html';
    } else {
        alert('Invalid credentials. Use: demo@pehchaan.com / demo123');
    }
});

document.getElementById('signupBtn').addEventListener('click', function() {
    alert('Account creation would be implemented in a full version. For demo, use: demo@pehchaan.com / demo123');
});

// Add logout function to your existing script.js
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    window.location.href = 'login.html';
}
