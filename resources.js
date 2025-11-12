// Resources JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize resources
    initResources();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load resources data
    loadResourcesData();
});

function initResources() {
    console.log('Resources section initialized');
    
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
}

function setupEventListeners() {
    // Category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.dataset.category;
            filterResources(category);
            
            // Update active state
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Quick access buttons
    document.querySelectorAll('.quick-access-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.dataset.category;
            
            if (category === 'emergency') {
                openEmergencyModal();
            } else {
                filterResources(category);
                
                // Update active category button
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                document.querySelector(`.category-btn[data-category="${category}"]`).classList.add('active');
                
                // Scroll to resources
                document.querySelector('.resources-grid').scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Emergency modal
    const emergencyModal = document.getElementById('emergencyModal');
    const closeBtn = document.querySelector('.close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            emergencyModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === emergencyModal) {
            emergencyModal.style.display = 'none';
        }
    });
    
    // Resource link tracking
    setupResourceLinkTracking();
}

function filterResources(category) {
    const resourceCategories = document.querySelectorAll('.resource-category');
    
    if (category === 'all') {
        // Show all categories
        resourceCategories.forEach(cat => {
            cat.classList.add('active');
        });
    } else {
        // Show only selected category
        resourceCategories.forEach(cat => {
            if (cat.dataset.category === category) {
                cat.classList.add('active');
            } else {
                cat.classList.remove('active');
            }
        });
    }
    
    // Update URL hash for deep linking
    window.location.hash = category === 'all' ? '' : `#${category}`;
}

function openEmergencyModal() {
    const modal = document.getElementById('emergencyModal');
    modal.style.display = 'block';
    
    // Log emergency access
    logResourceAccess('emergency_modal_opened');
}

function loadResourcesData() {
    // Check URL hash for deep linking
    const hash = window.location.hash.substring(1);
    if (hash && document.querySelector(`.category-btn[data-category="${hash}"]`)) {
        filterResources(hash);
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.category-btn[data-category="${hash}"]`).classList.add('active');
    } else {
        // Default to showing all resources
        filterResources('all');
    }
    
    // Update resource counts (could be dynamic in a real app)
    updateResourceStats();
}

function updateResourceStats() {
    // In a real app, these would be fetched from an API
    const stats = {
        totalResources: '50+',
        supportGroups: '25+',
        emergencyContacts: '10+'
    };
    
    Object.keys(stats).forEach(stat => {
        const element = document.getElementById(stat);
        if (element) {
            element.textContent = stats[stat];
        }
    });
}

function setupResourceLinkTracking() {
    // Track resource link clicks for analytics
    document.querySelectorAll('.resource-link').forEach(link => {
        link.addEventListener('click', function(e) {
            const resourceName = this.textContent.trim();
            const resourceUrl = this.href;
            
            logResourceAccess(resourceName, resourceUrl);
            
            // Optional: Open in new tab for external links
            if (this.target === '_blank') {
                e.preventDefault();
                window.open(this.href, '_blank');
            }
        });
    });
}

function logResourceAccess(resourceName, resourceUrl = '') {
    // In a real app, this would send data to analytics
    console.log(`Resource accessed: ${resourceName}`, resourceUrl);
    
    // Store in localStorage for recent resources
    const recentResources = JSON.parse(localStorage.getItem('recentResources') || '[]');
    const accessRecord = {
        name: resourceName,
        url: resourceUrl,
        timestamp: new Date().toISOString()
    };
    
    // Add to beginning and keep only last 10
    recentResources.unshift(accessRecord);
    if (recentResources.length > 10) {
        recentResources.pop();
    }
    
    localStorage.setItem('recentResources', JSON.stringify(recentResources));
}

// Emergency contact functions
function callNumber(number) {
    if (confirm(`Call ${number}?`)) {
        // In a real app, this would initiate a phone call
        // For web demo, we'll just show an alert
        alert(`Calling ${number}...\n\nIn a real application, this would connect the call.`);
        
        // Log emergency call attempt
        logResourceAccess(`emergency_call_${number}`);
    }
}

// Export functions for use in other modules
window.resourcesFunctions = {
    openEmergencyResources: function() {
        openEmergencyModal();
    },
    
    filterByCategory: function(category) {
        filterResources(category);
    },
    
    getRecentResources: function() {
        return JSON.parse(localStorage.getItem('recentResources') || '[]');
    }
};

// Add some utility functions
function searchResources(query) {
    // This would be implemented for search functionality
    console.log('Searching resources for:', query);
    
    // In a real implementation, this would filter resources based on the query
    const resources = document.querySelectorAll('.resource-card');
    resources.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(query.toLowerCase())) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Initialize search if search functionality is added later
function initSearch() {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search resources...';
    searchInput.className = 'resource-search';
    searchInput.style.cssText = `
        width: 100%;
        padding: 1rem;
        border: 2px solid #a8d0e6;
        border-radius: 8px;
        font-size: 1rem;
        margin-bottom: 2rem;
    `;
    
    searchInput.addEventListener('input', function(e) {
        searchResources(e.target.value);
    });
    
    // Add search to the page if needed
    // document.querySelector('.resources-content').prepend(searchInput);
}

// Call initSearch if you want to add search functionality
// initSearch();