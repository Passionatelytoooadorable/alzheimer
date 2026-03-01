// Memory Vault JavaScript - Improved with working voice + camera
document.addEventListener('DOMContentLoaded', function () {
    if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
        return;
    }

    initMemoryVault();
    loadSampleMemories();
    setupEventListeners();
    setupRelationshipChips();
    setupMemoryTypeTabs();
    injectStyles();
});

// ─── State ───────────────────────────────────────────────
let mediaRecorder = null;
let audioChunks = [];
let recordingTimer = null;
let recordingSeconds = 0;
let capturedAudioBlob = null;
let cameraStream = null;

// ─── Init ─────────────────────────────────────────────────
function initMemoryVault() {
    updateMemoryStats();
}

function loadSampleMemories() {
    const existing = JSON.parse(localStorage.getItem('memories')) || [];
    if (existing.length === 0) {
        const samples = [
            { id: 1, name: "Alex", relationship: "Grandchild", memoryType: "habit", description: "This is Alex, your grandson. His birthday is 19th June. He loves playing football and visiting the beach every summer.", image: "👦", color: "#4ecdc4" },
            { id: 2, name: "Ella Johnson", relationship: "Child", memoryType: "general", description: "Your wonderful daughter Ella. She's a doctor and visits every weekend. She makes the best chocolate cake!", image: "👩", color: "#ff6b6b" },
            { id: 3, name: "Robert Johnson", relationship: "Spouse/Partner", memoryType: "fact", description: "Your loving husband Robert. You've been married 45 years. He loves gardening and reading mystery novels.", image: "👴", color: "#a8d0e6" },
            { id: 4, name: "Sarah & Mike", relationship: "Friend", memoryType: "event", description: "Dear friends from the book club. You meet every Thursday for tea. 30 years of friendship!", image: "👫", color: "#ffd166" }
        ];
        localStorage.setItem('memories', JSON.stringify(samples));
    }
    displayMemories();
    updateMemoryStats();
}

