// Enhanced Dynamic Daily Tips System
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
            // Memory & Cognitive Tips (15 tips)
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
            {
                category: 'memory',
                text: "Try naming all your family members - it's a wonderful memory exercise!",
                icon: "👨‍👩‍👧‍👦"
            },
            {
                category: 'memory',
                text: "Create a 'memory palace' by associating items with familiar rooms in your home.",
                icon: "🏰"
            },
            {
                category: 'memory',
                text: "Practice repeating new information after 2 minutes, then 10 minutes, then 1 hour.",
                icon: "⏰"
            },
            {
                category: 'memory',
                text: "Try remembering what you had for dinner yesterday - it strengthens recent memory.",
                icon: "🍽️"
            },
            {
                category: 'memory',
                text: "Use rhymes or songs to remember important information like phone numbers.",
                icon: "🎵"
            },
            {
                category: 'memory',
                text: "Challenge yourself to remember the names of 5 childhood friends today.",
                icon: "👫"
            },
            {
                category: 'memory',
                text: "Practice visualization - picture your grocery list items in different rooms.",
                icon: "🛒"
            },
            {
                category: 'memory',
                text: "Try to recall your first teacher's name - it exercises long-term memory.",
                icon: "👩‍🏫"
            },
            {
                category: 'memory',
                text: "Use the 'chunking' method: group related information together for easier recall.",
                icon: "🧩"
            },
            {
                category: 'memory',
                text: "Practice remembering directions to familiar places without using GPS.",
                icon: "🗺️"
            },
            {
                category: 'memory',
                text: "Try to remember the plot of your favorite movie from beginning to end.",
                icon: "🎬"
            },
            {
                category: 'memory',
                text: "Create associations between new information and things you already know well.",
                icon: "🔗"
            },

            // Emotional Support & Encouragement (12 tips)
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
            {
                category: 'emotional',
                text: "It's okay to have difficult days. Tomorrow is always a fresh start.",
                icon: "🌅"
            },
            {
                category: 'emotional',
                text: "You have survived 100% of your bad days so far - that's impressive!",
                icon: "🏆"
            },
            {
                category: 'emotional',
                text: "Your feelings are valid, even when they're complicated or confusing.",
                icon: "💫"
            },
            {
                category: 'emotional',
                text: "Progress isn't always linear. Small steps forward still count as progress.",
                icon: "👣"
            },
            {
                category: 'emotional',
                text: "You don't have to be perfect to be worthy of love and respect.",
                icon: "❤️"
            },
            {
                category: 'emotional',
                text: "Your presence makes a difference in the lives of those around you.",
                icon: "✨"
            },
            {
                category: 'emotional',
                text: "It's courageous to ask for help when you need it - that's strength, not weakness.",
                icon: "🫂"
            },
            {
                category: 'emotional',
                text: "You have unique wisdom that comes from your life experiences.",
                icon: "📚"
            },

            // Practical Daily Living (10 tips)
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
            {
                category: 'practical',
                text: "Eating a balanced breakfast can improve your concentration throughout the morning.",
                icon: "🍎"
            },
            {
                category: 'practical',
                text: "Organize your medications in a weekly pill organizer to avoid confusion.",
                icon: "💊"
            },
            {
                category: 'practical',
                text: "Keep frequently used items in the same place to make them easier to find.",
                icon: "📍"
            },
            {
                category: 'practical',
                text: "Use sticky notes for important reminders - place them where you'll see them.",
                icon: "📝"
            },
            {
                category: 'practical',
                text: "Take regular breaks when doing tasks - your brain works better with rest periods.",
                icon: "☕"
            },
            {
                category: 'practical',
                text: "Good lighting can reduce eye strain and help with reading and tasks.",
                icon: "💡"
            },
            {
                category: 'practical',
                text: "Label drawers and cabinets to make finding things easier and reduce frustration.",
                icon: "🏷️"
            },

            // Social Connection (8 tips)
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
            {
                category: 'social',
                text: "Call a friend or family member just to say hello and check in.",
                icon: "📞"
            },
            {
                category: 'social',
                text: "Share a meal with someone - food tastes better with good company.",
                icon: "🍽️"
            },
            {
                category: 'social',
                text: "Ask someone about their day and really listen to their response.",
                icon: "👂"
            },
            {
                category: 'social',
                text: "Join a community activity or group that interests you.",
                icon: "👥"
            },
            {
                category: 'social',
                text: "Write a letter or card to someone you haven't spoken to in a while.",
                icon: "✉️"
            },

            // Mindfulness & Relaxation (10 tips)
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
            {
                category: 'mindfulness',
                text: "Practice the 5-4-3-2-1 grounding technique: notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.",
                icon: "🌍"
            },
            {
                category: 'mindfulness',
                text: "Spend 5 minutes just watching clouds or birds - no agenda, just observing.",
                icon: "☁️"
            },
            {
                category: 'mindfulness',
                text: "Try a body scan meditation: slowly notice sensations from head to toe.",
                icon: "🧘"
            },
            {
                category: 'mindfulness',
                text: "Eat one meal today in complete silence, focusing only on the taste and texture.",
                icon: "🍴"
            },
            {
                category: 'mindfulness',
                text: "Notice the temperature of the air on your skin right now.",
                icon: "🌡️"
            },
            {
                category: 'mindfulness',
                text: "Practice gratitude by thinking of three specific things you're thankful for.",
                icon: "🙏"
            },
            {
                category: 'mindfulness',
                text: "Watch a candle flame for 2 minutes - let your mind focus only on the flickering light.",
                icon: "🕯️"
            },

            // Gentle Reminders (8 tips)
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
            {
                category: 'reminder',
                text: "Check your calendar for any appointments or important dates today.",
                icon: "📅"
            },
            {
                category: 'reminder',
                text: "Have you moved your body today? Even gentle stretching helps.",
                icon: "🏃"
            },
            {
                category: 'reminder',
                text: "Remember to charge your phone and other important devices.",
                icon: "🔋"
            },
            {
                category: 'reminder',
                text: "Check the weather before going outside to dress appropriately.",
                icon: "🌤️"
            },
            {
                category: 'reminder',
                text: "Make sure you have your keys, wallet, and phone before leaving home.",
                icon: "🔑"
            },

            // Positive Affirmations (12 tips)
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
            },
            {
                category: 'affirmation',
                text: "You have overcome challenges before, and you can handle what comes today.",
                icon: "🛡️"
            },
            {
                category: 'affirmation',
                text: "Your worth is not determined by your memory or cognitive abilities.",
                icon: "⭐"
            },
            {
                category: 'affirmation',
                text: "You bring unique perspectives and wisdom to every situation.",
                icon: "🎯"
            },
            {
                category: 'affirmation',
                text: "It's okay to take things one step at a time - progress is progress.",
                icon: "🚶"
            },
            {
                category: 'affirmation',
                text: "You deserve kindness, especially from yourself.",
                icon: "💝"
            },
            {
                category: 'affirmation',
                text: "Your life experiences have made you resilient and wise.",
                icon: "🌳"
            },
            {
                category: 'affirmation',
                text: "You are loved exactly as you are, right in this moment.",
                icon: "❤️"
            },
            {
                category: 'affirmation',
                text: "Every breath you take is a new beginning and a fresh opportunity.",
                icon: "🌱"
            },
            {
                category: 'affirmation',
                text: "You have the strength to face whatever today brings.",
                icon: "⚡"
            },

            // Brain Health & Nutrition (10 tips)
            {
                category: 'brain',
                text: "Foods rich in omega-3 fatty acids like salmon and walnuts are great for brain health.",
                icon: "🐟"
            },
            {
                category: 'brain',
                text: "Blueberries are packed with antioxidants that protect your brain cells.",
                icon: "🫐"
            },
            {
                category: 'brain',
                text: "Dark leafy greens like spinach and kale support cognitive function.",
                icon: "🥬"
            },
            {
                category: 'brain',
                text: "Turmeric contains curcumin, which may help reduce inflammation in the brain.",
                icon: "🟨"
            },
            {
                category: 'brain',
                text: "Nuts and seeds provide vitamin E, which protects brain cells from damage.",
                icon: "🥜"
            },
            {
                category: 'brain',
                text: "Dark chocolate in moderation can improve blood flow to the brain.",
                icon: "🍫"
            },
            {
                category: 'brain',
                text: "Eggs are rich in choline, which is important for memory and brain function.",
                icon: "🥚"
            },
            {
                category: 'brain',
                text: "Green tea contains compounds that may enhance brain function and alertness.",
                icon: "🍵"
            },
            {
                category: 'brain',
                text: "Broccoli is high in compounds that support brain health and reduce inflammation.",
                icon: "🥦"
            },
            {
                category: 'brain',
                text: "Pumpkin seeds are rich in zinc, crucial for nerve signaling in the brain.",
                icon: "🎃"
            },

            // Sleep & Rest (8 tips)
            {
                category: 'sleep',
                text: "Aim for 7-9 hours of quality sleep each night for optimal brain function.",
                icon: "😴"
            },
            {
                category: 'sleep',
                text: "Keep a consistent sleep schedule, even on weekends.",
                icon: "⏰"
            },
            {
                category: 'sleep',
                text: "Create a relaxing bedtime routine to signal your brain it's time to sleep.",
                icon: "🛁"
            },
            {
                category: 'sleep',
                text: "Avoid screens for at least an hour before bedtime for better sleep quality.",
                icon: "📵"
            },
            {
                category: 'sleep',
                text: "Keep your bedroom cool, dark, and quiet for optimal sleeping conditions.",
                icon: "🌙"
            },
            {
                category: 'sleep',
                text: "Limit caffeine intake in the afternoon and evening for better sleep.",
                icon: "☕"
            },
            {
                category: 'sleep',
                text: "Short power naps (20-30 minutes) can boost alertness without affecting nighttime sleep.",
                icon: "💤"
            },
            {
                category: 'sleep',
                text: "Regular exercise during the day can help you sleep better at night.",
                icon: "🏃"
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
            !Object.values(this.usedTips).some(usedTip => usedTip.text === tip.text)
        );

        // If we've used all tips or very few left, reset and start fresh
        let selectedTip;
        if (unusedTips.length <= 5) {
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
        
        if (tipsContainer) {
            tipsContainer.innerHTML = `
                <div class="daily-tip">
                    <div class="tip-icon">${tip.icon}</div>
                    <div class="tip-content">
                        <p class="tip-text">${tip.text}</p>
                        <span class="tip-date">Today's Tip • ${tip.category.charAt(0).toUpperCase() + tip.category.slice(1)}</span>
                    </div>
                </div>
            `;
        }
    }

    updateCurrentDate() {
        const dateElement = document.getElementById('currentDate');
        if (dateElement) {
            dateElement.textContent = new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
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

    // Get statistics about tips
    getTipsStatistics() {
        const totalTips = this.tipsDatabase.length;
        const usedCount = Object.keys(this.usedTips).length;
        const remaining = totalTips - usedCount;
        
        return {
            total: totalTips,
            used: usedCount,
            remaining: remaining,
            percentageUsed: Math.round((usedCount / totalTips) * 100)
        };
    }

    // Display tips statistics (for debugging)
    showStatistics() {
        const stats = this.getTipsStatistics();
        console.log('📊 Daily Tips Statistics:');
        console.log(`   Total Tips: ${stats.total}`);
        console.log(`   Tips Used: ${stats.used}`);
        console.log(`   Tips Remaining: ${stats.remaining}`);
        console.log(`   Completion: ${stats.percentageUsed}%`);
        
        return stats;
    }
}

// Initialize Daily Tips when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.dailyTips = new DailyTips();
    
    // Log statistics on load
    setTimeout(() => {
        if (window.dailyTips) {
            window.dailyTips.showStatistics();
        }
    }, 1000);
});

// Enhanced utility function to reset tips (for development)
function resetAllTips() {
    if (window.dailyTips) {
        window.dailyTips.resetTips();
        const stats = window.dailyTips.showStatistics();
        alert(`All tips have been reset! You now have ${stats.total} unique tips available.`);
    }
}

// Function to show tips statistics
function showTipsStatistics() {
    if (window.dailyTips) {
        const stats = window.dailyTips.showStatistics();
        alert(`Tips Statistics:\nTotal: ${stats.total}\nUsed: ${stats.used}\nRemaining: ${stats.remaining}\nCompletion: ${stats.percentageUsed}%`);
    }
}

// Make functions available globally for debugging
window.resetAllTips = resetAllTips;
window.showTipsStatistics = showTipsStatistics;