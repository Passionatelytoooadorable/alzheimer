const API_BASE = 'https://alzheimer-vbm2.onrender.com/api';

// Check authentication
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');
let currentSessionId = localStorage.getItem('currentSessionId');

if (!token) {
    window.location.href = 'index.html';
}

// Track user activity and location
async function trackUserActivity(activityType, description) {
    try {
        await fetch(`${API_BASE}/activities`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                activity_type: activityType,
                description: description
            })
        });
    } catch (error) {
        console.error('Failed to track activity:', error);
    }
}

// Get user location
async function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                // Get address from coordinates (simplified)
                const address = `Lat: ${latitude}, Long: ${longitude}`;
                
                try {
                    // Save location to backend
                    await fetch(`${API_BASE}/locations`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            latitude: latitude,
                            longitude: longitude,
                            address: address
                        })
                    });
                    
                    resolve({ latitude, longitude, address });
                } catch (error) {
                    console.error('Failed to save location:', error);
                    resolve({ latitude, longitude, address });
                }
            },
            (error) => {
                console.error('Location error:', error);
                reject(error);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    });
}

// Load user data with enhanced tracking
async function loadUserData() {
    try {
        // Track dashboard access
        await trackUserActivity('dashboard_accessed', 'User accessed dashboard');

        // Get user location
        try {
            await getUserLocation();
        } catch (error) {
            console.log('Location tracking not available');
        }

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

        // Load user activities
        const activitiesResponse = await fetch(`${API_BASE}/auth/activities`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const activitiesData = await activitiesResponse.json();
        displayActivities(activitiesData.activities || []);

    } catch (error) {
        console.error('Failed to load user data:', error);
    }
}

// Enhanced add memory with tracking
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
            await trackUserActivity('memory_created', `Created memory: ${memoryData.title}`);
        }
        
        return result;
    } catch (error) {
        console.error('Failed to add memory:', error);
    }
}

// Enhanced add journal with tracking
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
            await trackUserActivity('journal_created', `Created journal: ${journalData.title || 'Untitled'}`);
        }
        
        return result;
    } catch (error) {
        console.error('Failed to add journal:', error);
    }
}

// Enhanced add reminder with tracking
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
            await trackUserActivity('reminder_created', `Created reminder: ${reminderData.title}`);
        }
        
        return result;
    } catch (error) {
        console.error('Failed to add reminder:', error);
    }
}

// Display activities
function displayActivities(activities) {
    const container = document.getElementById('activities-container');
    if (!container) return;
    
    if (activities.length === 0) {
        container.innerHTML = '<p>No recent activities</p>';
        return;
    }
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-type">${activity.activity_type}</div>
            <div class="activity-desc">${activity.description}</div>
            <div class="activity-time">${new Date(activity.timestamp).toLocaleString()}</div>
        </div>
    `).join('');
}

// Logout with session tracking
async function logout() {
    try {
        if (currentSessionId) {
            await fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ sessionId: currentSessionId })
            });
        }
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('currentSessionId');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Event listeners
document.getElementById('logout-btn').addEventListener('click', logout);

// Load data when page loads
document.addEventListener('DOMContentLoaded', loadUserData);
