// Journal JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize journal
    initJournal();
    
    // Load sample data
    loadSampleData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize calendar
    initializeCalendar();
});

function initJournal() {
    console.log('Journal initialized');
    
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
}

function loadSampleData() {
    // Clear any existing sample data to ensure fresh load
    if (!localStorage.getItem('journalDataLoaded')) {
        localStorage.removeItem('journalEntries');
        localStorage.removeItem('reminders');
    }

    // Sample journal entries
    const sampleEntries = [
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

    // Sample reminders - Fixed to have 4 reminders with correct times
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
            time: "19:00",
            completed: false
        },
        {
            id: 4,
            title: "Evening walk",
            date: new Date().toISOString().split('T')[0],
            time: "20:00",
            completed: false
        }
    ];

    // Store in localStorage if not already present
    const existingEntries = JSON.parse(localStorage.getItem('journalEntries')) || [];
    const existingReminders = JSON.parse(localStorage.getItem('reminders')) || [];
    
    if (existingEntries.length === 0) {
        localStorage.setItem('journalEntries', JSON.stringify(sampleEntries));
        console.log('Loaded sample journal entries');
    }
    
    if (existingReminders.length === 0) {
        localStorage.setItem('reminders', JSON.stringify(sampleReminders));
        console.log('Loaded sample reminders');
    }

    // Mark that we've loaded sample data
    localStorage.setItem('journalDataLoaded', 'true');

    displayEntries();
    displayReminders();
    updateStats();
}

function displayEntries(filter = 'all') {
    const entries = JSON.parse(localStorage.getItem('journalEntries')) || [];
    const entriesList = document.getElementById('entriesList');
    
    // Filter entries
    const today = new Date().toISOString().split('T')[0];
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    let filteredEntries = entries;
    
    switch(filter) {
        case 'today':
            filteredEntries = entries.filter(entry => entry.date === today);
            break;
        case 'week':
            filteredEntries = entries.filter(entry => entry.date >= oneWeekAgo);
            break;
        case 'month':
            filteredEntries = entries.filter(entry => entry.date >= oneMonthAgo);
            break;
    }

    // Clear list
    entriesList.innerHTML = '';

    // Add entry cards
    filteredEntries.forEach(entry => {
        const entryCard = createEntryCard(entry);
        entriesList.appendChild(entryCard);
    });

    // Show empty state if no entries
    if (filteredEntries.length === 0) {
        entriesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>No journal entries found</h3>
                <p>Start writing your first journal entry to capture your thoughts and memories!</p>
                <button class="action-btn primary" onclick="openNewEntryForm()">
                    Write Your First Entry
                </button>
            </div>
        `;
    }
}

function createEntryCard(entry) {
    const card = document.createElement('div');
    card.className = 'entry-card';
    card.innerHTML = `
        <div class="entry-header">
            <h3 class="entry-title">${entry.title}</h3>
            <div class="entry-date">${formatDate(entry.date)}</div>
        </div>
        <div class="entry-content">${entry.content}</div>
        <div class="entry-footer">
            <div class="entry-mood">${entry.mood}</div>
            <div class="entry-actions">
                <button class="entry-btn edit" onclick="editEntry(${entry.id})">Edit</button>
                <button class="entry-btn delete" onclick="deleteEntry(${entry.id})">Delete</button>
            </div>
        </div>
    `;
    
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.entry-actions')) {
            viewEntry(entry.id);
        }
    });
    
    return card;
}

function displayReminders() {
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
            <div class="reminder-time">${formatTime(reminder.time)}</div>
            <div class="reminder-text">${reminder.title}</div>
            <div class="reminder-status ${reminder.completed ? 'completed' : 'pending'}">
                ${reminder.completed ? 'Done' : 'Pending'}
            </div>
        `;
        
        reminderItem.addEventListener('click', () => {
            toggleReminderCompletion(reminder.id);
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
}

function formatTime(timeString) {
    // Convert 24-hour format to 12-hour format with AM/PM
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
}

function setupEventListeners() {
    // New Entry Button
    document.getElementById('newEntryBtn').addEventListener('click', openNewEntryForm);
    
    // Voice Entry Button
    document.getElementById('voiceEntryBtn').addEventListener('click', startVoiceEntry);
    
    // Prompts Button - Show prompts in main content area
    document.getElementById('promptsBtn').addEventListener('click', openPromptsSection);
    
    // Close Form Button
    document.getElementById('closeFormBtn').addEventListener('click', closeNewEntryForm);
    
    // Close Prompts Button
    document.getElementById('closePromptsBtn').addEventListener('click', closePromptsSection);
    
    // Filter Buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            displayEntries(this.dataset.filter);
        });
    });
    
    // Add Reminder Button
    document.getElementById('addReminderBtn').addEventListener('click', openReminderModal);
    
    // Use Prompt Buttons
    document.querySelectorAll('.use-prompt-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            usePrompt(this.dataset.prompt);
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
    document.getElementById('journalForm').addEventListener('submit', handleJournalSubmit);
    document.getElementById('reminderForm').addEventListener('submit', handleReminderSubmit);
    
    // Cancel buttons
    document.getElementById('cancelEntry').addEventListener('click', closeNewEntryForm);
    document.getElementById('cancelReminder').addEventListener('click', closeReminderModal);
    
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

    // Add reset button for development
    addResetButton();
}

