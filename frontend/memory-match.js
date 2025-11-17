class MemoryMatch {
    constructor() {
        this.allSymbols = [
            '🍎', '🍌', '🍒', '🍕', '🏀', '🎸', '🚗', '🌟', '⭐', '🎵', 
            '🏠', '🌸', '📚', '🎨', '🐾', '🌞', '🌙', '⚽', '🎮', '📱',
            '☕', '🎂', '🐶', '🐱', '🌊', '🏖️', '🎁', '💡', '🔑', '📅'
        ];
        this.cards = [];
        this.flippedCards = [];
        this.moves = 0;
        this.matches = 0;
        this.gameStarted = false;
        this.startTime = null;
        this.timerInterval = null;
        this.difficulty = 'easy';
        this.pairCount = 6;
        this.gridColumns = 4;
        
        this.aiMessages = {
            start: "Let's start! Find all the matching pairs. You can do this! 🌟",
            correct: [
                "Great memory! You're amazing! 🌟",
                "Perfect match! Your brain is sharp! 💫",
                "Excellent! You found a pair! 🎯",
                "Wonderful! Keep going! ⭐",
                "Brilliant! Your memory is working great! 🔥",
                "Perfect match! You're unstoppable! 🚀"
            ],
            encouragement: [
                "You're doing fantastic! 🌟",
                "Your memory is shining today! 💫",
                "Keep up the great work! 🎯",
                "You're a memory master! ⭐",
                "Incredible progress! 🔥"
            ]
        };
        
        this.setDifficulty('easy');
    }

    setDifficulty(level) {
        this.difficulty = level;
        document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.difficulty-btn.${level}`).classList.add('active');
        
        switch(level) {
            case 'easy':
                this.pairCount = 6;
                this.gridColumns = 4;
                break;
            case 'medium':
                this.pairCount = 9;
                this.gridColumns = 4;
                break;
            case 'hard':
                this.pairCount = 12;
                this.gridColumns = 6;
                break;
        }
        
        this.startGame();
    }

    startGame() {
        this.createCards();
        this.renderBoard();
        this.resetStats();
        this.showAIMessage(`Starting ${this.difficulty} mode with ${this.pairCount} pairs! Good luck! 🍀`);
    }

    createCards() {
        // Select random symbols for this game
        const selectedSymbols = [...this.allSymbols]
            .sort(() => Math.random() - 0.5)
            .slice(0, this.pairCount);
        
        this.cards = [...selectedSymbols, ...selectedSymbols]
            .map((symbol, index) => ({ 
                id: index, 
                symbol, 
                flipped: false, 
                matched: false 
            }))
            .sort(() => Math.random() - 0.5);
    }

    renderBoard() {
        const board = document.getElementById('gameBoard');
        board.innerHTML = '';
        board.style.gridTemplateColumns = `repeat(${this.gridColumns}, 1fr)`;
        
        this.cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = `card ${card.flipped ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`;
            cardElement.innerHTML = card.flipped || card.matched ? card.symbol : '?';
            cardElement.addEventListener('click', () => this.flipCard(card));
            board.appendChild(cardElement);
        });
    }

    flipCard(card) {
        if (card.flipped || card.matched || this.flippedCards.length === 2) return;

        if (!this.gameStarted) {
            this.gameStarted = true;
            this.startTime = Date.now();
            this.startTimer();
        }

        card.flipped = true;
        this.flippedCards.push(card);
        this.renderBoard();

        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateStats();
            this.checkMatch();
        }
    }

    checkMatch() {
        const [card1, card2] = this.flippedCards;
        
        if (card1.symbol === card2.symbol) {
            // Match found
            card1.matched = true;
            card2.matched = true;
            this.matches++;
            this.updateStats();
            
            this.showAIMessage(this.getRandomAIMessage());
            
            // Check for game completion
            if (this.matches === this.pairCount) {
                setTimeout(() => this.gameComplete(), 500);
            }
        } else {
            // No match
            setTimeout(() => {
                card1.flipped = false;
                card2.flipped = false;
                this.renderBoard();
            }, 1000);
        }

        setTimeout(() => {
            this.flippedCards = [];
        }, 1000);
    }

    getRandomAIMessage() {
        const messages = this.matches % 3 === 0 ? 
            this.aiMessages.encouragement : 
            this.aiMessages.correct;
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

    updateStats() {
        document.getElementById('moves').textContent = this.moves;
        document.getElementById('matches').textContent = `${this.matches}/${this.pairCount}`;
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.gameStarted) {
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
                const seconds = (elapsed % 60).toString().padStart(2, '0');
                document.getElementById('timer').textContent = `${minutes}:${seconds}`;
            }
        }, 1000);
    }

    resetStats() {
        this.moves = 0;
        this.matches = 0;
        this.gameStarted = false;
        this.flippedCards = [];
        clearInterval(this.timerInterval);
        document.getElementById('moves').textContent = '0';
        document.getElementById('matches').textContent = '0';
        document.getElementById('timer').textContent = '00:00';
    }

    gameComplete() {
        clearInterval(this.timerInterval);
        this.createConfetti();
        
        const finalTime = document.getElementById('timer').textContent;
        const performance = this.moves <= this.pairCount * 1.5 ? "Outstanding! 🏆" : 
                          this.moves <= this.pairCount * 2 ? "Excellent! ⭐" : 
                          "Great job! 🌟";
        
        document.getElementById('finalStats').innerHTML = 
            `Completed in ${finalTime} with ${this.moves} moves!<br>${performance}`;
        
        document.getElementById('celebration').style.display = 'flex';
        this.showAIMessage(`🎉 CONGRATULATIONS! You've completed the ${this.difficulty} level Memory Match! ${performance}`);
    }

    createConfetti() {
        const colors = ['#ff6b6b', '#4ecdc4', '#c4b5fd', '#ffd166', '#06d6a0', '#118ab2'];
        for (let i = 0; i < 150; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 5 + 's';
                confetti.style.width = Math.random() * 10 + 5 + 'px';
                confetti.style.height = Math.random() * 10 + 5 + 'px';
                document.body.appendChild(confetti);
            }, i * 20);
        }
    }
}

function setDifficulty(level) {
    if (!window.memoryGame) {
        window.memoryGame = new MemoryMatch();
    }
    window.memoryGame.setDifficulty(level);
}

function startGame() {
    if (!window.memoryGame) {
        window.memoryGame = new MemoryMatch();
    }
    window.memoryGame.startGame();
}

function closeCelebration() {
    document.getElementById('celebration').style.display = 'none';
    document.querySelectorAll('.confetti').forEach(confetti => confetti.remove());
    if (window.memoryGame) {
        window.memoryGame.startGame();
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    window.memoryGame = new MemoryMatch();
});