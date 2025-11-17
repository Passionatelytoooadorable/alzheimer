class SimpleTrivia {
    constructor() {
        this.allQuestions = {
            easy: [
                {
                    question: "What color is the sky on a clear day?",
                    options: ["Red", "Blue", "Green", "Yellow"],
                    correct: 1,
                    category: "Nature"
                },
                {
                    question: "How many legs does a cat have?",
                    options: ["Two", "Four", "Six", "Eight"],
                    correct: 1,
                    category: "Animals"
                },
                {
                    question: "What do we use to see?",
                    options: ["Ears", "Eyes", "Nose", "Mouth"],
                    correct: 1,
                    category: "Body"
                },
                {
                    question: "What falls from the sky when it rains?",
                    options: ["Snow", "Leaves", "Raindrops", "Stars"],
                    correct: 2,
                    category: "Weather"
                },
                {
                    question: "What animal says 'meow'?",
                    options: ["Dog", "Cow", "Cat", "Bird"],
                    correct: 2,
                    category: "Animals"
                },
                {
                    question: "What do we use to write on paper?",
                    options: ["Spoon", "Pen", "Hammer", "Brush"],
                    correct: 1,
                    category: "Objects"
                },
                {
                    question: "What is the color of grass?",
                    options: ["Blue", "Red", "Green", "Purple"],
                    correct: 2,
                    category: "Nature"
                },
                {
                    question: "What do we wear on our feet?",
                    options: ["Hat", "Gloves", "Shoes", "Scarf"],
                    correct: 2,
                    category: "Clothing"
                },
                {
                    question: "What tells us the time?",
                    options: ["Book", "Clock", "Chair", "Lamp"],
                    correct: 1,
                    category: "Objects"
                },
                {
                    question: "What do birds use to fly?",
                    options: ["Fins", "Wheels", "Wings", "Legs"],
                    correct: 2,
                    category: "Animals"
                },
                {
                    question: "What do we drink when we're thirsty?",
                    options: ["Food", "Water", "Air", "Sleep"],
                    correct: 1,
                    category: "Health"
                },
                {
                    question: "What shines brightly in the night sky?",
                    options: ["Moon", "Cloud", "Mountain", "Tree"],
                    correct: 0,
                    category: "Space"
                },
                {
                    question: "What do plants need to grow?",
                    options: ["Water", "Stones", "Metal", "Plastic"],
                    correct: 0,
                    category: "Nature"
                },
                {
                    question: "What do we call the meal we eat in the morning?",
                    options: ["Lunch", "Dinner", "Breakfast", "Snack"],
                    correct: 2,
                    category: "Food"
                },
                {
                    question: "What do we use to cut paper?",
                    options: ["Spoon", "Scissors", "Cup", "Plate"],
                    correct: 1,
                    category: "Objects"
                }
            ],
            medium: [
                {
                    question: "Which season comes after winter?",
                    options: ["Summer", "Spring", "Autumn", "Monsoon"],
                    correct: 1,
                    category: "Seasons"
                },
                {
                    question: "What is the opposite of 'day'?",
                    options: ["Morning", "Evening", "Night", "Noon"],
                    correct: 2,
                    category: "Time"
                },
                {
                    question: "Which fruit is yellow and curved?",
                    options: ["Apple", "Banana", "Grape", "Orange"],
                    correct: 1,
                    category: "Food"
                },
                {
                    question: "What do we call a baby dog?",
                    options: ["Kitten", "Puppy", "Cub", "Chick"],
                    correct: 1,
                    category: "Animals"
                },
                {
                    question: "Which month comes after April?",
                    options: ["March", "May", "June", "July"],
                    correct: 1,
                    category: "Time"
                },
                {
                    question: "What do we use to tell direction?",
                    options: ["Thermometer", "Compass", "Watch", "Ruler"],
                    correct: 1,
                    category: "Geography"
                },
                {
                    question: "Which shape has three sides?",
                    options: ["Circle", "Square", "Triangle", "Rectangle"],
                    correct: 2,
                    category: "Math"
                },
                {
                    question: "What do bees make?",
                    options: ["Butter", "Cheese", "Honey", "Jam"],
                    correct: 2,
                    category: "Animals"
                },
                {
                    question: "Which is the largest ocean?",
                    options: ["Atlantic", "Indian", "Pacific", "Arctic"],
                    correct: 2,
                    category: "Geography"
                },
                {
                    question: "What do we call frozen water?",
                    options: ["Steam", "Ice", "Rain", "Dew"],
                    correct: 1,
                    category: "Science"
                },
                {
                    question: "Which planet is known as the Red Planet?",
                    options: ["Venus", "Mars", "Jupiter", "Saturn"],
                    correct: 1,
                    category: "Space"
                },
                {
                    question: "What do we use to measure temperature?",
                    options: ["Scale", "Thermometer", "Clock", "Compass"],
                    correct: 1,
                    category: "Science"
                },
                {
                    question: "Which bird can't fly but can swim?",
                    options: ["Eagle", "Sparrow", "Penguin", "Owl"],
                    correct: 2,
                    category: "Animals"
                },
                {
                    question: "What is the capital of France?",
                    options: ["London", "Berlin", "Paris", "Rome"],
                    correct: 2,
                    category: "Geography"
                },
                {
                    question: "Which is the smallest continent?",
                    options: ["Asia", "Australia", "Europe", "Africa"],
                    correct: 1,
                    category: "Geography"
                }
            ],
            hard: [
                {
                    question: "Which gas do plants absorb from the air?",
                    options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
                    correct: 2,
                    category: "Science"
                },
                {
                    question: "What is the largest mammal in the world?",
                    options: ["Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
                    correct: 1,
                    category: "Animals"
                },
                {
                    question: "Which planet has the most moons?",
                    options: ["Earth", "Mars", "Jupiter", "Saturn"],
                    correct: 3,
                    category: "Space"
                },
                {
                    question: "What is the main language spoken in Brazil?",
                    options: ["Spanish", "Portuguese", "English", "French"],
                    correct: 1,
                    category: "Geography"
                },
                {
                    question: "Which element has the chemical symbol 'O'?",
                    options: ["Gold", "Oxygen", "Osmium", "Oganesson"],
                    correct: 1,
                    category: "Science"
                },
                {
                    question: "What is the longest river in the world?",
                    options: ["Amazon", "Nile", "Yangtze", "Mississippi"],
                    correct: 1,
                    category: "Geography"
                },
                {
                    question: "Which artist painted the Mona Lisa?",
                    options: ["Van Gogh", "Picasso", "Da Vinci", "Monet"],
                    correct: 2,
                    category: "Art"
                },
                {
                    question: "What is the hardest natural substance on Earth?",
                    options: ["Gold", "Iron", "Diamond", "Platinum"],
                    correct: 2,
                    category: "Science"
                },
                {
                    question: "Which country is known as the Land of the Rising Sun?",
                    options: ["China", "Japan", "Thailand", "India"],
                    correct: 1,
                    category: "Geography"
                },
                {
                    question: "What is the study of fossils called?",
                    options: ["Biology", "Geology", "Paleontology", "Archaeology"],
                    correct: 2,
                    category: "Science"
                },
                {
                    question: "Which instrument has 88 keys?",
                    options: ["Violin", "Guitar", "Piano", "Harp"],
                    correct: 2,
                    category: "Music"
                },
                {
                    question: "What is the largest desert in the world?",
                    options: ["Sahara", "Arabian", "Gobi", "Antarctic"],
                    correct: 3,
                    category: "Geography"
                },
                {
                    question: "Which blood type is known as the universal donor?",
                    options: ["A", "B", "AB", "O"],
                    correct: 3,
                    category: "Science"
                },
                {
                    question: "What is the capital of Canada?",
                    options: ["Toronto", "Vancouver", "Ottawa", "Montreal"],
                    correct: 2,
                    category: "Geography"
                },
                {
                    question: "Which planet is known for its rings?",
                    options: ["Mars", "Jupiter", "Saturn", "Uranus"],
                    correct: 2,
                    category: "Space"
                }
            ]
        };
        
        this.currentQuestions = [];
        this.currentQuestion = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.difficulty = 'easy';
        this.gameActive = false;
        
        this.aiMessages = {
            start: "Welcome to Trivia! Let's see how much you know! 🧠",
            correct: [
                "Brilliant! You're so smart! 🌟",
                "Perfect answer! You're amazing! 💫",
                "Correct! Your knowledge is impressive! 🎯",
                "Right on! You're a trivia star! ⭐",
                "Excellent! You know your stuff! 🔥",
                "Perfect! You're on fire! 🚀"
            ],
            incorrect: [
                "Good try! Let's try another one! 💪",
                "Almost there! You'll get the next one! 🌟",
                "Nice attempt! Ready for the next challenge? 🎯",
                "That was a tricky one! Let's keep going! 🚀"
            ],
            encouragement: [
                "You're doing great! Keep it up! 🌟",
                "Wonderful progress! You've got this! 💫",
                "I believe in you! Keep going! 🎯",
                "Your memory is shining today! ⭐"
            ]
        };
        
        this.setDifficulty('easy');
    }

    setDifficulty(level) {
        this.difficulty = level;
        document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.difficulty-btn.${level}`).classList.add('active');
        this.showAIMessage(`Selected ${level} difficulty! Ready to start? 🎯`);
    }

    startGame() {
        // Select 6 random questions from the chosen difficulty
        this.currentQuestions = [...this.allQuestions[this.difficulty]]
            .sort(() => Math.random() - 0.5)
            .slice(0, 6);
        
        this.currentQuestion = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.gameActive = true;
        
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('questionContainer').style.display = 'block';
        
        this.updateStats();
        this.displayQuestion();
        this.showAIMessage(this.aiMessages.start);
    }

    displayQuestion() {
        if (this.currentQuestion >= this.currentQuestions.length) {
            this.gameComplete();
            return;
        }
        
        const question = this.currentQuestions[this.currentQuestion];
        document.getElementById('questionText').innerHTML = 
            `${question.question} <span class="category-badge">${question.category}</span>`;
        
        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.textContent = option;
            optionElement.addEventListener('click', () => this.selectAnswer(index));
            optionsContainer.appendChild(optionElement);
        });

        document.getElementById('nextBtn').style.display = 'none';
        document.getElementById('feedback').textContent = '';
        document.getElementById('feedback').className = 'feedback';
        
        this.updateProgress();
    }

    selectAnswer(selectedIndex) {
        if (!this.gameActive) return;
        
        const question = this.currentQuestions[this.currentQuestion];
        const options = document.querySelectorAll('.option');
        const feedback = document.getElementById('feedback');
        
        // Disable all options
        options.forEach(option => {
            option.style.pointerEvents = 'none';
        });

        if (selectedIndex === question.correct) {
            // Correct answer
            options[selectedIndex].classList.add('correct');
            feedback.textContent = 'Correct! 🎉';
            feedback.className = 'feedback correct-feedback';
            this.score += 10;
            this.correctAnswers++;
            this.showAIMessage(this.getRandomMessage(this.aiMessages.correct));
        } else {
            // Incorrect answer
            options[selectedIndex].classList.add('incorrect');
            options[question.correct].classList.add('correct');
            feedback.textContent = `Good try! The correct answer is: ${question.options[question.correct]}`;
            feedback.className = 'feedback incorrect-feedback';
            this.showAIMessage(this.getRandomMessage(this.aiMessages.incorrect));
        }

        this.updateStats();
        document.getElementById('nextBtn').style.display = 'block';
        this.gameActive = false;
    }

    nextQuestion() {
        this.currentQuestion++;
        this.gameActive = true;
        this.displayQuestion();
    }

    updateStats() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('questionCount').textContent = `${this.currentQuestion + 1}/${this.currentQuestions.length}`;
        document.getElementById('correctCount').textContent = this.correctAnswers;
    }

    updateProgress() {
        const progress = ((this.currentQuestion) / this.currentQuestions.length) * 100;
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
        const percentage = Math.round((this.correctAnswers / this.currentQuestions.length) * 100);
        let performance, emoji;
        
        if (percentage === 100) {
            performance = "PERFECT SCORE! You're a trivia genius!";
            emoji = "🏆";
        } else if (percentage >= 80) {
            performance = "Outstanding! You're a trivia master!";
            emoji = "⭐";
        } else if (percentage >= 60) {
            performance = "Great job! You've got impressive knowledge!";
            emoji = "🎯";
        } else {
            performance = "Good effort! You're learning and improving!";
            emoji = "🌟";
        }
        
        document.getElementById('finalScore').innerHTML = 
            `You scored ${this.score} points with ${this.correctAnswers}/${this.currentQuestions.length} correct (${percentage}%)!<br>${performance} ${emoji}`;
        
        this.showAIMessage(`🎉 ${performance} ${emoji}`);
        document.getElementById('celebration').style.display = 'flex';
        document.getElementById('questionContainer').style.display = 'none';
    }
}

function setDifficulty(level) {
    if (!window.triviaGame) {
        window.triviaGame = new SimpleTrivia();
    }
    window.triviaGame.setDifficulty(level);
}

function startGame() {
    if (!window.triviaGame) {
        window.triviaGame = new SimpleTrivia();
    }
    window.triviaGame.startGame();
}

function nextQuestion() {
    if (window.triviaGame) {
        window.triviaGame.nextQuestion();
    }
}

function restartGame() {
    document.getElementById('celebration').style.display = 'none';
    document.getElementById('startBtn').style.display = 'inline-block';
    if (window.triviaGame) {
        window.triviaGame.startGame();
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    window.triviaGame = new SimpleTrivia();
});