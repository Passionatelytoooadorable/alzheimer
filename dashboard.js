class Dashboard {
    constructor() {
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.initializeSampleData();
        this.initializeDashboard();
        this.setupEventListeners();
        this.loadUserData();
        this.updateActivityBadges();
        this.setupStorageListener();
    }

    checkAuthentication() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (!isLoggedIn) {
            window.location.href = 'login.html';
            return;
        }
    }

    initializeDashboard() {
    console.log('Dashboard initialized');
    const userName = localStorage.getItem('userName') || 'Demo User';
    document.getElementById('userName').textContent = userName;
    this.updateDateDisplay();
}

    updateDateDisplay() {
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

    setupEventListeners() {
        this.setupEmergencyModal();
        this.checkLocationStatus();
        this.setupRealTimeUpdates();
        this.setupReminderInteractions();
    }

    setupStorageListener() {
        // Listen for storage changes from other tabs/pages
        window.addEventListener('storage', (e) => {
            if (e.key === 'journalCount' || e.key === 'weeklyCount' || e.key === 'memoryCount' || e.key === 'reminders') {
                console.log('Storage updated:', e.key, e.newValue);
                this.loadUserData();
            }
        });
        
        // Also listen for custom events from the same page
        window.addEventListener('dataUpdated', (e) => {
            console.log('Data updated event received:', e.detail);
            this.loadUserData();
        });

        // Listen for journal updates specifically
        window.addEventListener('journalUpdated', (e) => {
            console.log('Journal updated event received:', e.detail);
            this.loadUserData();
        });
    }

    setupEmergencyModal() {
        const emergencyBtn = document.getElementById('emergencyBtn');
        const emergencyModal = document.getElementById('emergencyModal');
        const closeBtn = document.querySelector('.close');
        
        if (emergencyBtn) {
            emergencyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                emergencyModal.style.display = 'block';
                emergencyBtn.style.animation = 'pulse 0.5s ease-in-out';
                setTimeout(() => {
                    emergencyBtn.style.animation = '';
                }, 500);
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                emergencyModal.style.display = 'none';
            });
        }
        
        window.addEventListener('click', (event) => {
            if (event.target === emergencyModal) {
                emergencyModal.style.display = 'none';
            }
        });
    }

    setupReminderInteractions() {
        const addReminderBtn = document.querySelector('.add-reminder-btn');
        if (addReminderBtn) {
            addReminderBtn.addEventListener('click', () => {
                this.addNewReminder();
            });
        }
    }

    addNewReminder() {
        // Redirect to journal page to add reminder
        window.location.href = 'journal.html';
    }

    checkLocationStatus() {
        const locationStatus = document.getElementById('locationStatus');
        
        if (navigator.geolocation) {
            locationStatus.textContent = 'Ready to track';
            locationStatus.style.background = '#96ceb4';
            locationStatus.style.color = 'white';
            this.simulateLocationUpdate();
        } else {
            locationStatus.textContent = 'Not supported';
            locationStatus.style.background = '#e9ecef';
            locationStatus.style.color = '#6c757d';
        }
    }

    simulateLocationUpdate() {
        setInterval(() => {
            const locationStatus = document.querySelector('.location-status');
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            locationStatus.textContent = `Last updated: ${timeString}`;
        }, 60000);
    }

    setupRealTimeUpdates() {
        setInterval(() => {
            this.updateRealTimeData();
        }, 30000);
    }

    updateRealTimeData() {
        const now = new Date();
        const reminders = document.querySelectorAll('.reminder-item');
        
        reminders.forEach((reminder) => {
            const timeElement = reminder.querySelector('.reminder-time');
            const statusElement = reminder.querySelector('.reminder-status');
            const timeText = timeElement.textContent;
            
            if (timeText.includes('AM') || timeText.includes('PM')) {
                const [hours, period] = timeText.split(' ');
                let [hour, minute] = hours.split(':');
                
                hour = parseInt(hour);
                if (period === 'PM' && hour !== 12) hour += 12;
                if (period === 'AM' && hour === 12) hour = 0;
                
                const reminderTime = new Date();
                reminderTime.setHours(hour, parseInt(minute), 0, 0);
                
                if (now > reminderTime && statusElement.textContent !== 'Completed') {
                    statusElement.textContent = 'Overdue';
                    statusElement.className = 'reminder-status pending';
                    statusElement.style.background = '#ff6b6b';
                    statusElement.style.color = 'white';
                }
            }
        });
    }

    loadUserData() {
        // Get memory count from memories array in localStorage
        const memories = JSON.parse(localStorage.getItem('memories')) || [];
        const memoryCount = memories.length.toString();
        
        // Use existing values for journal and weekly counts
        const journalCount = localStorage.getItem('journalCount') || '2';
        const weeklyCount = localStorage.getItem('weeklyCount') || '2';
        
        // Get reminder count from shared reminders
        const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
        const today = new Date().toISOString().split('T')[0];
        const todayReminders = reminders.filter(reminder => reminder.date === today);
        const reminderCount = todayReminders.length.toString();
        
        console.log('Loading user data - Memory:', memoryCount, 'Journal:', journalCount, 'Weekly:', weeklyCount, 'Reminders:', reminderCount);
        
        // Update all memory count elements
        document.getElementById('memoryCount').textContent = memoryCount;
        document.getElementById('memoryCount2').textContent = memoryCount;
        
        // Update all journal count elements
        document.getElementById('journalCount').textContent = journalCount;
        document.getElementById('journalCount2').textContent = journalCount;
        
        // Update weekly count
        document.getElementById('weeklyCount').textContent = weeklyCount;
        
        // Update reminder count
        document.getElementById('reminderCount').textContent = reminderCount;
        
        // Update reminders list in dashboard
        this.updateRemindersList(todayReminders);
        
        this.updateMemoryBadge(memoryCount);
        this.updateJournalBadge(journalCount, weeklyCount);
    }

    updateRemindersList(todayReminders) {
        const remindersList = document.getElementById('remindersList');
        if (!remindersList) return;
        
        remindersList.innerHTML = '';
        
        // Sort reminders by time
        todayReminders.sort((a, b) => a.time.localeCompare(b.time));
        
        todayReminders.forEach(reminder => {
            const reminderItem = document.createElement('li');
            reminderItem.className = 'reminder-item';
            
            const status = reminder.completed ? 'completed' : 'pending';
            const statusText = reminder.completed ? 'Completed' : 'Pending';
            
            reminderItem.innerHTML = `
                <span class="reminder-time">${this.formatTime(reminder.time)}</span>
                <span class="reminder-text">${reminder.title}</span>
                <span class="reminder-status ${status}">${statusText}</span>
            `;
            
            reminderItem.addEventListener('click', () => {
                this.toggleReminderStatus(reminder.id);
            });
            
            remindersList.appendChild(reminderItem);
        });
        
        // Add the "Add Reminder" button
        const addButton = document.createElement('button');
        addButton.className = 'add-reminder-btn';
        addButton.textContent = '+ Add Reminder';
        addButton.addEventListener('click', () => {
            this.addNewReminder();
        });
        
        remindersList.appendChild(addButton);
    }

    formatTime(timeString) {
        // Keep 24-hour format
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        return `${hour}:${minutes} ${ampm}`;
    }

    toggleReminderStatus(id) {
        const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
        const reminder = reminders.find(r => r.id === id);
        
        if (reminder) {
            reminder.completed = !reminder.completed;
            localStorage.setItem('reminders', JSON.stringify(reminders));
            
            // Update display
            this.loadUserData();
            
            // Dispatch storage event to sync with other pages
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'reminders',
                newValue: JSON.stringify(reminders)
            }));
        }
    }

    updateMemoryBadge(count) {
        const memoryBadge = document.getElementById('memoryBadge');
        if (count === '0') {
            memoryBadge.textContent = 'Get Started';
            memoryBadge.style.background = '#4ecdc4';
        } else {
            memoryBadge.textContent = `${count} memories`;
            memoryBadge.style.background = '#ff6b6b';
        }
    }

    updateJournalBadge(journalCount, weeklyCount) {
        const journalBadge = document.getElementById('journalBadge');
        const prompts = ['"What made you smile today?"', '"Who did you talk to today?"'];
        journalBadge.textContent = `${journalCount} entries, ${prompts.length} prompts`;
    }

    updateActivityBadges() {
        const journalBadge = document.getElementById('journalBadge');
        const prompts = ['"What made you smile today?"', '"Who did you talk to today?"'];
        const journalCount = localStorage.getItem('journalCount') || '2';
        const weeklyCount = localStorage.getItem('weeklyCount') || '2';
        journalBadge.textContent = `${journalCount} entries, ${prompts.length} prompts`;
        
        const aiBadge = document.getElementById('aiBadge');
        aiBadge.style.background = '#96ceb4';
        aiBadge.style.color = 'white';
    }

    initializeSampleData() {
        // Only initialize if data doesn't exist
        if (!localStorage.getItem('memories')) {
            const sampleMemories = [
                {
                    id: 1,
                    name: "Alex",
                    relationship: "grandchild",
                    description: "This is Ankit, grandson. His birthday was on 19th June. He loves playing football and visiting the beach with us every summer.",
                    image: "👦",
                    color: "#4ecdc4"
                },
                {
                    id: 2,
                    name: "Ella Johnson",
                    relationship: "daughter",
                    description: "My wonderful daughter Priya. She's a doctor and visits every weekend with her family. She makes the best chocolate cake!",
                    image: "👩",
                    color: "#ff6b6b"
                },
                {
                    id: 3,
                    name: "Robert Johnson",
                    relationship: "spouse",
                    description: "My loving husband Robert. We've been married for 45 years. He loves gardening and reading mystery novels together.",
                    image: "👴",
                    color: "#a8d0e6"
                },
                {
                    id: 4,
                    name: "Sarah & Mike",
                    relationship: "friends",
                    description: "Our dear friends from the book club. We meet every Thursday for tea and discuss our latest reads. 30 years of friendship!",
                    image: "👫",
                    color: "#ffd166"
                }
            ];
            localStorage.setItem('memories', JSON.stringify(sampleMemories));
        }
        
        // Initialize shared reminders if they don't exist
        if (!localStorage.getItem('reminders')) {
            const sampleReminders = [
                {
                    id: 1,
                    title: "Take morning medication",
                    date: new Date().toISOString().split('T')[0],
                    time: "09:00",
                    completed: false,
                    type: "medication"
                },
                {
                    id: 2,
                    title: "Doctor appointment",
                    date: new Date().toISOString().split('T')[0],
                    time: "14:00",
                    completed: false,
                    type: "normal"
                },
                {
                    id: 3,
                    title: "Call family member",
                    date: new Date().toISOString().split('T')[0],
                    time: "17:00",
                    completed: false,
                    type: "normal"
                },
                {
                    id: 4,
                    title: "Evening walk",
                    date: new Date().toISOString().split('T')[0],
                    time: "19:00",
                    completed: false,
                    type: "normal"
                }
            ];
            localStorage.setItem('reminders', JSON.stringify(sampleReminders));
        }
        
        if (!localStorage.getItem('journalCount')) {
            localStorage.setItem('journalCount', '2');
        }
        if (!localStorage.getItem('weeklyCount')) {
            localStorage.setItem('weeklyCount', '2');
        }
        if (!localStorage.getItem('userName')) {
            localStorage.setItem('userName', 'Demo User');
        }
        if (!localStorage.getItem('isLoggedIn')) {
            localStorage.setItem('isLoggedIn', 'true');
        }
        
        const memories = JSON.parse(localStorage.getItem('memories')) || [];
        const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
        console.log('Sample data initialized - Memory:', memories.length, 'Reminders:', reminders.length, 'Journal: 2, Weekly: 2');
    }
}