function addResetButton() {
    // Add a hidden reset button for development
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset Data';
    resetBtn.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: #ff6b6b;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 5px;
        cursor: pointer;
        z-index: 1000;
        opacity: 0.3;
    `;
    resetBtn.addEventListener('click', function() {
        localStorage.removeItem('journalEntries');
        localStorage.removeItem('reminders');
        localStorage.removeItem('journalDataLoaded');
        location.reload();
    });
    document.body.appendChild(resetBtn);
}

function initializeCalendar() {
    const currentDate = new Date();
    updateCalendar(currentDate);
    
    // Navigation buttons
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar(currentDate);
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar(currentDate);
    });
}

function updateCalendar(date) {
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
    const entries = JSON.parse(localStorage.getItem('journalEntries')) || [];
    
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
        const hasEntry = entries.some(entry => entry.date === dateString);
        
        if (hasEntry) {
            dayElement.classList.add('has-entry');
        }
        
        dayElement.textContent = day;
        dayElement.addEventListener('click', () => {
            showEntriesForDate(dateString);
        });
        
        calendarGrid.appendChild(dayElement);
    }
}

function showEntriesForDate(date) {
    const entries = JSON.parse(localStorage.getItem('journalEntries')) || [];
    const dateEntries = entries.filter(entry => entry.date === date);
    
    if (dateEntries.length > 0) {
        // Filter to show entries for this date
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        displayEntries('all'); // Reset to show all, then we'll manually filter
        
        // Highlight and scroll to entries for this date
        setTimeout(() => {
            const entryCards = document.querySelectorAll('.entry-card');
            entryCards.forEach(card => {
                const entryDate = card.querySelector('.entry-date').textContent;
                if (formatDate(date) === entryDate) {
                    card.style.background = '#f0f8f4';
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }, 100);
    } else {
        // No entries for this date, offer to create one
        if (confirm(`No journal entries for ${formatDate(date)}. Would you like to create one?`)) {
            openNewEntryForm();
            document.getElementById('entryDate').value = date;
        }
    }
}

function openNewEntryForm() {
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

function closeNewEntryForm() {
    // Show entries section
    document.getElementById('entriesSection').style.display = 'block';
    // Hide form section
    document.getElementById('journalFormSection').style.display = 'none';
}

function openReminderModal() {
    const modal = document.getElementById('reminderModal');
    const form = document.getElementById('reminderForm');
    
    form.reset();
    document.getElementById('reminderDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('reminderTime').value = '08:00';
    
    modal.style.display = 'block';
}

function closeReminderModal() {
    document.getElementById('reminderModal').style.display = 'none';
}

function openPromptsSection() {
    // Hide entries section and form section
    document.getElementById('entriesSection').style.display = 'none';
    document.getElementById('journalFormSection').style.display = 'none';
    // Show prompts section
    document.getElementById('promptsSection').style.display = 'block';
}

function closePromptsSection() {
    // Show entries section
    document.getElementById('entriesSection').style.display = 'block';
    // Hide prompts section
    document.getElementById('promptsSection').style.display = 'none';
}

function usePrompt(prompt) {
    // Close prompts and open form with the selected prompt
    closePromptsSection();
    openNewEntryForm();
    document.getElementById('entryContent').value = prompt;
    document.getElementById('entryContent').focus();
}

function startVoiceEntry() {
    showNotification('Voice entry feature coming soon!', 'info');
}

function handleJournalSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const editingId = document.getElementById('journalForm').dataset.editingId;
    
    let entry;
    let entries = JSON.parse(localStorage.getItem('journalEntries')) || [];
    
    if (editingId) {
        // Update existing entry
        entry = entries.find(e => e.id == editingId);
        if (entry) {
            entry.title = formData.get('entryTitle');
            entry.date = formData.get('entryDate');
            entry.content = formData.get('entryContent');
            entry.mood = formData.get('selectedMood') || '😊';
        }
    } else {
        // Create new entry
        entry = {
            id: Date.now(),
            title: formData.get('entryTitle'),
            date: formData.get('entryDate'),
            content: formData.get('entryContent'),
            mood: formData.get('selectedMood') || '😊'
        };
        entries.push(entry);
    }
    
    // Save to localStorage
    localStorage.setItem('journalEntries', JSON.stringify(entries));
    
    // Update dashboard stats
    if (typeof window.dashboardFunctions !== 'undefined') {
        window.dashboardFunctions.addJournalEntry();
    }
    
    // Close form and show entries
    closeNewEntryForm();
    
    // Refresh display
    displayEntries();
    updateStats();
    initializeCalendar();
    
    // Show success message
    showNotification(`Journal entry ${editingId ? 'updated' : 'saved'} successfully!`, 'success');
}

function handleReminderSubmit(e) {
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
    
    // Save to localStorage
    const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
    reminders.push(reminder);
    localStorage.setItem('reminders', JSON.stringify(reminders));
    
    // Close modal
    closeReminderModal();
    
    // Refresh display
    displayReminders();
    updateStats();
    
    // Show success message
    showNotification('Reminder added successfully!', 'success');
}

function toggleReminderCompletion(id) {
    const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
    const reminder = reminders.find(r => r.id === id);
    
    if (reminder) {
        reminder.completed = !reminder.completed;
        localStorage.setItem('reminders', JSON.stringify(reminders));
        displayReminders();
        
        showNotification(`Reminder ${reminder.completed ? 'completed' : 'marked as pending'}!`, 'success');
    }
}

function viewEntry(id) {
    const entries = JSON.parse(localStorage.getItem('journalEntries')) || [];
    const entry = entries.find(e => e.id === id);
    
    if (entry) {
        openNewEntryForm();
        
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

function editEntry(id) {
    const entries = JSON.parse(localStorage.getItem('journalEntries')) || [];
    const entry = entries.find(e => e.id === id);
    
    if (entry) {
        openNewEntryForm();
        
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

function deleteEntry(id) {
    if (confirm('Are you sure you want to delete this journal entry?')) {
        const entries = JSON.parse(localStorage.getItem('journalEntries')) || [];
        const filteredEntries = entries.filter(entry => entry.id !== id);
        localStorage.setItem('journalEntries', JSON.stringify(filteredEntries));
        
        displayEntries();
        updateStats();
        initializeCalendar();
        
        showNotification('Journal entry deleted successfully!', 'success');
    }
}

function updateStats() {
    const entries = JSON.parse(localStorage.getItem('journalEntries')) || [];
    const today = new Date().toISOString().split('T')[0];
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    document.getElementById('totalEntries').textContent = entries.length;
    document.getElementById('thisWeek').textContent = entries.filter(entry => entry.date >= oneWeekAgo).length;
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function showNotification(message, type) {
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
        ${type === 'success' ? 'background: #4ecdc4;' : 'background: #a8d0e6;'}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
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

// Debug function to check current data
function debugData() {
    console.log('Journal Entries:', JSON.parse(localStorage.getItem('journalEntries')) || []);
    console.log('Reminders:', JSON.parse(localStorage.getItem('reminders')) || []);
}

// Call debug on load for troubleshooting
setTimeout(debugData, 1000);