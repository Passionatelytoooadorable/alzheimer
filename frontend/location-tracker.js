//  Complete Geolocation Implementation
let map;
let userMarker;
let watchId = null;
let isTracking = false;

// Google Maps API key (replace with your actual key)
const GOOGLE_MAPS_API_KEY = 'AIzaSyC9S-gw5r2h3c8g4Y4Y4Y4Y4Y4Y4Y4Y4Y4Y4';

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
        return;
    }

    initializeLocationTracker();
    setupEventListeners();
});

function initializeLocationTracker() {
    // Initialize map with default location (will be updated with user's location)
    const defaultLocation = { lat: 40.7128, lng: -74.0060 }; // New York
    
    map = new google.maps.Map(document.getElementById('liveMap'), {
        zoom: 15,
        center: defaultLocation,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true
    });

    // Try to get current location immediately
    getCurrentLocation();
}

function setupEventListeners() {
    // Start Tracking Button
    document.getElementById('startTracking').addEventListener('click', startContinuousTracking);
    
    // Stop Tracking Button
    document.getElementById('stopTracking').addEventListener('click', stopContinuousTracking);
    
    // Refresh Location Button
    document.getElementById('refreshLocation').addEventListener('click', getCurrentLocation);
    
    // Add Safe Zone Button
    document.getElementById('addSafeZone').addEventListener('click', function() {
        alert('Safe zone creation feature would open here. This is a demo implementation.');
    });
    
    // Emergency Alert Button
    document.getElementById('emergencyAlert').addEventListener('click', showEmergencyModal);
    
    // Emergency Modal Buttons
    document.getElementById('confirmEmergency').addEventListener('click', sendEmergencyAlert);
    document.getElementById('cancelEmergency').addEventListener('click', hideEmergencyModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('emergencyModal');
        if (event.target === modal) {
            hideEmergencyModal();
        }
    });
}

function getCurrentLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by this browser.');
        return;
    }

    showLoading('Getting your current location...');

    navigator.geolocation.getCurrentPosition(
        function(position) {
            updateUserLocation(position);
            hideLoading();
        },
        function(error) {
            console.error('Error getting location:', error);
            handleLocationError(error);
            hideLoading();
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        }
    );
}

function startContinuousTracking() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by this browser.');
        return;
    }

    if (isTracking) {
        alert('Location tracking is already active.');
        return;
    }

    showLoading('Starting continuous location tracking...');

    watchId = navigator.geolocation.watchPosition(
        function(position) {
            updateUserLocation(position);
            if (!isTracking) {
                isTracking = true;
                updateTrackingStatus(true);
                hideLoading();
                showNotification('Continuous tracking started successfully!', 'success');
            }
        },
        function(error) {
            console.error('Error in continuous tracking:', error);
            handleLocationError(error);
            hideLoading();
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 30000
        }
    );
}

function stopContinuousTracking() {
    if (watchId && isTracking) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        isTracking = false;
        updateTrackingStatus(false);
        showNotification('Continuous tracking stopped.', 'info');
    } else {
        alert('No active tracking session to stop.');
    }
}

function updateUserLocation(position) {
    const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    };

    // Update map center and marker
    map.setCenter(userLocation);
    
    if (!userMarker) {
        userMarker = new google.maps.Marker({
            position: userLocation,
            map: map,
            title: 'Your Current Location',
            icon: {
                url: 'data:image/svg+xml;base64,' + btoa(`
                    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="12" fill="#4285F4" stroke="white" stroke-width="2"/>
                        <circle cx="16" cy="16" r="4" fill="white"/>
                    </svg>
                `),
                scaledSize: new google.maps.Size(32, 32)
            }
        });
    } else {
        userMarker.setPosition(userLocation);
    }

    // Add accuracy circle
    const accuracyCircle = new google.maps.Circle({
        strokeColor: '#4285F4',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#4285F4',
        fillOpacity: 0.2,
        map: map,
        center: userLocation,
        radius: position.coords.accuracy
    });

    // Remove previous accuracy circle after 5 seconds
    setTimeout(() => {
        accuracyCircle.setMap(null);
    }, 5000);

    // Update location details
    updateLocationDetails(position);
    
    // Save location to history
    saveLocationToHistory(userLocation, position.coords.accuracy);
}

