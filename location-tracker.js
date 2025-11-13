// Location Tracker JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Location Safety Page Loaded');
    
    // Initialize basic functionality
    setupBasicEventListeners();
    initializeMap();
    setupSafeZoneForm();
});

function setupBasicEventListeners() {
    console.log('Setting up event listeners...');
    
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
    
    // Refresh Location Button - ACTUAL FUNCTIONALITY
    const refreshLocation = document.getElementById('refreshLocation');
    if (refreshLocation) {
        refreshLocation.addEventListener('click', function() {
            console.log('Refresh Location button clicked!');
            
            // Update the "Last Updated" time
            const lastUpdated = document.querySelector('.detail-item:nth-child(2) .value');
            if (lastUpdated) {
                const now = new Date();
                lastUpdated.textContent = now.toLocaleTimeString();
            }
            
            // Update battery level in both map overlay and orange header
            const batteryValue = document.querySelector('.detail-item:nth-child(3) .value');
            const headerBattery = document.querySelector('.header-stats .stat:nth-child(4) .stat-number');
            
            if (batteryValue && headerBattery) {
                const currentBattery = parseInt(batteryValue.textContent);
                const newBattery = Math.max(5, currentBattery - Math.floor(Math.random() * 3));
                const batteryText = newBattery + '%';
                
                // Update both battery displays
                batteryValue.textContent = batteryText;
                headerBattery.textContent = batteryText;
                
                // Change battery color if low
                if (newBattery <= 20) {
                    batteryValue.style.color = '#ff6b6b';
                    batteryValue.style.fontWeight = 'bold';
                    headerBattery.style.color = '#ff6b6b';
                } else {
                    batteryValue.style.color = '';
                    batteryValue.style.fontWeight = '';
                    headerBattery.style.color = '';
                }
            }
            
            // Update location on map
            updateLocationOnMap();
            
            showNotification('Location refreshed! Battery: ' + (batteryValue ? batteryValue.textContent : '85%'), 'success');
        });
    }
    
    // Center Map Button - ACTUAL FUNCTIONALITY  
    const centerMap = document.getElementById('centerMap');
    if (centerMap) {
        centerMap.addEventListener('click', function() {
            console.log('Center Map button clicked!');
            
            // Re-center the map on current location
            if (window.locationMap && window.currentLocationMarker) {
                const currentLatLng = window.currentLocationMarker.getLatLng();
                window.locationMap.setView(currentLatLng, 13);
                
                // Add a nice zoom animation
                window.locationMap.flyTo(currentLatLng, 15, {
                    duration: 1,
                    easeLinearity: 0.25
                });
            }
            
            showNotification('Map centered on current location!', 'success');
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
            const zoneCard = this.closest('.safe-zone-card');
            zoneCard.remove();
            showNotification('Safe zone deleted!', 'success');
            updateStats();
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

// Function to update location on map
function updateLocationOnMap() {
    if (window.locationMap && window.currentLocationMarker) {
        // Add slight random movement to simulate location update (within 500m radius)
        const baseLat = 19.0760;
        const baseLng = 72.8777;
        const lat = baseLat + (Math.random() - 0.5) * 0.005;  // ~500m variation
        const lng = baseLng + (Math.random() - 0.5) * 0.005;  // ~500m variation
        
        // Smoothly move the marker to new position
        window.currentLocationMarker.setLatLng([lat, lng]);
        
        // Update the marker popup with new coordinates
        window.currentLocationMarker.setPopupContent(
            `Current Location<br>Tracking Active<br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`
        );
        
        console.log('Location updated to:', lat, lng);
    }
}

function setupSafeZoneForm() {
    const addSafeZoneBtn = document.getElementById('addSafeZoneBtn');
    const safeZonesList = document.querySelector('.safe-zones-list');
    const safeZonesSection = document.getElementById('safeZonesSection');
    
    // Create form HTML
    const formHTML = `
        <div class="safe-zone-form" id="safeZoneForm" style="display: none;">
            <h3>Add New Safe Zone</h3>
            <form id="safeZoneFormElement">
                <div class="form-group">
                    <label for="zoneName">Zone Name</label>
                    <input type="text" id="zoneName" name="zoneName" placeholder="Enter zone name" required>
                </div>
                <div class="form-group">
                    <label for="zoneType">Zone Type</label>
                    <select id="zoneType" name="zoneType" required>
                        <option value="">Select zone type</option>
                        <option value="home">Home</option>
                        <option value="park">Park</option>
                        <option value="store">Store</option>
                        <option value="work">Work</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="zoneAddress">Address</label>
                    <textarea id="zoneAddress" name="zoneAddress" placeholder="Enter full address" rows="3" required></textarea>
                </div>
                <div class="form-group">
                    <label for="zoneRadius">Safe Radius (meters)</label>
                    <input type="number" id="zoneRadius" name="zoneRadius" placeholder="Enter radius in meters" min="100" max="5000" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="form-btn secondary" id="cancelSafeZone">Cancel</button>
                    <button type="submit" class="form-btn primary">Save Safe Zone</button>
                </div>
            </form>
        </div>
    `;
    
    // Insert form after the safe zones list
    safeZonesSection.insertAdjacentHTML('beforeend', formHTML);
    
    const safeZoneForm = document.getElementById('safeZoneForm');
    const safeZoneFormElement = document.getElementById('safeZoneFormElement');
    const cancelSafeZone = document.getElementById('cancelSafeZone');
    
    // Show form from quick actions button with smooth scroll
    if (addSafeZoneBtn) {
        addSafeZoneBtn.addEventListener('click', function() {
            console.log('Add Safe Zone button clicked!');
            showSafeZoneFormFunc();
            
            // Smooth scroll to the form
            safeZonesSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start'
            });
        });
    }
    
    // Cancel form
    if (cancelSafeZone) {
        cancelSafeZone.addEventListener('click', function() {
            console.log('Cancel Safe Zone button clicked!');
            hideSafeZoneForm();
        });
    }
    
    // Handle form submission
    if (safeZoneFormElement) {
        safeZoneFormElement.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Safe Zone form submitted!');
            saveSafeZone();
        });
    }
    
    function showSafeZoneFormFunc() {
        safeZonesList.style.display = 'none';
        safeZoneForm.style.display = 'block';
    }
    
    function hideSafeZoneForm() {
        safeZonesList.style.display = 'flex';
        safeZoneForm.style.display = 'none';
        safeZoneFormElement.reset();
    }
    
    function saveSafeZone() {
        const zoneName = document.getElementById('zoneName').value;
        const zoneType = document.getElementById('zoneType').value;
        const zoneAddress = document.getElementById('zoneAddress').value;
        const zoneRadius = document.getElementById('zoneRadius').value;
        
        // Create new safe zone card
        const newZoneCard = document.createElement('div');
        newZoneCard.className = 'safe-zone-card';
        newZoneCard.innerHTML = `
            <div class="zone-header">
                <div class="zone-name">${zoneName}</div>
                <div class="zone-type">${zoneType.charAt(0).toUpperCase() + zoneType.slice(1)}</div>
            </div>
            <div class="zone-details">
                <div class="zone-address">${zoneAddress}</div>
                <div class="zone-radius">
                    <span class="radius-icon">📏</span>
                    Safe radius: ${zoneRadius} meters
                </div>
            </div>
            <div class="zone-actions">
                <button class="zone-btn edit">Edit</button>
                <button class="zone-btn delete">Delete</button>
            </div>
        `;
        
        // Add event listeners to new buttons
        newZoneCard.querySelector('.zone-btn.edit').addEventListener('click', function() {
            showNotification('Edit zone feature coming soon!', 'info');
        });
        
        newZoneCard.querySelector('.zone-btn.delete').addEventListener('click', function() {
            newZoneCard.remove();
            showNotification('Safe zone deleted!', 'success');
            updateStats();
        });
        
        // Add to the beginning of the list
        safeZonesList.insertBefore(newZoneCard, safeZonesList.firstChild);
        
        // Hide form and show list
        hideSafeZoneForm();
        
        // Show success message
        showNotification('Safe zone added successfully!', 'success');
        
        // Update stats
        updateStats();
    }
    
    function updateStats() {
        const zoneCount = document.querySelectorAll('.safe-zone-card').length;
        const statNumber = document.querySelector('.header-stats .stat:nth-child(2) .stat-number');
        if (statNumber) {
            statNumber.textContent = zoneCount;
        }
    }
}

