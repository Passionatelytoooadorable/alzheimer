// location-tracker.js - Updated with Live Backend API
const API_BASE = 'https://alzheimer-backend-new.onrender.com/api';

// Check authentication
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = 'index.html';
}

// Display user info
document.getElementById('user-name').textContent = user.name || 'User';

// Get current location and save to backend
async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                try {
                    // Get address from coordinates (simplified - you can use a geocoding service)
                    const address = await getAddressFromCoords(latitude, longitude);
                    
                    // Save to backend
                    const result = await saveLocationToBackend(latitude, longitude, address);
                    
                    resolve({
                        latitude,
                        longitude,
                        address,
                        timestamp: new Date().toISOString(),
                        saved: true
                    });
                } catch (error) {
                    resolve({
                        latitude,
                        longitude,
                        address: `Lat: ${latitude}, Long: ${longitude}`,
                        timestamp: new Date().toISOString(),
                        saved: false,
                        error: error.message
                    });
                }
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    });
}

// Save location to backend
async function saveLocationToBackend(latitude, longitude, address) {
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
    return await response.json();
}

// Get address from coordinates (simplified)
async function getAddressFromCoords(latitude, longitude) {
    // You can integrate with a geocoding service like Google Maps API here
    // For now, return coordinates as address
    return `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}`;
}

// Load location history from backend
async function loadLocationHistory() {
    try {
        // Note: You might want to create a /api/locations/history endpoint
        // For now, we'll just get the last location
        const response = await fetch(`${API_BASE}/locations/last`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        displayLastLocation(data.location);
    } catch (error) {
        console.error('Failed to load location history:', error);
    }
}

// Display last known location
function displayLastLocation(location) {
    const container = document.getElementById('location-history');
    if (!container) return;
    
    if (!location) {
        container.innerHTML = '<p>No location history found.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="location-card">
            <h3>Last Known Location</h3>
            <p><strong>Address:</strong> ${location.address}</p>
            <p><strong>Coordinates:</strong> ${location.latitude}, ${location.longitude}</p>
            <p><strong>Time:</strong> ${new Date(location.timestamp).toLocaleString()}</p>
        </div>
    `;
}

// Update location display
function updateLocationDisplay(locationData) {
    const locationInfo = document.getElementById('location-info');
    if (!locationInfo) return;
    
    locationInfo.innerHTML = `
        <div class="location-success">
            <h3>📍 Location Found!</h3>
            <p><strong>Address:</strong> ${locationData.address}</p>
            <p><strong>Coordinates:</strong> ${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}</p>
            <p><strong>Status:</strong> ${locationData.saved ? '✅ Saved to database' : '⚠️ Not saved'}</p>
            <p><strong>Time:</strong> ${new Date(locationData.timestamp).toLocaleString()}</p>
        </div>
    `;
}

// Event listener for location button
document.getElementById('get-location-btn').addEventListener('click', async function() {
    const btn = this;
    const originalText = btn.textContent;
    
    btn.textContent = 'Getting Location...';
    btn.disabled = true;
    
    try {
        const locationData = await getCurrentLocation();
        updateLocationDisplay(locationData);
        
        if (locationData.saved) {
            loadLocationHistory(); // Reload history
        }
    } catch (error) {
        console.error('Location error:', error);
        document.getElementById('location-info').innerHTML = `
            <div class="location-error">
                <h3>❌ Location Error</h3>
                <p>${error.message}</p>
                <p>Please ensure location services are enabled and try again.</p>
            </div>
        `;
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
});

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

document.getElementById('logout-btn')?.addEventListener('click', logout);

// Load location history when page loads
document.addEventListener('DOMContentLoaded', loadLocationHistory);
