// dashboard.js — Updated with Auth Guard and Smart Home Navigation
const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

document.addEventListener('DOMContentLoaded', function () {

    // Auth guard: not logged in → send to login
    if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
        return;
    }

    // KEY FIX: "Home" nav link for logged-in users → dashboard (not index.html which would seem like logout)
    // We handle this by making the Home link smart
    const homeLink = document.querySelector('.nav-links a[href="index.html"]');
    if (homeLink) {
        homeLink.href = 'dashboard.html';
        homeLink.textContent = 'Home';
    }

    // Logout handler
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', function (e) {
            e.preventDefault();
            ['token','user','isLoggedIn','userName','userEmail'].forEach(k => localStorage.removeItem(k));
            window.location.href = 'login.html';
        });
    }

    initializeDashboard();
    setupEventListeners();
});

function initializeDashboard() {
    updateDashboardData();

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    document.getElementById('currentDate').textContent = currentDate;

    loadReminders();
    setupEmergencyModal();
}

function updateDashboardData() {
    const memories = JSON.parse(localStorage.getItem('memories')) || [];
    document.getElementById('memoryCount').textContent = memories.length;
    document.getElementById('memoryCount2').textContent = memories.length;
    document.getElementById('memoryBadge').textContent = memories.length + ' memories';

    let journalCount = 0;
    let weeklyCount = 0;
    const journalEntries = JSON.parse(localStorage.getItem('journalEntries')) || [];
    if (journalEntries.length > 0) {
        journalCount = journalEntries.length;
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        weeklyCount = journalEntries.filter(e => e.date >= oneWeekAgo).length;
    } else {
        const journals = JSON.parse(localStorage.getItem('journals')) || [];
        journalCount = journals.length;
        weeklyCount = parseInt(localStorage.getItem('weeklyCount')) || 0;
    }

    document.getElementById('journalCount').textContent = journalCount;
    document.getElementById('journalCount2').textContent = journalCount;
    document.getElementById('journalBadge').textContent = journalCount + ' entries, 2 prompts';

    const weeklyEl = document.querySelector('.journal-tile .stat:nth-child(2) strong');
    if (weeklyEl) weeklyEl.textContent = weeklyCount;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    document.getElementById('userName').textContent = user.name || 'User';

    const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
    const todayReminders = reminders.filter(r => new Date(r.date).toDateString() === new Date().toDateString());
    document.getElementById('reminderCount').textContent = todayReminders.length;
}

function loadReminders() {
    const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
    const todayReminders = reminders.filter(r => new Date(r.date).toDateString() === new Date().toDateString());
    const list = document.getElementById('remindersList');

    const data = todayReminders.length > 0 ? todayReminders : [
        { time: '9:00 AM', text: 'Take morning medication', status: 'pending' },
        { time: '14:00 PM', text: 'Doctor appointment', status: 'upcoming' },
        { time: '17:00 PM', text: 'Call family member', status: 'pending' },
        { time: '19:00 PM', text: 'Evening walk', status: 'pending' }
    ];

    list.innerHTML = data.map(r => `
        <li class="reminder-item">
            <span class="reminder-time">${r.time}</span>
            <span class="reminder-text">${r.text}</span>
            <span class="reminder-status ${r.status}">${r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span>
        </li>
    `).join('');
}

function setupEventListeners() {
    document.querySelector('.add-reminder-btn').addEventListener('click', function () {
        alert('Add reminder feature would open a form here.');
    });

    document.getElementById('emergencyBtn').addEventListener('click', function () {
        document.getElementById('emergencyModal').style.display = 'block';
    });

    document.querySelector('.close').addEventListener('click', function () {
        document.getElementById('emergencyModal').style.display = 'none';
    });

    window.addEventListener('click', function (event) {
        const modal = document.getElementById('emergencyModal');
        if (event.target === modal) modal.style.display = 'none';
    });

    window.addEventListener('storage', function (e) {
        if (['memories','journalEntries','journals','reminders','weeklyCount'].includes(e.key)) {
            updateDashboardData();
            loadReminders();
        }
    });
}

function setupEmergencyModal() {
    console.log('Emergency modal ready');
}

function callNumber(number) {
    alert('Calling ' + number + '. In a real app, this would initiate a phone call.');
}

window.dashboardFunctions = { updateDashboardData, loadReminders };
