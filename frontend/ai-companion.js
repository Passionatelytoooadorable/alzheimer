// AI Companion - Powered by Claude API
// Stats (Days Active, Chats Today) are stored per-user using their auth token as a namespace key

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadInitialData();
});

// ─── Global State ────────────────────────────────────────────────────────────
let currentReminders = [];
let chatHistory = [];       // UI render array (session)
let apiMessages = [];       // Sent to Claude API (role: user/assistant)
let stream = null;
let capturedPhoto = null;
let chatBackups = [];
let hasShownWelcome = false;
let userKey = '';           // Unique key per user for localStorage namespacing

// ─── User Key ────────────────────────────────────────────────────────────────
// We derive a stable key from the auth token so each user has isolated stats.
function getUserKey() {
    if (userKey) return userKey;
    const token = localStorage.getItem('token') || 'guest';
    // Simple hash - take last 16 chars so key isn't huge but is user-specific
    userKey = 'user_' + token.slice(-16);
    return userKey;
}

function userStorage(key) {
    return getUserKey() + '_' + key;
}

// ─── Init ────────────────────────────────────────────────────────────────────
async function initializeApp() {
    updateDailyTip();
    loadReminders();
    initializeChat();
    updateStats();
    setupConsoleCommands();
    loadChatBackups();

    if (!hasShownWelcome) {
        showWelcomeGreeting();
        hasShownWelcome = true;
    }

    setTimeout(() => {
        if (window.dailyTips && window.dailyTips.showStatistics) {
            console.log('📊 Initial Tips Statistics:');
            window.dailyTips.showStatistics();
        }
    }, 2000);
}

// ─── Claude API Chat (via backend proxy) ─────────────────────────────────────
// Calls your Render backend which securely forwards to Anthropic.
// This avoids CORS issues and keeps your API key server-side.
const BACKEND_URL = 'https://alzheimer-backend-new.onrender.com';

