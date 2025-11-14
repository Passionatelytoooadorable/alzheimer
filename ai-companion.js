// AI Companion JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadInitialData();
});

// Global variables
let currentReminders = [];
let chatHistory = [];

// Initialize the application
function initializeApp() {
    updateDailyTip();
    loadReminders();
    initializeChat();
    updateStats();
}

// Set up all event listeners
function setupEventListeners() {
    // Chat functionality
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.querySelector('.send-btn');
    
    if (chatInput && sendButton) {
        // Send message on button click
        sendButton.addEventListener('click', sendMessage);
        
        // Send message on Enter key
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Quick action buttons
    const quickActionButtons = document.querySelectorAll('.quick-action-btn');
    quickActionButtons.forEach(button => {
        button.addEventListener('click', handleQuickAction);
    });
    
    // Game buttons
    const gameButtons = document.querySelectorAll('.game-btn-horizontal');
    gameButtons.forEach(button => {
        button.addEventListener('click', startGame);
    });
    
    // Reminder functionality
    const addReminderBtn = document.querySelector('.add-reminder-btn');
    if (addReminderBtn) {
        addReminderBtn.addEventListener('click', openReminderModal);
    }
    
    // Modal functionality
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });
    
    // Save reminder button
    const saveReminderBtn = document.getElementById('saveReminder');
    if (saveReminderBtn) {
        saveReminderBtn.addEventListener('click', saveReminder);
    }
    
    // Cancel reminder button
    const cancelReminderBtn = document.getElementById('cancelReminder');
    if (cancelReminderBtn) {
        cancelReminderBtn.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                closeModal();
            }
        });
    });
}

// Load initial data
function loadInitialData() {
    // Load any saved data from localStorage
    const savedReminders = localStorage.getItem('aiCompanionReminders');
    const savedChat = localStorage.getItem('aiCompanionChat');
    
    if (savedReminders) {
        currentReminders = JSON.parse(savedReminders);
        renderReminders();
    }
    
    if (savedChat) {
        chatHistory = JSON.parse(savedChat);
        renderChatHistory();
    }
}

// Update daily tip
function updateDailyTip() {
    const tips = [
        {
            icon: "🌞",
            text: "Start your day with a few minutes of deep breathing. It can help set a positive tone for the entire day.",
            category: "Mindfulness"
        },
        {
            icon: "💧",
            text: "Stay hydrated! Drinking enough water helps with concentration and overall well-being.",
            category: "Health"
        },
        {
            icon: "🚶",
            text: "Take short walking breaks throughout the day. Even 5 minutes can refresh your mind.",
            category: "Activity"
        },
        {
            icon: "📝",
            text: "Write down three things you're grateful for today. Gratitude boosts happiness.",
            category: "Mindfulness"
        },
        {
            icon: "🎵",
            text: "Listen to calming music during breaks. Music can significantly improve your mood.",
            category: "Relaxation"
        }
    ];
    
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const tipIndex = dayOfYear % tips.length;
    const currentTip = tips[tipIndex];
    
    const tipsContainer = document.getElementById('tipsContainer');
    if (tipsContainer) {
        tipsContainer.innerHTML = `
            <div class="daily-tip">
                <div class="tip-icon">${currentTip.icon}</div>
                <div class="tip-content">
                    <p class="tip-text">${currentTip.text}</p>
                    <span class="tip-date">${today.toLocaleDateString()} • ${currentTip.category}</span>
                </div>
            </div>
        `;
    }
}

// Initialize chat
function initializeChat() {
    // Add welcome message if no chat history exists
    if (chatHistory.length === 0) {
        const welcomeMessage = {
            type: 'companion',
            text: "Hello! I'm your AI Care Companion. I'm here to chat with you, help with reminders, and provide support whenever you need it. How are you feeling today?",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        chatHistory.push(welcomeMessage);
        addMessageToChat(welcomeMessage);
        saveChatToStorage();
    }
}

// Send message function
function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const messageText = chatInput.value.trim();
    
    if (!messageText) return;
    
    // Add user message
    const userMessage = {
        type: 'user',
        text: messageText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    addMessageToChat(userMessage);
    chatHistory.push(userMessage);
    
    // Clear input
    chatInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Generate AI response after a short delay
    setTimeout(() => {
        generateAIResponse(messageText);
    }, 1500);
    
    saveChatToStorage();
}

// Add message to chat UI
function addMessageToChat(message) {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;
    
    // Remove typing indicator if present
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.type}-message`;
    
    const avatar = message.type === 'user' ? '👤' : '🤖';
    const avatarClass = message.type === 'user' ? 'user-message' : 'companion-message';
    
    messageElement.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <p>${message.text}</p>
            <span class="message-time">${message.time}</span>
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;
    
    const typingElement = document.createElement('div');
    typingElement.className = 'message companion-message typing-indicator';
    typingElement.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Generate AI response
function generateAIResponse(userMessage) {
    const responses = {
        greetings: [
            "Hello! How are you feeling today?",
            "Hi there! It's good to hear from you.",
            "Greetings! How can I support you today?"
        ],
        feelings: [
            "I understand how you might be feeling. Would you like to talk more about it?",
            "Thank you for sharing that with me. Remember, it's okay to feel this way.",
            "I'm here to listen. Sometimes just talking about our feelings can help."
        ],
        help: [
            "I'm here to help! You can ask me about setting reminders, playing games, or just chat.",
            "How can I assist you today? I can help with reminders, games, or just have a conversation.",
            "I'm glad you reached out. What would you like help with today?"
        ],
        default: [
            "That's interesting! Tell me more about that.",
            "I appreciate you sharing that with me.",
            "I'm here to listen and support you. Would you like to continue talking about this?",
            "Thank you for the conversation. Is there anything specific you'd like to do today?"
        ]
    };
    
    let responseCategory = 'default';
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        responseCategory = 'greetings';
    } else if (lowerMessage.includes('feel') || lowerMessage.includes('sad') || lowerMessage.includes('happy') || lowerMessage.includes('anxious')) {
        responseCategory = 'feelings';
    } else if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('assist')) {
        responseCategory = 'help';
    }
    
    const possibleResponses = responses[responseCategory];
    const randomResponse = possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
    
    const aiMessage = {
        type: 'companion',
        text: randomResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    addMessageToChat(aiMessage);
    chatHistory.push(aiMessage);
    saveChatToStorage();
}

// Handle quick actions
function handleQuickAction(event) {
    const actionType = event.currentTarget.classList[1]; // medication, games, or stories
    
    const actions = {
        medication: "Let me help you with medication reminders. Would you like to set one now?",
        games: "Great choice! Games can be wonderful for mental exercise and relaxation.",
        stories: "I'd love to share a story with you! What kind of story would you like to hear?"
    };
    
    const response = actions[actionType] || "I'm here to help! What would you like to do?";
    
    const quickActionMessage = {
        type: 'companion',
        text: response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    addMessageToChat(quickActionMessage);
    chatHistory.push(quickActionMessage);
    
    // If medication action, open reminder modal
    if (actionType === 'medication') {
        setTimeout(() => {
            openReminderModal();
        }, 1000);
    }
    
    saveChatToStorage();
}

// Start game function
function startGame(event) {
    const gameCard = event.currentTarget.closest('.game-card-horizontal');
    const gameName = gameCard.querySelector('h4').textContent;
    
    showNotification(`Starting ${gameName}...`, 'info');
    
    // Add game message to chat
    const gameMessage = {
        type: 'companion',
        text: `I've started ${gameName} for you! This looks like a fun one. Would you like me to explain the rules?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    addMessageToChat(gameMessage);
    chatHistory.push(gameMessage);
    saveChatToStorage();
}

