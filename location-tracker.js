// Location Tracker JavaScript - IMPROVED VERSION
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Starting initialization');
    
    // Initialize basic functionality first
    setupBasicEventListeners();
    loadCompleteData();
    
    // Try to initialize map (might fail if Leaflet not loaded)
    try {
        initializeMap();
    } catch (error) {
        console.log('Map initialization failed:', error);
    }
});

function setupBasicEventListeners() {
    console.log('Setting up basic event listeners...');
    
    // Add Safe Zone Button
    const addSafeZoneBtn = document.getElementById('addSafeZoneBtn');
    if (addSafeZoneBtn) {
        addSafeZoneBtn.addEventListener('click', function() {
            console.log('Add Safe Zone button clicked!');
            toggleSafeZoneForm();
        });
        console.log('Add Safe Zone button listener added');
    }
    
    // Close Form Button
    const closeFormBtn = document.getElementById('closeSafeZoneForm');
    if (closeFormBtn) {
        closeFormBtn.addEventListener('click', function() {
            console.log('Close form button clicked!');
            toggleSafeZoneForm();
        });
    }
    
    // Cancel Button
    const cancelBtn = document.getElementById('cancelSafeZone');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            console.log('Cancel button clicked!');
            toggleSafeZoneForm();
        });
    }
    
    // Form submission
    const safeZoneForm = document.getElementById('safeZoneForm');
    if (safeZoneForm) {
        safeZoneForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Form submitted!');
            // Just hide the form for now
            toggleSafeZoneForm();
            showNotification('Safe zone added successfully!', 'success');
        });
    }
    
    // Radius slider
    const radiusSlider = document.getElementById('zoneRadius');
    const radiusValue = document.getElementById('radiusValue');
    if (radiusSlider && radiusValue) {
        radiusSlider.addEventListener('input', function() {
            radiusValue.textContent = `${this.value} meters`;
        });
    }
}

function toggleSafeZoneForm() {
    console.log('toggleSafeZoneForm called');
    
    const safeZonesList = document.getElementById('safeZonesList');
    const addSafeZoneForm = document.getElementById('addSafeZoneForm');
    
    console.log('Current state - List:', safeZonesList.style.display, 'Form:', addSafeZoneForm.style.display);
    
    if (safeZonesList && addSafeZoneForm) {
        if (addSafeZoneForm.style.display === 'none' || addSafeZoneForm.style.display === '') {
            // Show form, hide list
            safeZonesList.style.display = 'none';
            addSafeZoneForm.style.display = 'block';
            console.log('Form shown, list hidden');
        } else {
            // Show list, hide form
            safeZonesList.style.display = 'block';
            addSafeZoneForm.style.display = 'none';
            console.log('List shown, form hidden');
        }
    } else {
        console.error('Elements not found!');
    }
}

function loadCompleteData() {
    console.log('Loading complete data...');
    
    // Load safe zones
    loadSafeZones();
    
    // Load guardians
    loadGuardians();
    
    // Load alerts
    loadAlerts();
    
    // Load recent history
    loadRecentHistory();
}