async function callClaudeAPI(userText) {
    // Keep last 20 turns for context (10 back-and-forth exchanges)
    const recentMessages = apiMessages.slice(-20);
    const messagesPayload = [...recentMessages, { role: 'user', content: userText }];

    const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ messages: messagesPayload })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${response.status}`);
    }

    const data = await response.json();
    const assistantText = data.reply;

    // Update conversation context for follow-up messages
    apiMessages.push({ role: 'user', content: userText });
    apiMessages.push({ role: 'assistant', content: assistantText });

    return assistantText;
}

// ─── Event Listeners ──────────────────────────────────────────────────────────
function setupEventListeners() {
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.querySelector('.send-btn');

    if (chatInput && sendButton) {
        sendButton.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
    }

    document.querySelectorAll('.quick-action-btn').forEach(btn => {
        btn.addEventListener('click', handleQuickAction);
    });

    document.querySelectorAll('.game-btn-v').forEach(btn => {
        btn.addEventListener('click', startGame);
    });

    const addReminderBtn = document.querySelector('.add-reminder-btn');
    if (addReminderBtn) addReminderBtn.addEventListener('click', openReminderModal);

    const cameraToggle = document.getElementById('cameraToggle');
    if (cameraToggle) cameraToggle.addEventListener('click', openCameraModal);

    const settingsToggle = document.getElementById('settingsToggle');
    if (settingsToggle) settingsToggle.addEventListener('click', openSettingsModal);

    document.querySelectorAll('.close').forEach(btn => btn.addEventListener('click', closeModal));

    const saveReminderBtn = document.getElementById('saveReminder');
    if (saveReminderBtn) saveReminderBtn.addEventListener('click', saveReminder);

    const cancelReminderBtn = document.getElementById('cancelReminder');
    if (cancelReminderBtn) cancelReminderBtn.addEventListener('click', closeModal);

    const capturePhotoBtn = document.getElementById('capturePhoto');
    const retakePhotoBtn = document.getElementById('retakePhoto');
    const uploadPhotoBtn = document.getElementById('uploadPhoto');
    if (capturePhotoBtn) capturePhotoBtn.addEventListener('click', capturePhoto);
    if (retakePhotoBtn) retakePhotoBtn.addEventListener('click', retakePhoto);
    if (uploadPhotoBtn) uploadPhotoBtn.addEventListener('click', uploadPhotoToChat);

    const restoreChatsBtn = document.getElementById('restoreChats');
    const clearChatBtn = document.getElementById('clearChat');
    const exportChatsBtn = document.getElementById('exportChats');
    const importChatsBtn = document.getElementById('importChats');
    const chatImportFile = document.getElementById('chatImportFile');

    if (restoreChatsBtn) restoreChatsBtn.addEventListener('click', restorePreviousChats);
    if (clearChatBtn) clearChatBtn.addEventListener('click', clearCurrentChat);
    if (exportChatsBtn) exportChatsBtn.addEventListener('click', exportChatHistory);
    if (importChatsBtn) importChatsBtn.addEventListener('click', () => chatImportFile.click());
    if (chatImportFile) chatImportFile.addEventListener('change', importChatHistory);

    window.addEventListener('click', function(event) {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) closeModal();
        });
    });

    window.addEventListener('storage', function(e) {
        if (e.key === 'reminders') {
            loadReminders();
            updateStats();
        }
    });

    setInterval(updateStats, 60000);
    setInterval(checkForReminderUpdates, 5000);
}

function checkForReminderUpdates() {
    const savedReminders = localStorage.getItem('reminders');
    if (savedReminders) {
        const parsed = JSON.parse(savedReminders);
        if (JSON.stringify(parsed) !== JSON.stringify(currentReminders)) {
            currentReminders = parsed;
            renderReminders();
            updateStats();
        }
    }
}

// ─── Welcome Greeting ─────────────────────────────────────────────────────────
function showWelcomeGreeting() {
    const hour = new Date().getHours();
    let timeGreet = 'Hello!';
    if (hour >= 5 && hour < 12) timeGreet = 'Good morning!';
    else if (hour >= 12 && hour < 17) timeGreet = 'Good afternoon!';
    else if (hour >= 17 && hour < 22) timeGreet = 'Good evening!';

    const fullGreeting = `${timeGreet} I'm your AI Care Companion — powered by Claude. I'm here to chat, answer your questions, share stories, or just keep you company. How can I help you today?`;

    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    const recentWelcome = chatHistory.find(m => m.isWelcomeGreeting && m.timestamp > fifteenMinutesAgo);

    if (!recentWelcome) {
        const greetingMessage = {
            type: 'companion',
            text: fullGreeting,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isWelcomeGreeting: true,
            timestamp: Date.now()
        };

        chatHistory.push(greetingMessage);
        saveChatToStorage();
        renderChatHistory();
    }

    recordDayActive();
}

// ─── Per-User Stats ───────────────────────────────────────────────────────────
/**
 * Days Active: count of distinct calendar days the user has visited this page.
 * Stored as a set of date strings under userStorage('activeDays').
 *
 * Chats Today: count of user messages sent today.
 * Stored under userStorage('chatsToday') as { date, count }.
 */

function recordDayActive() {
    const today = new Date().toDateString();
    const key = userStorage('activeDays');
    const stored = localStorage.getItem(key);
    const activeDays = stored ? JSON.parse(stored) : [];

    if (!activeDays.includes(today)) {
        activeDays.push(today);
        localStorage.setItem(key, JSON.stringify(activeDays));
    }
}

function getDaysActive() {
    const key = userStorage('activeDays');
    const stored = localStorage.getItem(key);
    if (!stored) return 0;
    return JSON.parse(stored).length;
}

function incrementChatCount() {
    const today = new Date().toDateString();
    const key = userStorage('chatsToday');
    const stored = localStorage.getItem(key);
    let data = stored ? JSON.parse(stored) : { date: today, count: 0 };

    // Reset count if it's a new day
    if (data.date !== today) {
        data = { date: today, count: 0 };
    }

    data.count += 1;
    localStorage.setItem(key, JSON.stringify(data));
}

function getChatsToday() {
    const today = new Date().toDateString();
    const key = userStorage('chatsToday');
    const stored = localStorage.getItem(key);
    if (!stored) return 0;
    const data = JSON.parse(stored);
    return data.date === today ? data.count : 0;
}

// ─── Stats Display ────────────────────────────────────────────────────────────
function updateStats() {
    const daysEl = document.getElementById('daysActiveStat');
    const chatsEl = document.getElementById('chatSessions');
    if (daysEl) daysEl.textContent = getDaysActive();
    if (chatsEl) chatsEl.textContent = getChatsToday();
}

// ─── Send Message ─────────────────────────────────────────────────────────────
async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const messageText = chatInput.value.trim();
    if (!messageText) return;

    // Add user message to UI
    const userMessage = {
        type: 'user',
        text: messageText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    addMessageToChat(userMessage);
    chatHistory.push(userMessage);
    chatInput.value = '';

    // Track stat
    incrementChatCount();
    updateStats();

    showTypingIndicator();
    saveChatToStorage();

    try {
        const reply = await callClaudeAPI(messageText);

        const aiMessage = {
            type: 'companion',
            text: reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        addMessageToChat(aiMessage);
        chatHistory.push(aiMessage);
    } catch (error) {
        console.error('Claude API error:', error);
        const errMessage = {
            type: 'companion',
            text: "I'm sorry, I'm having a little trouble connecting right now. Please try again in a moment! 💙",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        addMessageToChat(errMessage);
        chatHistory.push(errMessage);
    }

    saveChatToStorage();
}

// ─── Chat UI Helpers ──────────────────────────────────────────────────────────
function addMessageToChat(message) {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;

    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) typingIndicator.remove();

    const el = document.createElement('div');
    el.className = `message ${message.type}-message`;
    const avatar = message.type === 'user' ? '👤' : '🤖';

    el.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <p>${message.text.replace(/\n/g, '<br>')}</p>
            <span class="message-time">${message.time}</span>
        </div>
    `;

    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;

    const el = document.createElement('div');
    el.className = 'message companion-message typing-indicator';
    el.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderChatHistory() {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;
    chatMessages.innerHTML = '';
    chatHistory.forEach(message => {
        if (message.photo) {
            addPhotoMessageToChat(message);
        } else {
            addMessageToChat(message);
        }
    });
}

