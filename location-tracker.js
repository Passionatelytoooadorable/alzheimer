// Location Tracker JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Location Safety Page Loaded');
    
    // Initialize basic functionality
    setupBasicEventListeners();
    initializeMap();
});

function setupBasicEventListeners() {
    console.log('Setting up event listeners...');
    
    // Add Safe Zone Button
    const addSafeZoneBtn = document.getElementById('addSafeZoneBtn');
    if (addSafeZoneBtn) {
        addSafeZoneBtn.addEventListener('click', function() {
            console.log('Add Safe Zone button clicked!');
            showNotification('Safe zone feature coming soon!', 'info');
        });
    }
    
    // Show Safe Zone Form Button
    const showSafeZoneForm = document.getElementById('showSafeZoneForm');
    if (showSafeZoneForm) {
        showSafeZoneForm.addEventListener('click', function() {
            console.log('Show Safe Zone Form button clicked!');
            showNotification('Safe zone form will appear here!', 'info');
        });
    }
    
    // Start Tracking Button
    const startTrackingBtn = document.getElementById('startTrackingBtn');
    if (startTrackingBtn) {
        startTrackingBtn.addEventListener('click', function() {
            console.log('Start Tracking button clicked!');
            showNotification('Live tracking started!', 'success');
        });
    }
    
    // Share Location Button
    const shareLocationBtn = document.getElementById('shareLocationBtn');
    if (shareLocationBtn) {
        shareLocationBtn.addEventListener('click', function() {
            console.log('Share Location button clicked!');
            showNotification('Location shared with guardians!', 'success');
        });
    }
    
    // Refresh Location Button
    const refreshLocation = document.getElementById('refreshLocation');
    if (refreshLocation) {
        refreshLocation.addEventListener('click', function() {
            console.log('Refresh Location button clicked!');
            showNotification('Location refreshed!', 'info');
        });
    }
    
    // Center Map Button
    const centerMap = document.getElementById('centerMap');
    if (centerMap) {
        centerMap.addEventListener('click', function() {
            console.log('Center Map button clicked!');
            showNotification('Map centered!', 'info');
        });
    }
    
    // Add Guardian Button
    const addGuardianBtn = document.getElementById('addGuardianBtn');
    if (addGuardianBtn) {
        addGuardianBtn.addEventListener('click', function() {
            console.log('Add Guardian button clicked!');
            showNotification('Add guardian feature coming soon!', 'info');
        });
    }
    
    // Edit and Delete Zone Buttons
    const editButtons = document.querySelectorAll('.zone-btn.edit');
    editButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            console.log('Edit zone button clicked!');
            showNotification('Edit zone feature coming soon!', 'info');
        });
    });
    
    const deleteButtons = document.querySelectorAll('.zone-btn.delete');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            console.log('Delete zone button clicked!');
            showNotification('Delete zone feature coming soon!', 'info');
        });
    });
    
    // View All History Button
    const viewAllBtn = document.querySelector('.view-all-btn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function() {
            console.log('View All History button clicked!');
            showNotification('Full history view coming soon!', 'info');
        });
    }
}

function initializeMap() {
    try {
        // Initialize the map centered on Mumbai
        const map = L.map('locationMap').setView([19.0760, 72.8777], 13);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Add a marker for current location
        const marker = L.marker([19.0760, 72.8777]).addTo(map)
            .bindPopup('Current Location<br>Tracking Active')
            .openPopup();
        
        // Add sample safe zones as circles
        const homeZone = L.circle([19.0760, 72.8777], {
            color: '#3498db',
            fillColor: '#3498db',
            fillOpacity: 0.1,
            radius: 500
        }).addTo(map).bindPopup('Home Safe Zone<br>500m radius');
        
        const parkZone = L.circle([19.0720, 72.8700], {
            color: '#27ae60',
            fillColor: '#27ae60',
            fillOpacity: 0.1,
            radius: 800
        }).addTo(map).bindPopup('Park Safe Zone<br>800m radius');
        
        const storeZone = L.circle([19.0800, 72.8850], {
            color: '#e74c3c',
            fillColor: '#e74c3c',
            fillOpacity: 0.1,
            radius: 300
        }).addTo(map).bindPopup('Store Safe Zone<br>300m radius');
        
        console.log('Map initialized successfully with safe zones');
    } catch (error) {
        console.log('Map could not be initialized:', error);
        // Fallback: Show message if map fails
        const mapContainer = document.getElementById('locationMap');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f8f9fa; color: #6c757d;">
                    <div style="text-align: center;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🗺️</div>
                        <h3>Map Loading</h3>
                        <p>Interactive map will appear here</p>
                        <p style="font-size: 0.9rem; margin-top: 0.5rem;">Safe zones: Home, Park, Store</p>
                    </div>
                </div>
            `;
        }
    }
}

// Notification function
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
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        background: ${type === 'success' ? '#3498db' : type === 'error' ? '#ff6b6b' : '#a8d0e6'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add CSS for notification animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);