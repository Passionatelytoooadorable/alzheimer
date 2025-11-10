document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Basic validation
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    // In a real application, you would send this data to a server
    console.log('Login attempt with:', { email, password });
    
    // For demo purposes, show a success message
    alert('Login successful! Redirecting to your Memory Vault...');
    
    // In a real app, you would redirect to the main application
    // window.location.href = 'index.html';
});

document.getElementById('signupBtn').addEventListener('click', function() {
    // In a real application, you would redirect to a signup page
    alert('Redirecting to account creation...');
    // window.location.href = 'signup.html';
});

// Add some interactive effects
document.querySelectorAll('.input-group input').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });
});

// for demo purposes
if (email === "demo@pehchaan.com" && password === "demo123") {
    localStorage.setItem('isLoggedIn', 'true');
    window.location.href = 'index.html';
}

// After successful login
localStorage.setItem('isLoggedIn', 'true');
window.location.href = 'index.html';  // Redirect to main app