// Reminder functionality
function openReminderModal() {
    const modal = document.getElementById('reminderModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Set current time as default
        const now = new Date();
        const timeString = now.toTimeString().substring(0, 5);
        document.getElementById('reminderTime').value = timeString;
    }
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

function saveReminder() {
    const title = document.getElementById('reminderTitle').value;
    const time = document.getElementById('reminderTime').value;
    const type = document.getElementById('reminderType').value;
    
    if (!title || !time) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    const newReminder = {
        id: Date.now(),
        title: title,
        time: time,
        type: type,
        completed: false
    };
    
    currentReminders.push(newReminder);
    renderReminders();
    saveRemindersToStorage();
    closeModal();
    
    showNotification('Reminder added successfully!', 'success');
    
    // Clear form
    document.getElementById('reminderTitle').value = '';
}

function renderReminders() {
    const remindersList = document.querySelector('.reminders-list');
    if (!remindersList) return;
    
    remindersList.innerHTML = '';
    
    if (currentReminders.length === 0) {
        remindersList.innerHTML = '<p style="text-align: center; color: #666; padding: 1rem;">No reminders set</p>';
        return;
    }
    
    // Sort reminders by time
    currentReminders.sort((a, b) => a.time.localeCompare(b.time));
    
    currentReminders.forEach(reminder => {
        const reminderElement = document.createElement('div');
        reminderElement.className = `reminder-item ${reminder.type === 'urgent' ? 'urgent' : ''}`;
        reminderElement.innerHTML = `
            <div class="reminder-time">${reminder.time}</div>
            <div class="reminder-text">${reminder.title}</div>
        `;
        
        remindersList.appendChild(reminderElement);
    });
}

// Update stats
function updateStats() {
    const stats = {
        days: Math.floor(Math.random() * 100) + 50,
        reminders: currentReminders.length,
        chats: chatHistory.filter(msg => msg.type === 'user').length
    };
    
    document.querySelectorAll('.stat-number').forEach(stat => {
        const label = stat.nextElementSibling.textContent.toLowerCase();
        if (label.includes('day')) {
            stat.textContent = stats.days;
        } else if (label.includes('reminder')) {
            stat.textContent = stats.reminders;
        } else if (label.includes('chat')) {
            stat.textContent = stats.chats;
        }
    });
}

// Render chat history
function renderChatHistory() {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;
    
    chatMessages.innerHTML = '';
    
    chatHistory.forEach(message => {
        addMessageToChat(message);
    });
}

// Save data to localStorage
function saveRemindersToStorage() {
    localStorage.setItem('aiCompanionReminders', JSON.stringify(currentReminders));
    updateStats();
}

function saveChatToStorage() {
    localStorage.setItem('aiCompanionChat', JSON.stringify(chatHistory));
    updateStats();
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Check for reminders that are due
function checkDueReminders() {
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5);
    
    currentReminders.forEach(reminder => {
        if (reminder.time === currentTime && !reminder.completed) {
            showNotification(`Reminder: ${reminder.title}`, 'info');
            
            // Mark as completed for today
            reminder.completed = true;
        }
    });
    
    // Reset completed status at midnight
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight - now;
    
    setTimeout(() => {
        currentReminders.forEach(reminder => {
            reminder.completed = false;
        });
        saveRemindersToStorage();
    }, timeUntilMidnight);
}

// Initialize reminder checking
setInterval(checkDueReminders, 60000); // Check every minute
checkDueReminders(); // Initial check

// Export functions for global access (if needed)
window.AICompanion = {
    sendMessage,
    openReminderModal,
    closeModal,
    saveReminder,
    startGame,
    showNotification
};