document.addEventListener('DOMContentLoaded', function() {
    const addMemoryBtn = document.getElementById('addMemoryBtn');
    const formSidebar = document.getElementById('formSidebar');
    const closeFormBtn = document.getElementById('closeFormBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const memoryForm = document.getElementById('memoryForm');
    const memoriesGrid = document.getElementById('memoriesGrid');
    
    // Show form when "Add New Memory" is clicked
    addMemoryBtn.addEventListener('click', function() {
        formSidebar.style.display = 'block';
        if (window.innerWidth <= 768) {
            formSidebar.classList.add('active');
        }
    });
    
    // Hide form when close button is clicked
    closeFormBtn.addEventListener('click', function() {
        hideFormSidebar();
    });
    
    // Hide form when cancel button is clicked
    cancelBtn.addEventListener('click', function() {
        hideFormSidebar();
    });
    
    // Function to hide the form sidebar
    function hideFormSidebar() {
        if (window.innerWidth <= 768) {
            formSidebar.classList.remove('active');
            setTimeout(() => {
                formSidebar.style.display = 'none';
            }, 300);
        } else {
            formSidebar.style.display = 'none';
        }
    }
    
    // Handle form submission
    memoryForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const personName = document.getElementById('personName').value;
        const relationship = document.getElementById('relationship').value;
        const memoryDescription = document.getElementById('memoryDescription').value;
        
        // Create new memory card
        createMemoryCard(personName, relationship, memoryDescription);
        
        // Reset form and hide it
        memoryForm.reset();
        hideFormSidebar();
        
        // Show success message
        alert('Memory saved successfully!');
    });
    
    // Handle file upload area click
    const uploadArea = document.getElementById('photoUpload');
    uploadArea.addEventListener('click', function() {
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/jpeg,image/png';
        
        // Trigger file selection
        fileInput.click();
        
        // Handle file selection
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                // Check file size (5MB max)
                if (file.size > 5 * 1024 * 1024) {
                    alert('File size must be less than 5MB');
                    return;
                }
                // Check file type
                if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
                    alert('Please select a JPEG or PNG image');
                    return;
                }
                
                // In a real app, you would upload the file here
                alert('File selected: ' + file.name);
            }
        });
    });
    
    // Function to create a memory card
    function createMemoryCard(name, relationship, description) {
        // Remove empty state if it exists
        const emptyState = memoriesGrid.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
        
        // Create memory card HTML
        const memoryCard = document.createElement('div');
        memoryCard.className = 'memory-card';
        memoryCard.innerHTML = `
            <div class="memory-img"></div>
            <div class="memory-content">
                <div class="memory-name">${name}</div>
                <div class="memory-relationship">${relationship}</div>
                <div class="memory-description">${description}</div>
            </div>
        `;
        
        // Add the new memory card to the grid
        memoriesGrid.appendChild(memoryCard);
    }
    
    // Close form when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && 
            formSidebar.classList.contains('active') && 
            !formSidebar.contains(e.target) && 
            e.target !== addMemoryBtn) {
            hideFormSidebar();
        }
    });
});