function initializeMap() {
    try {
        // Initialize the map centered on Mumbai
        const map = L.map('locationMap').setView([19.0760, 72.8777], 13);
        window.locationMap = map; // Store reference globally
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Add a marker for current location
        const marker = L.marker([19.0760, 72.8777]).addTo(map)
            .bindPopup('Current Location<br>Tracking Active<br>Lat: 19.076000<br>Lng: 72.877700')
            .openPopup();
        window.currentLocationMarker = marker; // Store reference
        
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

// Hidden reset function for debugging - run from console
function resetLocationTracker() {
    console.log('🧠 Alzheimer\'s Support - Location Tracker Reset');
    
    // Reset all form fields
    document.querySelectorAll('input, select, textarea').forEach(element => {
        element.value = '';
    });
    
    // Reset battery to 85% and time to "Just now" in both locations
    const lastUpdated = document.querySelector('.detail-item:nth-child(2) .value');
    const batteryValue = document.querySelector('.detail-item:nth-child(3) .value');
    const headerBattery = document.querySelector('.header-stats .stat:nth-child(4) .stat-number');
    
    if (lastUpdated) lastUpdated.textContent = 'Just now';
    if (batteryValue) {
        batteryValue.textContent = '85%';
        batteryValue.style.color = '';
        batteryValue.style.fontWeight = '';
    }
    if (headerBattery) {
        headerBattery.textContent = '85%';
        headerBattery.style.color = '';
    }
    
    // Reset safe zones to original 3
    const safeZonesList = document.querySelector('.safe-zones-list');
    if (safeZonesList) {
        safeZonesList.innerHTML = `
            <div class="safe-zone-card">
                <div class="zone-header">
                    <div class="zone-name">Home</div>
                    <div class="zone-type">Home</div>
                </div>
                <div class="zone-details">
                    <div class="zone-address">123 Main Street, Mumbai</div>
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
                    <div class="zone-name">Local Park</div>
                    <div class="zone-type">Park</div>
                </div>
                <div class="zone-details">
                    <div class="zone-address">Central Park, Bandra West</div>
                    <div class="zone-radius">
                        <span class="radius-icon">📏</span>
                        Safe radius: 800 meters
                    </div>
                </div>
                <div class="zone-actions">
                    <button class="zone-btn edit">Edit</button>
                    <button class="zone-btn delete">Delete</button>
                </div>
            </div>
            <div class="safe-zone-card">
                <div class="zone-header">
                    <div class="zone-name">Grocery Store</div>
                    <div class="zone-type">Store</div>
                </div>
                <div class="zone-details">
                    <div class="zone-address">456 Market Road, Andheri</div>
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
        
        // Re-attach event listeners to delete buttons
        const deleteButtons = safeZonesList.querySelectorAll('.zone-btn.delete');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const zoneCard = this.closest('.safe-zone-card');
                zoneCard.remove();
                showNotification('Safe zone deleted!', 'success');
                updateStats();
            });
        });
    }
    
    // Reset stats
    const statNumber = document.querySelector('.header-stats .stat:nth-child(2) .stat-number');
    if (statNumber) {
        statNumber.textContent = '3';
    }
    
    // Reset map to original position if available
    if (window.locationMap && window.currentLocationMarker) {
        window.locationMap.setView([19.0760, 72.8777], 13);
        window.currentLocationMarker.setLatLng([19.0760, 72.8777]);
        window.currentLocationMarker.setPopupContent('Current Location<br>Tracking Active<br>Lat: 19.076000<br>Lng: 72.877700');
    }
    
    // Hide any open form
    const safeZoneForm = document.getElementById('safeZoneForm');
    if (safeZoneForm) {
        safeZoneForm.style.display = 'none';
    }
    
    // Show the safe zones list
    if (safeZonesList) {
        safeZonesList.style.display = 'flex';
    }
    
    showNotification('Location tracker has been reset!', 'success');
    console.log('✅ Reset complete! All data restored to initial state.');
}

// Make it available globally for console access
window.resetLocationTracker = resetLocationTracker;
window.resetApp = resetLocationTracker; // Alias for convenience

// Also add a quick status function
window.appStatus = function() {
    console.log('🧠 Alzheimer\'s Support App Status:');
    console.log('📍 Safe Zones:', document.querySelectorAll('.safe-zone-card').length);
    console.log('👥 Guardians:', document.querySelectorAll('.guardian-card').length);
    console.log('🔋 Battery (Map):', document.querySelector('.detail-item:nth-child(3) .value')?.textContent || 'Unknown');
    console.log('🔋 Battery (Header):', document.querySelector('.header-stats .stat:nth-child(4) .stat-number')?.textContent || 'Unknown');
    console.log('🗺️ Map:', window.locationMap ? 'Loaded' : 'Not loaded');
    console.log('📍 Marker:', window.currentLocationMarker ? 'Active' : 'Not active');
};

// Help function
window.help = function() {
    console.log('🧠 Alzheimer\'s Support - Available Console Commands:');
    console.log('resetLocationTracker() - Reset everything to initial state');
    console.log('resetApp() - Alias for resetLocationTracker');
    console.log('appStatus() - Check current app status');
    console.log('help() - Show this help message');
};
