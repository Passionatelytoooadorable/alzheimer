// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    initializeDashboard();
    
    // Set current date
    updateDateDisplay();
    
    // Load user data
    loadUserData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update activity badges
    updateActivityBadges();
});

function initializeDashboard() {
    console.log('Dashboard initialized');
    
    // Check if user is logged in (basic check)
    const userName = localStorage.getItem('userName') || 'User';
    document.getElementById('userName').textContent = userName;
}

function updateDateDisplay() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const dateString = now.toLocaleDateString('en-US', options);
    document.getElementById('currentDate').textContent = dateString;
}

function loadUserData() {
    // Load memory count from localStorage
    const memoryCount = localStorage.getItem('memoryCount') || '0';
    document.getElementById('memoryCount').textContent = memoryCount;
    
    // Load journal count from localStorage
    const journalCount = localStorage.getItem('journalCount') || '0';
    document.getElementById('journalCount').textContent = journalCount;
    
    // Update memory badge
    updateMemoryBadge(memoryCount);
}

function setupEventListeners() {
    // Emergency button
    const emergencyBtn = document.getElementById('emergencyBtn');
    const emergencyModal = document.getElementById('emergencyModal');
    const closeBtn = document.querySelector('.close');
    
    if (emergencyBtn) {
        emergencyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            emergencyModal.style.display = 'block';
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            emergencyModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === emergencyModal) {
            emergencyModal.style.display = 'none';
        }
    });
    
    // Location status check
    checkLocationStatus();
    
    // Simulate real-time updates
    setInterval(updateRealTimeData, 30000); // Every 30 seconds
}

function updateMemoryBadge(count) {
    const memoryBadge = document.getElementById('memoryBadge');
    if (count === '0') {
        memoryBadge.textContent = 'Get Started';
        memoryBadge.style.background = '#4ecdc4';
    } else {
        memoryBadge.textContent = `${count} memories`;
        memoryBadge.style.background = '#ff6b6b';
    }
}

function checkLocationStatus() {
    const locationStatus = document.getElementById('locationStatus');
    
    if (navigator.geolocation) {
        locationStatus.textContent = 'Ready to track';
        locationStatus.style.background = '#96ceb4';
        locationStatus.style.color = 'white';
    } else {
        locationStatus.textContent = 'Not supported';
        locationStatus.style.background = '#e9ecef';
        locationStatus.style.color = '#6c757d';
    }
}

function updateActivityBadges() {
    // Simulate new journal prompts
    const journalBadge = document.getElementById('journalBadge');
    const prompts = ['"What made you smile today?"', '"Who did you talk to today?"'];
    journalBadge.textContent = `${prompts.length} new prompts`;
    
    // AI companion status
    const aiBadge = document.getElementById('aiBadge');
    aiBadge.style.background = '#96ceb4';
    aiBadge.style.color = 'white';
}

function updateRealTimeData() {
    // Simulate real-time updates
    console.log('Updating dashboard data...');
    
    // Update reminder status
    const now = new Date();
    const reminders = document.querySelectorAll('.reminders-list li');
    
    reminders.forEach((reminder, index) => {
        if (index === 0 && now.getHours() >= 9) {
            reminder.style.textDecoration = 'line-through';
            reminder.style.opacity = '0.6';
        }
    });
}

// Emergency contact functions
function callNumber(number) {
    if (confirm(`Call ${number}?`)) {
        // In a real app, this would initiate a phone call
        // For web demo, we'll just show an alert
        alert(`Calling ${number}...\n\nIn a real application, this would connect the call.`);
        
        // Close modal after "call"
        document.getElementById('emergencyModal').style.display = 'none';
    }
}

// Export functions for use in other modules
window.dashboardFunctions = {
    updateUserData: function() {
        loadUserData();
    },
    
    addMemory: function() {
        let count = parseInt(localStorage.getItem('memoryCount') || '0');
        count++;
        localStorage.setItem('memoryCount', count.toString());
        loadUserData();
    },
    
    addJournalEntry: function() {
        let count = parseInt(localStorage.getItem('journalCount') || '0');
        count++;
        localStorage.setItem('journalCount', count.toString());
        loadUserData();
    }
};

// Sample data initialization
function initializeSampleData() {
    if (!localStorage.getItem('memoryCount')) {
        localStorage.setItem('memoryCount', '3');
    }
    if (!localStorage.getItem('journalCount')) {
        localStorage.setItem('journalCount', '2');
    }
    if (!localStorage.getItem('userName')) {
        localStorage.setItem('userName', 'Alex');
    }
}

// Initialize sample data on first load
initializeSampleData();
