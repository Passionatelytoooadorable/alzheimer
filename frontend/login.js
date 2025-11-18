// Login page JavaScript - Updated with Live Backend API
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const textSizeBtn = document.getElementById('textSize');
    const highContrastBtn = document.getElementById('highContrast');
    
    const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

    // Initialize login functionality
    initLoginForm();
    initAccessibility();

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
        
        // Attempt login with backend API
        attemptBackendLogin(username, password);
    }

    function validateInputs(username, password) {
        if (!username || !password) {
            showMessage('Please fill in all fields', 'error');
            return false;
        }
        return true;
    }

    async function attemptBackendLogin(username, password) {
        const submitBtn = loginForm.querySelector('.login-button');
        const originalText = submitBtn.textContent;
        
        // Show loading state
        setButtonLoading(submitBtn, true, 'Signing In...');
        
        try {
            const credentials = {
                email: username, // Backend accepts email or username
                password: password
            };

            const response = await fetch(`${API_BASE}/auth/signin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });
            
            const result = await response.json();
            
            if (result.token) {
                loginSuccess(result, submitBtn, originalText);
            } else {
                loginFailed(submitBtn, originalText, result.message || 'Invalid username or password');
            }
        } catch (error) {
            console.error('Login API error:', error);
            loginFailed(submitBtn, originalText, 'Network error. Please try again later.');
        }
    }

    function loginSuccess(loginData, submitBtn, originalText) {
        showMessage('Login successful! Redirecting...', 'success');
        
        // Store user session with backend data
        localStorage.setItem('token', loginData.token);
        localStorage.setItem('user', JSON.stringify(loginData.user));
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userName', loginData.user.name);
        localStorage.setItem('userEmail', loginData.user.email);
        
        // Redirect to dashboard after successful login
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    }

    function loginFailed(submitBtn, originalText, message) {
        showMessage(message, 'error');
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
});
