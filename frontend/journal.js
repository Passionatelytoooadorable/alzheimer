// Journal JavaScript with Live Backend API Integration
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
        
        // Load data from backend
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
            const response = await fetch(`${API_BASE}/journals`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch journals');
            }
            
            const data = await response.json();
            this.entries = data.journals || [];
            
            // Transform backend data to match frontend format
            this.entries = this.entries.map(entry => ({
                id: entry.id,
                title: entry.title || 'Untitled Entry',
                date: new Date(entry.created_at).toISOString().split('T')[0],
                content: entry.content,
                mood: this.convertMoodToEmoji(entry.mood)
            }));
            
            console.log('Loaded journals from backend:', this.entries);
            
            // Load reminders (using localStorage for now as per original)
            this.loadReminders();
            
            this.displayEntries();
            this.updateStats();
            
        } catch (error) {
            console.error('Failed to load journal data:', error);
            // Fallback to localStorage if backend fails
            this.loadFromLocalStorage();
        }
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

    loadFromLocalStorage() {
        const localEntries = JSON.parse(localStorage.getItem('journalEntries')) || [];
        if (localEntries.length > 0) {
            this.entries = localEntries;
            this.displayEntries();
            this.updateStats();
        } else {
            // Show empty state
            this.displayEntries();
        }
    }

    loadReminders() {
        // Load reminders from localStorage (as per original functionality)
        const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
        
        // Sample reminders if none exist
        if (reminders.length === 0) {
            const sampleReminders = [
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
            localStorage.setItem('reminders', JSON.stringify(sampleReminders));
        }
        
        this.displayReminders();
    }

    setupEventListeners() {
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

        // Listen for storage updates
        window.addEventListener('storage', (e) => {
            if (e.key === 'journalCount' || e.key === 'weeklyCount') {
                this.updateStats();
            }
        });
    }

    displayEntries(filter = 'all') {
        const entriesList = document.getElementById('entriesList');
        
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
    }

    createEntryCard(entry) {
        const card = document.createElement('div');
        card.className = 'entry-card';
        card.innerHTML = `
            <div class="entry-header">
                <h3 class="entry-title">${entry.title}</h3>
                <div class="entry-date">${this.formatDate(entry.date)}</div>
            </div>
            <div class="entry-content">${entry.content}</div>
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
        const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
        const today = new Date().toISOString().split('T')[0];
        const todayReminders = reminders.filter(reminder => reminder.date === today);
        const remindersList = document.getElementById('remindersList');
        
        // Update count
        document.getElementById('remindersCount').textContent = todayReminders.length;
        
        // Clear list
        remindersList.innerHTML = '';
        
        // Add reminder items
        todayReminders.forEach(reminder => {
            const reminderItem = document.createElement('div');
            reminderItem.className = 'reminder-item';
            reminderItem.innerHTML = `
                <div class="reminder-time">${this.formatTime(reminder.time)}</div>
                <div class="reminder-text">${reminder.title}</div>
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
    }

    formatTime(timeString) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    initializeCalendar() {
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

    showEntriesForDate(date) {
        const dateEntries = this.entries.filter(entry => entry.date === date);
        
        if (dateEntries.length > 0) {
            // Filter to show entries for this date
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            this.displayEntries('all');
            
            // Highlight and scroll to entries for this date
            setTimeout(() => {
                const entryCards = document.querySelectorAll('.entry-card');
                entryCards.forEach(card => {
                    const entryDate = card.querySelector('.entry-date').textContent;
                    if (this.formatDate(date) === entryDate) {
                        card.style.background = '#f0f8f4';
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });
            }, 100);
        } else {
            // No entries for this date, offer to create one
            if (confirm(`No journal entries for ${this.formatDate(date)}. Would you like to create one?`)) {
                this.openNewEntryForm();
                document.getElementById('entryDate').value = date;
            }
        }
    }

    openNewEntryForm() {
        // Hide entries section and prompts section
        document.getElementById('entriesSection').style.display = 'none';
        document.getElementById('promptsSection').style.display = 'none';
        // Show form section
        document.getElementById('journalFormSection').style.display = 'block';
        
        // Reset form
        document.getElementById('formTitle').textContent = 'New Journal Entry';
        document.getElementById('journalForm').reset();
        document.getElementById('entryDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('selectedMood').value = '';
        document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
        
        // Enable form for new entry
        document.querySelectorAll('#journalForm input, #journalForm textarea').forEach(element => {
            element.disabled = false;
        });
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.disabled = false;
        });
        document.getElementById('cancelEntry').textContent = 'Cancel';
        document.querySelector('.btn-primary').style.display = 'block';
        
        // Clear any editing state
        delete document.getElementById('journalForm').dataset.editingId;
        
        // Focus on title field
        document.getElementById('entryTitle').focus();
    }

    closeNewEntryForm() {
        // Show entries section
        document.getElementById('entriesSection').style.display = 'block';
        // Hide form section
        document.getElementById('journalFormSection').style.display = 'none';
    }

    openReminderModal() {
        const modal = document.getElementById('reminderModal');
        const form = document.getElementById('reminderForm');
        
        form.reset();
        document.getElementById('reminderDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('reminderTime').value = '08:00';
        
        modal.style.display = 'block';
    }

    closeReminderModal() {
        document.getElementById('reminderModal').style.display = 'none';
    }

    openPromptsSection() {
        // Hide entries section and form section
        document.getElementById('entriesSection').style.display = 'none';
        document.getElementById('journalFormSection').style.display = 'none';
        // Show prompts section
        document.getElementById('promptsSection').style.display = 'block';
    }

    closePromptsSection() {
        // Show entries section
        document.getElementById('entriesSection').style.display = 'block';
        // Hide prompts section
        document.getElementById('promptsSection').style.display = 'none';
    }

    usePrompt(prompt) {
        // Close prompts and open form with the selected prompt
        this.closePromptsSection();
        this.openNewEntryForm();
        document.getElementById('entryContent').value = prompt;
        document.getElementById('entryContent').focus();
    }

    startVoiceEntry() {
        this.showNotification('Voice entry feature coming soon!', 'info');
    }

    async handleJournalSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const editingId = document.getElementById('journalForm').dataset.editingId;
        
        const entryData = {
            title: formData.get('entryTitle'),
            date: formData.get('entryDate'),
            content: formData.get('entryContent'),
            mood: this.convertEmojiToMood(formData.get('selectedMood') || '😊')
        };
        
        try {
            if (editingId) {
                // Update existing entry
                await this.updateJournalEntry(editingId, entryData);
            } else {
                // Create new entry
                await this.createJournalEntry(entryData);
            }
            
            // Close form and show entries
            this.closeNewEntryForm();
            
            // Refresh display
            await this.loadJournalData();
            this.initializeCalendar();
            
            // Show success message
            this.showNotification(`Journal entry ${editingId ? 'updated' : 'saved'} successfully!`, 'success');
            
        } catch (error) {
            console.error('Failed to save journal entry:', error);
            this.showNotification('Failed to save journal entry. Please try again.', 'error');
        }
    }

    async createJournalEntry(entryData) {
        const response = await fetch(`${API_BASE}/journals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({
                title: entryData.title,
                content: entryData.content,
                mood: entryData.mood
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create journal entry');
        }
        
        const result = await response.json();
        return result;
    }

    async updateJournalEntry(id, entryData) {
        const response = await fetch(`${API_BASE}/journals/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({
                title: entryData.title,
                content: entryData.content,
                mood: entryData.mood
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update journal entry');
        }
        
        const result = await response.json();
        return result;
    }

    async deleteJournalEntry(id) {
        const response = await fetch(`${API_BASE}/journals/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete journal entry');
        }
        
        return true;
    }

    updateDashboardStats() {
        const journalCount = this.entries.length;
        const weeklyCount = this.calculateWeeklyCount();
        
        // Update localStorage for dashboard sync
        localStorage.setItem('journalCount', journalCount.toString());
        localStorage.setItem('weeklyCount', weeklyCount.toString());
        
        // Get reminder count for today
        const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
        const today = new Date().toISOString().split('T')[0];
        const todayReminders = reminders.filter(reminder => reminder.date === today);
        localStorage.setItem('reminderCount', todayReminders.length.toString());
        
        // Dispatch events to update dashboard
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'journalCount',
            newValue: journalCount.toString()
        }));
        
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'weeklyCount', 
            newValue: weeklyCount.toString()
        }));
        
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'reminderCount',
            newValue: todayReminders.length.toString()
        }));
    }

    calculateWeeklyCount() {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const weeklyEntries = this.entries.filter(entry => entry.date >= oneWeekAgo);
        return weeklyEntries.length;
    }

    handleReminderSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const reminder = {
            id: Date.now(),
            title: formData.get('reminderTitle'),
            date: formData.get('reminderDate'),
            time: formData.get('reminderTime'),
            repeat: formData.get('reminderRepeat'),
            completed: false,
            type: 'normal'
        };
        
        // Save to shared localStorage
        const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
        reminders.push(reminder);
        localStorage.setItem('reminders', JSON.stringify(reminders));
        
        // Close modal
        this.closeReminderModal();
        
        // Refresh display
        this.displayReminders();
        this.updateStats();
        
        // Update dashboard stats
        this.updateDashboardStats();
        
        // Show success message
        this.showNotification('Reminder added successfully!', 'success');
    }

    toggleReminderCompletion(id) {
        const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
        const reminder = reminders.find(r => r.id === id);
        
        if (reminder) {
            reminder.completed = !reminder.completed;
            localStorage.setItem('reminders', JSON.stringify(reminders));
            this.displayReminders();
            
            this.showNotification(`Reminder ${reminder.completed ? 'completed' : 'marked as pending'}!`, 'success');
            
            // Update dashboard stats
            this.updateDashboardStats();
        }
    }

    viewEntry(id) {
        const entry = this.entries.find(e => e.id === id);
        
        if (entry) {
            this.openNewEntryForm();
            
            // Update form title
            document.getElementById('formTitle').textContent = 'View Journal Entry';
            
            // Fill form with entry data
            document.getElementById('entryDate').value = entry.date;
            document.getElementById('entryTitle').value = entry.title;
            document.getElementById('entryContent').value = entry.content;
            document.getElementById('selectedMood').value = entry.mood;
            
            // Set active mood button
            document.querySelectorAll('.mood-btn').forEach(btn => {
                if (btn.dataset.mood === entry.mood) {
                    btn.classList.add('active');
                }
            });
            
            // Disable form for viewing
            document.querySelectorAll('#journalForm input, #journalForm textarea').forEach(element => {
                element.disabled = true;
            });
            document.querySelectorAll('.mood-btn').forEach(btn => {
                btn.disabled = true;
            });
            document.getElementById('cancelEntry').textContent = 'Close';
            document.querySelector('.btn-primary').style.display = 'none';
        }
    }

    editEntry(id) {
        const entry = this.entries.find(e => e.id === id);
        
        if (entry) {
            this.openNewEntryForm();
            
            // Update form title
            document.getElementById('formTitle').textContent = 'Edit Journal Entry';
            
            // Fill form with entry data
            document.getElementById('entryDate').value = entry.date;
            document.getElementById('entryTitle').value = entry.title;
            document.getElementById('entryContent').value = entry.content;
            document.getElementById('selectedMood').value = entry.mood;
            
            // Set active mood button
            document.querySelectorAll('.mood-btn').forEach(btn => {
                if (btn.dataset.mood === entry.mood) {
                    btn.classList.add('active');
                }
            });
            
            // Store the ID for updating
            document.getElementById('journalForm').dataset.editingId = id;
        }
    }

    async deleteEntry(id) {
        if (confirm('Are you sure you want to delete this journal entry?')) {
            try {
                await this.deleteJournalEntry(id);
                
                // Update dashboard stats after deletion
                this.updateDashboardStats();
                
                // Refresh data
                await this.loadJournalData();
                this.initializeCalendar();
                
                this.showNotification('Journal entry deleted successfully!', 'success');
            } catch (error) {
                console.error('Failed to delete journal entry:', error);
                this.showNotification('Failed to delete journal entry. Please try again.', 'error');
            }
        }
    }

    updateStats() {
        document.getElementById('totalEntries').textContent = this.entries.length;
        const weeklyCount = this.calculateWeeklyCount();
        document.getElementById('thisWeek').textContent = weeklyCount;
        
        // Also update localStorage for dashboard sync
        localStorage.setItem('weeklyCount', weeklyCount.toString());
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
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
    journal = new Journal();
});

// Debug function to check current data
function debugData() {
    console.log('Journal Entries:', journal.entries);
    console.log('Reminders:', JSON.parse(localStorage.getItem('reminders')) || []);
    console.log('Journal Count in localStorage:', localStorage.getItem('journalCount'));
    console.log('Weekly Count in localStorage:', localStorage.getItem('weeklyCount'));
}
