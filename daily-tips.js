// Dynamic Daily Tips System
class DailyTips {
    constructor() {
        this.tipsDatabase = this.initializeTipsDatabase();
        this.usedTips = this.loadUsedTips();
        this.currentDate = new Date().toDateString();
        this.init();
    }

    init() {
        this.displayDailyTip();
        this.updateCurrentDate();
    }

    initializeTipsDatabase() {
        return [
            // Memory & Cognitive Tips
            {
                category: 'memory',
                text: "Try recalling three happy memories from your past today. It's great exercise for your mind!",
                icon: "🧠"
            },
            {
                category: 'memory', 
                text: "Looking at old photographs can help strengthen your memory pathways. Try it today!",
                icon: "📸"
            },
            {
                category: 'memory',
                text: "Remember, it's perfectly okay to forget things sometimes. Be gentle with yourself today.",
                icon: "💖"
            },

            // Emotional Support & Encouragement
            {
                category: 'emotional',
                text: "Every small accomplishment is worth celebrating. Be proud of yourself today!",
                icon: "🎉"
            },
            {
                category: 'emotional',
                text: "You are stronger than you think. Remember all the challenges you've overcome!",
                icon: "💪"
            },
            {
                category: 'emotional',
                text: "Take a moment to appreciate the simple joys around you today.",
                icon: "😊"
            },
            {
                category: 'emotional',
                text: "Your journey is unique and valuable. Every day you're making progress!",
                icon: "🌟"
            },

            // Practical Daily Living
            {
                category: 'practical',
                text: "Drinking a glass of water can help improve focus and memory. Stay hydrated today!",
                icon: "💧"
            },
            {
                category: 'practical',
                text: "A short walk outside can do wonders for your mood and mental clarity.",
                icon: "🚶‍♂️"
            },
            {
                category: 'practical',
                text: "Keeping a routine helps create comforting predictability in your day.",
                icon: "🕒"
            },

            // Social Connection
            {
                category: 'social',
                text: "Sharing a story with someone today can bring joy to both of you.",
                icon: "💬"
            },
            {
                category: 'social',
                text: "Remember that you're surrounded by people who care about you deeply.",
                icon: "👨‍👩‍👧"
            },
            {
                category: 'social',
                text: "A simple smile can brighten someone's day - including your own!",
                icon: "😄"
            },

            // Mindfulness & Relaxation
            {
                category: 'mindfulness',
                text: "Take three deep breaths. Notice how calm you can feel in this moment.",
                icon: "🌬️"
            },
            {
                category: 'mindfulness',
                text: "Listen to the sounds around you. Being present can be very peaceful.",
                icon: "👂"
            },
            {
                category: 'mindfulness',
                text: "Today, try to notice one beautiful thing you haven't noticed before.",
                icon: "🌻"
            },

            // Gentle Reminders
            {
                category: 'reminder',
                text: "Don't forget to take your medications as scheduled today.",
                icon: "💊"
            },
            {
                category: 'reminder',
                text: "Have you had enough water today? Staying hydrated is important!",
                icon: "🚰"
            },
            {
                category: 'reminder',
                text: "Remember to eat your meals at regular times for consistent energy.",
                icon: "🍎"
            },

            // Positive Affirmations
            {
                category: 'affirmation',
                text: "You are capable, you are strong, and you are doing your best today.",
                icon: "✨"
            },
            {
                category: 'affirmation',
                text: "Every day you learn something new about yourself and the world.",
                icon: "📚"
            },
            {
                category: 'affirmation',
                text: "Your presence makes a difference in the lives of those around you.",
                icon: "💫"
            }
        ];
    }

    getDailyTip() {
        const today = new Date().toDateString();
        
        // Check if we already have a tip for today
        if (this.usedTips[today]) {
            return this.usedTips[today];
        }

        // Get unused tips
        const unusedTips = this.tipsDatabase.filter(tip => 
            !Object.values(this.usedTips).includes(tip.text)
        );

        // If we've used all tips, reset and start fresh
        let selectedTip;
        if (unusedTips.length === 0) {
            this.usedTips = {}; // Reset used tips
            selectedTip = this.tipsDatabase[Math.floor(Math.random() * this.tipsDatabase.length)];
        } else {
            selectedTip = unusedTips[Math.floor(Math.random() * unusedTips.length)];
        }

        // Save today's tip
        this.usedTips[today] = selectedTip;
        this.saveUsedTips();

        return selectedTip;
    }

    displayDailyTip() {
        const tip = this.getDailyTip();
        const tipsContainer = document.getElementById('tipsContainer');
        
        tipsContainer.innerHTML = `
            <div class="daily-tip">
                <div class="tip-icon">${tip.icon}</div>
                <div class="tip-content">
                    <p class="tip-text">${tip.text}</p>
                    <span class="tip-date">Today's Tip</span>
                </div>
            </div>
        `;
    }

    updateCurrentDate() {
        document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    loadUsedTips() {
        const saved = localStorage.getItem('aiCompanionUsedTips');
        return saved ? JSON.parse(saved) : {};
    }

    saveUsedTips() {
        localStorage.setItem('aiCompanionUsedTips', JSON.stringify(this.usedTips));
    }

    // Method to manually reset tips (for testing or special circumstances)
    resetTips() {
        this.usedTips = {};
        this.saveUsedTips();
        this.displayDailyTip();
    }

    // Get tips by category for specialized display
    getTipsByCategory(category) {
        return this.tipsDatabase.filter(tip => tip.category === category);
    }

    // Get random tip from specific category
    getRandomTipByCategory(category) {
        const categoryTips = this.getTipsByCategory(category);
        return categoryTips[Math.floor(Math.random() * categoryTips.length)];
    }
}

// Initialize Daily Tips when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.dailyTips = new DailyTips();
});

// Utility function to reset tips (for development)
function resetAllTips() {
    if (window.dailyTips) {
        window.dailyTips.resetTips();
        alert('All tips have been reset! New tips will start fresh tomorrow.');
    }
}

// Make reset function available globally for debugging
window.resetAllTips = resetAllTips;