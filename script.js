// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        window.location.href = 'login.html';
    }
}

// Display user email on page load
document.addEventListener('DOMContentLoaded', function() {
    const userEmail = localStorage.getItem('userEmail') || 'demo@pehchaan.com';
    const userEmailElement = document.getElementById('userEmail');
    if (userEmailElement) {
        userEmailElement.textContent = userEmail;
    }
});

// Enhanced MemoryAidAssistant Class with Proper Loading
class MemoryAidAssistant {
    constructor() {
        this.currentTab = 'memoryVault';
        this.memories = JSON.parse(localStorage.getItem('memories')) || [];
        this.journalEntries = JSON.parse(localStorage.getItem('journalEntries')) || [];
        this.settings = JSON.parse(localStorage.getItem('settings')) || this.getDefaultSettings();
        this.isListening = false;
        this.isInitialized = false;
        
        console.log('MemoryAidAssistant constructor called');
    }

    getDefaultSettings() {
        return {
            voicePrompts: true,
            autoRead: true,
            fontSize: 'medium',
            colorContrast: 'normal',
            theme: 'dark'
        };
    }

    async init() {
        try {
            console.log('Starting initialization...');
            
            // Show loading spinner immediately
            this.showLoading();
            
            // Add a small delay to ensure loading spinner is visible
            await this.delay(500);
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Apply settings
            this.applySettings();
            
            // Load data
            this.loadMemories();
            this.loadJournalEntries();
            this.generateCalendar();
            
            // Simulate some loading time for better UX
            await this.delay(1000);
            
            // Mark as initialized
            this.isInitialized = true;
            
            // Hide loading spinner
            this.hideLoading();
            
            console.log('App initialized successfully');
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to initialize app: ' + error.message);
        }
    }

