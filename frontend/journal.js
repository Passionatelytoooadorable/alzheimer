// journal.js - Updated with Calendar and Journal Entries
const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

// Check authentication
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = 'index.html';
}

// Display user info
document.getElementById('user-name').textContent = user.name || 'User';

// Calendar variables
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let journals = [];

// Load journals from backend
async function loadJournals() {
    try {
        const response = await fetch(`${API_BASE}/journals`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        journals = data.journals || [];
        displayJournals(journals);
        updateStats();
        generateCalendar();
    } catch (error) {
        console.error('Failed to load journals:', error);
        // For demo purposes, show sample data
        showSampleData();
    }
}

// Show sample data when backend is unavailable
function showSampleData() {
    const sampleJournals = [
        {
            id: 1,
            title: "Beautiful Morning",
            content: "Today I woke up feeling refreshed and happy. The sun was shining and the birds were singing outside my window.",
            mood: "😊",
            created_at: new Date().toISOString()
        },
        {
            id: 2,
            title: "Family Visit",
            content: "My daughter came to visit today with her children. We had a wonderful time talking about old memories.",
            mood: "😌",
            created_at: new Date(Date.now() - 86400000).toISOString()
        }
    ];
    journals = sampleJournals;
    displayJournals(journals);
    updateStats();
    generateCalendar();
}

// Update statistics
function updateStats() {
    const totalEntries = journals.length;
    const thisWeek = journals.filter(journal => {
        const journalDate = new Date(journal.created_at);
        const oneWeekAgo = new Date(Date.now() - 7 * 86400000);
        return journalDate >= oneWeekAgo;
    }).length;
    
    document.getElementById('totalEntries').textContent = totalEntries;
    document.getElementById('thisWeek').textContent = thisWeek;
}

// Display journals in the entries list
function displayJournals(journalsToShow) {
    const container = document.getElementById('entriesList');
    if (!container) return;
    
    if (journalsToShow.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>No journal entries yet</h3>
                <p>Start writing your thoughts and experiences!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = journalsToShow.map(journal => `
        <div class="entry-card" data-id="${journal.id}">
            <div class="entry-header">
                <h3 class="entry-title">${journal.title || 'Untitled Entry'}</h3>
                <span class="entry-date">${new Date(journal.created_at).toLocaleDateString()}</span>
            </div>
            <div class="entry-content">${journal.content}</div>
            <div class="entry-footer">
                <span class="entry-mood">${journal.mood || '😊'}</span>
                <div class="entry-actions">
                    <button class="entry-btn edit" onclick="editJournal(${journal.id})">Edit</button>
                    <button class="entry-btn delete" onclick="deleteJournal(${journal.id})">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Generate calendar
function generateCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthElement = document.getElementById('currentMonth');
    
    if (!calendarGrid) return;
    
    // Update month display
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    currentMonthElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    // Clear previous calendar
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day header';
        dayElement.textContent = day;
        calendarGrid.appendChild(dayElement);
    });
    
    // Get first day of month and total days
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        // Check if this day has journal entries
        const hasEntry = journals.some(journal => {
            const journalDate = new Date(journal.created_at);
            return journalDate.getDate() === day && 
                   journalDate.getMonth() === currentMonth && 
                   journalDate.getFullYear() === currentYear;
        });
        
        // Check if it's today
        const today = new Date();
        if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            dayElement.classList.add('today');
        }
        
        if (hasEntry) {
            dayElement.classList.add('has-entry');
        }
        
        // Add click event to show entries for that day
        dayElement.addEventListener('click', () => {
            showEntriesForDate(day, currentMonth, currentYear);
        });
        
        calendarGrid.appendChild(dayElement);
    }
}

// Show entries for specific date
function showEntriesForDate(day, month, year) {
    const filteredJournals = journals.filter(journal => {
        const journalDate = new Date(journal.created_at);
        return journalDate.getDate() === day && 
               journalDate.getMonth() === month && 
               journalDate.getFullYear() === year;
    });
    
    if (filteredJournals.length > 0) {
        displayJournals(filteredJournals);
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    } else {
        const container = document.getElementById('entriesList');
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <h3>No entries for this date</h3>
                <p>You haven't written any journal entries for ${month + 1}/${day}/${year}</p>
            </div>
        `;
    }
}

// Filter journals
function filterJournals(filterType) {
    const now = new Date();
    let filteredJournals = [];
    
    switch (filterType) {
        case 'today':
            filteredJournals = journals.filter(journal => {
                const journalDate = new Date(journal.created_at);
                return journalDate.toDateString() === now.toDateString();
            });
            break;
        case 'week':
            const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
            filteredJournals = journals.filter(journal => {
                const journalDate = new Date(journal.created_at);
                return journalDate >= oneWeekAgo;
            });
            break;
        case 'month':
            filteredJournals = journals.filter(journal => {
                const journalDate = new Date(journal.created_at);
                return journalDate.getMonth() === now.getMonth() && 
                       journalDate.getFullYear() === now.getFullYear();
            });
            break;
        default:
            filteredJournals = journals;
    }
    
    displayJournals(filteredJournals);
}

// Add new journal to backend
async function addJournalEntry(title, content, mood = '😊') {
    try {
        const response = await fetch(`${API_BASE}/journals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: title,
                content: content,
                mood: mood
            })
        });
        const result = await response.json();
        
        if (result.journal) {
            alert('Journal entry added successfully!');
            loadJournals(); // Reload all journals
            return result;
        }
        return null;
    } catch (error) {
        console.error('Failed to add journal:', error);
        // For demo purposes, add locally
        const newJournal = {
            id: Date.now(),
            title: title,
            content: content,
            mood: mood,
            created_at: new Date().toISOString()
        };
        journals.unshift(newJournal);
        displayJournals(journals);
        updateStats();
        generateCalendar();
        alert('Journal entry added successfully! (Local storage)');
        return { journal: newJournal };
    }
}

// Edit journal (placeholder)
function editJournal(id) {
    const journal = journals.find(j => j.id === id);
    if (journal) {
        document.getElementById('entryDate').value = new Date(journal.created_at).toISOString().split('T')[0];
        document.getElementById('entryTitle').value = journal.title;
        document.getElementById('entryContent').value = journal.content;
        document.getElementById('selectedMood').value = journal.mood;
        
        // Update mood buttons
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mood === journal.mood) {
                btn.classList.add('active');
            }
        });
        
        showJournalForm();
        alert('Edit functionality will be implemented in the next version.');
    }
}

// Delete journal (placeholder)
function deleteJournal(id) {
    if (confirm('Are you sure you want to delete this journal entry?')) {
        // Remove from local array for demo
        journals = journals.filter(j => j.id !== id);
        displayJournals(journals);
        updateStats();
        generateCalendar();
        alert('Journal entry deleted! (Local demo)');
    }
}

// Show/Hide journal form
function showJournalForm() {
    document.getElementById('entriesSection').style.display = 'none';
    document.getElementById('journalFormSection').style.display = 'block';
    document.getElementById('promptsSection').style.display = 'none';
    
    // Set today's date as default
    document.getElementById('entryDate').value = new Date().toISOString().split('T')[0];
}

function hideJournalForm() {
    document.getElementById('entriesSection').style.display = 'block';
    document.getElementById('journalFormSection').style.display = 'none';
    document.getElementById('promptsSection').style.display = 'none';
}

function showPrompts() {
    document.getElementById('entriesSection').style.display = 'none';
    document.getElementById('journalFormSection').style.display = 'none';
    document.getElementById('promptsSection').style.display = 'block';
}

// Event listeners for UI interactions
document.addEventListener('DOMContentLoaded', function() {
    loadJournals();
    
    // New entry button
    document.getElementById('newEntryBtn').addEventListener('click', showJournalForm);
    
    // Close form button
    document.getElementById('closeFormBtn').addEventListener('click', hideJournalForm);
    
    // Cancel entry button
    document.getElementById('cancelEntry').addEventListener('click', hideJournalForm);
    
    // Prompts button
    document.getElementById('promptsBtn').addEventListener('click', showPrompts);
    
    // Close prompts button
    document.getElementById('closePromptsBtn').addEventListener('click', () => {
        document.getElementById('promptsSection').style.display = 'none';
        document.getElementById('entriesSection').style.display = 'block';
    });
    
    // Use prompt buttons
    document.querySelectorAll('.use-prompt-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const prompt = this.dataset.prompt;
            document.getElementById('entryContent').value = prompt;
            showJournalForm();
        });
    });
    
    // Mood selection
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('selectedMood').value = this.dataset.mood;
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.dataset.filter;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterJournals(filter);
        });
    });
    
    // Calendar navigation
    document.getElementById('prevMonth').addEventListener('click', function() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        generateCalendar();
    });
    
    document.getElementById('nextMonth').addEventListener('click', function() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        generateCalendar();
    });
    
    // Journal form submission
    document.getElementById('journalForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const title = document.getElementById('entryTitle').value;
        const content = document.getElementById('entryContent').value;
        const mood = document.getElementById('selectedMood').value || '😊';
        
        if (content.trim()) {
            const result = await addJournalEntry(title, content, mood);
            if (result) {
                document.getElementById('journalForm').reset();
                hideJournalForm();
            }
        } else {
            alert('Please write something in your journal entry.');
        }
    });
    
    // Voice entry button (placeholder)
    document.getElementById('voiceEntryBtn').addEventListener('click', function() {
        alert('Voice entry feature will be implemented in the next version.');
    });
});

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

document.getElementById('logout-btn')?.addEventListener('click', logout);
