class WordAssociation {
    constructor() {
        this.wordPairs = [
            { word1: "Sun", word2: "Moon", category: "Celestial" },
            { word1: "Day", word2: "Night", category: "Time" },
            { word1: "Hot", word2: "Cold", category: "Temperature" },
            { word1: "Big", word2: "Small", category: "Size" },
            { word1: "Fast", word2: "Slow", category: "Speed" },
            { word1: "Happy", word2: "Sad", category: "Emotion" },
            { word1: "Land", word2: "Water", category: "Geography" },
            { word1: "City", word2: "Country", category: "Location" },
            { word1: "Summer", word2: "Winter", category: "Season" },
            { word1: "Breakfast", word2: "Dinner", category: "Meal" }
        ];
        this.availableWords = [];
        this.associationPairs = [];
        this.matchedPairs = 0;
        this.score = 0;
        this.scrollInterval = null;
        this.aiMessages = {
            start: "Welcome! Drag words from the left to their matches on the right. Let's connect some ideas! 🧠",
            correct: [
                "Perfect match! You're a word wizard! 🌟",
                "Excellent connection! Your mind is sharp! 💫",
                "Brilliant! You found the perfect pair! 🎯",
                "Wonderful! You're great at making connections! ⭐",
                "Amazing! Your associative thinking is impressive! 🔥",
                "Perfect! You're connecting ideas like a pro! 🚀",
                "Excellent! Your brain is making great links! 👑",
                "Brilliant connection! You're a natural! 🌈"
            ],
            incorrect: [
                "Good try! That's not quite the right match. 💪",
                "Almost! Let's try a different combination. 🌟",
                "Interesting thought! Let's find the perfect partner. 🎯",
                "Close! Keep exploring the connections. 🚀",
                "Nice attempt! The right match is waiting. 🌈"
            ],
            encouragement: [
                "You're doing fantastic with these word connections! 🌟",
                "Your associative thinking is really shining! 💫",
                "Wonderful progress! You're a word association star! 🎯",
                "You're making great connections! Keep it up! ⭐",
                "Your brain is working beautifully today! 🔥"
            ]
        };
        this.init();
    }

    init() {
        this.setupGame();
        this.renderWordPool();
        this.renderAssociationPairs();
        this.setupDragAndDrop();
        this.showAIMessage(this.aiMessages.start);
        this.updateStats();
    }

