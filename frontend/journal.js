// Journal JavaScript - Complete Version
const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

class Journal {
    constructor() {
        this.entries = [];
        this.reminders = [];
        this.currentPrompt = '';
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (!this.token) {
            window.location.href = 'index.html';
            return;
        }
        
        this.init();
    }

    async init() {
        console.log('Journal initialized');
        
        // Load data immediately
        this.loadDefaultData();
        
        // Setup all event listeners
        this.setupEventListeners();
        
        // Initialize calendar
        this.initializeCalendar();
        
        // Update dashboard stats
        this.updateDashboardStats();
        
        // Initial display
        this.displayEntries();
        this.displayReminders();
        this.updateStats();
    }

    loadDefaultData() {
        // ONLY 2 VALID ENTRIES - no duplicates
        this.entries = [
            {
                id: 2,
                title: "Morning Walk Thoughts",
                date: "2025-11-18",
                content: "Went for my morning walk today. The weather was perfect - not too hot, not too cold. Saw the neighbor's cat sunbathing on the fence. It made me think about how simple pleasures can bring so much joy.",
                mood: "😌"
            },
            {
                id: 1,
                title: "A Wonderful Day with Family",
                date: "2025-11-17",
                content: "Today was such a beautiful day. My grandchildren came to visit and we spent the afternoon in the garden. They showed me their new toys and we had tea together. It reminded me of when my own children were young.",
                mood: "😊"
            }
        ];

        // Load default reminders
        const today = new Date().toISOString().split('T')[0];
        this.reminders = [
            {
                id: 1,
                title: "Take morning medication",
                date: today,
                time: "09:00",
                completed: false
            },
            {
                id: 2,
                title: "Doctor appointment",
                date: today,
                time: "14:00",
                completed: false
            },
            {
                id: 3,
                title: "Call family member",
                date: today,
                time: "17:00",
                completed: false
            },
            {
                id: 4,
                title: "Evening walk",
                date: today,
                time: "19:00",
                completed: false
            }
        ];

        // Save to localStorage for dashboard
        localStorage.setItem('journalEntries', JSON.stringify(this.entries));
        localStorage.setItem('reminders', JSON.stringify(this.reminders));
    }

