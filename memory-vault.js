// Modal functionality
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('addMemoryModal');
    const addBtn = document.getElementById('addMemoryBtn');
    const closeBtn = document.querySelector('.close');
    const memoryForm = document.getElementById('memoryForm');
    
    // Open modal
    addBtn.addEventListener('click', function() {
        modal.style.display = 'block';
    });
    
    // Close modal
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Handle form submission
    memoryForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = document.getElementById('memoryTitle').value;
        const date = document.getElementById('memoryDate').value;
        const description = document.getElementById('memoryDescription').value;
        
        // In a real app, you would save this data and add the new memory to the gallery
        alert(`Memory "${title}" added successfully!`);
        
        // Reset form and close modal
        memoryForm.reset();
        modal.style.display = 'none';
    });
    
    // Add click functionality to memory cards
    const memoryCards = document.querySelectorAll('.memory-card');
    
    memoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const title = this.querySelector('h3').textContent;
            alert(`Viewing memory: ${title}`);
            // In a real app, you would open a detailed view of the memory
        });
    });
});
