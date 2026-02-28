// dashboard.js
document.addEventListener('DOMContentLoaded', function () {

    if (!localStorage.getItem('token')) {
        window.location.href = 'signup.html';
        return;
    }

    initSharedNav('dashboard.html');
    initializeDashboard();
    setupEventListeners();
});

function initializeDashboard() {
    updateDashboardData();
    var dateEl = document.getElementById('currentDate');
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    loadReminders();
}

function updateDashboardData() {
    // Name: scoped profileData > user object > fallback
    var profile = UserStore.get('profileData', {});
    var user    = JSON.parse(localStorage.getItem('user') || '{}');
    var name    = profile.name || user.name || localStorage.getItem('userName') || 'User';

    setTxt('userName', name);

    // Memories
    var memories = UserStore.get('memories', []);
    setTxt('memoryCount',  memories.length);
    setTxt('memoryCount2', memories.length);
    var memBadge = document.getElementById('memoryBadge');
    if (memBadge) memBadge.textContent = memories.length + ' memories';

    // Journal
    var je = UserStore.get('journalEntries', []);
    if (!je.length) je = UserStore.get('journals', []);
    var oneWeekAgo   = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    var weeklyCount  = je.filter(function (e) { return e.date && e.date >= oneWeekAgo; }).length;
    setTxt('journalCount',  je.length);
    setTxt('journalCount2', je.length);
    var jBadge = document.getElementById('journalBadge');
    if (jBadge) jBadge.textContent = je.length + ' entries';
    setTxt('weeklyCount', weeklyCount);

    // Reports
    var reports    = UserStore.get('userReports', []);
    var today      = new Date().toDateString();
    setTxt('reminderCount', reports.length);
}

function setTxt(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
}

function loadReminders() {
    var reminders = UserStore.get('reminders', []);
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
                '<span class="reminder-time">'  + r.time   + '</span>' +
                '<span class="reminder-text">'  + r.text   + '</span>' +
                '<span class="reminder-status ' + r.status + '">' +
                    r.status.charAt(0).toUpperCase() + r.status.slice(1) +
                '</span></li>';
        }).join('');
    }
}

function setupEventListeners() {
    var addBtn = document.querySelector('.add-reminder-btn');
    if (addBtn) addBtn.addEventListener('click', function () {
        alert('Connect this to your reminders module.');
    });

    var emergencyBtn   = document.getElementById('emergencyBtn');
    var emergencyModal = document.getElementById('emergencyModal');
    var closeBtn       = document.querySelector('.close');
    if (emergencyBtn && emergencyModal) {
        emergencyBtn.addEventListener('click', function () { emergencyModal.style.display = 'block'; });
    }
    if (closeBtn && emergencyModal) {
        closeBtn.addEventListener('click', function () { emergencyModal.style.display = 'none'; });
    }
    window.addEventListener('click', function (e) {
        if (emergencyModal && e.target === emergencyModal) emergencyModal.style.display = 'none';
    });

    window.addEventListener('storage', function (e) {
        if (e.key && e.key.startsWith('alz:')) {
            updateDashboardData();
            loadReminders();
        }
    });
}

function callNumber(number) {
    alert('Calling ' + number);
}