// ─── Quick Actions ────────────────────────────────────────────────────────────
async function handleQuickAction(event) {
    const actionType = event.currentTarget.classList[1];

    let prompt = '';
    if (actionType === 'medication') {
        prompt = 'Can you remind me about my medication and give me some tips for remembering to take it?';
        setTimeout(() => openReminderModal(), 1000);
    } else if (actionType === 'games') {
        prompt = 'Let\'s play a memory game!';
    } else if (actionType === 'stories') {
        prompt = 'Please tell me a short comforting story.';
    } else {
        prompt = 'How can you help me today?';
    }

    // Show user message
    const userMessage = {
        type: 'user',
        text: prompt,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    addMessageToChat(userMessage);
    chatHistory.push(userMessage);

    incrementChatCount();
    updateStats();
    showTypingIndicator();
    saveChatToStorage();

    try {
        const reply = await callClaudeAPI(prompt);
        const aiMessage = {
            type: 'companion',
            text: reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        addMessageToChat(aiMessage);
        chatHistory.push(aiMessage);
    } catch {
        addMessageToChat({
            type: 'companion',
            text: "I'm having trouble right now. Please try again! 💙",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    }
    saveChatToStorage();
}

// ─── Games ───────────────────────────────────────────────────────────────────
function startGame(event) {
    const gameCard = event.currentTarget.closest('.game-card-horizontal');
    const gameName = gameCard.querySelector('h4').textContent;

    showNotification(`Opening ${gameName}...`, 'info');

    const gameResponses = {
        'Memory Match': '🧠 Opening Memory Match! This game is wonderful for strengthening your memory. Have fun and take your time!',
        'Simple Trivia': '❓ Let\'s do some trivia! Fun questions are a great way to keep your mind sharp. Good luck!',
        'Word Association': '🔗 Time for Word Association! Connecting words and ideas is excellent brain exercise. Enjoy!'
    };

    switch(gameName) {
        case 'Memory Match':
            window.open('memory-match.html', 'MemoryMatch', 'width=900,height=800');
            break;
        case 'Simple Trivia':
            window.open('simple-trivia.html', 'SimpleTrivia', 'width=700,height=900');
            break;
        case 'Word Association':
            window.open('word-association.html', 'WordAssociation', 'width=900,height=800');
            break;
    }

    const gameMessage = {
        type: 'companion',
        text: gameResponses[gameName] || '🎮 Opening your game now! Every game you play helps keep your mind active!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    addMessageToChat(gameMessage);
    chatHistory.push(gameMessage);
    saveChatToStorage();
}

// ─── Reminders ───────────────────────────────────────────────────────────────
function resetRemindersToDefault() {
    const today = new Date().toISOString().split('T')[0];
    const defaultReminders = [
        { id: 1, title: 'Take morning medication', date: today, time: '09:00', completed: false },
        { id: 2, title: 'Doctor appointment',      date: today, time: '14:00', completed: false },
        { id: 3, title: 'Call family member',      date: today, time: '17:00', completed: false },
        { id: 4, title: 'Evening walk',            date: today, time: '19:00', completed: false }
    ];
    localStorage.setItem('reminders', JSON.stringify(defaultReminders));
    currentReminders = defaultReminders;
    renderReminders();
    updateStats();
    showNotification('Reminders reset to default!', 'success');
}

function loadReminders() {
    const saved = localStorage.getItem('reminders');
    if (saved) {
        currentReminders = JSON.parse(saved);
        renderReminders();
    } else {
        resetRemindersToDefault();
    }
}

function openReminderModal() {
    const modal = document.getElementById('reminderModal');
    if (!modal) return;
    modal.style.display = 'block';
    const now = new Date();
    const timeEl = document.getElementById('reminderTime');
    const dateEl = document.getElementById('reminderDate');
    if (timeEl) timeEl.value = now.toTimeString().substring(0, 5);
    if (dateEl) dateEl.value = now.toISOString().split('T')[0];
}

function saveReminder() {
    const title = document.getElementById('reminderTitle')?.value;
    const time  = document.getElementById('reminderTime')?.value;
    const date  = document.getElementById('reminderDate')?.value;

    if (!title || !time || !date) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    const newReminder = { id: Date.now(), title, date, time, completed: false };
    const existing = JSON.parse(localStorage.getItem('reminders') || '[]');
    existing.push(newReminder);
    localStorage.setItem('reminders', JSON.stringify(existing));
    currentReminders = existing;
    renderReminders();
    updateStats();
    closeModal();
    showNotification('Reminder added successfully!', 'success');
    const titleEl = document.getElementById('reminderTitle');
    if (titleEl) titleEl.value = '';
}

function renderReminders() {
    const list = document.querySelector('.reminders-list');
    if (!list) return;
    list.innerHTML = '';
    list.style.maxHeight = 'none';
    list.style.overflow = 'visible';

    const today = new Date().toISOString().split('T')[0];
    const todayReminders = currentReminders
        .filter(r => r.date === today)
        .sort((a, b) => a.time.localeCompare(b.time));

    if (todayReminders.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#666;padding:1rem;">No reminders for today</p>';
        return;
    }

    todayReminders.forEach(reminder => {
        const el = document.createElement('div');
        el.className = `reminder-item ${reminder.completed ? 'completed' : ''}`;
        el.innerHTML = `
            <div class="reminder-time">${reminder.time}</div>
            <div class="reminder-text">${reminder.title}</div>
            <div class="reminder-status">${reminder.completed ? '✓' : ''}</div>
        `;
        el.addEventListener('click', () => toggleReminderCompletion(reminder.id));
        list.appendChild(el);
    });
}

function toggleReminderCompletion(id) {
    const reminder = currentReminders.find(r => r.id === id);
    if (reminder) {
        reminder.completed = !reminder.completed;
        localStorage.setItem('reminders', JSON.stringify(currentReminders));
        renderReminders();
        updateStats();
        showNotification(`Reminder ${reminder.completed ? 'completed' : 'reopened'}!`, 'success');
    }
}

// ─── Chat Storage ─────────────────────────────────────────────────────────────
function saveChatToStorage() {
    localStorage.setItem(userStorage('aiCompanionChat'), JSON.stringify(chatHistory));
    updateStats();
}

function initializeChat() {
    const saved = localStorage.getItem(userStorage('aiCompanionChat'));
    if (saved) {
        chatHistory = JSON.parse(saved);
        renderChatHistory();
    }
    recordDayActive();
}

// ─── Backup / Export / Import ─────────────────────────────────────────────────
function loadChatBackups() {
    const saved = localStorage.getItem(userStorage('aiCompanionChatBackups'));
    if (saved) chatBackups = JSON.parse(saved);
}

function createChatBackup() {
    if (chatHistory.length > 0) {
        chatBackups.push({ timestamp: new Date().toISOString(), chats: JSON.parse(JSON.stringify(chatHistory)) });
        if (chatBackups.length > 5) chatBackups = chatBackups.slice(-5);
        localStorage.setItem(userStorage('aiCompanionChatBackups'), JSON.stringify(chatBackups));
    }
}

function restorePreviousChats() {
    if (chatBackups.length === 0) { showNotification('No previous chat backups found.', 'info'); return; }
    const recent = chatBackups[chatBackups.length - 1];
    if (confirm('Restore most recent chat backup? This will replace your current chat.')) {
        chatHistory = JSON.parse(JSON.stringify(recent.chats));
        apiMessages = []; // Reset API context
        saveChatToStorage();
        renderChatHistory();
        showNotification('Chat restored successfully!', 'success');
        closeModal();
        hasShownWelcome = false;
    }
}

function clearCurrentChat() {
    if (confirm('Are you sure you want to clear the current chat? This action cannot be undone.')) {
        createChatBackup();
        chatHistory = [];
        apiMessages = [];
        saveChatToStorage();
        renderChatHistory();
        hasShownWelcome = false;
        setTimeout(() => showWelcomeGreeting(), 500);
        showNotification('Chat cleared successfully!', 'success');
        closeModal();
    }
}

function exportChatHistory() {
    if (chatHistory.length === 0) { showNotification('No chat history to export.', 'info'); return; }
    const dataStr = JSON.stringify({ version: '1.0', exportDate: new Date().toISOString(), chats: chatHistory }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-companion-chat-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('Chat history exported successfully!', 'success');
    closeModal();
}

function importChatHistory(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            const chats = Array.isArray(imported) ? imported : (imported.chats || []);
            if (chats.length === 0) { showNotification('No valid chat data found.', 'error'); return; }
            if (confirm(`Import ${chats.length} chat messages? This will replace your current chat.`)) {
                createChatBackup();
                chatHistory = chats;
                apiMessages = [];
                saveChatToStorage();
                renderChatHistory();
                showNotification('Chat history imported!', 'success');
                closeModal();
                hasShownWelcome = false;
            }
        } catch { showNotification('Error importing chat file.', 'error'); }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ─── Camera ───────────────────────────────────────────────────────────────────
async function openCameraModal() {
    const modal = document.getElementById('cameraModal');
    if (!modal) return;
    modal.style.display = 'block';
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        const video = document.getElementById('cameraVideo');
        video.srcObject = stream;
        document.getElementById('capturePhoto').style.display = 'block';
        document.getElementById('retakePhoto').style.display = 'none';
        document.getElementById('uploadPhoto').style.display = 'none';
        document.getElementById('photoPreview').style.display = 'none';
        video.style.display = 'block';
    } catch { showNotification('Unable to access camera. Please check permissions.', 'error'); }
}

function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    capturedPhoto = canvas.toDataURL('image/jpeg', 0.8);
    document.getElementById('previewImage').src = capturedPhoto;
    document.getElementById('photoPreview').style.display = 'block';
    video.style.display = 'none';
    document.getElementById('capturePhoto').style.display = 'none';
    document.getElementById('retakePhoto').style.display = 'block';
    document.getElementById('uploadPhoto').style.display = 'block';
}

function retakePhoto() {
    document.getElementById('cameraVideo').style.display = 'block';
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('capturePhoto').style.display = 'block';
    document.getElementById('retakePhoto').style.display = 'none';
    document.getElementById('uploadPhoto').style.display = 'none';
    capturedPhoto = null;
}

async function uploadPhotoToChat() {
    if (!capturedPhoto) return;

    const photoMessage = {
        type: 'user', photo: capturedPhoto,
        text: 'I shared a photo',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    addPhotoMessageToChat(photoMessage);
    chatHistory.push(photoMessage);
    saveChatToStorage();
    closeModal();

    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }

    showTypingIndicator();

    // Claude can't actually see the photo over the text API, so give a warm response
    try {
        const reply = await callClaudeAPI('The user just shared a photo with you. Respond warmly, ask what the photo is about or if there\'s a story behind it.');
        const aiMessage = {
            type: 'companion', text: reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        addMessageToChat(aiMessage);
        chatHistory.push(aiMessage);
    } catch {
        addMessageToChat({ type: 'companion', text: 'What a wonderful photo! Would you like to tell me more about it? 📸', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    }
    saveChatToStorage();
}

function addPhotoMessageToChat(message) {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) typingIndicator.remove();

    const el = document.createElement('div');
    el.className = `message ${message.type}-message photo-message`;
    el.innerHTML = `
        <div class="message-avatar">${message.type === 'user' ? '👤' : '🤖'}</div>
        <div class="photo-content">
            <img src="${message.photo}" alt="Shared photo">
            <p class="photo-caption">${message.text}</p>
            <span class="message-time">${message.time}</span>
        </div>
    `;
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ─── Settings / Modals ────────────────────────────────────────────────────────
function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.style.display = 'block';
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    capturedPhoto = null;
}

// ─── Notification ─────────────────────────────────────────────────────────────
function showNotification(message, type = 'info') {
    document.querySelectorAll('.notification').forEach(n => n.remove());
    const n = document.createElement('div');
    n.className = `notification ${type}`;
    n.textContent = message;
    document.body.appendChild(n);
    setTimeout(() => { if (n.parentNode) n.parentNode.removeChild(n); }, 3000);
}

// ─── Misc ─────────────────────────────────────────────────────────────────────
function updateDailyTip() {
    const tipsContainer = document.getElementById('tipsContainer');
    if (tipsContainer && !tipsContainer.innerHTML.trim()) {
        tipsContainer.innerHTML = `
            <div class="daily-tip">
                <div class="tip-icon">🌞</div>
                <div class="tip-content">
                    <p class="tip-text">Loading your daily tip...</p>
                    <span class="tip-date">Today's Tip</span>
                </div>
            </div>
        `;
    }
}

function loadInitialData() {
    const saved = localStorage.getItem('reminders');
    if (saved) {
        currentReminders = JSON.parse(saved);
    } else {
        resetRemindersToDefault();
    }
    renderReminders();
}

// Reminder due-check
setInterval(function checkDueReminders() {
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5);
    const today = now.toISOString().split('T')[0];
    currentReminders.forEach(r => {
        if (r.date === today && r.time === currentTime && !r.completed) {
            showNotification(`⏰ Reminder: ${r.title}`, 'info');
            r.completed = true;
            localStorage.setItem('reminders', JSON.stringify(currentReminders));
        }
    });
}, 60000);

// ─── Console Commands ─────────────────────────────────────────────────────────
function setupConsoleCommands() {
    window.debugAICompanion = () => {
        console.log('🤖 AI Companion Debug Info:');
        console.log('📋 Current Reminders:', currentReminders);
        console.log('💬 Chat History Length:', chatHistory.length);
        console.log('🗝️ User Key:', getUserKey());
        console.log('📅 Days Active:', getDaysActive());
        console.log('💬 Chats Today:', getChatsToday());
    };
    window.clearAIChat = clearCurrentChat;
    window.resetAICompanionReminders = resetRemindersToDefault;
    console.log('🎮 Console commands: debugAICompanion(), clearAIChat(), resetAICompanionReminders()');
}

// ─── Global Export ────────────────────────────────────────────────────────────
window.AICompanion = {
    sendMessage, openReminderModal, closeModal, saveReminder,
    startGame, showNotification, openCameraModal, openSettingsModal
};
