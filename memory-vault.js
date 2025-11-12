// Memory Vault JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize memory vault
    initMemoryVault();
    
    // Load sample memories
    loadSampleMemories();
    
    // Setup event listeners
    setupEventListeners();
});

function initMemoryVault() {
    console.log('Memory Vault initialized');
    
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
}

function loadSampleMemories() {
    const sampleMemories = [
        {
            id: 1,
            name: "Alex",
            relationship: "grandchild",
            description: "This is Ankit, grandson. His birthday was on 19th June. He loves playing football and visiting the beach with us every summer.",
            image: "👦",
            color: "#4ecdc4"
        },
        {
            id: 2,
            name: "Ella Johnson",
            relationship: "daughter",
            description: "My wonderful daughter Priya. She's a doctor and visits every weekend with her family. She makes the best chocolate cake!",
            image: "👩",
            color: "#ff6b6b"
        },
        {
            id: 3,
            name: "Robert Johnson",
            relationship: "spouse",
            description: "My loving husband Robert. We've been married for 45 years. He loves gardening and reading mystery novels together.",
            image: "👴",
            color: "#a8d0e6"
        },
        {
            id: 4,
            name: "Sarah & Mike",
            relationship: "friends",
            description: "Our dear friends from the book club. We meet every Thursday for tea and discuss our latest reads. 30 years of friendship!",
            image: "👫",
            color: "#ffd166"
        }
    ];

    // Always ensure sample memories are available
    const existingMemories = JSON.parse(localStorage.getItem('memories')) || [];
    
    // If no memories exist, load the sample memories
    if (existingMemories.length === 0) {
        localStorage.setItem('memories', JSON.stringify(sampleMemories));
    }

    displayMemories();
}

