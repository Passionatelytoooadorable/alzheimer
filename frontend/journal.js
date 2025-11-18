// Journal JavaScript with Live Backend API Integration and Default Data
const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

class Journal {
    constructor() {
        this.entries = [];
        this.currentPrompt = '';
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Check authentication
        if (!this.token) {
            window.location.href = 'index.html';
            return;
        }
        
        this.init();
    }

    async init() {
        console.log('Journal initialized with backend API');
        
        // Load data from backend and create default entries if needed
        await this.loadJournalData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize calendar
        this.initializeCalendar();
        
        // Update dashboard stats
        this.updateDashboardStats();
    }

    async loadJournalData() {
        try {
            console.log('Loading journal data from backend...');
            const response = await fetch(`${API_BASE}/journals`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch journals: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Backend response:', data);
            
            this.entries = data.journals || [];
            
            // Transform backend data to match frontend format
            this.entries = this.entries.map(entry => ({
                id: entry.id,
                title: entry.title || 'Untitled Entry',
                date: new Date(entry.created_at).toISOString().split('T')[0],
                content: entry.content,
                mood: this.convertMoodToEmoji(entry.mood)
            }));
            
            console.log('Transformed entries:', this.entries);
            
            // Create default entries if this is user's first time
            if (this.entries.length === 0) {
                console.log('No entries found, creating default entries...');
                await this.createDefaultJournalEntries();
            } else {
                console.log('Found existing entries:', this.entries.length);
                this.displayEntries();
                this.updateStats();
            }
            
            // Load reminders
            this.loadReminders();
            
        } catch (error) {
            console.error('Failed to load journal data:', error);
            // Fallback: create default entries locally
            this.createDefaultEntriesLocally();
        }
    }

    async createDefaultJournalEntries() {
        console.log('Creating default journal entries for new user...');
        
        const defaultEntries = [
            {
                title: "A Wonderful Day with Family",
                content: "Today was such a beautiful day. My grandchildren came to visit and we spent the afternoon in the garden. They showed me their new toys and we had tea together. It reminded me of when my own children were young.",
                mood: "happy",
                date: new Date().toISOString().split('T')[0] // Today
            },
            {
                title: "Morning Walk Thoughts", 
                content: "Went for my morning walk today. The weather was perfect - not too hot, not too cold. Saw the neighbor's cat sunbathing on the fence. It made me think about how simple pleasures can bring so much joy.",
                mood: "calm",
                date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Yesterday
            }
        ];

        const createdEntries = [];
        
        try {
            for (const entryData of defaultEntries) {
                const result = await this.createJournalEntry(entryData);
                if (result && result.journal) {
                    createdEntries.push({
                        id: result.journal.id,
                        title: result.journal.title,
                        date: new Date(result.journal.created_at).toISOString().split('T')[0],
                        content: result.journal.content,
                        mood: this.convertMoodToEmoji(result.journal.mood)
                    });
                }
            }
            
            console.log('Default journal entries created successfully:', createdEntries);
            this.entries = createdEntries;
            
            // Display the entries
            this.displayEntries();
            this.updateStats();
            
        } catch (error) {
            console.error('Failed to create default journal entries in backend:', error);
            // Fallback to local creation
            this.createDefaultEntriesLocally();
        }
    }

    createDefaultEntriesLocally() {
        console.log('Creating default entries locally...');
        
        const defaultEntries = [
            {
                id: 1,
                title: "A Wonderful Day with Family",
                date: new Date().toISOString().split('T')[0],
                content: "Today was such a beautiful day. My grandchildren came to visit and we spent the afternoon in the garden. They showed me their new toys and we had tea together. It reminded me of when my own children were young.",
                mood: "😊"
            },
            {
                id: 2,
                title: "Morning Walk Thoughts",
                date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                content: "Went for my morning walk today. The weather was perfect - not too hot, not too cold. Saw the neighbor's cat sunbathing on the fence. It made me think about how simple pleasures can bring so much joy.",
                mood: "😌"
            }
        ];
        
        this.entries = defaultEntries;
        localStorage.setItem('journalEntries', JSON.stringify(defaultEntries));
        
        this.displayEntries();
        this.updateStats();
        console.log('Default entries created locally');
    }

    convertMoodToEmoji(mood) {
        const moodMap = {
            'happy': '😊',
            'calm': '😌',
            'sad': '😢',
            'frustrated': '😠',
            'tired': '😴',
            'neutral': '😊'
        };
        return moodMap[mood] || '😊';
    }

    convertEmojiToMood(emoji) {
        const moodMap = {
            '😊': 'happy',
            '😌': 'calm',
            '😢': 'sad',
            '😠': 'frustrated',
            '😴': 'tired'
        };
        return moodMap[emoji] || 'neutral';
    }

    loadReminders() {
        console.log('Loading reminders...');
        
        // Check if reminders already exist in localStorage
        let reminders = JSON.parse(localStorage.getItem('reminders')) || [];
        
        // Create default reminders if none exist (first time user)
        if (reminders.length === 0) {
            console.log('Creating default reminders for new user...');
            
            const defaultReminders = [
                {
                    id: 1,
                    title: "Take morning medication",
                    date: new Date().toISOString().split('T')[0],
                    time: "09:00",
                    completed: false
                },
                {
                    id: 2,
                    title: "Doctor appointment",
                    date: new Date().toISOString().split('T')[0],
                    time: "14:00",
                    completed: false
                },
                {
                    id: 3,
                    title: "Call family member", 
                    date: new Date().toISOString().split('T')[0],
                    time: "17:00",
                    completed: false
                },
                {
                    id: 4,
                    title: "Evening walk",
                    date: new Date().toISOString().split('T')[0],
                    time: "19:00",
                    completed: false
                }
            ];
            
            reminders = defaultReminders;
            localStorage.setItem('reminders', JSON.stringify(reminders));
            console.log('Default reminders created successfully');
        }
        
        console.log('Reminders loaded:', reminders);
        this.displayReminders();
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // New Entry Button
        document.getElementById('newEntryBtn').addEventListener('click', () => this.openNewEntryForm());
        
        // Voice Entry Button
        document.getElementById('voiceEntryBtn').addEventListener('click', () => this.startVoiceEntry());
        
        // Prompts Button
        document.getElementById('promptsBtn').addEventListener('click', () => this.openPromptsSection());
        
        // Close Form Button
        document.getElementById('closeFormBtn').addEventListener('click', () => this.closeNewEntryForm());
        
        // Close Prompts Button
        document.getElementById('closePromptsBtn').addEventListener('click', () => this.closePromptsSection());
        
        // Filter Buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                journal.displayEntries(this.dataset.filter);
            });
        });
        
        // Add Reminder Button
        document.getElementById('addReminderBtn').addEventListener('click', () => this.openReminderModal());
        
        // Use Prompt Buttons
        document.querySelectorAll('.use-prompt-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                journal.usePrompt(this.dataset.prompt);
            });
        });
        
        // Mood Buttons
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                document.getElementById('selectedMood').value = this.dataset.mood;
            });
        });
        
        // Form submissions
        document.getElementById('journalForm').addEventListener('submit', (e) => this.handleJournalSubmit(e));
        document.getElementById('reminderForm').addEventListener('submit', (e) => this.handleReminderSubmit(e));
        
        // Cancel buttons
        document.getElementById('cancelEntry').addEventListener('click', () => this.closeNewEntryForm());
        document.getElementById('cancelReminder').addEventListener('click', () => this.closeReminderModal());
        
        // Modal close buttons
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.addEventListener('click', function() {
                this.closest('.modal').style.display = 'none';
            });
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());

        console.log('Event listeners setup complete');
    }

    displayEntries(filter = 'all') {
        console.log('Displaying entries with filter:', filter);
        const entriesList = document.getElementById('entriesList');
        
        if (!entriesList) {
            console.error('entriesList element not found!');
            return;
        }

        // Filter entries
        const today = new Date().toISOString().split('T')[0];
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        let filteredEntries = this.entries;
        
        switch(filter) {
            case 'today':
                filteredEntries = this.entries.filter(entry => entry.date === today);
                break;
            case 'week':
                filteredEntries = this.entries.filter(entry => entry.date >= oneWeekAgo);
                break;
            case 'month':
                filteredEntries = this.entries.filter(entry => entry.date >= oneMonthAgo);
                break;
        }

        console.log('Filtered entries:', filteredEntries);

        // Clear list
        entriesList.innerHTML = '';

        // Add entry cards
        filteredEntries.forEach(entry => {
            const entryCard = this.createEntryCard(entry);
            entriesList.appendChild(entryCard);
        });

        // Show empty state if no entries
        if (filteredEntries.length === 0) {
            entriesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3>No journal entries found</h3>
                    <p>Start writing your first journal entry to capture your thoughts and memories!</p>
                    <button class="action-btn primary" onclick="journal.openNewEntryForm()">
                        Write Your First Entry
                    </button>
                </div>
            `;
        }
        
        console.log('Entries display completed');
    }

    createEntryCard(entry) {
        const card = document.createElement('div');
        card.className = 'entry-card';
        card.innerHTML = `
            <div class="entry-header">
                <h3 class="entry-title">${this.escapeHtml(entry.title)}</h3>
                <div class="entry-date">${this.formatDate(entry.date)}</div>
            </div>
            <div class="entry-content">${this.escapeHtml(entry.content)}</div>
            <div class="entry-footer">
                <div class="entry-mood">${entry.mood}</div>
                <div class="entry-actions">
                    <button class="entry-btn edit" onclick="journal.editEntry(${entry.id})">Edit</button>
                    <button class="entry-btn delete" onclick="journal.deleteEntry(${entry.id})">Delete</button>
                </div>
            </div>
        `;
        
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.entry-actions')) {
                this.viewEntry(entry.id);
            }
        });
        
        return card;
    }

    displayReminders() {
        console.log('Displaying reminders...');
        const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
        const today = new Date().toISOString().split('T')[0];
        const todayReminders = reminders.filter(reminder => reminder.date === today);
        const remindersList = document.getElementById('remindersList');
        
        if (!remindersList) {
            console.error('remindersList element not found!');
            return;
        }

        // Update count
        const remindersCountElement = document.getElementById('remindersCount');
        if (remindersCountElement) {
            remindersCountElement.textContent = todayReminders.length;
        }
        
        // Clear list
        remindersList.innerHTML = '';
        
        // Add reminder items
        todayReminders.forEach(reminder => {
            const reminderItem = document.createElement('div');
            reminderItem.className = 'reminder-item';
            reminderItem.innerHTML = `
                <div class="reminder-time">${this.formatTime(reminder.time)}</div>
                <div class="reminder-text">${this.escapeHtml(reminder.title)}</div>
                <div class="reminder-status ${reminder.completed ? 'completed' : 'pending'}">
                    ${reminder.completed ? 'Done' : 'Pending'}
                </div>
            `;
            
            reminderItem.addEventListener('click', () => {
                this.toggleReminderCompletion(reminder.id);
            });
            
            remindersList.appendChild(reminderItem);
        });
        
        // Show empty state if no reminders
        if (todayReminders.length === 0) {
            remindersList.innerHTML = `
                <div class="empty-state" style="padding: 1rem;">
                    <div class="empty-icon">⏰</div>
                    <p>No reminders for today</p>
                </div>
            `;
        }
        
        // Update dashboard stats
        this.updateDashboardStats();
        
        console.log('Reminders display completed');
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    formatTime(timeString) {
        if (!timeString) return '--:--';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    initializeCalendar() {
        console.log('Initializing calendar...');
        const currentDate = new Date();
        this.updateCalendar(currentDate);
        
        // Navigation buttons
        document.getElementById('prevMonth').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            this.updateCalendar(currentDate);
        });
        
        document.getElementById('nextMonth').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            this.updateCalendar(currentDate);
        });
    }

    updateCalendar(date) {
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        
        document.getElementById('currentMonth').textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const startingDay = firstDay.getDay();
        const monthLength = lastDay.getDate();
        
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) {
            console.error('calendarGrid element not found!');
            return;
        }
        
        calendarGrid.innerHTML = '';
        
        // Add day headers
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day header';
            dayElement.textContent = day;
            calendarGrid.appendChild(dayElement);
        });
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day';
            calendarGrid.appendChild(emptyDay);
        }
        
        // Add days of the month
        const today = new Date();
        
        for (let day = 1; day <= monthLength; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            // Check if today
            if (date.getFullYear() === today.getFullYear() && 
                date.getMonth() === today.getMonth() && 
                day === today.getDate()) {
                dayElement.classList.add('today');
            }
            
            // Check if has journal entry
            const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasEntry = this.entries.some(entry => entry.date === dateString);
            
            if (hasEntry) {
                dayElement.classList.add('has-entry');
            }
            
            dayElement.textContent = day;
            dayElement.addEventListener('click', () => {
                this.showEntriesForDate(dateString);
            });
            
            calendarGrid.appendChild(dayElement);
        }
    }

    // ... (rest of the methods remain the same as previous version)

    updateStats() {
        console.log('Updating stats...');
        const totalEntriesElement = document.getElementById('totalEntries');
        const thisWeekElement = document.getElementById('thisWeek');
        
        if (totalEntriesElement) {
            totalEntriesElement.textContent = this.entries.length;
        }
        
        const weeklyCount = this.calculateWeeklyCount();
        if (thisWeekElement) {
            thisWeekElement.textContent = weeklyCount;
        }
        
        // Also update localStorage for dashboard sync
        localStorage.setItem('weeklyCount', weeklyCount.toString());
        
        console.log('Stats updated - Total:', this.entries.length, 'Weekly:', weeklyCount);
    }

    formatDate(dateString) {
        try {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(dateString).toLocaleDateString('en-US', options);
        } catch (error) {
            console.error('Error formatting date:', error);
            return dateString;
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            ${type === 'success' ? 'background: #4ecdc4;' : 
              type === 'error' ? 'background: #ff6b6b;' : 'background: #a8d0e6;'}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

// Add CSS for notifications if not already present
if (!document.querySelector('#journal-notifications')) {
    const style = document.createElement('style');
    style.id = 'journal-notifications';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

// Initialize journal when DOM is loaded
let journal;
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing journal...');
    journal = new Journal();
});

// Debug function to check current data
function debugData() {
    console.log('=== DEBUG DATA ===');
    console.log('Journal Entries:', journal.entries);
    console.log('Reminders:', JSON.parse(localStorage.getItem('reminders')) || []);
    console.log('Journal Count in localStorage:', localStorage.getItem('journalCount'));
    console.log('Weekly Count in localStorage:', localStorage.getItem('weeklyCount'));
    console.log('=== END DEBUG ===');
}

// Force reload data (for testing)
function forceReload() {
    if (journal) {
        journal.loadJournalData();
    }
}
