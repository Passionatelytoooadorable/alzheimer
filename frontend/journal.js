const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

class Journal {
    constructor() {
        this.entries = [];
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
        
        // FIRST: Always create and show default entries immediately
        await this.createAndShowDefaultEntries();
        
        // THEN: Setup everything else
        this.setupEventListeners();
        this.initializeCalendar();
        this.loadReminders();
        this.updateDashboardStats();
    }

    async createAndShowDefaultEntries() {
        console.log('Creating default entries...');
        
        // First try to load from backend
        try {
            const response = await fetch(`${API_BASE}/journals`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.entries = data.journals || [];
                
                // Transform to frontend format
                this.entries = this.entries.map(entry => ({
                    id: entry.id,
                    title: entry.title || 'Untitled Entry',
                    date: new Date(entry.created_at).toISOString().split('T')[0],
                    content: entry.content,
                    mood: this.convertMoodToEmoji(entry.mood)
                }));
                
                console.log('Loaded from backend:', this.entries.length, 'entries');
            }
        } catch (error) {
            console.error('Backend failed, using local storage:', error);
            // Load from localStorage if backend fails
            const localEntries = JSON.parse(localStorage.getItem('journalEntries')) || [];
            this.entries = localEntries;
        }

        // If no entries exist, CREATE THEM RIGHT NOW
        if (this.entries.length === 0) {
            console.log('No entries found, creating default entries immediately...');
            
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
            
            // Save to localStorage immediately
            localStorage.setItem('journalEntries', JSON.stringify(defaultEntries));
            this.entries = defaultEntries;
            
            console.log('Default entries created and saved to localStorage');
            
            // Try to save to backend too (but don't wait for it)
            this.saveDefaultsToBackend(defaultEntries);
        }

        // DISPLAY THE ENTRIES IMMEDIATELY
        this.displayEntries();
        this.updateStats();
        console.log('Entries displayed:', this.entries);
    }

