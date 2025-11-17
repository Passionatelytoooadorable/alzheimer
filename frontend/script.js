// Homepage JavaScript - can be used for interactive elements
document.addEventListener('DOMContentLoaded', function() {
    console.log('Alzheimer\'s Support Platform loaded');
    
    // Add any homepage-specific JavaScript here
    // For example: interactive features, animations, etc.
    
    // Example: Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