    setupEventListeners() {
        // New Entry Button
        this.addListener('newEntryBtn', 'click', () => this.openNewEntryForm());
        
        // Voice Entry Button
        this.addListener('voiceEntryBtn', 'click', () => this.startVoiceEntry());
        
        // Close Form Button
        this.addListener('closeFormBtn', 'click', () => this.closeNewEntryForm());
        
        // Add Reminder Button
        this.addListener('addReminderBtn', 'click', () => this.openReminderModal());
        
        // Cancel buttons
        this.addListener('cancelEntry', 'click', () => this.closeNewEntryForm());
        this.addListener('cancelReminder', 'click', () => this.closeReminderModal());
        
        // Form submissions
        this.addListener('journalForm', 'submit', (e) => this.handleJournalSubmit(e));
        this.addListener('reminderForm', 'submit', (e) => this.handleReminderSubmit(e));
        
        // Filter Buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.displayEntries(btn.dataset.filter);
            });
        });
        
        // Mood Buttons
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const selectedMood = document.getElementById('selectedMood');
                if (selectedMood) selectedMood.value = btn.dataset.mood;
            });
        });
        
        // Modal close buttons
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                closeBtn.closest('.modal').style.display = 'none';
            });
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });
        
        // Calendar navigation
        this.addListener('prevMonth', 'click', () => this.navigateCalendar(-1));
        this.addListener('nextMonth', 'click', () => this.navigateCalendar(1));
    }

    addListener(id, event, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, handler);
        }
    }

    displayEntries(filter = 'all') {
        const entriesList = document.getElementById('entriesList');
        if (!entriesList) return;
        
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

        // Sort by date (newest first)
        filteredEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Clear and populate list
        entriesList.innerHTML = '';

        if (filteredEntries.length === 0) {
            entriesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3>No journal entries found</h3>
                    <p>Start writing your first journal entry!</p>
                    <button class="action-btn primary" onclick="journal.openNewEntryForm()">
                        Write Your First Entry
                    </button>
                </div>
            `;
            return;
        }

        filteredEntries.forEach(entry => {
            const entryCard = this.createEntryCard(entry);
            entriesList.appendChild(entryCard);
        });
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
        const today = new Date().toISOString().split('T')[0];
        const todayReminders = this.reminders.filter(reminder => reminder.date === today);
        const remindersList = document.getElementById('remindersList');
        
        if (!remindersList) return;
        
        // Update count
        const remindersCount = document.getElementById('remindersCount');
        if (remindersCount) {
            remindersCount.textContent = todayReminders.length;
        }
        
        // Clear and populate list
        remindersList.innerHTML = '';

        if (todayReminders.length === 0) {
            remindersList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⏰</div>
                    <p>No reminders for today</p>
                </div>
            `;
            return;
        }

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
    }

    initializeCalendar() {
        this.currentCalendarDate = new Date();
        this.updateCalendar(this.currentCalendarDate);
    }

    navigateCalendar(direction) {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + direction);
        this.updateCalendar(this.currentCalendarDate);
    }

    updateCalendar(date) {
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        
        const currentMonth = document.getElementById('currentMonth');
        if (currentMonth) {
            currentMonth.textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        }
        
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const startingDay = firstDay.getDay();
        const monthLength = lastDay.getDate();
        
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) return;
        
        calendarGrid.innerHTML = '';
        
        // Day headers
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day header';
            dayElement.textContent = day;
            calendarGrid.appendChild(dayElement);
        });
        
        // Empty cells before first day
        for (let i = 0; i < startingDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyDay);
        }
        
        // Days of the month
        const today = new Date();
        const currentToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        for (let day = 1; day <= monthLength; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
            
            // Check if today
            if (currentDate.getTime() === currentToday.getTime()) {
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

    showEntriesForDate(date) {
        const dateEntries = this.entries.filter(entry => entry.date === date);
        
        if (dateEntries.length > 0) {
            // Show all entries and scroll to matching ones
            const activeFilter = document.querySelector('.filter-btn.active');
            const currentFilter = activeFilter ? activeFilter.dataset.filter : 'all';
            this.displayEntries(currentFilter);
            
            setTimeout(() => {
                const entryCards = document.querySelectorAll('.entry-card');
                entryCards.forEach(card => {
                    const entryDate = card.querySelector('.entry-date').textContent;
                    if (this.formatDate(date) === entryDate) {
                        card.style.backgroundColor = '#f0f8ff';
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        
                        // Remove highlight after 3 seconds
                        setTimeout(() => {
                            card.style.backgroundColor = '';
                        }, 3000);
                    }
                });
            }, 100);
        } else {
            if (confirm(`No journal entries for ${this.formatDate(date)}. Would you like to create one?`)) {
                this.openNewEntryForm();
                document.getElementById('entryDate').value = date;
            }
        }
    }

    openNewEntryForm() {
        this.showSection('journalFormSection');
        this.hideSection('entriesSection');
        this.hideSection('promptsSection');
        
        document.getElementById('formTitle').textContent = 'New Journal Entry';
        document.getElementById('journalForm').reset();
        document.getElementById('entryDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('selectedMood').value = '';
        
        document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('#journalForm input, #journalForm textarea').forEach(el => el.disabled = false);
        document.querySelectorAll('.mood-btn').forEach(btn => btn.disabled = false);
        
        document.getElementById('cancelEntry').textContent = 'Cancel';
        document.querySelector('#journalForm .btn-primary').style.display = 'block';
        
        delete document.getElementById('journalForm').dataset.editingId;
        
        document.getElementById('entryTitle').focus();
    }

    closeNewEntryForm() {
        this.showSection('entriesSection');
        this.hideSection('journalFormSection');
    }

    openReminderModal() {
        document.getElementById('reminderModal').style.display = 'block';
        document.getElementById('reminderForm').reset();
        document.getElementById('reminderDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('reminderTime').value = '08:00';
    }

    closeReminderModal() {
        document.getElementById('reminderModal').style.display = 'none';
    }

    showSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) section.style.display = 'block';
    }

    hideSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) section.style.display = 'none';
    }

    startVoiceEntry() {
        this.showNotification('Voice entry feature coming soon!', 'info');
    }

    handleJournalSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const editingId = document.getElementById('journalForm').dataset.editingId;
        
        const entryData = {
            title: formData.get('entryTitle'),
            date: formData.get('entryDate'),
            content: formData.get('entryContent'),
            mood: formData.get('selectedMood') || '😊'
        };
        
        if (editingId) {
            // Update entry
            const index = this.entries.findIndex(entry => entry.id == editingId);
            if (index !== -1) {
                this.entries[index] = { ...this.entries[index], ...entryData };
            }
        } else {
            // Create new entry
            const newEntry = {
                id: Date.now(),
                ...entryData
            };
            this.entries.push(newEntry);
        }
        
        // Save to localStorage
        localStorage.setItem('journalEntries', JSON.stringify(this.entries));
        
        this.closeNewEntryForm();
        this.displayEntries();
        this.updateStats();
        this.initializeCalendar();
        this.updateDashboardStats();
        
        this.showNotification(`Journal entry ${editingId ? 'updated' : 'saved'} successfully!`, 'success');
    }

    handleReminderSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const reminder = {
            id: Date.now(),
            title: formData.get('reminderTitle'),
            date: formData.get('reminderDate'),
            time: formData.get('reminderTime'),
            completed: false
        };
        
        this.reminders.push(reminder);
        localStorage.setItem('reminders', JSON.stringify(this.reminders));
        
        this.closeReminderModal();
        this.displayReminders();
        this.updateDashboardStats();
        
        this.showNotification('Reminder added successfully!', 'success');
    }

    toggleReminderCompletion(id) {
        const reminder = this.reminders.find(r => r.id === id);
        if (reminder) {
            reminder.completed = !reminder.completed;
            localStorage.setItem('reminders', JSON.stringify(this.reminders));
            this.displayReminders();
            this.updateDashboardStats();
            
            this.showNotification(`Reminder ${reminder.completed ? 'completed' : 'marked as pending'}!`, 'success');
        }
    }

    viewEntry(id) {
        const entry = this.entries.find(e => e.id === id);
        if (!entry) return;
        
        this.openNewEntryForm();
        document.getElementById('formTitle').textContent = 'View Journal Entry';
        
        this.fillFormWithEntry(entry);
        
        // Disable form for viewing
        document.querySelectorAll('#journalForm input, #journalForm textarea').forEach(el => el.disabled = true);
        document.querySelectorAll('.mood-btn').forEach(btn => btn.disabled = true);
        document.getElementById('cancelEntry').textContent = 'Close';
        document.querySelector('#journalForm .btn-primary').style.display = 'none';
    }

    editEntry(id) {
        const entry = this.entries.find(e => e.id === id);
        if (!entry) return;
        
        this.openNewEntryForm();
        document.getElementById('formTitle').textContent = 'Edit Journal Entry';
        
        this.fillFormWithEntry(entry);
        document.getElementById('journalForm').dataset.editingId = id;
    }

    fillFormWithEntry(entry) {
        document.getElementById('entryDate').value = entry.date;
        document.getElementById('entryTitle').value = entry.title;
        document.getElementById('entryContent').value = entry.content;
        document.getElementById('selectedMood').value = entry.mood;
        
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mood === entry.mood);
        });
    }

    deleteEntry(id) {
        if (!confirm('Are you sure you want to delete this journal entry?')) return;
        
        this.entries = this.entries.filter(entry => entry.id !== id);
        localStorage.setItem('journalEntries', JSON.stringify(this.entries));
        
        this.updateDashboardStats();
        this.displayEntries();
        this.updateStats();
        this.initializeCalendar();
        
        this.showNotification('Journal entry deleted successfully!', 'success');
    }

    updateStats() {
        const totalEntries = document.getElementById('totalEntries');
        const thisWeek = document.getElementById('thisWeek');
        
        if (totalEntries) totalEntries.textContent = this.entries.length;
        if (thisWeek) thisWeek.textContent = this.calculateWeeklyCount();
    }

    calculateWeeklyCount() {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return this.entries.filter(entry => entry.date >= oneWeekAgo).length;
    }

    updateDashboardStats() {
        const journalCount = this.entries.length;
        const weeklyCount = this.calculateWeeklyCount();
        const today = new Date().toISOString().split('T')[0];
        const reminderCount = this.reminders.filter(r => r.date === today && !r.completed).length;
        
        localStorage.setItem('journalCount', journalCount.toString());
        localStorage.setItem('weeklyCount', weeklyCount.toString());
        localStorage.setItem('reminderCount', reminderCount.toString());
        
        // Trigger storage event for dashboard update
        window.dispatchEvent(new Event('storage'));
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    formatTime(timeString) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    showNotification(message, type) {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 0;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 400px;
            min-width: 300px;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .notification-content {
                padding: 1rem 1.5rem;
                display: flex;
                justify-content: between;
                align-items: center;
            }
            .notification-message {
                flex: 1;
                font-weight: 600;
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                margin-left: 1rem;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.journal = new Journal();
});

// Make journal globally available
if (typeof window !== 'undefined') {
    window.Journal = Journal;
}
