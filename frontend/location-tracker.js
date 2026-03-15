// Location Tracker JavaScript with Backend API Integration
const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

document.addEventListener('DOMContentLoaded', function() {
    
    // Check authentication
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        window.location.replace('login.html');
        return;
    }

    // Initialize basic functionality
    setupBasicEventListeners();
    initializeMap();
    setupSafeZoneForm();
    
    // Load initial data from backend
    loadInitialData();
});

async function loadInitialData() {
    try {
        await loadLocationHistory();
        await loadSafeZones();
        await loadLinkedCaregiver();
    } catch (error) {
    }
}

async function loadLinkedCaregiver() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const res = await fetch(API_BASE + '/caregiver/link-status', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) return;
        const data = await res.json();
        const link = data.link;
        const listEl = document.getElementById('guardiansList');
        const infoEl = document.getElementById('guardiansInfo');
        if (!listEl) return;

        if (link && link.status === 'accepted') {
            const initials = (link.caregiver_name || 'C').split(' ').map(function(w){ return w[0]; }).join('').toUpperCase().slice(0, 2);
            listEl.innerHTML =
                '<div class="guardian-card">' +
                    '<div class="guardian-info">' +
                        '<div class="guardian-avatar">' + escStr(initials) + '</div>' +
                        '<div class="guardian-details">' +
                            '<div class="guardian-name">' + escStr(link.caregiver_name || 'Caregiver') + '</div>' +
                            '<div class="guardian-contact">' + escStr(link.caregiver_email || '') + '</div>' +
                            '<div class="guardian-role">Linked Caregiver</div>' +
                        '</div>' +
                        '<div class="guardian-status active">Active</div>' +
                    '</div>' +
                '</div>';
            if (infoEl) infoEl.style.display = 'none';
            var guardianStat = document.querySelector('.header-stats .stat:nth-child(3) .stat-number');
            if (guardianStat) guardianStat.textContent = '1';
        } else {
            listEl.innerHTML = '';
            if (infoEl) infoEl.style.display = 'flex';
            var guardianStat2 = document.querySelector('.header-stats .stat:nth-child(3) .stat-number');
            if (guardianStat2) guardianStat2.textContent = '0';
        }
    } catch (e) {
        // Silently fail — caregiver link is optional
    }
}

function escStr(s) {
    return String(s || '').replace(/[&<>"']/g, function(c) {
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
}

function setupBasicEventListeners() {
    
    // Start Tracking Button - WITH BACKEND INTEGRATION
    const startTrackingBtn = document.getElementById('startTrackingBtn');
    if (startTrackingBtn) {
        startTrackingBtn.addEventListener('click', function() {
            startRealTimeTracking();
            showNotification('Live tracking started with real location!', 'success');
        });
    }
    
    // Share Location Button - WITH BACKEND INTEGRATION
    const shareLocationBtn = document.getElementById('shareLocationBtn');
    if (shareLocationBtn) {
        shareLocationBtn.addEventListener('click', function() {
            shareRealTimeLocation();
        });
    }
    
    // Refresh Location Button - WITH BACKEND INTEGRATION
    const refreshLocation = document.getElementById('refreshLocation');
    if (refreshLocation) {
        refreshLocation.addEventListener('click', function() {
            refreshRealLocation();
        });
    }
    
    // Center Map Button - NOW CENTERS ON USER'S REAL LOCATION  
    const centerMap = document.getElementById('centerMap');
    if (centerMap) {
        centerMap.addEventListener('click', function() {
            centerOnUserLocation();
        });
    }
    
// Edit and Delete Zone Buttons
    const editButtons = document.querySelectorAll('.zone-btn.edit');
    editButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            showNotification('To edit this zone, delete it and add a new one.', 'info');
        });
    });
    
    const deleteButtons = document.querySelectorAll('.zone-btn.delete');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', function() {
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
            showNotification('Your full location history is visible to your linked caregiver.', 'info');
        });
    }
}

// REAL-TIME LOCATION TRACKING FUNCTIONS WITH BACKEND INTEGRATION
let watchId = null;
let userCurrentLocation = null;

