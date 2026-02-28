// dashboard.js
const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

document.addEventListener('DOMContentLoaded', function () {

    // Auth guard
    if (!localStorage.getItem('token')) {
        window.location.href = 'signup.html';
        return;
    }

    // Inject shared nav
    initSharedNav('dashboard.html');

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
}

function updateDashboardData() {
    const memories = JSON.parse(localStorage.getItem('memories') || '[]');
    document.getElementById('memoryCount').textContent   = memories.length;
    document.getElementById('memoryCount2').textContent  = memories.length;
    document.getElementById('memoryBadge').textContent   = memories.length + ' memories';

    let journalCount = 0, weeklyCount = 0;
    const je = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    if (je.length > 0) {
        journalCount = je.length;
        const oneWeekAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0];
        weeklyCount = je.filter(e => e.date >= oneWeekAgo).length;
    } else {
        journalCount = JSON.parse(localStorage.getItem('journals') || '[]').length;
        weeklyCount  = parseInt(localStorage.getItem('weeklyCount') || '0');
    }

    document.getElementById('journalCount').textContent  = journalCount;
    document.getElementById('journalCount2').textContent = journalCount;
    document.getElementById('journalBadge').textContent  = journalCount + ' entries';
    const wEl = document.querySelector('.journal-tile .stat:nth-child(2) strong');
    if (wEl) wEl.textContent = weeklyCount;

    // User name — prefer profileData name, fallback to user/token
    const profile = JSON.parse(localStorage.getItem('profileData') || '{}');
    const user    = JSON.parse(localStorage.getItem('user') || '{}');
    document.getElementById('userName').textContent = profile.name || user.name || localStorage.getItem('userName') || 'User';

    const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
    const today = new Date().toDateString();
    document.getElementById('reminderCount').textContent = reminders.filter(r => new Date(r.date).toDateString() === today).length;
}

function loadReminders() {
    const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
    const today = new Date().toDateString();
    const todayR = reminders.filter(r => new Date(r.date).toDateString() === today);
    const data = todayR.length > 0 ? todayR : [
        { time: '9:00 AM',  text: 'Take morning medication', status: 'pending' },
        { time: '14:00 PM', text: 'Doctor appointment',      status: 'upcoming' },
        { time: '17:00 PM', text: 'Call family member',      status: 'pending' },
        { time: '19:00 PM', text: 'Evening walk',            status: 'pending' }
    ];
    document.getElementById('remindersList').innerHTML = data.map(r => `
        <li class="reminder-item">
            <span class="reminder-time">${r.time}</span>
            <span class="reminder-text">${r.text}</span>
            <span class="reminder-status ${r.status}">${r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span>
        </li>`).join('');
}

function setupEventListeners() {
    document.querySelector('.add-reminder-btn').addEventListener('click', () => {
        alert('Add reminder feature — connect to your reminders module.');
    });

    document.getElementById('emergencyBtn').addEventListener('click', () => {
        document.getElementById('emergencyModal').style.display = 'block';
    });
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('emergencyModal').style.display = 'none';
    });
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('emergencyModal'))
            document.getElementById('emergencyModal').style.display = 'none';
    });
    window.addEventListener('storage', (e) => {
        if (['memories','journalEntries','journals','reminders','weeklyCount','profileData'].includes(e.key)) {
            updateDashboardData();
            loadReminders();
        }
    });
}

function callNumber(number) {
    alert('Calling ' + number + '. In a real app, this would initiate a phone call.');
}

window.dashboardFunctions = { updateDashboardData, loadReminders };
