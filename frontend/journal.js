// journal.js - Updated with Live Backend API
const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

// Check authentication
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = 'index.html';
}

// Display user info
document.getElementById('user-name').textContent = user.name || 'User';

// Load journals from backend
async function loadJournals() {
    try {
        const response = await fetch(`${API_BASE}/journals`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        displayJournals(data.journals || []);
    } catch (error) {
        console.error('Failed to load journals:', error);
        alert('Failed to load journals. Please check your connection.');
    }
}

// Add new journal to backend
async function addJournalEntry(title, content, mood = 'neutral') {
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
            return result;
        }
        return null;
    } catch (error) {
        console.error('Failed to add journal:', error);
        alert('Failed to add journal entry. Please try again.');
        return null;
    }
}

// Display journals
function displayJournals(journals) {
    const container = document.getElementById('journals-container');
    if (!container) return;
    
    if (journals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No journal entries yet</h3>
                <p>Start writing your thoughts and experiences!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = journals.map(journal => `
        <div class="journal-entry">
            <div class="journal-header">
                <h3>${journal.title || 'Untitled Entry'}</h3>
                <span class="journal-date">${new Date(journal.created_at).toLocaleDateString()}</span>
            </div>
            <div class="journal-content">${journal.content}</div>
            <div class="journal-footer">
                <span class="mood-tag ${journal.mood || 'neutral'}">${journal.mood || 'Neutral'}</span>
                <small>Added: ${new Date(journal.created_at).toLocaleString()}</small>
            </div>
        </div>
    `).join('');
}

// Event listener for new journal entry
document.getElementById('journal-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const title = document.getElementById('journal-title').value;
    const content = document.getElementById('journal-content').value;
    const mood = document.getElementById('journal-mood').value;
    
    if (content.trim()) {
        const result = await addJournalEntry(title, content, mood);
        if (result) {
            document.getElementById('journal-form').reset();
            loadJournals(); // Reload the list
        }
    } else {
        alert('Please write something in your journal entry.');
    }
});

// Quick mood selection
document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.getElementById('journal-mood').value = this.dataset.mood;
        
        // Update active state
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
});

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

document.getElementById('logout-btn')?.addEventListener('click', logout);

// Load journals when page loads
document.addEventListener('DOMContentLoaded', loadJournals);