function startRealTimeTracking() {
    if (!navigator.geolocation) {
        showNotification('Geolocation is not supported by this browser.', 'error');
        return;
    }

    // Request high accuracy for better results
    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };

    // Start watching position
    watchId = navigator.geolocation.watchPosition(
        async function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;
            
            userCurrentLocation = { lat, lng, accuracy };
            
            // Save to backend
            try {
                await saveLocationToBackend(lat, lng);
            } catch (error) {
            }
            
            // Update map with real location
            updateMapWithRealLocation(lat, lng, accuracy);
            
            // Update location info card
            updateLocationInfoCard(lat, lng, accuracy);
            
            // Simulate battery update (in real app, this would come from device)
            updateBatteryLevel();
            
        },
        function(error) {
            handleLocationError(error);
        },
        options
    );
    
    showNotification('Real-time tracking activated!', 'success');
}

async function refreshRealLocation() {
    if (!navigator.geolocation) {
        showNotification('Geolocation is not supported by this browser.', 'error');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;
            
            userCurrentLocation = { lat, lng, accuracy };
            
            // Save to backend
            try {
                await saveLocationToBackend(lat, lng);
            } catch (error) {
            }
            
            // Update map with real location
            updateMapWithRealLocation(lat, lng, accuracy);
            
            // Update location info card
            updateLocationInfoCard(lat, lng, accuracy);
            
            // Update battery
            updateBatteryLevel();
            
            showNotification('Location refreshed with real coordinates!', 'success');
        },
        function(error) {
            handleLocationError(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

function centerOnUserLocation() {
    if (userCurrentLocation) {
        const { lat, lng } = userCurrentLocation;
        window.locationMap.setView([lat, lng], 15);
        
        // Add smooth animation
        window.locationMap.flyTo([lat, lng], 16, {
            duration: 1,
            easeLinearity: 0.25
        });
        
        showNotification('Map centered on your real location!', 'success');
    } else {
        showNotification('No location data available. Click "Refresh" first.', 'error');
    }
}

async function shareRealTimeLocation() {
    if (userCurrentLocation) {
        const { lat, lng } = userCurrentLocation;
        
        // Create shareable message
        const message = `My current location: https://maps.google.com/?q=${lat},${lng}`;
        
        // In a real app, this would send to backend/guardians
        
        try {
            // Save to backend when sharing
            await saveLocationToBackend(lat, lng);
            showNotification('Your real location has been shared with guardians!', 'success');
        } catch (error) {
            showNotification('Location shared locally, but failed to save to server.', 'warning');
        }
        
        // Add to history (simulated)
        addToLocationHistory(lat, lng);
    } else {
        showNotification('No location available to share. Please enable tracking.', 'error');
    }
}

// BACKEND API FUNCTIONS
async function saveLocationToBackend(latitude, longitude) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const address = await getAddressFromCoords(latitude, longitude);
        
        const response = await fetch(`${API_BASE}/locations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                latitude: latitude,
                longitude: longitude,
                address: address
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to save location to backend');
        }
        
        const result = await response.json();
        // ── Geofence check after every successful save ──────────────────
        checkGeofence(latitude, longitude);
        return result;
    } catch (error) {
        throw error;
    }
}

// ── Safe zone store — populated by loadSafeZones() ───────────────────────────
var _safeZones = [];       // { name, lat, lng, radius (metres) }
var _lastAlertZone = null; // prevent alert storms

// Haversine distance in metres between two lat/lng points
function _haversineM(lat1, lng1, lat2, lng2) {
    var R  = 6371000;
    var f1 = lat1 * Math.PI / 180, f2 = lat2 * Math.PI / 180;
    var df = (lat2 - lat1) * Math.PI / 180;
    var dl = (lng2 - lng1) * Math.PI / 180;
    var a  = Math.sin(df/2)*Math.sin(df/2) +
             Math.cos(f1)*Math.cos(f2)*Math.sin(dl/2)*Math.sin(dl/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ── Main geofence check ───────────────────────────────────────────────────────
async function checkGeofence(lat, lng) {
    if (!_safeZones.length) return;

    var insideAny = _safeZones.some(function(zone) {
        return _haversineM(lat, lng, zone.lat, zone.lng) <= zone.radius;
    });

    if (!insideAny) {
        // Find the nearest zone for the alert message
        var nearest = _safeZones.reduce(function(best, zone) {
            var d = _haversineM(lat, lng, zone.lat, zone.lng);
            return d < best.dist ? { zone: zone, dist: d } : best;
        }, { zone: _safeZones[0], dist: Infinity });

        var alertKey = Math.round(lat * 100) + ',' + Math.round(lng * 100);
        if (_lastAlertZone === alertKey) return; // same position, already alerted
        _lastAlertZone = alertKey;

        // Show in-app notification
        showNotification(
            'You are outside all safe zones! Nearest: ' + nearest.zone.name +
            ' (' + Math.round(nearest.dist) + 'm away). Your caregiver has been notified.',
            'error'
        );

        // Browser push notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⚠️ Safe Zone Alert', {
                body: 'You have left all your safe zones. Nearest: ' + nearest.zone.name + '.',
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🧠</text></svg>'
            });
        }

        // Notify backend so caregiver gets flagged
        notifyBackendGeofenceBreach(lat, lng, nearest.zone.name);
    } else {
        // Back inside — reset storm prevention
        if (_lastAlertZone !== null) {
            _lastAlertZone = null;
            showNotification('You are back inside a safe zone.', 'success');
        }
    }
}

async function notifyBackendGeofenceBreach(lat, lng, nearestZoneName) {
    var token = localStorage.getItem('token');
    if (!token) return;
    try {
        await fetch(API_BASE + '/locations/geofence-breach', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                latitude:     lat,
                longitude:    lng,
                nearest_zone: nearestZoneName,
                breached_at:  new Date().toISOString()
            })
        });
    } catch (e) {
        // Silently fail — the in-app notification already fired
    }
}

async function loadLocationHistory() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE}/locations/history`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayLocationHistory(data.locations || []);
        }
    } catch (error) {
    }
}

async function loadSafeZones() {
    const token = localStorage.getItem('token');
    if (!token) return;

    // ── Try backend first, fall back to localStorage ─────────────────────────
    try {
        const response = await fetch(API_BASE + '/safe-zones', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (response.ok) {
            const data = await response.json();
            if (data.zones && data.zones.length) {
                _safeZones = data.zones.map(function(z) {
                    return { name: z.name || 'Safe Zone', lat: parseFloat(z.latitude), lng: parseFloat(z.longitude), radius: parseFloat(z.radius) || 300 };
                });
                localStorage.setItem('_safeZones', JSON.stringify(_safeZones));
                return;
            }
        }
    } catch (e) {}

    // ── Fallback: use zones saved to localStorage by the safe-zone form ───────
    try {
        var stored = JSON.parse(localStorage.getItem('_safeZones') || '[]');
        if (stored.length) { _safeZones = stored; }
    } catch (e) {}
}


async function getAddressFromCoords(latitude, longitude) {
    // You can integrate with a geocoding service like Google Maps API here
    // For now, return coordinates as address
    return `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}`;
}

function displayLocationHistory(locations) {
    const historyList = document.querySelector('.history-list');
    if (!historyList || !locations.length) return;

    // Update history list with data from backend
    // This is a simplified implementation - you might want to merge with existing UI
}

// REST OF THE ORIGINAL FUNCTIONS (unchanged)
function updateMapWithRealLocation(lat, lng, accuracy) {
    if (window.locationMap && window.currentLocationMarker) {
        // Update marker position
        window.currentLocationMarker.setLatLng([lat, lng]);
        
        // Update popup with real coordinates
        window.currentLocationMarker.setPopupContent(
            `Your Real Location<br>Tracking Active<br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}<br>Accuracy: ±${Math.round(accuracy)}m`
        );
        
        // Add accuracy circle if it doesn't exist
        if (!window.accuracyCircle) {
            window.accuracyCircle = L.circle([lat, lng], {
                color: '#3498db',
                fillColor: '#3498db',
                fillOpacity: 0.1,
                radius: accuracy
            }).addTo(window.locationMap);
        } else {
            window.accuracyCircle.setLatLng([lat, lng]);
            window.accuracyCircle.setRadius(accuracy);
        }
        
        // Center map on new location if it's the first update
        if (!window.mapInitialized) {
            window.locationMap.setView([lat, lng], 15);
            window.mapInitialized = true;
        }
    }
}

function updateLocationInfoCard(lat, lng, accuracy) {
    const lastUpdated = document.querySelector('.detail-item:nth-child(2) .value');
    const statusValue = document.querySelector('.detail-item:nth-child(1) .value');
    
    if (lastUpdated) {
        const now = new Date();
        lastUpdated.textContent = now.toLocaleTimeString();
    }
    
    if (statusValue) {
        statusValue.textContent = 'Real-time Tracking';
        statusValue.style.color = '#27ae60';
        statusValue.style.fontWeight = 'bold';
    }
}

function updateBatteryLevel() {
    const batteryValue = document.querySelector('.detail-item:nth-child(3) .value');
    const headerBattery = document.querySelector('.header-stats .stat:nth-child(4) .stat-number');
    
    if (batteryValue && headerBattery) {
        // Simulate realistic battery drain (85% to 20% range)
        const currentBattery = parseInt(batteryValue.textContent) || 85;
        const newBattery = Math.max(20, currentBattery - Math.floor(Math.random() * 2));
        const batteryText = newBattery + '%';
        
        // Update both battery displays
        batteryValue.textContent = batteryText;
        headerBattery.textContent = batteryText;
        
        // Change battery color if low
        if (newBattery <= 20) {
            batteryValue.style.color = '#ff6b6b';
            batteryValue.style.fontWeight = 'bold';
            headerBattery.style.color = '#ff6b6b';
        } else if (newBattery <= 50) {
            batteryValue.style.color = '#f39c12';
            headerBattery.style.color = '#f39c12';
        } else {
            batteryValue.style.color = '#27ae60';
            headerBattery.style.color = '#27ae60';
        }
    }
}

function handleLocationError(error) {
    let message = 'Unknown location error';
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location permissions.';
            break;
        case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.';
            break;
        case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
    }
    
    showNotification(message, 'error');
}

function addToLocationHistory(lat, lng) {
    // This would normally save to database
    // For now, we'll just log it
}

function stopRealTimeTracking() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        showNotification('Real-time tracking stopped', 'info');
    }
}

