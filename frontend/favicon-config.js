// SVG Version 
class DynamicFavicon {
    constructor() {
        this.pageIcons = {
            'index.html': '🏠',
            'dashboard.html': '📊',
            'ai-companion.html': '🤖',
            'memory-vault.html': '💖',
            'journal.html': '📝',
            'location-tracker.html': '📍',
            'resources.html': '📚',
            'login.html': '🔐',
            'signup.html': '👤'
        };
        
        // Only initialize on pages that should have dynamic favicons
        if (this.shouldInitialize()) {
            this.init();
        }
    }

    shouldInitialize() {
        // Don't initialize on login/signup pages to avoid conflicts
        const currentPage = this.getCurrentPage();
        return currentPage !== 'login.html' && currentPage !== 'signup.html';
    }

    init() {
        // Set initial favicon based on current page
        this.updateFavicon();
        
        // Listen for page changes (for SPA-like behavior)
        window.addEventListener('hashchange', () => this.updateFavicon());
        window.addEventListener('popstate', () => this.updateFavicon());
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        return page;
    }

    createFavicon(emoji) {
        // Create SVG favicon - FIXED: Use encodeURIComponent instead of btoa
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <rect width="100" height="100" fill="transparent" rx="15"/>
            <text x="50" y="85" font-family="Arial, sans-serif" font-size="95"
                  text-anchor="middle" fill="white">${emoji}</text>
        </svg>`;
        
        // FIX: Use encodeURIComponent instead of btoa for emoji support
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    updateFavicon() {
        try {
            const currentPage = this.getCurrentPage();
            const emoji = this.pageIcons[currentPage] || '🧠';
            
            // Remove any existing favicon
            const existingFavicon = document.querySelector('link[rel="icon"]');
            if (existingFavicon) {
                existingFavicon.remove();
            }

            // Create new favicon
            const favicon = document.createElement('link');
            favicon.rel = 'icon';
            favicon.href = this.createFavicon(emoji);
            favicon.type = 'image/svg+xml';
            
            document.head.appendChild(favicon);
            
            // Update Apple touch icon too
            this.updateAppleTouchIcon(emoji);
        } catch (error) {
        }
    }

    updateAppleTouchIcon(emoji) {
        const existingAppleIcon = document.querySelector('link[rel="apple-touch-icon"]');
        if (existingAppleIcon) {
            existingAppleIcon.remove();
        }

        const appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        appleIcon.href = this.createFavicon(emoji);
        document.head.appendChild(appleIcon);
    }
}

// Initialize when DOM is loaded - only on allowed pages
document.addEventListener('DOMContentLoaded', () => {
    const dynamicFavicon = new DynamicFavicon();
});