    async saveDefaultsToBackend(defaultEntries) {
        // Try to save defaults to backend in background
        for (const entry of defaultEntries) {
            try {
                await fetch(`${API_BASE}/journals`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify({
                        title: entry.title,
                        content: entry.content,
                        mood: this.convertEmojiToMood(entry.mood)
                    })
                });
            } catch (error) {
                console.log('Backend save failed for entry, but local copy exists');
            }
        }
    }

    convertMoodToEmoji(mood) {
        const moodMap = {
            'happy': '😊',
            'calm': '😌', 
            'sad': '😢',
            'frustrated': '😠',
            'tired': '😴'
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
        let reminders = JSON.parse(localStorage.getItem('reminders')) || [];
        
        // Create default reminders if none exist
        if (reminders.length === 0) {
            console.log('Creating default reminders...');
            reminders = [
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
            localStorage.setItem('reminders', JSON.stringify(reminders));
            console.log('Default reminders created');
        }
        
        this.displayReminders();
    }

    setupEventListeners() {
        // Button events
        document.getElementById('newEntryBtn').addEventListener('click', () => this.openNewEntryForm());
        document.getElementById('voiceEntryBtn').addEventListener('click', () => this.startVoiceEntry());
        document.getElementById('promptsBtn').addEventListener('click', () => this.openPromptsSection());
        document.getElementById('closeFormBtn').addEventListener('click', () => this.closeNewEntryForm());
        document.getElementById('closePromptsBtn').addEventListener('click', () => this.closePromptsSection());
        document.getElementById('addReminderBtn').addEventListener('click', () => this.openReminderModal());
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                journal.displayEntries(this.dataset.filter);
            });
        });

        // Prompt buttons
        document.querySelectorAll('.use-prompt-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                journal.usePrompt(this.dataset.prompt);
            });
        });

        // Mood buttons
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

        // Modal close
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.addEventListener('click', function() {
                this.closest('.modal').style.display = 'none';
            });
        });

        window.addEventListener('click', function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });
    }

    displayEntries(filter = 'all') {
        const entriesList = document.getElementById('entriesList');
        if (!entriesList) {
            console.error('entriesList not found!');
            return;
        }

        console.log('Displaying entries:', this.entries);

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

        entriesList.innerHTML = '';

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
        
        if (!remindersList) {
            console.error('remindersList not found!');
            return;
        }

        // Update count
        document.getElementById('remindersCount').textContent = todayReminders.length;
        
        remindersList.innerHTML = '';
        
        if (todayReminders.length === 0) {
            remindersList.innerHTML = `
                <div class="empty-state" style="padding: 1rem;">
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
    }

    formatTime(timeString) { 
        const [hours, minutes] = timeString.split(':'); 
        const hour = parseInt(hours); 
        const ampm = hour >= 12 ? 'PM' : 'AM'; 
        return `${hours}:${minutes} ${ampm}`; 
    }

    initializeCalendar() {
        const currentDate = new Date();
        this.updateCalendar(currentDate);
        
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
        
        // Empty days
        for (let i = 0; i < startingDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day';
            calendarGrid.appendChild(emptyDay);
        }
        
        // Month days
        const today = new Date();
        
        for (let day = 1; day <= monthLength; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            if (date.getFullYear() === today.getFullYear() && 
                date.getMonth() === today.getMonth() && 
                day === today.getDate()) {
                dayElement.classList.add('today');
            }
            
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

    updateStats() {
        document.getElementById('totalEntries').textContent = this.entries.length;
        const weeklyCount = this.calculateWeeklyCount();
        document.getElementById('thisWeek').textContent = weeklyCount;
        localStorage.setItem('weeklyCount', weeklyCount.toString());
    }

    calculateWeeklyCount() {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return this.entries.filter(entry => entry.date >= oneWeekAgo).length;
    }

    updateDashboardStats() {
        const journalCount = this.entries.length;
        const weeklyCount = this.calculateWeeklyCount();
        const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
        const today = new Date().toISOString().split('T')[0];
        const todayReminders = reminders.filter(reminder => reminder.date === today);
        
        localStorage.setItem('journalCount', journalCount.toString());
        localStorage.setItem('weeklyCount', weeklyCount.toString());
        localStorage.setItem('reminderCount', todayReminders.length.toString());
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
        setTimeout(() => notification.remove(), 3000);
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('journalEntries'); 
        window.location.href = 'index.html';
    }

    // UI Methods
    openNewEntryForm() {
        document.getElementById('entriesSection').style.display = 'none';
        document.getElementById('promptsSection').style.display = 'none';
        document.getElementById('journalFormSection').style.display = 'block';
        
        document.getElementById('formTitle').textContent = 'New Journal Entry';
        document.getElementById('journalForm').reset();
        document.getElementById('entryDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('selectedMood').value = '';
        document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
        
        delete document.getElementById('journalForm').dataset.editingId;
        document.getElementById('entryTitle').focus();
    }

    closeNewEntryForm() {
        document.getElementById('entriesSection').style.display = 'block';
        document.getElementById('journalFormSection').style.display = 'none';
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

    openPromptsSection() {
        document.getElementById('entriesSection').style.display = 'none';
        document.getElementById('journalFormSection').style.display = 'none';
        document.getElementById('promptsSection').style.display = 'block';
    }

    closePromptsSection() {
        document.getElementById('entriesSection').style.display = 'block';
        document.getElementById('promptsSection').style.display = 'none';
    }

    usePrompt(prompt) {
        this.closePromptsSection();
        this.openNewEntryForm();
        document.getElementById('entryContent').value = prompt;
        document.getElementById('entryContent').focus();
    }

    startVoiceEntry() {
        this.showNotification('Voice entry feature coming soon!', 'info');
    }

    // Form Handlers
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
                await this.updateJournalEntry(editingId, entryData);
            } else {
                await this.createJournalEntry(entryData);
            }
            
            this.closeNewEntryForm();
            await this.reloadEntries();
            this.initializeCalendar();
            
            this.showNotification(`Journal entry ${editingId ? 'updated' : 'saved'} successfully!`, 'success');
            
        } catch (error) {
            console.error('Failed to save journal entry:', error);
            this.showNotification('Failed to save journal entry. Please try again.', 'error');
        }
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
            completed: false
        };
        
        const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
        reminders.push(reminder);
        localStorage.setItem('reminders', JSON.stringify(reminders));
        
        this.closeReminderModal();
        this.displayReminders();
        this.updateStats();
        this.updateDashboardStats();
        
        this.showNotification('Reminder added successfully!', 'success');
    }

    // API Methods
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
        
        if (!response.ok) throw new Error('Failed to create journal entry');
        return await response.json();
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
        
        if (!response.ok) throw new Error('Failed to update journal entry');
        return await response.json();
    }

    async deleteJournalEntry(id) {
        const response = await fetch(`${API_BASE}/journals/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to delete journal entry');
        return true;
    }

    // Other Methods
    toggleReminderCompletion(id) {
        const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
        const reminder = reminders.find(r => r.id === id);
        
        if (reminder) {
            reminder.completed = !reminder.completed;
            localStorage.setItem('reminders', JSON.stringify(reminders));
            this.displayReminders();
            this.updateDashboardStats();
        }
    }

    viewEntry(id) {
        const entry = this.entries.find(e => e.id === id);
        if (!entry) return;

        this.openNewEntryForm();
        document.getElementById('formTitle').textContent = 'View Journal Entry';
        document.getElementById('entryDate').value = entry.date;
        document.getElementById('entryTitle').value = entry.title;
        document.getElementById('entryContent').value = entry.content;
        document.getElementById('selectedMood').value = entry.mood;
        
        document.querySelectorAll('.mood-btn').forEach(btn => {
            if (btn.dataset.mood === entry.mood) btn.classList.add('active');
        });
        
        document.querySelectorAll('#journalForm input, #journalForm textarea').forEach(el => el.disabled = true);
        document.querySelectorAll('.mood-btn').forEach(btn => btn.disabled = true);
        document.getElementById('cancelEntry').textContent = 'Close';
        document.querySelector('.btn-primary').style.display = 'none';
    }

    editEntry(id) {
        const entry = this.entries.find(e => e.id === id);
        if (!entry) return;

        this.openNewEntryForm();
        document.getElementById('formTitle').textContent = 'Edit Journal Entry';
        document.getElementById('entryDate').value = entry.date;
        document.getElementById('entryTitle').value = entry.title;
        document.getElementById('entryContent').value = entry.content;
        document.getElementById('selectedMood').value = entry.mood;
        
        document.querySelectorAll('.mood-btn').forEach(btn => {
            if (btn.dataset.mood === entry.mood) btn.classList.add('active');
        });
        
        document.getElementById('journalForm').dataset.editingId = id;
    }

    async deleteEntry(id) {
        if (!confirm('Are you sure you want to delete this journal entry?')) return;

        try {
            await this.deleteJournalEntry(id);
            await this.reloadEntries();
            this.initializeCalendar();
            this.showNotification('Journal entry deleted successfully!', 'success');
        } catch (error) {
            console.error('Failed to delete journal entry:', error);
            this.showNotification('Failed to delete journal entry. Please try again.', 'error');
        }
    }

    showEntriesForDate(date) {
        const dateEntries = this.entries.filter(entry => entry.date === date);
        
        if (dateEntries.length > 0) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            this.displayEntries('all');
            
            setTimeout(() => {
                document.querySelectorAll('.entry-card').forEach(card => {
                    const entryDate = card.querySelector('.entry-date').textContent;
                    if (this.formatDate(date) === entryDate) {
                        card.style.background = '#f0f8f4';
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

// Initialize when DOM is ready
let journal;
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - starting journal');
    journal = new Journal();
});

// Add notification styles
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

// Debug function to force show defaults
function forceShowDefaults() {
    localStorage.removeItem('journalEntries');
    location.reload();
}

