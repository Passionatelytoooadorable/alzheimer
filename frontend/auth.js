// auth.js - Complete Authentication Helper
const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

// Check if user is authenticated
function isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
}

// Check authentication and redirect if needed
function checkAuth() {
    const protectedPages = ['dashboard.html', 'memory.html', 'journal.html', 'location.html', 'resources.html', 'memory-vault.html', 'location-tracker.html', 'ai-companion.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage) && !isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Get current user
function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('memories');
    localStorage.removeItem('journals');
    localStorage.removeItem('reminders');
    window.location.href = 'login.html';
}

// Check auth on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    // Update navigation based on auth status
    const authLink = document.getElementById('authLink');
    if (authLink && isAuthenticated()) {
        authLink.textContent = 'Logout';
        authLink.href = '#';
        authLink.onclick = logout;
    }
});

// Data synchronization functions
function updateDashboardData() {
    // Update memory count
    const memories = JSON.parse(localStorage.getItem('memories')) || [];
    const memoryCountElements = document.querySelectorAll('#memoryCount, #memoryCount2, #memoryBadge');
    memoryCountElements.forEach(el => {
        if (el.id === 'memoryBadge') {
            el.textContent = `${memories.length} memories`;
        } else {
            el.textContent = memories.length;
        }
    });

    // Update journal count
    const journals = JSON.parse(localStorage.getItem('journals')) || [];
    const journalCountElements = document.querySelectorAll('#journalCount, #journalCount2, #journalBadge');
    journalCountElements.forEach(el => {
        if (el.id === 'journalBadge') {
            el.textContent = `${journals.length} entries`;
        } else {
            el.textContent = journals.length;
        }
    });

    // Update user name
    const user = getUser();
    const userNameElement = document.getElementById('userName');
    if (userNameElement && user) {
        userNameElement.textContent = user.name || 'User';
    }

    // Update date
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
}

// Listen for storage updates
window.addEventListener('storage', function(e) {
    if (e.key === 'memories' || e.key === 'journals') {
        updateDashboardData();
    }
});

// Make functions available globally
window.authHelper = {
    isAuthenticated,
    checkAuth,
    getUser,
    logout,
    updateDashboardData
};