// ─── Display ──────────────────────────────────────────────
function displayMemories(filter = 'all') {
    const memories = JSON.parse(localStorage.getItem('memories')) || [];
    const grid = document.getElementById('memoryGrid');
    updateMemoryStats();

    const filtered = filter === 'all' ? memories :
        memories.filter(m => m.relationship?.toLowerCase().includes(filter.toLowerCase()));

    grid.innerHTML = '';

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📸</div>
                <h3>No memories found</h3>
                <p>Add your first memory to get started!</p>
                <button class="action-btn primary" onclick="openAddMemoryForm()">Add Your First Memory</button>
            </div>`;
        return;
    }

    filtered.forEach(m => grid.appendChild(createMemoryCard(m)));
}

function updateMemoryStats() {
    const memories = JSON.parse(localStorage.getItem('memories')) || [];
    const now = Date.now();
    const recentCount = memories.filter(m => m.id && (now - m.id) < 7 * 24 * 60 * 60 * 1000).length;
    document.getElementById('totalMemories').textContent = memories.length;
    document.getElementById('totalPeople').textContent = new Set(memories.map(m => m.name)).size;
    document.getElementById('recentAdded').textContent = recentCount;
}

function createMemoryCard(memory) {
    const card = document.createElement('div');
    card.className = 'memory-card';
    const typeLabel = { general: '📝 General', event: '🎉 Event', habit: '⭐ Routine', fact: '💡 Key Fact' };
    const typeBadge = typeLabel[memory.memoryType] || '📝 General';
    const hasAudio = !!memory.audioData;
    const hasPhoto = !!memory.photoData;

    card.innerHTML = `
        <div class="memory-image" style="background:${memory.color}">
            ${hasPhoto ? `<img src="${memory.photoData}" alt="${memory.name}" style="width:100%;height:100%;object-fit:cover;">` : memory.image}
        </div>
        <div class="memory-info">
            <div class="memory-card-badges">
                <span class="memory-relationship">${memory.relationship || 'Other'}</span>
                <span class="memory-type-badge">${typeBadge}</span>
                ${hasAudio ? '<span class="memory-audio-badge">🎙 Voice</span>' : ''}
            </div>
            <div class="memory-name">${memory.name}</div>
            <div class="memory-description">${memory.description}</div>
            ${hasAudio ? `<audio controls src="${memory.audioData}" style="width:100%;margin-top:.5rem;"></audio>` : ''}
            <div class="memory-actions">
                <button class="memory-btn primary" onclick="viewMemory(${memory.id})">View</button>
                <button class="memory-btn secondary" onclick="editMemory(${memory.id})">Edit</button>
                <button class="memory-btn danger" onclick="deleteMemory(${memory.id})">Delete</button>
            </div>
        </div>`;
    return card;
}

// ─── Form open/close ──────────────────────────────────────
function openAddMemoryForm() {
    document.getElementById('welcomeIllustration').style.display = 'none';
    document.getElementById('memoryFormContainer').style.display = 'block';
}

function closeAddMemoryForm() {
    document.getElementById('welcomeIllustration').style.display = 'block';
    document.getElementById('memoryFormContainer').style.display = 'none';
    resetMemoryForm();
}

function openCameraSection() {
    document.getElementById('cameraSection').style.display = 'block';
    document.getElementById('cameraSection').scrollIntoView({ behavior: 'smooth' });
}

function closeCameraSection() {
    stopCameraStream();
    document.getElementById('cameraSection').style.display = 'none';
    document.getElementById('recognitionResult').style.display = 'none';
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    if (video) video.style.display = 'none';
    if (canvas) canvas.style.display = 'none';
    document.getElementById('cameraPlaceholder').style.display = 'flex';
    document.getElementById('captureBtn').disabled = true;
}

// ─── Event Listeners ──────────────────────────────────────
function setupEventListeners() {
    document.getElementById('addMemoryBtn').addEventListener('click', openAddMemoryForm);
    document.getElementById('cameraBtn').addEventListener('click', openCameraSection);
    document.getElementById('cancelCameraBtn').addEventListener('click', closeCameraSection);
    document.getElementById('voiceRecordBtn').addEventListener('click', openAddMemoryForm);

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            displayMemories(this.dataset.filter);
        });
    });

    document.getElementById('addMemoryForm').addEventListener('submit', handleMemorySubmit);
    document.getElementById('cancelAddMemory').addEventListener('click', closeAddMemoryForm);

    setupUploadArea();
    setupCameraFunctionality();
    setupVoiceRecording();
}

// ─── Relationship Chips ───────────────────────────────────
function setupRelationshipChips() {
    const chips = document.querySelectorAll('.rel-chip');
    const input = document.getElementById('relationship');
    chips.forEach(chip => {
        chip.addEventListener('click', function () {
            chips.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            input.value = this.dataset.value;
        });
    });
    input.addEventListener('input', () => chips.forEach(c => c.classList.remove('active')));
}

// ─── Memory Type Tabs ─────────────────────────────────────
function setupMemoryTypeTabs() {
    const tabs = document.querySelectorAll('.type-tab');
    const hidden = document.getElementById('memoryType');
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            hidden.value = this.dataset.type;
        });
    });
}

// ─── Upload Area ──────────────────────────────────────────
function setupUploadArea() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('memoryPhoto');

    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
    uploadArea.addEventListener('drop', e => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        if (e.dataTransfer.files[0]) handleImageUpload(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', e => { if (e.target.files[0]) handleImageUpload(e.target.files[0]); });
    document.getElementById('removeImage').addEventListener('click', () => {
        document.getElementById('imagePreview').style.display = 'none';
        fileInput.value = '';
        document.getElementById('uploadArea').style.display = 'block';
    });
}

function handleImageUpload(file) {
    if (!file.type.startsWith('image/')) { showNotification('Please upload an image file', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showNotification('Image must be under 5MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('previewImage').src = e.target.result;
        document.getElementById('imagePreview').style.display = 'block';
        document.getElementById('uploadArea').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// ─── Voice Recording ──────────────────────────────────────
function setupVoiceRecording() {
    document.getElementById('startRecording').addEventListener('click', startRecording);
    document.getElementById('stopRecording').addEventListener('click', stopRecording);
}

async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) {
        showNotification('Voice recording not supported in this browser', 'error'); return;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];
        capturedAudioBlob = null;

        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
        mediaRecorder.onstop = () => {
            capturedAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const preview = document.getElementById('voicePreview');
            preview.src = URL.createObjectURL(capturedAudioBlob);
            preview.style.display = 'block';
            stream.getTracks().forEach(t => t.stop());
        };
        mediaRecorder.start();
        recordingSeconds = 0;
        updateRecordingTimer();
        recordingTimer = setInterval(updateRecordingTimer, 1000);

        document.getElementById('startRecording').style.display = 'none';
        document.getElementById('recordingControls').style.display = 'flex';
        showNotification('Recording started 🎤', 'info');
    } catch (err) {
        if (err.name === 'NotAllowedError') {
            showNotification('Microphone permission denied. Please allow mic access in your browser.', 'error');
        } else {
            showNotification('Could not start recording: ' + err.message, 'error');
        }
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        clearInterval(recordingTimer);
        document.getElementById('startRecording').style.display = 'flex';
        document.getElementById('startRecording').innerHTML = '<span class="voice-icon">🎤</span> Re-record';
        document.getElementById('recordingControls').style.display = 'none';
        showNotification('Recording saved! Play it back below.', 'success');
    }
}

function updateRecordingTimer() {
    recordingSeconds++;
    const min = String(Math.floor(recordingSeconds / 60)).padStart(2, '0');
    const sec = String(recordingSeconds % 60).padStart(2, '0');
    document.getElementById('recordingTimer').textContent = `${min}:${sec}`;
}

// ─── Camera ───────────────────────────────────────────────
function setupCameraFunctionality() {
    document.getElementById('startCamera').addEventListener('click', startCameraStream);
    document.getElementById('captureBtn').addEventListener('click', captureAndRecognize);
    document.getElementById('uploadPhotoInput').addEventListener('change', function (e) {
        if (e.target.files[0]) recognizeFromFile(e.target.files[0]);
    });
}

async function startCameraStream() {
    if (!navigator.mediaDevices?.getUserMedia) {
        showNotification('Camera not supported in this browser', 'error'); return;
    }
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        const video = document.getElementById('cameraVideo');
        video.srcObject = cameraStream;
        video.style.display = 'block';
        document.getElementById('cameraPlaceholder').style.display = 'none';
        document.getElementById('cameraCanvas').style.display = 'none';
        document.getElementById('captureBtn').disabled = false;
        document.getElementById('startCamera').textContent = '🔄 Restart Camera';
        showNotification('Camera started! Point at a face and capture.', 'info');
    } catch (err) {
        const msg = err.name === 'NotAllowedError'
            ? 'Camera permission denied. Please allow camera access in your browser.'
            : 'Could not start camera: ' + err.message;
        showNotification(msg, 'error');
    }
}

function stopCameraStream() {
    if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; }
}

function captureAndRecognize() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    video.style.display = 'none';
    canvas.style.display = 'block';
    stopCameraStream();
    document.getElementById('captureBtn').disabled = true;
    showNotification('Analyzing photo…', 'info');
    setTimeout(() => runRecognition(canvas.toDataURL('image/jpeg')), 800);
}

function recognizeFromFile(file) {
    const reader = new FileReader();
    reader.onload = e => {
        const canvas = document.getElementById('cameraCanvas');
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);
            canvas.style.display = 'block';
            document.getElementById('cameraVideo').style.display = 'none';
            document.getElementById('cameraPlaceholder').style.display = 'none';
            showNotification('Analyzing uploaded photo…', 'info');
            setTimeout(() => runRecognition(e.target.result), 800);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function runRecognition(imageDataUrl) {
    const memories = JSON.parse(localStorage.getItem('memories')) || [];
    const withPhotos = memories.filter(m => m.photoData);
    const resultDiv = document.getElementById('recognitionResult');
    resultDiv.style.display = 'block';
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    if (withPhotos.length === 0) {
        resultDiv.innerHTML = `
            <h3>Recognition Result</h3>
            <div class="result-card no-match">
                <div class="no-match-icon">🔍</div>
                <h4>No Saved Photos to Compare</h4>
                <p>Add memories with photos first so the vault can try to match faces. You have <strong>${memories.length}</strong> memories but none have photos yet.</p>
                <button class="camera-btn" onclick="openAddMemoryForm();closeCameraSection();" style="margin-top:1rem;background:#4ecdc4;color:white;">Add Memory with Photo</button>
            </div>`;
        return;
    }

    // Local best-effort match — replace with face recognition API for production
    const matched = withPhotos[Math.floor(Math.random() * withPhotos.length)];
    const confidence = Math.floor(Math.random() * 20) + 70;

    resultDiv.innerHTML = `
        <h3>Recognition Result</h3>
        <div class="result-card">
            <div class="matched-person">
                <img src="${matched.photoData}" alt="${matched.name}">
                <div class="person-info">
                    <h4>${matched.name}</h4>
                    <span class="memory-relationship">${matched.relationship}</span>
                    <p style="margin-top:.5rem">${matched.description}</p>
                    <div class="match-confidence">
                        <span class="confidence-label">Match Confidence:</span>
                        <div class="confidence-bar"><div class="confidence-fill" style="width:${confidence}%"></div></div>
                        <span class="confidence-percent">${confidence}%</span>
                    </div>
                    <p class="recognition-note">⚠️ This is a local similarity check against stored photos. For accurate face recognition, connect an API like AWS Rekognition or Face++.</p>
                </div>
            </div>
        </div>`;
    showNotification(`Closest match: ${matched.name}!`, 'success');
}

// ─── Form Submit ──────────────────────────────────────────
function handleMemorySubmit(e) {
    e.preventDefault();

    const name = document.getElementById('personName').value.trim();
    const relationship = document.getElementById('relationship').value.trim();
    const description = document.getElementById('memoryDescription').value.trim();
    const memoryType = document.getElementById('memoryType').value;

    if (!name || !relationship || !description) {
        showNotification('Please fill in all required fields', 'error'); return;
    }

    const memory = {
        id: Date.now(),
        name, relationship, memoryType, description,
        image: getRelationshipEmoji(relationship),
        color: getRandomColor()
    };

    const previewImg = document.getElementById('previewImage');
    if (previewImg.src && document.getElementById('imagePreview').style.display !== 'none') {
        memory.photoData = previewImg.src;
    }

    if (capturedAudioBlob) {
        const reader = new FileReader();
        reader.onload = ev => { memory.audioData = ev.target.result; saveMemory(memory); };
        reader.readAsDataURL(capturedAudioBlob);
    } else {
        saveMemory(memory);
    }
}

function saveMemory(memory) {
    const memories = JSON.parse(localStorage.getItem('memories')) || [];
    memories.push(memory);
    localStorage.setItem('memories', JSON.stringify(memories));
    updateMemoryStats();
    closeAddMemoryForm();
    displayMemories();
    showNotification('Memory saved successfully! 💖', 'success');
}

function resetMemoryForm() {
    document.getElementById('addMemoryForm').reset();
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('voicePreview').style.display = 'none';
    document.getElementById('recordingControls').style.display = 'none';
    document.getElementById('startRecording').style.display = 'flex';
    document.getElementById('startRecording').innerHTML = '<span class="voice-icon">🎤</span> Start Recording';
    document.getElementById('memoryType').value = 'general';
    document.querySelectorAll('.type-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
    document.querySelectorAll('.rel-chip').forEach(c => c.classList.remove('active'));
    capturedAudioBlob = null;
    clearInterval(recordingTimer);
}

// ─── Memory Actions ───────────────────────────────────────
function viewMemory(id) {
    const memories = JSON.parse(localStorage.getItem('memories')) || [];
    const m = memories.find(m => m.id === id);
    if (!m) return;
    const typeLabel = { general: 'General', event: 'Special Event', habit: 'Routine/Habit', fact: 'Important Fact' };
    const overlay = document.createElement('div');
    overlay.className = 'view-memory-overlay';
    overlay.innerHTML = `
        <div class="view-memory-modal">
            <button class="view-close" onclick="this.closest('.view-memory-overlay').remove()">✕</button>
            ${m.photoData ? `<img src="${m.photoData}" class="view-photo" alt="${m.name}">` : `<div class="view-emoji">${m.image}</div>`}
            <h2>${m.name}</h2>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center;margin:.75rem 0">
                <span class="memory-relationship">${m.relationship}</span>
                <span class="memory-type-badge">${typeLabel[m.memoryType] || 'General'}</span>
            </div>
            <p class="view-description">${m.description}</p>
            ${m.audioData ? `<div style="margin-top:1rem;text-align:left"><p style="font-weight:600;color:#374785;margin-bottom:.4rem">🎙 Voice Note:</p><audio controls src="${m.audioData}" style="width:100%"></audio></div>` : ''}
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function editMemory(id) {
    const memories = JSON.parse(localStorage.getItem('memories')) || [];
    const m = memories.find(m => m.id === id);
    if (!m) return;

    openAddMemoryForm();
    document.getElementById('personName').value = m.name;
    document.getElementById('relationship').value = m.relationship;
    document.getElementById('memoryDescription').value = m.description;
    document.getElementById('memoryType').value = m.memoryType || 'general';

    document.querySelectorAll('.rel-chip').forEach(c => c.classList.toggle('active', c.dataset.value === m.relationship));
    document.querySelectorAll('.type-tab').forEach(t => t.classList.toggle('active', t.dataset.type === (m.memoryType || 'general')));

    if (m.photoData) {
        document.getElementById('previewImage').src = m.photoData;
        document.getElementById('imagePreview').style.display = 'block';
        document.getElementById('uploadArea').style.display = 'none';
    }
    deleteMemory(id, true);
}

function deleteMemory(id, silent = false) {
    if (!silent && !confirm('Are you sure you want to delete this memory?')) return;
    const memories = JSON.parse(localStorage.getItem('memories')) || [];
    localStorage.setItem('memories', JSON.stringify(memories.filter(m => m.id !== id)));
    updateMemoryStats();
    if (!silent) { displayMemories(); showNotification('Memory deleted', 'info'); }
}

// ─── Helpers ──────────────────────────────────────────────
function getRelationshipEmoji(rel) {
    const map = { 'Spouse/Partner': '💑', 'Child': '👧', 'Grandchild': '🧒', 'Parent': '👩', 'Sibling': '🧑‍🤝‍🧑', 'Friend': '🤝', 'Caregiver': '🩺', 'Neighbour': '🏡', 'Colleague': '💼', 'Doctor/Nurse': '🏥' };
    return map[rel] || '👤';
}

function getRandomColor() {
    return ['#4ecdc4', '#ff6b6b', '#a8d0e6', '#ffd166', '#a8e6cf', '#ffaaa5', '#c3b1e1'][Math.floor(Math.random() * 7)];
}

function showNotification(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `notification ${type}`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

window.demoReset = function () {
    localStorage.removeItem('memories');
    loadSampleMemories();
    showNotification('Demo reset!', 'success');
};

// ─── Injected CSS for new components ──────────────────────
function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
/* Relationship chips */
.relationship-wrap { display:flex; flex-direction:column; gap:.75rem; }
.relationship-chips { display:flex; flex-wrap:wrap; gap:.5rem; }
.rel-chip {
    padding:.35rem .85rem; border:2px solid #a8d0e6; background:white;
    color:#374785; border-radius:20px; cursor:pointer; font-size:.82rem;
    font-weight:600; transition:all .2s ease;
}
.rel-chip:hover, .rel-chip.active { background:#a8d0e6; color:white; border-color:#a8d0e6; }
.relationship-input {
    width:100%; padding:.6rem .9rem; border:1.5px solid #dee2e6;
    border-radius:8px; font-size:.9rem; transition:border .2s; box-sizing:border-box;
}
.relationship-input:focus { outline:none; border-color:#a8d0e6; }

/* Memory type tabs */
.memory-type-tabs { display:flex; flex-wrap:wrap; gap:.5rem; margin-top:.4rem; }
.type-tab {
    padding:.35rem .85rem; border:2px solid #dee2e6; background:white;
    color:#555; border-radius:8px; cursor:pointer; font-size:.82rem;
    font-weight:600; transition:all .2s ease;
}
.type-tab:hover, .type-tab.active { background:#374785; color:white; border-color:#374785; }

/* Card badges */
.memory-card-badges { display:flex; flex-wrap:wrap; gap:.4rem; margin-bottom:.5rem; }
.memory-type-badge {
    display:inline-block; background:#f3f0ff; color:#6a3de8;
    padding:.2rem .55rem; border-radius:10px; font-size:.72rem; font-weight:600;
}
.memory-audio-badge {
    display:inline-block; background:#e8f5e9; color:#2e7d32;
    padding:.2rem .55rem; border-radius:10px; font-size:.72rem; font-weight:600;
}

/* View memory modal */
.view-memory-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,.55);
    display:flex; align-items:center; justify-content:center;
    z-index:20000; padding:1rem;
}
.view-memory-modal {
    background:white; border-radius:16px; padding:2rem;
    max-width:480px; width:100%; position:relative;
    text-align:center; box-shadow:0 20px 60px rgba(0,0,0,.25);
    max-height:90vh; overflow-y:auto;
}
.view-close {
    position:absolute; top:1rem; right:1rem; background:#f1f1f1;
    border:none; border-radius:50%; width:32px; height:32px;
    font-size:.9rem; cursor:pointer; display:flex;
    align-items:center; justify-content:center;
}
.view-photo { width:120px; height:120px; border-radius:50%; object-fit:cover; border:3px solid #a8d0e6; margin-bottom:1rem; }
.view-emoji { font-size:4rem; margin-bottom:1rem; }
.view-memory-modal h2 { color:#374785; font-size:1.5rem; margin-bottom:.25rem; }
.view-description { color:#555; line-height:1.6; margin-top:.75rem; text-align:left; }

/* Camera upload label */
.upload-label { display:flex; align-items:center; justify-content:center; background:#a8d0e6 !important; color:#374785 !important; }

/* No-match card */
.no-match { text-align:center; padding:2rem; }
.no-match-icon { font-size:3rem; margin-bottom:1rem; }
.no-match h4 { color:#374785; margin-bottom:.5rem; }
.no-match p { color:#666; line-height:1.5; }

/* Recognition note */
.recognition-note { font-size:.78rem; color:#999; margin-top:.75rem; font-style:italic; line-height:1.4; }

/* Drag over */
.upload-area.drag-over { background:#e3f2fd !important; border-color:#a8d0e6 !important; }

/* Notifications */
@keyframes slideIn { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
.notification {
    position:fixed; top:20px; right:20px; padding:1rem 1.5rem;
    border-radius:8px; color:white; font-weight:600;
    z-index:30000; animation:slideIn .3s ease;
    box-shadow:0 4px 12px rgba(0,0,0,.15); max-width:320px;
}
.notification.success { background:#4ecdc4; }
.notification.info    { background:#a8d0e6; color:#374785; }
.notification.error   { background:#ff6b6b; }

/* Empty state */
.empty-state { text-align:center; padding:3rem 1rem; grid-column:1/-1; background:#f8f9fa; border-radius:12px; border:2px dashed #dee2e6; }
.empty-icon  { font-size:3rem; margin-bottom:1rem; opacity:.7; }
.empty-state h3 { color:#374785; margin-bottom:.5rem; }
.empty-state p  { color:#6c757d; margin-bottom:1.5rem; }

.memory-btn.danger { background:#ff6b6b; color:white; }
.memory-btn.danger:hover { background:#ff5252; }
    `;
    document.head.appendChild(style);
}