// Emergency contact functions
function callNumber(number) {
    if (confirm(`Call ${number}?`)) {
        alert(`Calling ${number}...\n\nIn a real application, this would connect the call.`);
        document.getElementById('emergencyModal').style.display = 'none';
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(2.5);
            opacity: 0;
        }
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes bounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
    }
`;
document.head.appendChild(style);

// Global functions for other modules
window.dashboardFunctions = {
    updateUserData: function() {
        const dashboard = new Dashboard();
        dashboard.loadUserData();
        
        // Dispatch custom event for same-page updates
        window.dispatchEvent(new CustomEvent('dataUpdated', {
            detail: { type: 'userData' }
        }));
    },
    
    addMemory: function() {
        const dashboard = new Dashboard();
        dashboard.loadUserData();
        window.dispatchEvent(new CustomEvent('dataUpdated', {
            detail: { type: 'memory' }
        }));
    },
    
    addJournalEntry: function() {
        let count = parseInt(localStorage.getItem('journalCount') || '2');
        count++;
        localStorage.setItem('journalCount', count.toString());
        
        // Calculate weekly count
        const entries = JSON.parse(localStorage.getItem('journalEntries')) || [];
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const weeklyCount = entries.filter(entry => entry.date >= oneWeekAgo).length;
        localStorage.setItem('weeklyCount', weeklyCount.toString());
        
        // Update dashboard and dispatch events
        const dashboard = new Dashboard();
        dashboard.loadUserData();
        window.dispatchEvent(new CustomEvent('dataUpdated', {
            detail: { type: 'journal', count: count, weeklyCount: weeklyCount }
        }));
        
        console.log('Journal entry added. Total:', count, 'Weekly:', weeklyCount);
    },
    
    getJournalCount: function() {
        return parseInt(localStorage.getItem('journalCount') || '2');
    },
    
    getWeeklyCount: function() {
        return parseInt(localStorage.getItem('weeklyCount') || '2');
    },
    
    getMemoryCount: function() {
        const memories = JSON.parse(localStorage.getItem('memories')) || [];
        return memories.length;
    },
    
    getReminderCount: function() {
        const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
        const today = new Date().toISOString().split('T')[0];
        const todayReminders = reminders.filter(reminder => reminder.date === today);
        return todayReminders.length;
    }
};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new Dashboard();
});