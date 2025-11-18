// dashboard.js - Updated with Complete Synchronization
const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
    }

    initializeDashboard();
    setupEventListeners();
});

function initializeDashboard() {
    // Update all dashboard data
    updateDashboardData();
    
    // Set current date
    const currentDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    document.getElementById('currentDate').textContent = currentDate;

    // Load sample reminders
    loadReminders();
    
    // Setup emergency modal
    setupEmergencyModal();
}

function updateDashboardData() {
    // Update memory count from localStorage
    const memories = JSON.parse(localStorage.getItem('memories')) || [];
    document.getElementById('memoryCount').textContent = memories.length;
    document.getElementById('memoryCount2').textContent = memories.length;
    document.getElementById('memoryBadge').textContent = `${memories.length} memories`;

    // Update journal count from localStorage
    const journals = JSON.parse(localStorage.getItem('journals')) || [];
    document.getElementById('journalCount').textContent = journals.length;
    document.getElementById('journalCount2').textContent = journals.length;
    document.getElementById('journalBadge').textContent = `${journals.length} entries, 2 prompts`;

    // Update user name
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    document.getElementById('userName').textContent = user.name || 'User';

    // Update reminder count
    const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
    const todayReminders = reminders.filter(reminder => {
        const reminderDate = new Date(reminder.date).toDateString();
        const today = new Date().toDateString();
        return reminderDate === today;
    });
    document.getElementById('reminderCount').textContent = todayReminders.length;
}

function loadReminders() {
    const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
    const today = new Date().toDateString();
    
    const todayReminders = reminders.filter(reminder => {
        const reminderDate = new Date(reminder.date).toDateString();
        return reminderDate === today;
    });

    // If no reminders in localStorage, use sample data
    if (todayReminders.length === 0) {
        const sampleReminders = [
            { time: '9:00 AM', text: 'Take morning medication', status: 'pending' },
            { time: '14:00 PM', text: 'Doctor appointment', status: 'upcoming' },
            { time: '17:00 PM', text: 'Call family member', status: 'pending' },
            { time: '19:00 PM', text: 'Evening walk', status: 'pending' }
        ];
        
        const remindersList = document.getElementById('remindersList');
        remindersList.innerHTML = sampleReminders.map(reminder => `
            <li class="reminder-item">
                <span class="reminder-time">${reminder.time}</span>
                <span class="reminder-text">${reminder.text}</span>
                <span class="reminder-status ${reminder.status}">${reminder.status.charAt(0).toUpperCase() + reminder.status.slice(1)}</span>
            </li>
        `).join('');
    } else {
        // Display reminders from localStorage
        const remindersList = document.getElementById('remindersList');
        remindersList.innerHTML = todayReminders.map(reminder => `
            <li class="reminder-item">
                <span class="reminder-time">${reminder.time}</span>
                <span class="reminder-text">${reminder.text}</span>
                <span class="reminder-status ${reminder.status}">${reminder.status.charAt(0).toUpperCase() + reminder.status.slice(1)}</span>
            </li>
        `).join('');
    }
}

function setupEventListeners() {
    // Add Reminder Button
    document.querySelector('.add-reminder-btn').addEventListener('click', function() {
        alert('Add reminder feature would open a form here. This is a demo implementation.');
    });

    // Emergency Button
    document.getElementById('emergencyBtn').addEventListener('click', function() {
        document.getElementById('emergencyModal').style.display = 'block';
    });

    // Close Modal
    document.querySelector('.close').addEventListener('click', function() {
        document.getElementById('emergencyModal').style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('emergencyModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Listen for storage updates from other pages
    window.addEventListener('storage', function(e) {
        if (e.key === 'memories' || e.key === 'journals' || e.key === 'reminders') {
            updateDashboardData();
            loadReminders();
        }
    });
}

function setupEmergencyModal() {
    // Modal is already in HTML, just ensure it works
    console.log('Emergency modal setup complete');
}

function callNumber(number) {
    alert(`Calling ${number}. In a real app, this would initiate a phone call.`);
    // In a real mobile app, you would use: window.location.href = `tel:${number}`;
}

// Make dashboard functions available globally for cross-page updates
window.dashboardFunctions = {
    updateDashboardData,
    loadReminders
};
