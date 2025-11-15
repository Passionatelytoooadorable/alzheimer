// Signup page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    const textSizeBtn = document.getElementById('textSize');
    const highContrastBtn = document.getElementById('highContrast');
    
    // Initialize signup functionality
    initSignupForm();
    initAccessibility();
    setupPasswordStrength();

    function initSignupForm() {
        if (!signupForm) return;

        // Disable browser default validation
        disableBrowserValidation();
        
        signupForm.addEventListener('submit', handleSignup);
        
        // Real-time username and email validation
        document.getElementById('username').addEventListener('blur', validateUsername);
        document.getElementById('email').addEventListener('blur', validateEmail);
        document.getElementById('password').addEventListener('input', updatePasswordStrength);
        document.getElementById('confirmPassword').addEventListener('blur', validatePasswordMatch);
    }

    function handleSignup(e) {
        e.preventDefault();
        
        const formData = getFormData();
        
        // Validation
        if (!validateForm(formData)) return;
        
        // Attempt registration
        attemptRegistration(formData);
    }

    function getFormData() {
        return {
            fullName: document.getElementById('fullName').value.trim(),
            username: document.getElementById('username').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirmPassword').value,
            terms: document.querySelector('input[name="terms"]').checked
        };
    }

    function validateForm(data) {
        // Check required fields
        if (!data.fullName || !data.username || !data.email || !data.phone || !data.password) {
            showMessage('Please fill in all required fields', 'error');
            return false;
        }
        
        // Check terms agreement
        if (!data.terms) {
            showMessage('Please agree to the Terms of Service and Privacy Policy', 'error');
            return false;
        }
        
        if (!isValidEmail(data.email)) {
        showMessage('Please enter a valid email address', 'error');
        return false;
        }
        
        // Validate phone format
        if (!isValidPhone(data.phone)) {
            showMessage('Please enter a valid phone number', 'error');
            return false;
        }
        
        // Check password match
        if (data.password !== data.confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return false;
        }
        
        // Check password strength
        if (data.password.length < 6) {
            showMessage('Password must be at least 6 characters long', 'error');
            return false;
        }
        
        return true;
    }

    // Add this function to prevent form validation UI
    function disableBrowserValidation() {
        const form = document.getElementById('signupForm');
        if (form) {
            form.setAttribute('novalidate', 'novalidate');
        }
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function isValidPhone(phone) {
        // Basic phone validation - allows various formats
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    function validateUsername() {
        const username = document.getElementById('username').value.trim();
        if (!username) return true;
        
        const users = getUsers();
        const isUnique = !users.some(user => user.username === username);
        
        if (!isUnique) {
            showFieldError('username', 'Username already exists');
            return false;
        } else {
            clearFieldError('username');
            return true;
        }
    }

    function validateEmail() {
        const email = document.getElementById('email').value.trim();
        if (!email) return true;
        
        if (!isValidEmail(email)) {
            showFieldError('email', 'Invalid email format');
            return false;
        }
        
        const users = getUsers();
        const isUnique = !users.some(user => user.email === email);
        
        if (!isUnique) {
            showFieldError('email', 'Email already registered');
            return false;
        } else {
            clearFieldError('email');
            return true;
        }
    }

    function validatePasswordMatch() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (confirmPassword && password !== confirmPassword) {
            showFieldError('confirmPassword', 'Passwords do not match');
            return false;
        } else {
            clearFieldError('confirmPassword');
            return true;
        }
    }

    function getUsers() {
        return JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    }

    function attemptRegistration(userData) {
        const submitBtn = signupForm.querySelector('.login-button');
        const originalText = submitBtn.textContent;
        
        // Show loading state
        setButtonLoading(submitBtn, true, 'Creating Account...');
        
        // Simulate API call
        setTimeout(() => {
            const users = getUsers();
            
            // Check if username or email still available (in case of race condition)
            const usernameExists = users.some(user => user.username === userData.username);
            const emailExists = users.some(user => user.email === userData.email);
            
            if (usernameExists || emailExists) {
                if (usernameExists) showFieldError('username', 'Username already exists');
                if (emailExists) showFieldError('email', 'Email already registered');
                setButtonLoading(submitBtn, false, originalText);
                return;
            }
            
            // Create new user
            const newUser = {
                id: generateId(),
                fullName: userData.fullName,
                username: userData.username,
                email: userData.email,
                phone: userData.phone,
                password: userData.password, // In real app, this would be hashed
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            localStorage.setItem('registeredUsers', JSON.stringify(users));
            
            registrationSuccess(newUser, submitBtn, originalText);
        }, 1500);
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    function registrationSuccess(user, submitBtn, originalText) {
        showMessage('Account created successfully! Redirecting to login...', 'success');
        
        // Auto-login the user
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userName', user.fullName);
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userUsername', user.username);
        localStorage.setItem('userPhone', user.phone);
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    }

    function setupPasswordStrength() {
        const passwordInput = document.getElementById('password');
        const strengthBar = document.querySelector('.strength-bar');
        const strengthText = document.querySelector('.strength-text');
        
        passwordInput.addEventListener('input', updatePasswordStrength);
        
        function updatePasswordStrength() {
            const password = passwordInput.value;
            let strength = 0;
            let text = 'Password strength';
            let color = '#ff6b6b';
            
            if (password.length >= 6) strength += 25;
            if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 25;
            if (password.match(/\d/)) strength += 25;
            if (password.match(/[^a-zA-Z\d]/)) strength += 25;
            
            if (strength >= 75) {
                text = 'Strong password';
                color = '#51cf66';
            } else if (strength >= 50) {
                text = 'Good password';
                color = '#ffd43b';
            } else if (strength >= 25) {
                text = 'Weak password';
                color = '#ff922b';
            } else {
                text = 'Very weak password';
                color = '#ff6b6b';
            }
            
            strengthBar.style.width = strength + '%';
            strengthBar.style.background = color;
            strengthText.textContent = text;
            strengthText.style.color = color;
        }
    }

    function showFieldError(fieldName, message) {
    const field = document.getElementById(fieldName);
    const formGroup = field.closest('.form-group');
    
    // Remove existing error
    const existingError = formGroup.querySelector('.field-error');
    if (existingError) existingError.remove();
    
    // Remove any existing error class
    field.classList.remove('error');
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = 'color: #e74c3c; font-size: 0.8rem; margin-top: 0.25rem;';
    
    formGroup.appendChild(errorDiv);
    
    // Add error class to input for optional styling
    field.classList.add('error');
}

    function clearFieldError(fieldName) {
    const field = document.getElementById(fieldName);
    const formGroup = field.closest('.form-group');
    const existingError = formGroup.querySelector('.field-error');
    
    if (existingError) existingError.remove();
    
    // Remove error class and reset to normal styling
    field.classList.remove('error');
    field.style.borderColor = '#ced4da';
}

    function setButtonLoading(button, isLoading, text) {
        button.textContent = text;
        button.disabled = isLoading;
    }

    function showMessage(message, type) {
        removeExistingMessages();
        
        const messageDiv = createMessageElement(message, type);
        const loginCard = document.querySelector('.login-card');
        
        if (loginCard) {
            loginCard.insertBefore(messageDiv, loginCard.querySelector('.login-footer'));
        }
    }

    function removeExistingMessages() {
        const existingMessage = document.querySelector('.login-message');
        if (existingMessage) existingMessage.remove();
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
        
        Object.assign(messageDiv.style, styles);
        
        setTimeout(() => {
            if (messageDiv.parentNode) messageDiv.remove();
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