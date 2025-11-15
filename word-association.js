class WordAssociation {
    constructor() {
        this.allWordPairs = {
            easy: [
                { word1: "Sun", word2: "Moon", category: "Celestial" },
                { word1: "Day", word2: "Night", category: "Time" },
                { word1: "Hot", word2: "Cold", category: "Temperature" },
                { word1: "Big", word2: "Small", category: "Size" },
                { word1: "Fast", word2: "Slow", category: "Speed" },
                { word1: "Happy", word2: "Sad", category: "Emotion" },
                { word1: "Land", word2: "Water", category: "Geography" },
                { word1: "City", word2: "Country", category: "Location" },
                { word1: "Summer", word2: "Winter", category: "Season" },
                { word1: "Breakfast", word2: "Dinner", category: "Meal" },
                { word1: "Morning", word2: "Evening", category: "Time" },
                { word1: "Light", word2: "Dark", category: "Appearance" },
                { word1: "Sweet", word2: "Sour", category: "Taste" },
                { word1: "Young", word2: "Old", category: "Age" },
                { word1: "Rich", word2: "Poor", category: "Wealth" }
            ],
            medium: [
                { word1: "Doctor", word2: "Patient", category: "Profession" },
                { word1: "Teacher", word2: "Student", category: "Education" },
                { word1: "Writer", word2: "Book", category: "Profession" },
                { word1: "Artist", word2: "Painting", category: "Art" },
                { word1: "Chef", word2: "Recipe", category: "Profession" },
                { word1: "Farmer", word2: "Crop", category: "Profession" },
                { word1: "Singer", word2: "Song", category: "Music" },
                { word1: "Actor", word2: "Role", category: "Entertainment" },
                { word1: "Driver", word2: "License", category: "Transport" },
                { word1: "Builder", word2: "Blueprint", category: "Construction" },
                { word1: "Sailor", word2: "Ship", category: "Profession" },
                { word1: "Pilot", word2: "Plane", category: "Aviation" },
                { word1: "Gardener", word2: "Plants", category: "Profession" },
                { word1: "Baker", word2: "Bread", category: "Food" },
                { word1: "Fisherman", word2: "Net", category: "Profession" }
            ],
            hard: [
                { word1: "Microscope", word2: "Bacteria", category: "Science" },
                { word1: "Telescope", word2: "Stars", category: "Astronomy" },
                { word1: "Thermometer", word2: "Temperature", category: "Science" },
                { word1: "Barometer", word2: "Pressure", category: "Weather" },
                { word1: "Stethoscope", word2: "Heartbeat", category: "Medical" },
                { word1: "Calculator", word2: "Numbers", category: "Math" },
                { word1: "Compass", word2: "Direction", category: "Navigation" },
                { word1: "Microphone", word2: "Sound", category: "Audio" },
                { word1: "Camera", word2: "Photograph", category: "Technology" },
                { word1: "Keyboard", word2: "Type", category: "Computer" },
                { word1: "Thermostat", word2: "Climate", category: "Home" },
                { word1: "Pedometer", word2: "Steps", category: "Fitness" },
                { word1: "Speedometer", word2: "Velocity", category: "Transport" },
                { word1: "Odometer", word2: "Distance", category: "Vehicle" },
                { word1: "Altimeter", word2: "Altitude", category: "Aviation" }
            ]
        };
        
        this.availableWords = [];
        this.associationPairs = [];
        this.matchedPairs = 0;
        this.score = 0;
        this.difficulty = 'easy';
        this.scrollInterval = null;
        this.scrollSpeed = 0;
        
        this.aiMessages = {
            start: "Welcome! Drag words from the left to their matches on the right. Let's connect some ideas! 🧠",
            correct: [
                "Perfect match! You're a word wizard! 🌟",
                "Excellent connection! Your mind is sharp! 💫",
                "Brilliant! You found the perfect pair! 🎯",
                "Wonderful! You're great at making connections! ⭐",
                "Amazing! Your associative thinking is impressive! 🔥",
                "Perfect! You're connecting ideas like a pro! 🚀"
            ],
            incorrect: [
                "Good try! That's not quite the right match. 💪",
                "Almost! Let's try a different combination. 🌟",
                "Interesting thought! Let's find the perfect partner. 🎯",
                "Close! Keep exploring the connections. 🚀"
            ],
            encouragement: [
                "You're doing fantastic with these word connections! 🌟",
                "Your associative thinking is really shining! 💫",
                "Wonderful progress! You're a word association star! 🎯",
                "You're making great connections! Keep it up! ⭐"
            ]
        };
        
        this.setDifficulty('easy');
    }

    setDifficulty(level) {
        this.difficulty = level;
        document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.difficulty-btn.${level}`).classList.add('active');
        document.getElementById('totalPairs').textContent = '6';
        this.startGame();
    }

    startGame() {
        // Select 6 random pairs from the chosen difficulty
        const selectedPairs = [...this.allWordPairs[this.difficulty]]
            .sort(() => Math.random() - 0.5)
            .slice(0, 6);
        
        this.setupGame(selectedPairs);
        this.renderWordPool();
        this.renderAssociationPairs();
        this.setupDragAndDrop();
        this.showAIMessage(`Starting ${this.difficulty} mode! Good luck! 🍀`);
        this.updateStats();
    }

    setupGame(selectedPairs) {
        this.availableWords = [];
        selectedPairs.forEach(pair => {
            this.availableWords.push({ word: pair.word1, pair: pair.word2, category: pair.category });
            this.availableWords.push({ word: pair.word2, pair: pair.word1, category: pair.category });
        });
        
        // Shuffle available words
        this.availableWords = this.availableWords.sort(() => Math.random() - 0.5);
        
        // Initialize empty association pairs
        this.associationPairs = selectedPairs.map(pair => ({
            word1: pair.word1,
            word2: null,
            category: pair.category,
            matched: false
        }));
        
        this.matchedPairs = 0;
        this.score = 0;
    }

    renderWordPool() {
        const wordPool = document.getElementById('wordPool');
        wordPool.innerHTML = '';
        
        this.availableWords.forEach((wordObj, index) => {
            const wordElement = document.createElement('div');
            wordElement.className = 'word-item';
            wordElement.textContent = wordObj.word;
            wordElement.draggable = true;
            wordElement.dataset.index = index;
            wordElement.addEventListener('dragstart', this.handleDragStart.bind(this));
            wordElement.addEventListener('dragend', this.handleDragEnd.bind(this));
            wordPool.appendChild(wordElement);
        });
    }

    renderAssociationPairs() {
        const associationPairs = document.getElementById('associationPairs');
        associationPairs.innerHTML = '';
        
        this.associationPairs.forEach((pair, index) => {
            const pairElement = document.createElement('div');
            pairElement.className = `association-pair ${pair.matched ? 'matched' : ''}`;
            pairElement.dataset.index = index;
            pairElement.addEventListener('dragover', this.handleDragOver.bind(this));
            pairElement.addEventListener('drop', this.handleDrop.bind(this));
            pairElement.addEventListener('dragenter', this.handleDragEnter.bind(this));
            pairElement.addEventListener('dragleave', this.handleDragLeave.bind(this));
            
            if (pair.matched) {
                pairElement.innerHTML = `
                    <div class="word-match">${pair.word1}</div>
                    <span class="connector">↔</span>
                    <div class="word-match">${pair.word2}</div>
                    <span class="category-badge">${pair.category}</span>
                `;
            } else {
                pairElement.innerHTML = `
                    <div class="word-match">${pair.word1}</div>
                    <span class="connector">+</span>
                    <div class="drop-zone">Drop match here</div>
                    <span class="category-badge">${pair.category}</span>
                `;
            }
            
            associationPairs.appendChild(pairElement);
        });
    }

    setupDragAndDrop() {
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
        
        const wordPool = document.getElementById('wordPool');
        const associationArea = document.getElementById('associationPairs');
        
        wordPool.addEventListener('dragover', this.handleContainerDragOver.bind(this));
        associationArea.addEventListener('dragover', this.handleContainerDragOver.bind(this));
    }

    handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.index);
        e.target.classList.add('dragging');
        this.startAutoScroll();
    }

    handleDragEnd(e) {
        document.querySelectorAll('.word-item').forEach(item => {
            item.classList.remove('dragging');
        });
        document.querySelectorAll('.association-pair').forEach(pair => {
            pair.classList.remove('drag-hover');
        });
        this.stopAutoScroll();
    }

    handleDragOver(e) {
        e.preventDefault();
    }

    handleDragEnter(e) {
        e.currentTarget.classList.add('drag-hover');
    }

    handleDragLeave(e) {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            e.currentTarget.classList.remove('drag-hover');
        }
    }

    handleContainerDragOver(e) {
        e.preventDefault();
        const container = e.currentTarget;
        const scrollThreshold = 50;
        const scrollSpeed = 10;
        
        const rect = container.getBoundingClientRect();
        const mouseY = e.clientY;
        
        const distanceFromTop = mouseY - rect.top;
        const distanceFromBottom = rect.bottom - mouseY;
        
        let scrollDirection = 0;
        if (distanceFromTop < scrollThreshold) {
            scrollDirection = -1;
        } else if (distanceFromBottom < scrollThreshold) {
            scrollDirection = 1;
        }
        
        const proximity = Math.min(distanceFromTop, distanceFromBottom);
        const speedMultiplier = proximity < scrollThreshold ? 
            (scrollThreshold - proximity) / scrollThreshold : 0;
        
        this.scrollSpeed = scrollDirection * scrollSpeed * speedMultiplier;
    }

    startAutoScroll() {
        this.stopAutoScroll();
        this.scrollInterval = setInterval(() => {
            if (this.scrollSpeed !== 0) {
                const wordPool = document.getElementById('wordPool');
                const associationArea = document.getElementById('associationPairs');
                
                if (wordPool && Math.abs(wordPool.scrollHeight - wordPool.clientHeight) > 1) {
                    wordPool.scrollTop += this.scrollSpeed;
                }
                if (associationArea && Math.abs(associationArea.scrollHeight - associationArea.clientHeight) > 1) {
                    associationArea.scrollTop += this.scrollSpeed;
                }
            }
        }, 16);
    }

    stopAutoScroll() {
        if (this.scrollInterval) {
            clearInterval(this.scrollInterval);
            this.scrollInterval = null;
        }
        this.scrollSpeed = 0;
    }

    handleDrop(e) {
        e.preventDefault();
        const wordIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const pairIndex = parseInt(e.currentTarget.dataset.index);
        const wordObj = this.availableWords[wordIndex];
        const pair = this.associationPairs[pairIndex];
        
        document.querySelectorAll('.word-item').forEach(item => {
            item.classList.remove('dragging');
        });
        document.querySelectorAll('.association-pair').forEach(pair => {
            pair.classList.remove('drag-hover');
        });
        this.stopAutoScroll();

        if (wordObj.pair === pair.word1) {
            pair.word2 = wordObj.word;
            pair.matched = true;
            this.matchedPairs++;
            this.score += 10;
            
            this.availableWords.splice(wordIndex, 1);
            
            this.showAIMessage(this.getRandomMessage(this.aiMessages.correct));
            this.renderWordPool();
            this.renderAssociationPairs();
            this.updateStats();
            
            if (this.matchedPairs === 6) {
                setTimeout(() => this.gameComplete(), 1000);
            }
        } else {
            this.showAIMessage(this.getRandomMessage(this.aiMessages.incorrect));
        }

        if (this.matchedPairs > 0 && this.matchedPairs % 2 === 0) {
            setTimeout(() => {
                this.showAIMessage(this.getRandomMessage(this.aiMessages.encouragement));
            }, 1000);
        }
    }

    checkMatches() {
        let correctMatches = 0;
        this.associationPairs.forEach(pair => {
            if (pair.word2 && this.isCorrectMatch(pair.word1, pair.word2)) {
                correctMatches++;
            }
        });
        
        if (correctMatches === 6) {
            this.showAIMessage("🎉 All matches are correct! You're a word association genius! 🌟");
        } else {
            this.showAIMessage(`You have ${correctMatches} correct matches out of 6. Keep going! 💪`);
        }
    }

    isCorrectMatch(word1, word2) {
        return this.associationPairs.some(pair => 
            (pair.word1 === word1 && pair.word2 === word2) || 
            (pair.word1 === word2 && pair.word2 === word1)
        );
    }

    updateStats() {
        document.getElementById('matchedPairs').textContent = this.matchedPairs;
        document.getElementById('score').textContent = this.score;
        
        const progress = (this.matchedPairs / 6) * 100;
        document.getElementById('progressBar').style.width = `${progress}%`;
    }

    getRandomMessage(messages) {
        return messages[Math.floor(Math.random() * messages.length)];
    }

    showAIMessage(message) {
        const aiMessage = document.getElementById('aiMessage');
        aiMessage.textContent = message;
        aiMessage.style.animation = 'none';
        setTimeout(() => {
            aiMessage.style.animation = 'fadeIn 0.5s ease';
        }, 10);
    }

    gameComplete() {
        let performance, emoji;
        if (this.score === 60) {
            performance = "PERFECT SCORE! You're a word association master!";
            emoji = "🏆";
        } else if (this.score >= 40) {
            performance = "Excellent! You've got great word skills!";
            emoji = "⭐";
        } else {
            performance = "Great job! You're making wonderful connections!";
            emoji = "🌟";
        }
        
        document.getElementById('finalStats').innerHTML = 
            `You matched all ${this.matchedPairs} word pairs with ${this.score} points!<br>${performance} ${emoji}`;
        
        this.showAIMessage(`🎉 ${performance} ${emoji}`);
        document.getElementById('celebration').style.display = 'flex';
    }
}

function setDifficulty(level) {
    if (!window.wordGame) {
        window.wordGame = new WordAssociation();
    }
    window.wordGame.setDifficulty(level);
}

function startGame() {
    if (!window.wordGame) {
        window.wordGame = new WordAssociation();
    }
    window.wordGame.startGame();
}

function checkMatches() {
    if (window.wordGame) {
        window.wordGame.checkMatches();
    }
}

function restartGame() {
    document.getElementById('celebration').style.display = 'none';
    if (window.wordGame) {
        window.wordGame.startGame();
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    window.wordGame = new WordAssociation();
});