function loadSafeZones() {
    const safeZonesList = document.getElementById('safeZonesList');
    if (safeZonesList) {
        safeZonesList.innerHTML = `
            <div class="safe-zone-card">
                <div class="zone-header">
                    <div class="zone-name">Home</div>
                    <div class="zone-type">Home</div>
                </div>
                <div class="zone-details">
                    <div class="zone-address">123 Marine Drive, Mumbai, Maharashtra 400020</div>
                    <div class="zone-radius">
                        <span class="radius-icon">📏</span>
                        Safe radius: 500 meters
                    </div>
                </div>
                <div class="zone-actions">
                    <button class="zone-btn edit">Edit</button>
                    <button class="zone-btn delete">Delete</button>
                </div>
            </div>
            <div class="safe-zone-card">
                <div class="zone-header">
                    <div class="zone-name">Sanjay Gandhi National Park</div>
                    <div class="zone-type">Park</div>
                </div>
                <div class="zone-details">
                    <div class="zone-address">Sanjay Gandhi National Park, Mumbai, Maharashtra 400101</div>
                    <div class="zone-radius">
                        <span class="radius-icon">📏</span>
                        Safe radius: 1000 meters
                    </div>
                </div>
                <div class="zone-actions">
                    <button class="zone-btn edit">Edit</button>
                    <button class="zone-btn delete">Delete</button>
                </div>
            </div>
            <div class="safe-zone-card">
                <div class="zone-header">
                    <div class="zone-name">Local Grocery Store</div>
                    <div class="zone-type">Store</div>
                </div>
                <div class="zone-details">
                    <div class="zone-address">456 Linking Road, Bandra West, Mumbai, Maharashtra 400050</div>
                    <div class="zone-radius">
                        <span class="radius-icon">📏</span>
                        Safe radius: 300 meters
                    </div>
                </div>
                <div class="zone-actions">
                    <button class="zone-btn edit">Edit</button>
                    <button class="zone-btn delete">Delete</button>
                </div>
            </div>
        `;
        
        // Update safe zones count
        document.getElementById('safeZones').textContent = '3';
        console.log('All 3 safe zones loaded');
    }
}

function loadGuardians() {
    const guardiansList = document.getElementById('guardiansList');
    if (guardiansList) {
        guardiansList.innerHTML = `
            <div class="guardian-card">
                <div class="guardian-info">
                    <div class="guardian-avatar">EJ</div>
                    <div class="guardian-details">
                        <div class="guardian-name">Ella Johnson</div>
                        <div class="guardian-contact">(555) 123-4567</div>
                    </div>
                    <div class="guardian-status active">Active</div>
                </div>
            </div>
            <div class="guardian-card">
                <div class="guardian-info">
                    <div class="guardian-avatar">MC</div>
                    <div class="guardian-details">
                        <div class="guardian-name">Michael Chen</div>
                        <div class="guardian-contact">(555) 987-6543</div>
                    </div>
                    <div class="guardian-status active">Active</div>
                </div>
            </div>
        `;
        
        // Update guardians count
        document.getElementById('guardiansCount').textContent = '2';
        console.log('Guardians loaded');
    }
}

function loadAlerts() {
    const alertsList = document.getElementById('alertsList');
    if (alertsList) {
        alertsList.innerHTML = `
            <div class="alert-item">
                <div class="alert-icon">⚠️</div>
                <div class="alert-content">
                    <div class="alert-message">Left safe zone: Home</div>
                    <div class="alert-time">10:30 AM</div>
                </div>
            </div>
            <div class="alert-item">
                <div class="alert-icon">⚠️</div>
                <div class="alert-content">
                    <div class="alert-message">Entered safe zone: Sanjay Gandhi National Park</div>
                    <div class="alert-time">11:15 AM</div>
                </div>
            </div>
        `;
        
        // Update alerts count
        document.getElementById('alertsCount').textContent = '2';
        console.log('Alerts loaded');
    }
}

function loadRecentHistory() {
    const historyList = document.getElementById('historyList');
    if (historyList) {
        historyList.innerHTML = `
            <div class="history-item">
                <div class="history-icon">📍</div>
                <div class="history-details">
                    <div class="history-location">Home</div>
                    <div class="history-time">10:00 AM</div>
                </div>
            </div>
            <div class="history-item">
                <div class="history-icon">📍</div>
                <div class="history-details">
                    <div class="history-location">Sanjay Gandhi National Park</div>
                    <div class="history-time">10:45 AM</div>
                </div>
            </div>
            <div class="history-item">
                <div class="history-icon">📍</div>
                <div class="history-details">
                    <div class="history-location">Local Grocery Store</div>
                    <div class="history-time">11:30 AM</div>
                </div>
            </div>
        `;
        console.log('Recent history loaded');
    }
}

// Basic map function
function initializeMap() {
    try {
        // Initialize the map centered on Mumbai
        const map = L.map('locationMap').setView([19.0760, 72.8777], 13);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        console.log('Map initialized successfully');
    } catch (error) {
        console.log('Map could not be initialized:', error);
    }
}

// Notification function
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Make functions available globally for debugging
window.toggleSafeZoneForm = toggleSafeZoneForm;