function initializeMap() {
    try {
        // Initialize the map with a generic center (will be updated with user's location)
        // Ensure map container has a concrete height before Leaflet reads it
        var mapEl = document.getElementById('locationMap');
        if (mapEl && !mapEl.style.height) { mapEl.style.height = '500px'; }

        const map = L.map('locationMap', { zoomControl: true }).setView([20.5937, 78.9629], 5);
        window.locationMap = map;

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);

        // Force tile re-render after layout is fully painted
        setTimeout(function() { map.invalidateSize(); }, 200);
        setTimeout(function() { map.invalidateSize(); }, 800);
        
        // Add a marker that will be updated with real location
        const marker = L.marker([20.5937, 78.9629]).addTo(map)
            .bindPopup('Waiting for location...<br>Click "Start Live Tracking"')
            .openPopup();
        window.currentLocationMarker = marker;
        
        // Add sample safe zones (these would be dynamic in real app)
        addDynamicSafeZones();
        
        
        // Auto-start tracking if permissions are already granted
        setTimeout(() => {
            refreshRealLocation();
        }, 1000);
        
    } catch (error) {
        // Fallback: Show message if map fails
        const mapContainer = document.getElementById('locationMap');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f8f9fa; color: #6c757d;">
                    <div style="text-align: center;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🗺️</div>
                        <h3>Map Loading</h3>
                        <p>Interactive map will appear here</p>
                        <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            Reload Map
                        </button>
                    </div>
                </div>
            `;
        }
    }
}

function addDynamicSafeZones() {
    // In a real app, these would come from database based on user's location
    // For demo, we'll create generic zones that would be replaced with real data
    
    const homeZone = L.circle([20.5937, 78.9629], {
        color: '#3498db',
        fillColor: '#3498db',
        fillOpacity: 0.1,
        radius: 500
    }).addTo(window.locationMap).bindPopup('Home Safe Zone<br>500m radius<br>Location will update when tracking starts');
    
}

function setupSafeZoneForm() {
    // ... (keep all existing safe zone form code exactly as is) ...
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
            hideSafeZoneForm();
        });
    }
    
    // Handle form submission
    if (safeZoneFormElement) {
        safeZoneFormElement.addEventListener('submit', function(e) {
            e.preventDefault();
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
            showNotification('To edit this zone, delete it and add a new one.', 'info');
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
                    // Save to geofence store
                    try {
                        var newZone = { name: zoneName || 'Safe Zone', lat: lat, lng: lng, radius: radius };
                        _safeZones.push(newZone);
                        localStorage.setItem('_safeZones', JSON.stringify(_safeZones));
                    } catch(e) {}
        
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
        background: ${type === 'success' ? '#3498db' : type === 'error' ? '#ff6b6b' : type === 'warning' ? '#f39c12' : '#a8d0e6'};
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

// Enhanced reset function for debugging
function resetLocationTracker() {
    
    // Stop real-time tracking
    stopRealTimeTracking();
    
    // Reset all form fields
    document.querySelectorAll('input, select, textarea').forEach(element => {
        element.value = '';
    });
    
    // Reset location info
    const lastUpdated = document.querySelector('.detail-item:nth-child(2) .value');
    const statusValue = document.querySelector('.detail-item:nth-child(1) .value');
    const batteryValue = document.querySelector('.detail-item:nth-child(3) .value');
    const headerBattery = document.querySelector('.header-stats .stat:nth-child(4) .stat-number');
    
    if (lastUpdated) lastUpdated.textContent = 'Just now';
    if (statusValue) {
        statusValue.textContent = 'Tracking Active';
        statusValue.style.color = '';
        statusValue.style.fontWeight = '';
    }
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
                    <div class="zone-address">Your Current Location</div>
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
                    <div class="zone-address">Nearby Park Area</div>
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
                    <div class="zone-address">Local Shopping Area</div>
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
    
    // Reset map to generic center
    if (window.locationMap && window.currentLocationMarker) {
        window.locationMap.setView([20.5937, 78.9629], 5);
        window.currentLocationMarker.setLatLng([20.5937, 78.9629]);
        window.currentLocationMarker.setPopupContent('Waiting for location...<br>Click "Start Live Tracking"');
        
        // Remove accuracy circle if exists
        if (window.accuracyCircle) {
            window.locationMap.removeLayer(window.accuracyCircle);
            window.accuracyCircle = null;
        }
    }
    
    // Reset tracking state
    userCurrentLocation = null;
    window.mapInitialized = false;
    
    // Hide any open form
    const safeZoneForm = document.getElementById('safeZoneForm');
    if (safeZoneForm) {
        safeZoneForm.style.display = 'none';
    }
    
    // Show the safe zones list
    if (safeZonesList) {
        safeZonesList.style.display = 'flex';
    }
    
    showNotification('Location tracker has been reset! Click "Start Live Tracking" for real location.', 'success');
}

// Make it available globally for console access
window.resetLocationTracker = resetLocationTracker;
window.resetApp = resetLocationTracker;
window.stopRealTimeTracking = stopRealTimeTracking;
window.startRealTimeTracking = startRealTimeTracking;

// Enhanced status function
window.appStatus = function() {
    console.log('🧠 Alzheimer\'s Support App Status:');
    console.log('📍 Safe Zones:', document.querySelectorAll('.safe-zone-card').length);
    console.log('👥 Guardians:', document.querySelectorAll('.guardian-card').length);
    console.log('🔋 Battery (Map):', document.querySelector('.detail-item:nth-child(3) .value')?.textContent || 'Unknown');
    console.log('🔋 Battery (Header):', document.querySelector('.header-stats .stat:nth-child(4) .stat-number')?.textContent || 'Unknown');
    console.log('🗺️ Map:', window.locationMap ? 'Loaded' : 'Not loaded');
    console.log('📍 Real Location:', userCurrentLocation ? `Lat: ${userCurrentLocation.lat.toFixed(6)}, Lng: ${userCurrentLocation.lng.toFixed(6)}` : 'Not available');
    console.log('📍 Tracking Active:', watchId ? 'Yes' : 'No');
};

// Help function
window.help = function() {
    console.log('🧠 Alzheimer\'s Support - Available Console Commands:');
    console.log('resetLocationTracker() - Reset everything to initial state');
    console.log('resetApp() - Alias for resetLocationTracker');
    console.log('startRealTimeTracking() - Start real-time location tracking');
    console.log('stopRealTimeTracking() - Stop real-time location tracking');
    console.log('appStatus() - Check current app status');
    console.log('help() - Show this help message');
};