function updateLocationDetails(position) {
    document.getElementById('currentLat').textContent = position.coords.latitude.toFixed(6);
    document.getElementById('currentLng').textContent = position.coords.longitude.toFixed(6);
    document.getElementById('currentAccuracy').textContent = `${Math.round(position.coords.accuracy)} meters`;
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
    
    // Update header stats
    document.getElementById('locationTime').textContent = 'Now';
}

function updateTrackingStatus(tracking) {
    const statusElement = document.getElementById('locationStatus');
    const startButton = document.getElementById('startTracking');
    const stopButton = document.getElementById('stopTracking');
    
    if (tracking) {
        statusElement.textContent = 'Tracking';
        statusElement.style.color = '#4ecdc4';
        startButton.disabled = true;
        stopButton.disabled = false;
    } else {
        statusElement.textContent = 'Active';
        statusElement.style.color = '#666';
        startButton.disabled = false;
        stopButton.disabled = true;
    }
}

function handleLocationError(error) {
    let errorMessage = 'Unknown error occurred while getting location.';
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
        case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
    }
    
    showNotification(errorMessage, 'error');
    console.error('Location error:', error);
}

function saveLocationToHistory(location, accuracy) {
    const history = JSON.parse(localStorage.getItem('locationHistory')) || [];
    
    history.unshift({
        timestamp: new Date().toISOString(),
        latitude: location.lat,
        longitude: location.lng,
        accuracy: accuracy
    });
    
    // Keep only last 50 locations
    if (history.length > 50) {
        history.pop();
    }
    
    localStorage.setItem('locationHistory', JSON.stringify(history));
}

function showEmergencyModal() {
    document.getElementById('emergencyModal').style.display = 'block';
}

function hideEmergencyModal() {
    document.getElementById('emergencyModal').style.display = 'none';
}

function sendEmergencyAlert() {
    const userLocation = userMarker ? userMarker.getPosition() : null;
    
    let alertMessage = '🚨 EMERGENCY ALERT 🚨\n\n';
    alertMessage += 'I need immediate assistance!\n\n';
    
    if (userLocation) {
        alertMessage += `My current location:\n`;
        alertMessage += `Latitude: ${userLocation.lat().toFixed(6)}\n`;
        alertMessage += `Longitude: ${userLocation.lng().toFixed(6)}\n`;
        alertMessage += `Google Maps: https://maps.google.com/?q=${userLocation.lat()},${userLocation.lng()}\n\n`;
    }
    
    alertMessage += `Time: ${new Date().toLocaleString()}\n`;
    alertMessage += `Sent via Alzheimer's Support App`;
    
    // In a real app, this would send to backend and notify emergency contacts
    alert('EMERGENCY ALERT SENT!\n\nThis alert with your location has been sent to your emergency contacts.\n\nMessage content:\n' + alertMessage);
    
    hideEmergencyModal();
    showNotification('Emergency alert sent successfully!', 'success');
}

function showLoading(message) {
    // You can implement a loading spinner here
    console.log('Loading:', message);
}

function hideLoading() {
    // Hide loading spinner
    console.log('Loading complete');
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
        ${type === 'success' ? 'background: #4ecdc4;' : type === 'error' ? 'background: #ff6b6b;' : 'background: #a8d0e6;'}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function callNumber(number) {
    alert(`Calling ${number}. In a real app, this would initiate a phone call.`);
    // In a real mobile app, you would use: window.location.href = `tel:${number}`;
}

// Initialize map when Google Maps API is loaded
window.initMap = initializeLocationTracker;
