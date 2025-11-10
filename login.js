// Login page specific JavaScript
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
                alert('Login functionality would connect to a secure server in a real application.');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                
                // In a real app, you would redirect after successful login
                // window.location.href = 'dashboard.html';
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
