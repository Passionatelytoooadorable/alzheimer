class Dashboard {
    constructor() {
        this.puzzleAnimationInterval = null;
        this.puzzleState = 'connected';
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.initializeDashboard();
        this.initFloatingPuzzle();
        this.setupEventListeners();
        this.loadUserData();
        this.updateActivityBadges();
        this.initializeSampleData();
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
        const userName = localStorage.getItem('userName') || 'User';
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

    initFloatingPuzzle() {
        const puzzleContainer = document.querySelector('.puzzle-container');
        this.startPuzzleAnimation();
        
        const puzzlePieces = document.querySelectorAll('.puzzle-piece');
        puzzlePieces.forEach(piece => {
            piece.addEventListener('click', (e) => {
                e.stopPropagation();
                const feature = piece.getAttribute('data-feature');
                this.navigateToFeature(feature);
                this.animatePieceClick(piece);
            });
        });
    }

    startPuzzleAnimation() {
        this.puzzleAnimationInterval = setInterval(() => {
            if (this.puzzleState === 'connected') {
                this.animateSeparation();
            } else if (this.puzzleState === 'separated') {
                this.animateConnection();
            }
        }, 3000);
    }

    animateSeparation() {
        const puzzleContainer = document.querySelector('.puzzle-container');
        this.puzzleState = 'separating';
        
        puzzleContainer.classList.remove('connected');
        puzzleContainer.classList.add('separated');
        
        setTimeout(() => {
            this.puzzleState = 'separated';
        }, 600);
    }

    animateConnection() {
        const puzzleContainer = document.querySelector('.puzzle-container');
        this.puzzleState = 'connecting';
        
        puzzleContainer.classList.remove('separated');
        puzzleContainer.classList.add('connected');
        
        setTimeout(() => {
            this.puzzleState = 'connected';
        }, 600);
    }

    navigateToFeature(feature) {
        const featureUrls = {
            'memory': 'memory-vault.html',
            'journal': 'journal.html',
            'location': 'location-tracker.html',
            'ai': 'ai-companion.html'
        };
        
        if (featureUrls[feature]) {
            window.location.href = featureUrls[feature];
        }
    }

    animatePieceClick(piece) {
        piece.style.transform = 'scale(1.1)';
        setTimeout(() => {
            piece.style.transform = '';
        }, 300);
    }

    highlightConnections(activePiece) {
        const pieces = document.querySelectorAll('.puzzle-piece');
        const activeFeature = activePiece.getAttribute('data-feature');
        
        pieces.forEach(piece => {
            const feature = piece.getAttribute('data-feature');
            if (feature !== activeFeature) {
                piece.style.filter = 'brightness(1.2)';
                piece.style.zIndex = '5';
            }
        });
        
        activePiece.style.filter = 'brightness(1.3)';
        activePiece.style.zIndex = '15';
    }

    removeConnectionHighlights() {
        const pieces = document.querySelectorAll('.puzzle-piece');
        pieces.forEach(piece => {
            piece.style.filter = '';
            piece.style.zIndex = '';
        });
    }

    setupEventListeners() {
        this.setupEmergencyModal();
        this.checkLocationStatus();
        this.setupRealTimeUpdates();
        this.setupReminderInteractions();
    }

    setupEmergencyModal() {
        const emergencyBtn = document.getElementById('emergencyBtn');
        const emergencyModal = document.getElementById('emergencyModal');
        const closeBtn = document.querySelector('.close');
        
        if (emergencyBtn) {
            emergencyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                emergencyModal.style.display = 'block';
                // Add emergency animation
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

        // Make reminders clickable
        const reminderItems = document.querySelectorAll('.reminder-item');
        reminderItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                this.toggleReminderStatus(item, index);
            });
        });
    }

    addNewReminder() {
        const remindersList = document.querySelector('.reminders-list');
        const newReminder = document.createElement('li');
        newReminder.className = 'reminder-item';
        newReminner.innerHTML = `
            <span class="reminder-time">Now</span>
            <span class="reminder-text">New reminder - click to edit</span>
            <span class="reminder-status pending">New</span>
        `;
        
        remindersList.appendChild(newReminder);
        
        // Add click event to new reminder
        newReminder.addEventListener('click', () => {
            this.editReminder(newReminder);
        });
        
        // Animate the new reminder
        newReminder.style.animation = 'slideIn 0.3s ease-out';
        setTimeout(() => {
            newReminder.style.animation = '';
        }, 300);
    }

    toggleReminderStatus(reminder, index) {
        const statusElement = reminder.querySelector('.reminder-status');
        const currentStatus = statusElement.textContent.toLowerCase();
        
        if (currentStatus === 'pending') {
            statusElement.textContent = 'Completed';
            statusElement.className = 'reminder-status completed';
            reminder.style.opacity = '0.7';
            reminder.style.textDecoration = 'line-through';
        } else if (currentStatus === 'completed') {
            statusElement.textContent = 'Pending';
            statusElement.className = 'reminder-status pending';
            reminder.style.opacity = '1';
            reminder.style.textDecoration = 'none';
        }
        
        // Add completion animation
        reminder.style.animation = 'bounce 0.3s ease-in-out';
        setTimeout(() => {
            reminder.style.animation = '';
        }, 300);
    }

    checkLocationStatus() {
        const locationStatus = document.getElementById('locationStatus');
        
        if (navigator.geolocation) {
            locationStatus.textContent = 'Ready to track';
            locationStatus.style.background = '#96ceb4';
            locationStatus.style.color = 'white';
            
            // Simulate location update
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
        // Update reminder status based on current time
        const now = new Date();
        const reminders = document.querySelectorAll('.reminder-item');
        
        reminders.forEach((reminder, index) => {
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
        const memoryCount = localStorage.getItem('memoryCount') || '0';
        const journalCount = localStorage.getItem('journalCount') || '0';
        
        document.getElementById('memoryCount').textContent = memoryCount;
        document.getElementById('memoryCount2').textContent = memoryCount;
        document.getElementById('journalCount').textContent = journalCount;
        document.getElementById('journalCount2').textContent = journalCount;
        
        this.updateMemoryBadge(memoryCount);
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

    updateActivityBadges() {
        const journalBadge = document.getElementById('journalBadge');
        const prompts = ['"What made you smile today?"', '"Who did you talk to today?"'];
        journalBadge.textContent = `${prompts.length} new prompts`;
        
        const aiBadge = document.getElementById('aiBadge');
        aiBadge.style.background = '#96ceb4';
        aiBadge.style.color = 'white';
    }

    initializeSampleData() {
        if (!localStorage.getItem('memoryCount')) {
            localStorage.setItem('memoryCount', '4');
        }
        if (!localStorage.getItem('journalCount')) {
            localStorage.setItem('journalCount', '2');
        }
        if (!localStorage.getItem('userName')) {
            localStorage.setItem('userName', 'Charlie');
        }
        if (!localStorage.getItem('isLoggedIn')) {
            localStorage.setItem('isLoggedIn', 'true');
        }
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
    },
    
    addMemory: function() {
        let count = parseInt(localStorage.getItem('memoryCount') || '0');
        count++;
        localStorage.setItem('memoryCount', count.toString());
        const dashboard = new Dashboard();
        dashboard.loadUserData();
    },
    
    addJournalEntry: function() {
        let count = parseInt(localStorage.getItem('journalCount') || '0');
        count++;
        localStorage.setItem('journalCount', count.toString());
        const dashboard = new Dashboard();
        dashboard.loadUserData();
    }
};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new Dashboard();
});
