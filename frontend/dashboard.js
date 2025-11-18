// dashboard.js - Updated with Live Backend API
const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

// Check authentication
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = 'index.html';
}

// Display user info
document.getElementById('user-name').textContent = user.name || 'User';

// Load user data from backend
async function loadUserData() {
    try {
        console.log('Loading user data from backend...');
        
        // Load memories
        const memoriesResponse = await fetch(`${API_BASE}/memories`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const memoriesData = await memoriesResponse.json();
        displayMemories(memoriesData.memories || []);

        // Load journals
        const journalsResponse = await fetch(`${API_BASE}/journals`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const journalsData = await journalsResponse.json();
        displayJournals(journalsData.journals || []);

        // Load reminders
        const remindersResponse = await fetch(`${API_BASE}/reminders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const remindersData = await remindersResponse.json();
        displayReminders(remindersData.reminders || []);

        console.log('User data loaded successfully');

    } catch (error) {
        console.error('Failed to load user data:', error);
        alert('Failed to load data. Please check your connection.');
    }
}

// Add new memory to backend
async function addMemory(memoryData) {
    try {
        const response = await fetch(`${API_BASE}/memories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(memoryData)
        });
        const result = await response.json();
        
        if (result.memory) {
            alert('Memory added successfully!');
            loadUserData(); // Reload data
        }
        return result;
    } catch (error) {
        console.error('Failed to add memory:', error);
        alert('Failed to add memory. Please try again.');
    }
}

window.addEventListener('memoryUpdated', function(e) {
    document.getElementById('memoryCount').textContent = e.detail.count;
    document.getElementById('memoryCount2').textContent = e.detail.count;
});

// Add new journal to backend
async function addJournal(journalData) {
    try {
        const response = await fetch(`${API_BASE}/journals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(journalData)
        });
        const result = await response.json();
        
        if (result.journal) {
            alert('Journal added successfully!');
            loadUserData(); // Reload data
        }
        return result;
    } catch (error) {
        console.error('Failed to add journal:', error);
        alert('Failed to add journal. Please try again.');
    }
}

// Add new reminder to backend
async function addReminder(reminderData) {
    try {
        const response = await fetch(`${API_BASE}/reminders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(reminderData)
        });
        const result = await response.json();
        
        if (result.reminder) {
            alert('Reminder added successfully!');
            loadUserData(); // Reload data
        }
        return result;
    } catch (error) {
        console.error('Failed to add reminder:', error);
        alert('Failed to add reminder. Please try again.');
    }
}

// Update location to backend
async function updateLocation(locationData) {
    try {
        const response = await fetch(`${API_BASE}/locations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(locationData)
        });
        return await response.json();
    } catch (error) {
        console.error('Failed to update location:', error);
    }
}

function updateDashboardCounts() {
    // Update memory count from localStorage
    const memories = JSON.parse(localStorage.getItem('memories')) || [];
    document.getElementById('memoryCount').textContent = memories.length;
    document.getElementById('memoryCount2').textContent = memories.length;
    
    // Update journal count (you'll need to implement journal storage)
    const journals = JSON.parse(localStorage.getItem('journals')) || [];
    document.getElementById('journalCount').textContent = journals.length;
    document.getElementById('journalCount2').textContent = journals.length;
    
    // Update user name
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    document.getElementById('userName').textContent = user.name || 'User';
}

// Display functions
function displayMemories(memories) {
    const container = document.getElementById('memories-container');
    if (!container) return;
    
    if (memories.length === 0) {
        container.innerHTML = '<p>No memories yet. Add your first memory!</p>';
        return;
    }
    
    container.innerHTML = memories.map(memory => `
        <div class="memory-card">
            <h3>${memory.title}</h3>
            <p>${memory.description}</p>
            <div class="memory-meta">
                <small>Date: ${new Date(memory.memory_date).toLocaleDateString()}</small>
                <small>Location: ${memory.location || 'Not specified'}</small>
                <small>Added: ${new Date(memory.created_at).toLocaleDateString()}</small>
            </div>
        </div>
    `).join('');
}

function displayJournals(journals) {
    const container = document.getElementById('journals-container');
    if (!container) return;
    
    if (journals.length === 0) {
        container.innerHTML = '<p>No journal entries yet. Start writing!</p>';
        return;
    }
    
    container.innerHTML = journals.map(journal => `
        <div class="journal-card">
            <h3>${journal.title || 'Untitled'}</h3>
            <p class="journal-content">${journal.content}</p>
            <div class="journal-meta">
                <span class="mood">Mood: ${journal.mood || 'Not specified'}</span>
                <span class="date">${new Date(journal.created_at).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');
}

function displayReminders(reminders) {
    const container = document.getElementById('reminders-container');
    if (!container) return;
    
    if (reminders.length === 0) {
        container.innerHTML = '<p>No reminders yet. Add your first reminder!</p>';
        return;
    }
    
    container.innerHTML = reminders.map(reminder => `
        <div class="reminder-card ${reminder.is_completed ? 'completed' : ''}">
            <h3>${reminder.title}</h3>
            <p>${reminder.description}</p>
            <div class="reminder-meta">
                <small>Due: ${new Date(reminder.reminder_date).toLocaleString()}</small>
                <small>Priority: ${reminder.priority || 'medium'}</small>
                <small>Status: ${reminder.is_completed ? 'Completed' : 'Pending'}</small>
            </div>
        </div>
    `).join('');
}

// Event listeners for adding new items
document.getElementById('add-memory-btn')?.addEventListener('click', async function() {
    const title = prompt('Enter memory title:');
    const description = prompt('Enter memory description:');
    
    if (title && description) {
        await addMemory({
            title: title,
            description: description,
            memory_date: new Date().toISOString().split('T')[0],
            location: ''
        });
    }
});

document.getElementById('add-journal-btn')?.addEventListener('click', async function() {
    const content = prompt('Write your journal entry:');
    const mood = prompt('How are you feeling? (happy, sad, neutral, etc.):') || 'neutral';
    
    if (content) {
        await addJournal({
            title: 'Daily Journal',
            content: content,
            mood: mood
        });
    }
});

document.getElementById('add-reminder-btn')?.addEventListener('click', async function() {
    const title = prompt('Enter reminder title:');
    const description = prompt('Enter reminder description:');
    
    if (title && description) {
        // Set reminder for 1 hour from now
        const reminderDate = new Date(Date.now() + 60 * 60 * 1000);
        
        await addReminder({
            title: title,
            description: description,
            reminder_date: reminderDate.toISOString(),
            priority: 'medium'
        });
    }
});

// Get user location and update to backend
document.getElementById('update-location-btn')?.addEventListener('click', function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const address = `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`;
                
                await updateLocation({
                    latitude: latitude,
                    longitude: longitude,
                    address: address
                });
                
                alert(`Location updated: ${address}`);
            },
            (error) => {
                console.error('Location error:', error);
                alert('Could not get your location. Please enable location services.');
            }
        );
    } else {
        alert('Geolocation is not supported by this browser.');
    }
});

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    window.location.href = 'login.html';
}

document.getElementById('logout-btn')?.addEventListener('click', logout);

// Load data when page loads
document.addEventListener('DOMContentLoaded', function() {
    updateDashboardCounts();
    loadUserData();
});
