// to check if user is logged in
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (!isLoggedIn) {
        // If not logged in, redirect to login page
        window.location.href = 'login.html';
        return;
    }
    
    // User is logged in, show personalized content
    const userName = localStorage.getItem('userName') || 'User';
    const welcomeElement = document.querySelector('.welcome-section h1');
    if (welcomeElement) {
        welcomeElement.textContent = `Welcome to Alzheimer's Support Platform, ${userName}!`;
    }
});