    // Utility function for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showLoading() {
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (loadingSpinner) {
            loadingSpinner.classList.add('active');
            console.log('Loading spinner shown');
        }
    }

    hideLoading() {
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (loadingSpinner) {
            loadingSpinner.classList.remove('active');
            console.log('Loading spinner hidden');
        }
    }

    setupEventListeners() {
        try {
            console.log('Setting up event listeners...');

            // Navigation
            const navButtons = document.querySelectorAll('.nav-btn');
            if (navButtons.length === 0) {
                console.warn('No navigation buttons found');
            } else {
                navButtons.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        this.switchTab(e.currentTarget.dataset.tab);
                    });
                });
            }

            // Theme Toggle
            const themeBtn = document.getElementById('themeToggle');
            if (themeBtn) {
                themeBtn.addEventListener('click', () => {
                    this.toggleTheme();
                });
            }

            // Settings
            const settingsBtn = document.getElementById('settingsBtn');
            if (settingsBtn) {
                settingsBtn.addEventListener('click', () => {
                    this.showSettings();
                });
            }

            // Memory Vault
            const addMemoryBtn = document.getElementById('addMemoryBtn');
            if (addMemoryBtn) {
                addMemoryBtn.addEventListener('click', () => {
                    this.showAddMemoryModal();
                });
            }

            const recognizeBtn = document.getElementById('recognizeBtn');
            if (recognizeBtn) {
                recognizeBtn.addEventListener('click', () => {
                    this.startFaceRecognition();
                });
            }

            // Modal close buttons
            const closeButtons = document.querySelectorAll('.close-btn, .close-modal');
            if (closeButtons.length > 0) {
                closeButtons.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        this.closeAllModals();
                    });
                });
            }

            // Quick actions for chat
            const quickButtons = document.querySelectorAll('.quick-btn');
            if (quickButtons.length > 0) {
                quickButtons.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const message = e.currentTarget.dataset.message;
                        document.getElementById('chatInput').value = message;
                        this.sendChatMessage();
                    });
                });
            }

            // Chat input
            const sendMessageBtn = document.getElementById('sendMessage');
            if (sendMessageBtn) {
                sendMessageBtn.addEventListener('click', () => {
                    this.sendChatMessage();
                });
            }

            const chatInput = document.getElementById('chatInput');
            if (chatInput) {
                chatInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.sendChatMessage();
                    }
                });
            }

            // Memory form submission
            const memoryForm = document.getElementById('memoryForm');
            if (memoryForm) {
                memoryForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.saveMemory();
                });
            }

            // Journal buttons
            const addEntryBtn = document.getElementById('addEntryBtn');
            if (addEntryBtn) {
                addEntryBtn.addEventListener('click', () => {
                    this.addJournalEntry();
                });
            }

            const voiceEntryBtn = document.getElementById('voiceEntryBtn');
            if (voiceEntryBtn) {
                voiceEntryBtn.addEventListener('click', () => {
                    this.startVoiceJournalEntry();
                });
            }

            // Map buttons
            const goHomeBtn = document.getElementById('goHomeBtn');
            if (goHomeBtn) {
                goHomeBtn.addEventListener('click', () => {
                    this.navigateHome();
                });
            }

            const findPlacesBtn = document.getElementById('findPlacesBtn');
            if (findPlacesBtn) {
                findPlacesBtn.addEventListener('click', () => {
                    this.findSafePlaces();
                });
            }

            console.log('Event listeners setup complete');

        } catch (error) {
            console.error('Event listener setup error:', error);
            throw error;
        }
    }

    showError(message) {
        this.hideLoading();
        
        const errorDisplay = document.getElementById('errorDisplay');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorDisplay && errorMessage) {
            errorMessage.textContent = message;
            errorDisplay.style.display = 'flex';
        } else {
            // Fallback to alert if error display elements don't exist
            alert('Error: ' + message);
        }
        
        console.error('App Error:', message);
    }

    toggleTheme() {
    try {
        const currentTheme = this.settings.theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        this.updateSetting('theme', newTheme);
        // Removed the success message that was causing the dialog box
        console.log(`Switched to ${newTheme} mode`);
    } catch (error) {
        console.error('Theme toggle error:', error);
    }
}

    applySettings() {
        try {
            // Apply theme
            document.documentElement.setAttribute('data-theme', this.settings.theme);
            
            // Update theme toggle icon
            const themeIcon = document.querySelector('#themeToggle i');
            if (themeIcon) {
                themeIcon.className = this.settings.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }

            console.log('Settings applied - Theme:', this.settings.theme);
        } catch (error) {
            console.error('Settings application error:', error);
        }
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        localStorage.setItem('settings', JSON.stringify(this.settings));
        this.applySettings();
    }

    switchTab(tabName) {
        try {
            console.log('Switching to tab:', tabName);
            
            // Update navigation
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            const targetNav = document.querySelector(`[data-tab="${tabName}"]`);
            if (targetNav) {
                targetNav.classList.add('active');
            }

            // Update content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            const targetContent = document.getElementById(tabName);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            this.currentTab = tabName;
            
        } catch (error) {
            console.error('Tab switch error:', error);
        }
    }

    // Memory Vault Functions
    showAddMemoryModal() {
        try {
            const modal = document.getElementById('addMemoryModal');
            if (modal) {
                modal.classList.add('active');
            }
        } catch (error) {
            console.error('Show modal error:', error);
        }
    }

    startFaceRecognition() {
        this.showMessage('Face Recognition', 'This feature would use your camera to recognize faces. For demo purposes, this is simulated.');
        
        // Simulate face recognition with sample data
        setTimeout(() => {
            this.showMessage('Face Recognized!', 'This appears to be Sarah - your daughter! She last visited 3 days ago.');
        }, 1500);
    }

    saveMemory() {
        try {
            const name = document.getElementById('personName')?.value || 'Unknown';
            const relationship = document.getElementById('relationship')?.value || 'Family';
            const notes = document.getElementById('memoryNotes')?.value || 'No notes added';
            
            const memory = {
                id: Date.now(),
                name: name,
                relationship: relationship,
                notes: notes,
                photo: '', // You can add photo functionality later
                createdAt: new Date().toISOString()
            };
            
            this.memories.push(memory);
            localStorage.setItem('memories', JSON.stringify(this.memories));
            
            this.closeAllModals();
            this.loadMemories();
            this.showSuccess('Memory saved successfully!');
            
        } catch (error) {
            console.error('Save memory error:', error);
            this.showError('Failed to save memory');
        }
    }

    loadMemories() {
        try {
            const grid = document.getElementById('memoriesGrid');
            if (!grid) {
                console.warn('Memories grid not found');
                return;
            }

            // Add some sample memories if none exist
            if (this.memories.length === 0) {
                this.memories = [
                    {
                        id: 1,
                        name: 'Sarah Johnson',
                        relationship: 'Daughter',
                        notes: 'Visits every weekend, loves baking',
                        photo: '',
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 2,
                        name: 'Dr. Michael Chen',
                        relationship: 'Doctor',
                        notes: 'Primary care physician, next appointment in 2 weeks',
                        photo: '',
                        createdAt: new Date().toISOString()
                    }
                ];
                localStorage.setItem('memories', JSON.stringify(this.memories));
            }

            grid.innerHTML = this.memories.map(memory => `
                <div class="memory-card">
                    <div class="memory-photo">
                        ${memory.photo ? 
                            `<img src="${memory.photo}" alt="${memory.name}">` : 
                            `<i class="fas fa-user-circle"></i>`
                        }
                    </div>
                    <div class="memory-info">
                        <h3>${memory.name}</h3>
                        <p class="memory-relationship">${memory.relationship}</p>
                        <p class="memory-notes">${memory.notes}</p>
                        <div class="memory-meta">
                            <small>Added ${new Date(memory.createdAt).toLocaleDateString()}</small>
                        </div>
                    </div>
                </div>
            `).join('');
            
            console.log('Memories loaded:', this.memories.length);
        } catch (error) {
            console.error('Load memories error:', error);
        }
    }

    // Journal Functions
    addJournalEntry() {
        try {
            const entry = {
                id: Date.now(),
                date: new Date().toISOString(),
                content: 'Today was a good day. I spent time with family and enjoyed the beautiful weather.',
                type: 'text'
            };
            
            this.journalEntries.push(entry);
            localStorage.setItem('journalEntries', JSON.stringify(this.journalEntries));
            this.loadJournalEntries();
            this.showSuccess('Journal entry added!');
        } catch (error) {
            console.error('Add journal entry error:', error);
        }
    }

    startVoiceJournalEntry() {
        this.showMessage('Voice Journal', 'Speak now... I\'m listening to your journal entry. (Voice recognition would be implemented here)');
    }

    loadJournalEntries() {
        try {
            const container = document.getElementById('journalEntries');
            if (!container) {
                console.warn('Journal entries container not found');
                return;
            }

            // Add sample entries if none exist
            if (this.journalEntries.length === 0) {
                this.journalEntries = [
                    {
                        id: 1,
                        date: new Date().toISOString(),
                        content: "Today was a wonderful day. I spent time in the garden and the flowers are blooming beautifully."
                    },
                    {
                        id: 2,
                        date: new Date(Date.now() - 86400000).toISOString(),
                        content: "Had a lovely video call with my daughter and grandchildren. They're growing up so fast!"
                    }
                ];
                localStorage.setItem('journalEntries', JSON.stringify(this.journalEntries));
            }

            // Show only recent entries
            const recentEntries = this.journalEntries.slice(-5).reverse();
            
            container.innerHTML = recentEntries.map(entry => `
                <div class="journal-entry">
                    <div class="entry-header">
                        <div class="entry-date">${new Date(entry.date).toLocaleDateString()}</div>
                    </div>
                    <div class="entry-content">
                        ${entry.content}
                    </div>
                </div>
            `).join('');
            
            console.log('Journal entries loaded:', this.journalEntries.length);
        } catch (error) {
            console.error('Load journal error:', error);
        }
    }

    generateCalendar() {
        try {
            const grid = document.getElementById('calendarGrid');
            if (!grid) {
                console.warn('Calendar grid not found');
                return;
            }

            const now = new Date();
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            
            let html = '';
            for (let day = 1; day <= daysInMonth; day++) {
                const hasEntry = this.journalEntries.some(entry => 
                    new Date(entry.date).getDate() === day
                );
                
                const isToday = day === now.getDate();
                
                html += `<div class="calendar-day ${hasEntry ? 'has-entry' : ''} ${isToday ? 'today' : ''}">${day}</div>`;
            }
            
            grid.innerHTML = html;
            console.log('Calendar generated for month');
        } catch (error) {
            console.error('Calendar generation error:', error);
        }
    }

    // Map Functions
    navigateHome() {
        this.showMessage('Navigation', 'Starting navigation to home... You should arrive in approximately 15 minutes.');
    }

    findSafePlaces() {
        const places = [
            { name: 'Central Park', distance: '0.5 miles', type: 'park' },
            { name: 'Family Grocery', distance: '1.2 miles', type: 'store' },
            { name: 'Community Pharmacy', distance: '0.8 miles', type: 'pharmacy' }
        ];
        
        const placesHtml = places.map(place => `
            <div class="place-result" style="display: flex; align-items: center; gap: 15px; padding: 10px; border-bottom: 1px solid var(--border-primary);">
                <i class="fas fa-${this.getPlaceIcon(place.type)}"></i>
                <div>
                    <strong>${place.name}</strong><br>
                    <span style="color: var(--text-secondary);">${place.distance} away</span>
                </div>
            </div>
        `).join('');
        
        this.showMessage('Safe Places Nearby', placesHtml);
    }

    getPlaceIcon(type) {
        const icons = {
            'park': 'tree',
            'store': 'shopping-cart',
            'pharmacy': 'prescription-bottle',
            'home': 'home'
        };
        return icons[type] || 'map-marker-alt';
    }

    // AI Companion Functions
    sendChatMessage() {
        try {
            const input = document.getElementById('chatInput');
            const message = input?.value.trim();
            
            if (!message) return;
            
            // Add user message
            this.addChatMessage(message, 'user');
            if (input) input.value = '';
            
            // Show typing indicator
            this.showTypingIndicator();
            
            // Simulate AI response
            setTimeout(() => {
                this.hideTypingIndicator();
                const response = this.generateAIResponse(message);
                this.addChatMessage(response, 'bot');
            }, 1500);
        } catch (error) {
            console.error('Chat message error:', error);
        }
    }

    addChatMessage(message, sender) {
        try {
            const container = document.getElementById('chatMessages');
            if (!container) return;

            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}-message`;
            
            messageDiv.innerHTML = `
                <div class="message-content">${message}</div>
                <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            `;
            
            container.appendChild(messageDiv);
            container.scrollTop = container.scrollHeight;
        } catch (error) {
            console.error('Add chat message error:', error);
        }
    }

    showTypingIndicator() {
        try {
            const container = document.getElementById('chatMessages');
            if (!container) return;

            const indicator = document.createElement('div');
            indicator.className = 'message bot-message typing-indicator';
            indicator.id = 'typingIndicator';
            indicator.innerHTML = `
                <div class="message-content">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            `;
            
            container.appendChild(indicator);
            container.scrollTop = container.scrollHeight;
        } catch (error) {
            console.error('Typing indicator error:', error);
        }
    }

    hideTypingIndicator() {
        try {
            const indicator = document.getElementById('typingIndicator');
            if (indicator) {
                indicator.remove();
            }
        } catch (error) {
            console.error('Hide typing indicator error:', error);
        }
    }

    generateAIResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('who') && lowerMessage.includes('daughter')) {
            return "Your daughter Sarah visits every weekend. She's the one who loves baking cookies with you!";
        }
        
        if (lowerMessage.includes('yesterday')) {
            return "Yesterday you visited the park and had lunch with your son. You mentioned the flowers were beautiful!";
        }
        
        if (lowerMessage.includes('memory') || lowerMessage.includes('remember')) {
            return "Let me check your Memory Vault... I see you have wonderful photos with your family!";
        }
        
        if (lowerMessage.includes('theme') || lowerMessage.includes('dark') || lowerMessage.includes('light')) {
            return "We're using dark theme for better comfort. You can switch to light mode using the theme button in the top right.";
        }
        
        // Default responses
        const responses = [
            "I'm here to help you remember important things and keep you company.",
            "That's interesting! Tell me more about that.",
            "I understand how you feel. Would you like to look at some photos in your Memory Vault?",
            "Remember, you can always ask me about your family, your schedule, or your favorite places.",
            "You're doing great today! Is there anything specific you'd like to talk about?",
            "The dark theme makes it easier to read, especially in low light conditions."
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Utility Functions
    showMessage(title, content) {
        // Simple alert for demo - you can replace with a custom modal
        alert(`${title}\n\n${content}`);
    }

    showSuccess(message) {
        this.showMessage('Success', message);
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    showSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.add('active');
        }
    }
}

// Initialize the application with proper loading sequence
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    
    // Show loading spinner immediately
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.classList.add('active');
        console.log('Loading spinner activated');
    }
    
    // Initialize app after a brief delay to ensure DOM is ready
    setTimeout(async () => {
        try {
            console.log('Starting app initialization...');
            window.memoryAidApp = new MemoryAidAssistant();
            await window.memoryAidApp.init();
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            
            // Ensure loading spinner is hidden on error
            if (loadingSpinner) {
                loadingSpinner.classList.remove('active');
            }
            
            // Show error message
            const errorDisplay = document.getElementById('errorDisplay');
            const errorMessage = document.getElementById('errorMessage');
            
            if (errorDisplay && errorMessage) {
                errorMessage.textContent = 'Failed to load the application. Please refresh the page. Error: ' + error.message;
                errorDisplay.style.display = 'flex';
            } else {
                alert('Application failed to load. Please refresh the page.');
            }
        }
    }, 100);
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Hide loading spinner on any global error
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.classList.remove('active');
    }
});

// Add this function to your existing script.js
function logout() {
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';

}

