// Login page JavaScript - Clean Version
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const textSizeBtn = document.getElementById('textSize');
    const highContrastBtn = document.getElementById('highContrast');
    
    // Demo credentials
    const validUsers = [
        { username: 'demo', password: 'demo123', name: 'Demo User' },
        { username: 'user@demo.com', password: 'password123', name: 'Alex Johnson' },
        { username: 'test', password: 'test', name: 'Test User' }
    ];

    // Initialize login functionality
    initLoginForm();
    initAccessibility();
    addDemoHint();

    function initLoginForm() {
        if (!loginForm) return;

        loginForm.addEventListener('submit', handleLogin);
    }

    function handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        // Validation
        if (!validateInputs(username, password)) return;
        
        // Attempt login
        attemptLogin(username, password);
    }

    function validateInputs(username, password) {
        if (!username || !password) {
            showMessage('Please fill in all fields', 'error');
            return false;
        }
        return true;
    }

    function attemptLogin(username, password) {
        const submitBtn = loginForm.querySelector('.login-button');
        const originalText = submitBtn.textContent;
        
        // Show loading state
        setButtonLoading(submitBtn, true, 'Signing In...');
        
        // Simulate API call
        setTimeout(() => {
            const user = validUsers.find(u => 
                u.username === username && u.password === password
            );
            
            if (user) {
                loginSuccess(user, submitBtn, originalText);
            } else {
                loginFailed(submitBtn, originalText);
            }
        }, 1000);
    }

    function loginSuccess(user, submitBtn, originalText) {
        showMessage('Login successful! Redirecting...', 'success');
        
        // Store user session
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userName', user.name);
        localStorage.setItem('userEmail', user.username);
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    }

    function loginFailed(submitBtn, originalText) {
        showMessage('Invalid username or password. Please try again.', 'error');
        setButtonLoading(submitBtn, false, originalText);
        
        // Clear password field and refocus
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
    }

    function setButtonLoading(button, isLoading, text) {
        button.textContent = text;
        button.disabled = isLoading;
    }

    function showMessage(message, type) {
        // Remove existing messages
        removeExistingMessages();
        
        // Create new message
        const messageDiv = createMessageElement(message, type);
        
        // Insert in login card
        const loginCard = document.querySelector('.login-card');
        if (loginCard) {
            loginCard.insertBefore(messageDiv, loginCard.querySelector('.login-footer'));
        }
    }

    function removeExistingMessages() {
        const existingMessage = document.querySelector('.login-message');
        if (existingMessage) {
            existingMessage.remove();
        }
    }

    function createMessageElement(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `login-message ${type}`;
        messageDiv.textContent = message;
        
        const styles = {
            padding: '1rem',
            margin: '1rem 0',
            borderRadius: '8px',
            textAlign: 'center',
            fontWeight: '500',
            fontSize: '0.9rem'
        };
        
        if (type === 'success') {
            Object.assign(styles, {
                background: '#d4edda',
                color: '#155724',
                border: '1px solid #c3e6cb'
            });
        } else {
            Object.assign(styles, {
                background: '#f8d7da',
                color: '#721c24',
                border: '1px solid #f5c6cb'
            });
        }
        
        // Apply styles
        Object.assign(messageDiv.style, styles);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
        
        return messageDiv;
    }

    function addDemoHint() {
        const demoHint = document.createElement('div');
        demoHint.className = 'demo-hint';
        demoHint.innerHTML = `
            <div style="
                background: #e3f2fd;
                border: 1px solid #bbdefb;
                border-radius: 8px;
                padding: 1rem;
                margin: 2rem 0 1rem 0;
                font-size: 0.85rem;
                color: #1565c0;
                line-height: 1.5;
            ">
                <strong>💡 Demo Login Credentials:</strong><br>
                <div style="margin-top: 0.5rem;">
                    • <strong>Username:</strong> <code>demo</code> | <strong>Password:</strong> <code>demo123</code><br>
                    • <strong>Email:</strong> <code>user@demo.com</code> | <strong>Password:</strong> <code>password123</code><br>
                    • <strong>Username:</strong> <code>test</code> | <strong>Password:</strong> <code>test</code>
                </div>
            </div>
        `;
        
        const loginFooter = document.querySelector('.login-footer');
        if (loginFooter) {
            loginFooter.parentNode.insertBefore(demoHint, loginFooter);
        }
    }

    function initAccessibility() {
        // Text size toggle
        if (textSizeBtn) {
            let textSizeIncreased = false;
            textSizeBtn.addEventListener('click', function() {
                document.body.classList.toggle('large-text');
                textSizeIncreased = !textSizeIncreased;
                textSizeBtn.textContent = textSizeIncreased ? 
                    'Decrease Text Size' : 'Increase Text Size';
            });
        }
        
        // High contrast toggle
        if (highContrastBtn) {
            let highContrastEnabled = false;
            highContrastBtn.addEventListener('click', function() {
                document.body.classList.toggle('high-contrast');
                highContrastEnabled = !highContrastEnabled;
                highContrastBtn.textContent = highContrastEnabled ? 
                    'Normal Contrast' : 'High Contrast';
            });
        }
        
        // Focus management
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', function() {
                this.parentElement.classList.remove('focused');
            });
        });
    }

    // Quick test function for development
    function autoFillDemo() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('demo') === 'true') {
            document.getElementById('username').value = 'demo';
            document.getElementById('password').value = 'demo123';
            showMessage('Demo credentials auto-filled. Click "Sign In" to continue.', 'success');
        }
    }
    
    autoFillDemo();
});