    setupGame() {
        this.availableWords = [];
        this.wordPairs.forEach(pair => {
            this.availableWords.push({ word: pair.word1, pair: pair.word2, category: pair.category });
            this.availableWords.push({ word: pair.word2, pair: pair.word1, category: pair.category });
        });
        
        // Shuffle available words
        this.availableWords = this.availableWords.sort(() => Math.random() - 0.5);
        
        // Initialize empty association pairs
        this.associationPairs = this.wordPairs.map(pair => ({
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
                    <span>↔</span>
                    <div class="word-match">${pair.word2}</div>
                `;
            } else {
                pairElement.innerHTML = `
                    <div class="word-match">${pair.word1}</div>
                    <span>+</span>
                    <div class="drop-zone" style="min-width: 100px; color: #666; padding: 8px 15px; border: 2px dashed #ccc; border-radius: 20px;">Drop match here</div>
                `;
            }
            
            associationPairs.appendChild(pairElement);
        });
    }

    setupDragAndDrop() {
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
        
        // Setup auto-scroll containers
        const wordPool = document.getElementById('wordPool');
        const associationArea = document.getElementById('associationPairs');
        
        wordPool.addEventListener('dragover', this.handleContainerDragOver.bind(this));
        associationArea.addEventListener('dragover', this.handleContainerDragOver.bind(this));
    }

    handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.index);
        e.target.classList.add('dragging');
        
        // Start auto-scroll when dragging begins
        this.startAutoScroll();
    }

    handleDragEnd(e) {
        // Remove dragging class from all words
        document.querySelectorAll('.word-item').forEach(item => {
            item.classList.remove('dragging');
        });
        
        // Remove hover effects
        document.querySelectorAll('.association-pair').forEach(pair => {
            pair.classList.remove('drag-hover');
        });
        
        // Stop auto-scroll
        this.stopAutoScroll();
    }

    handleDragOver(e) {
        e.preventDefault();
    }

    handleDragEnter(e) {
        e.currentTarget.classList.add('drag-hover');
    }

    handleDragLeave(e) {
        // Only remove hover class if not dragging over a child element
        if (!e.currentTarget.contains(e.relatedTarget)) {
            e.currentTarget.classList.remove('drag-hover');
        }
    }

    handleContainerDragOver(e) {
        e.preventDefault();
        
        // Auto-scroll logic for containers
        const container = e.currentTarget;
        const scrollThreshold = 50; // pixels from edge
        const scrollSpeed = 10; // pixels per interval
        
        const rect = container.getBoundingClientRect();
        const mouseY = e.clientY;
        
        // Calculate distance from top and bottom edges
        const distanceFromTop = mouseY - rect.top;
        const distanceFromBottom = rect.bottom - mouseY;
        
        // Determine scroll direction and speed
        let scrollDirection = 0;
        if (distanceFromTop < scrollThreshold) {
            scrollDirection = -1; // Scroll up
        } else if (distanceFromBottom < scrollThreshold) {
            scrollDirection = 1; // Scroll down
        }
        
        // Update scroll speed based on proximity to edge
        const proximity = Math.min(distanceFromTop, distanceFromBottom);
        const speedMultiplier = proximity < scrollThreshold ? 
            (scrollThreshold - proximity) / scrollThreshold : 0;
        
        this.scrollSpeed = scrollDirection * scrollSpeed * speedMultiplier;
    }

    startAutoScroll() {
        this.stopAutoScroll(); // Clear any existing interval
        
        this.scrollInterval = setInterval(() => {
            if (this.scrollSpeed !== 0) {
                // Find the appropriate container to scroll
                const wordPool = document.getElementById('wordPool');
                const associationArea = document.getElementById('associationPairs');
                
                // Scroll both containers simultaneously for better UX
                if (wordPool && Math.abs(wordPool.scrollHeight - wordPool.clientHeight) > 1) {
                    wordPool.scrollTop += this.scrollSpeed;
                }
                if (associationArea && Math.abs(associationArea.scrollHeight - associationArea.clientHeight) > 1) {
                    associationArea.scrollTop += this.scrollSpeed;
                }
            }
        }, 16); // ~60fps
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
        
        // Remove dragging class from all words
        document.querySelectorAll('.word-item').forEach(item => {
            item.classList.remove('dragging');
        });

        // Remove hover effects
        document.querySelectorAll('.association-pair').forEach(pair => {
            pair.classList.remove('drag-hover');
        });

        // Stop auto-scroll
        this.stopAutoScroll();

        // Check if this is the correct match
        if (wordObj.pair === pair.word1) {
            // Correct match
            pair.word2 = wordObj.word;
            pair.matched = true;
            this.matchedPairs++;
            this.score += 10;
            
            // Remove the word from available words
            this.availableWords.splice(wordIndex, 1);
            
            this.showAIMessage(this.getRandomMessage(this.aiMessages.correct));
            this.renderWordPool();
            this.renderAssociationPairs();
            this.updateStats();
            
            // Check for game completion
            if (this.matchedPairs === this.wordPairs.length) {
                setTimeout(() => this.gameComplete(), 1000);
            }
        } else {
            // Incorrect match
            this.showAIMessage(this.getRandomMessage(this.aiMessages.incorrect));
        }

        // Show encouragement every 3 matches
        if (this.matchedPairs > 0 && this.matchedPairs % 3 === 0) {
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
        
        if (correctMatches === this.wordPairs.length) {
            this.showAIMessage("🎉 All matches are correct! You're a word association genius! 🌟");
        } else {
            this.showAIMessage(`You have ${correctMatches} correct matches out of ${this.wordPairs.length}. Keep going! 💪`);
        }
    }

    isCorrectMatch(word1, word2) {
        return this.wordPairs.some(pair => 
            (pair.word1 === word1 && pair.word2 === word2) || 
            (pair.word1 === word2 && pair.word2 === word1)
        );
    }

    updateStats() {
        document.getElementById('matchedPairs').textContent = this.matchedPairs;
        document.getElementById('totalPairs').textContent = this.wordPairs.length;
        document.getElementById('score').textContent = this.score;
        
        const progress = (this.matchedPairs / this.wordPairs.length) * 100;
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
        document.getElementById('finalStats').textContent = 
            `You matched all ${this.matchedPairs} word pairs with a perfect score of ${this.score}!`;
        
        this.showAIMessage("🏆 WORD ASSOCIATION MASTER! You've perfectly connected all the words! Your cognitive connections are incredible! 🌟");
        document.getElementById('celebration').style.display = 'flex';
    }
}

function startGame() {
    window.wordGame = new WordAssociation();
}

function checkMatches() {
    window.wordGame.checkMatches();
}

function restartGame() {
    document.getElementById('celebration').style.display = 'none';
    startGame();
}

// Initialize game when page loads
window.addEventListener('load', startGame);