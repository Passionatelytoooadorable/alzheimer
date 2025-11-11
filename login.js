// Login page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const textSizeBtn = document.getElementById('textSize');
    const highContrastBtn = document.getElementById('highContrast');
    
    // Form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // Simple validation
            if (!username || !password) {
                alert('Please fill in all fields');
                return;
            }
            
            // Show loading state
            const submitBtn = loginForm.querySelector('.login-button');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Signing In...';
            submitBtn.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                alert('Login successful! In a real application, you would be redirected to your dashboard.');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 1500);
        });
    }
    
    // Accessibility features
    let textSizeIncreased = false;
    if (textSizeBtn) {
        textSizeBtn.addEventListener('click', function() {
            document.body.classList.toggle('large-text');
            textSizeIncreased = !textSizeIncreased;
            textSizeBtn.textContent = textSizeIncreased ? 
                'Decrease Text Size' : 'Increase Text Size';
        });
    }
    
    let highContrastEnabled = false;
    if (highContrastBtn) {
        highContrastBtn.addEventListener('click', function() {
            document.body.classList.toggle('high-contrast');
            highContrastEnabled = !highContrastEnabled;
            highContrastBtn.textContent = highContrastEnabled ? 
                'Normal Contrast' : 'High Contrast';
        });
    }
    
    // Focus management for accessibility
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
});

// success handler:
setTimeout(() => {
    window.location.href = 'dashboard.html';
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
}, 1500);

// Login page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const textSizeBtn = document.getElementById('textSize');
    const highContrastBtn = document.getElementById('highContrast');
    
    // DEMO CREDENTIALS - Remove in production
    const demoCredentials = {
        username: 'demo',
        password: 'demo123',
        email: 'user@demo.com',
        password: 'password123'
    };
    
    // Form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // Simple validation
            if (!username || !password) {
                showMessage('Please fill in all fields', 'error');
                return;
            }
            
            // Show loading state
            const submitBtn = loginForm.querySelector('.login-button');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Signing In...';
            submitBtn.disabled = true;
            
            // Simulate API call with demo validation
            setTimeout(() => {
                // Demo login validation
                if ((username === 'demo' && password === 'demo123') || 
                    (username === 'user@demo.com' && password === 'password123') ||
                    (username === 'test' && password === 'test')) {
                    
                    showMessage('Login successful! Redirecting...', 'success');
                    
                    // Store user session
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('userName', getDisplayName(username));
                    
                    // Redirect to dashboard
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                    
                } else {
                    showMessage('Invalid credentials. Try: demo/demo123 or user@demo.com/password123', 'error');
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            }, 1500);
        });
    }
    
    // Demo login helper functions
    function getDisplayName(username) {
        const names = {
            'demo': 'Demo User',
            'user@demo.com': 'Alex Johnson',
            'test': 'Test User'
        };
        return names[username] || 'User';
    }
    
    function showMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.login-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `login-message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 8px;
            text-align: center;
            font-weight: 500;
            ${type === 'success' ? 
                'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : 
                'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'
            }
        `;
        
        // Insert after the form
        loginForm.parentNode.insertBefore(messageDiv, loginForm.nextSibling);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
    
    // Add demo credentials hint
    addDemoHint();
    
    function addDemoHint() {
        const demoHint = document.createElement('div');
        demoHint.className = 'demo-hint';
        demoHint.innerHTML = `
            <div style="
                background: #e3f2fd;
                border: 1px solid #bbdefb;
                border-radius: 8px;
                padding: 1rem;
                margin: 1rem 0;
                font-size: 0.9rem;
                color: #1565c0;
            ">
                <strong>Demo Login:</strong><br>
                • Username: <code>demo</code> | Password: <code>demo123</code><br>
                • Email: <code>user@demo.com</code> | Password: <code>password123</code>
            </div>
        `;
        
        const loginFooter = document.querySelector('.login-footer');
        if (loginFooter) {
            loginFooter.parentNode.insertBefore(demoHint, loginFooter);
        }
    }
    
    // Accessibility features
    let textSizeIncreased = false;
    if (textSizeBtn) {
        textSizeBtn.addEventListener('click', function() {
            document.body.classList.toggle('large-text');
            textSizeIncreased = !textSizeIncreased;
            textSizeBtn.textContent = textSizeIncreased ? 
                'Decrease Text Size' : 'Increase Text Size';
        });
    }
    
    let highContrastEnabled = false;
    if (highContrastBtn) {
        highContrastBtn.addEventListener('click', function() {
            document.body.classList.toggle('high-contrast');
            highContrastEnabled = !highContrastEnabled;
            highContrastBtn.textContent = highContrastEnabled ? 
                'Normal Contrast' : 'High Contrast';
        });
    }
    
    // Focus management for accessibility
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
    
   

