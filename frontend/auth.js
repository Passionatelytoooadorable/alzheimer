// auth.js - Authentication helper functions
const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        // Only redirect if we're on a protected page
        const protectedPages = ['dashboard.html', 'memory.html', 'journal.html', 'location.html', 'resources.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (protectedPages.includes(currentPage)) {
            window.location.href = 'login.html';
            return false;
        }
    }
    return true;
}

function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Check auth on page load for protected pages
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});
