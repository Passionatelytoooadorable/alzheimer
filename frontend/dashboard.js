// dashboard.js
document.addEventListener('DOMContentLoaded', function () {

    // Auth guard
    if (!localStorage.getItem('token')) {
        window.location.href = 'signup.html';
        return;
    }

    // Inject shared nav — reads fresh user from localStorage
    initSharedNav('dashboard.html');

    initializeDashboard();
    setupEventListeners();
});

function initializeDashboard() {
    updateDashboardData();

    var currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    var dateEl = document.getElementById('currentDate');
    if (dateEl) dateEl.textContent = currentDate;

    loadReminders();
}

function updateDashboardData() {
    // ALWAYS read fresh user — check profileData first (user may have updated name there)
    var profileStored = localStorage.getItem('profileData');
    var storedUser    = localStorage.getItem('user');
    var profile = profileStored ? JSON.parse(profileStored) : {};
    var user    = storedUser    ? JSON.parse(storedUser)    : {};

    // Name priority: profileData.name > user.name > userName key > fallback
    var displayName = profile.name || user.name || localStorage.getItem('userName') || 'User';

    var nameEl = document.getElementById('userName');
    if (nameEl) nameEl.textContent = displayName;

    // Memories
    var memories = JSON.parse(localStorage.getItem('memories') || '[]');
    var memCount  = memories.length;
    setTxt('memoryCount',  memCount);
    setTxt('memoryCount2', memCount);
    var memBadge = document.getElementById('memoryBadge');
    if (memBadge) memBadge.textContent = memCount + ' memories';

    // Journal
    var je = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    if (!je.length) je = JSON.parse(localStorage.getItem('journals') || '[]');
    var journalCount = je.length;
    var oneWeekAgo   = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    var weeklyCount  = je.filter(function (e) { return e.date && e.date >= oneWeekAgo; }).length
                    || parseInt(localStorage.getItem('weeklyCount') || '0');

    setTxt('journalCount',  journalCount);
    setTxt('journalCount2', journalCount);
    var jBadge = document.getElementById('journalBadge');
    if (jBadge) jBadge.textContent = journalCount + ' entries';

    var wkEl = document.querySelector('.journal-tile .stat:nth-child(2) strong');
    if (wkEl) wkEl.textContent = weeklyCount;
    if (document.getElementById('weeklyCount')) setTxt('weeklyCount', weeklyCount);

    // Reminders
    var reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
    var today     = new Date().toDateString();
    var todayCount = reminders.filter(function (r) {
        return new Date(r.date).toDateString() === today;
    }).length;
    setTxt('reminderCount', todayCount);
}

function setTxt(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
}

function loadReminders() {
    var reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
    var today     = new Date().toDateString();
    var todayR    = reminders.filter(function (r) {
        return new Date(r.date).toDateString() === today;
    });

    var data = todayR.length > 0 ? todayR : [
        { time: '9:00 AM',  text: 'Take morning medication', status: 'pending'  },
        { time: '14:00 PM', text: 'Doctor appointment',      status: 'upcoming' },
        { time: '17:00 PM', text: 'Call family member',      status: 'pending'  },
        { time: '19:00 PM', text: 'Evening walk',            status: 'pending'  }
    ];

    var list = document.getElementById('remindersList');
    if (list) {
        list.innerHTML = data.map(function (r) {
            return '<li class="reminder-item">' +
                '<span class="reminder-time">'   + r.time   + '</span>' +
                '<span class="reminder-text">'   + r.text   + '</span>' +
                '<span class="reminder-status '  + r.status + '">' +
                    r.status.charAt(0).toUpperCase() + r.status.slice(1) +
                '</span></li>';
        }).join('');
    }
}

function setupEventListeners() {
    var addReminderBtn = document.querySelector('.add-reminder-btn');
    if (addReminderBtn) {
        addReminderBtn.addEventListener('click', function () {
            alert('Add reminder feature — connect to your reminders module.');
        });
    }

    var emergencyBtn   = document.getElementById('emergencyBtn');
    var emergencyModal = document.getElementById('emergencyModal');
    var closeBtn       = document.querySelector('.close');

    if (emergencyBtn && emergencyModal) {
        emergencyBtn.addEventListener('click', function () {
            emergencyModal.style.display = 'block';
        });
    }
    if (closeBtn && emergencyModal) {
        closeBtn.addEventListener('click', function () {
            emergencyModal.style.display = 'none';
        });
    }
    window.addEventListener('click', function (e) {
        if (emergencyModal && e.target === emergencyModal) {
            emergencyModal.style.display = 'none';
        }
    });

    // Update if localStorage changes (e.g. from another tab)
    window.addEventListener('storage', function (e) {
        var watched = ['memories','journalEntries','journals','reminders','weeklyCount','profileData','user','userName'];
        if (watched.indexOf(e.key) !== -1) {
            updateDashboardData();
            loadReminders();
        }
    });
}

function callNumber(number) {
    alert('Calling ' + number + '. In a real app, this would initiate a phone call.');
}