function displayMemories(filter = 'all') {
    const memories = JSON.parse(localStorage.getItem('memories')) || [];
    const memoryGrid = document.getElementById('memoryGrid');
    
    // Update stats
    document.getElementById('totalMemories').textContent = memories.length;
    document.getElementById('totalPeople').textContent = new Set(memories.map(m => m.name)).size;
    
    // Filter memories
    const filteredMemories = filter === 'all' ? memories : 
        memories.filter(memory => memory.relationship === filter);
    
    document.getElementById('recentAdded').textContent = filteredMemories.length;

    // Clear grid
    memoryGrid.innerHTML = '';

    // Add memory cards
    filteredMemories.forEach(memory => {
        const memoryCard = createMemoryCard(memory);
        memoryGrid.appendChild(memoryCard);
    });

    // Show empty state if no memories
    if (filteredMemories.length === 0) {
        memoryGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📸</div>
                <h3>No memories found</h3>
                <p>Add your first memory to get started!</p>
                <button class="action-btn primary" onclick="openAddMemoryForm()">
                    Add Your First Memory
                </button>
            </div>
        `;
    }
}

function createMemoryCard(memory) {
    const card = document.createElement('div');
    card.className = 'memory-card';
    card.innerHTML = `
        <div class="memory-image" style="background: ${memory.color}">
            ${memory.image}
        </div>
        <div class="memory-info">
            <div class="memory-name">${memory.name}</div>
            <div class="memory-relationship">${getRelationshipLabel(memory.relationship)}</div>
            <div class="memory-description">${memory.description}</div>
            <div class="memory-actions">
                <button class="memory-btn primary" onclick="viewMemory(${memory.id})">View Details</button>
                <button class="memory-btn secondary" onclick="editMemory(${memory.id})">Edit</button>
            </div>
        </div>
    `;
    return card;
}

function getRelationshipLabel(relationship) {
    const labels = {
        'spouse': 'Spouse/Partner',
        'child': 'Child',
        'grandchild': 'Grandchild',
        'sibling': 'Brother/Sister',
        'friend': 'Friend',
        'caregiver': 'Caregiver',
        'other': 'Other'
    };
    return labels[relationship] || relationship;
}

function setupEventListeners() {
    // Add Memory Button
    document.getElementById('addMemoryBtn').addEventListener('click', openAddMemoryForm);
    
    // Camera Button
    document.getElementById('cameraBtn').addEventListener('click', openCameraSection);
    
    // Cancel Camera Button
    document.getElementById('cancelCameraBtn').addEventListener('click', closeCameraSection);
    
    // Voice Record Button
    document.getElementById('voiceRecordBtn').addEventListener('click', startVoiceRecording);
    
    // Filter Buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            displayMemories(this.dataset.filter);
        });
    });
    
    // Form submission
    document.getElementById('addMemoryForm').addEventListener('submit', handleMemorySubmit);
    
    // Cancel button
    document.getElementById('cancelAddMemory').addEventListener('click', closeAddMemoryForm);
    
    // Upload Area
    setupUploadArea();
    
    // Camera functionality
    setupCameraFunctionality();
}

function openAddMemoryForm() {
    // Hide welcome illustration
    document.getElementById('welcomeIllustration').style.display = 'none';
    // Show memory form
    document.getElementById('memoryFormContainer').style.display = 'block';
}

function closeAddMemoryForm() {
    // Show welcome illustration
    document.getElementById('welcomeIllustration').style.display = 'block';
    // Hide memory form
    document.getElementById('memoryFormContainer').style.display = 'none';
    // Reset form
    resetMemoryForm();
}

function openCameraSection() {
    document.getElementById('cameraSection').style.display = 'block';
    // Scroll to camera section
    document.getElementById('cameraSection').scrollIntoView({ behavior: 'smooth' });
}

function closeCameraSection() {
    document.getElementById('cameraSection').style.display = 'none';
    // Reset camera state
    resetCameraState();
}

function setupCameraFunctionality() {
    document.getElementById('startCamera').addEventListener('click', function() {
        showNotification('Camera started! This would access your camera in a real app.', 'info');
        document.getElementById('captureBtn').disabled = false;
    });

    document.getElementById('captureBtn').addEventListener('click', function() {
        showNotification('Photo captured! Recognizing person...', 'info');
        
        // Simulate recognition after delay
        setTimeout(() => {
            document.getElementById('recognitionResult').style.display = 'block';
            showNotification('Person recognized! Match found in your memory vault.', 'success');
        }, 2000);
    });

    document.getElementById('uploadPhoto').addEventListener('click', function() {
        showNotification('Photo upload feature coming soon!', 'info');
    });
}

function resetCameraState() {
    document.getElementById('captureBtn').disabled = true;
    document.getElementById('recognitionResult').style.display = 'none';
}

function setupUploadArea() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('memoryPhoto');
    const imagePreview = document.getElementById('imagePreview');
    const previewImage = document.getElementById('previewImage');
    const removeImageBtn = document.getElementById('removeImage');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.background = '#e3f2fd';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.background = '#f8f9fa';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.background = '#f8f9fa';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageUpload(files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageUpload(e.target.files[0]);
        }
    });
    
    removeImageBtn.addEventListener('click', () => {
        imagePreview.style.display = 'none';
        fileInput.value = '';
        uploadArea.style.display = 'block';
    });
}

function handleImageUpload(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('previewImage').src = e.target.result;
        document.getElementById('imagePreview').style.display = 'block';
        document.getElementById('uploadArea').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function handleMemorySubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const memory = {
        id: Date.now(),
        name: formData.get('personName'),
        relationship: formData.get('relationship'),
        description: formData.get('memoryDescription'),
        image: '👤', // Default emoji
        color: getRandomColor()
    };
    
    // Save to localStorage
    const memories = JSON.parse(localStorage.getItem('memories')) || [];
    memories.push(memory);
    localStorage.setItem('memories', JSON.stringify(memories));
    
    // Update dashboard stats
    if (typeof window.dashboardFunctions !== 'undefined') {
        window.dashboardFunctions.addMemory();
    }
    
    // Close form and reset
    closeAddMemoryForm();
    
    // Refresh display
    displayMemories();
    
    // Show success message
    showNotification('Memory added successfully!', 'success');
}

function resetMemoryForm() {
    document.getElementById('addMemoryForm').reset();
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('voicePreview').style.display = 'none';
}

function getRandomColor() {
    const colors = ['#4ecdc4', '#ff6b6b', '#a8d0e6', '#ffd166', '#a8e6cf', '#ffaaa5'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function startVoiceRecording() {
    showNotification('Voice recording feature coming soon!', 'info');
}

function viewMemory(id) {
    const memories = JSON.parse(localStorage.getItem('memories')) || [];
    const memory = memories.find(m => m.id === id);
    if (memory) {
        alert(`Memory Details:\n\nName: ${memory.name}\nRelationship: ${getRelationshipLabel(memory.relationship)}\n\nDescription: ${memory.description}`);
    }
}

function editMemory(id) {
    showNotification('Edit feature coming soon!', 'info');
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        ${type === 'success' ? 'background: #4ecdc4;' : 'background: #a8d0e6;'}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Emergency reset function for demo (hidden from UI)
function resetToSampleMemories() {
    const sampleMemories = [
        {
            id: 1,
            name: "Alex",
            relationship: "grandchild",
            description: "This is Ankit, grandson. His birthday was on 19th June. He loves playing football and visiting the beach with us every summer.",
            image: "👦",
            color: "#4ecdc4"
        },
        {
            id: 2,
            name: "Ella Johnson",
            relationship: "daughter",
            description: "My wonderful daughter Priya. She's a doctor and visits every weekend with her family. She makes the best chocolate cake!",
            image: "👩",
            color: "#ff6b6b"
        },
        {
            id: 3,
            name: "Robert Johnson",
            relationship: "spouse",
            description: "My loving husband Robert. We've been married for 45 years. He loves gardening and reading mystery novels together.",
            image: "👴",
            color: "#a8d0e6"
        },
        {
            id: 4,
            name: "Sarah & Mike",
            relationship: "friends",
            description: "Our dear friends from the book club. We meet every Thursday for tea and discuss our latest reads. 30 years of friendship!",
            image: "👫",
            color: "#ffd166"
        }
    ];
    
    localStorage.setItem('memories', JSON.stringify(sampleMemories));
    displayMemories();
    showNotification('Demo data reset successfully!', 'success');
}

// Make it available in console for emergency use during demo
window.demoReset = resetToSampleMemories;

// Add some CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .empty-state {
        text-align: center;
        padding: 3rem;
        grid-column: 1 / -1;
    }
    
    .empty-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
    }
    
    .empty-state h3 {
        color: #374785;
        margin-bottom: 0.5rem;
    }
    
    .empty-state p {
        color: #6c757d;
        margin-bottom: 2rem;
    }
`;
document.head.appendChild(style);
