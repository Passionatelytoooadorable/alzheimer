document.addEventListener('DOMContentLoaded', function() {
    const addMemoryBtn = document.getElementById('addMemoryBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const placeholderContent = document.getElementById('placeholderContent');
    const memoryForm = document.getElementById('memoryForm');
    const uploadArea = document.getElementById('uploadArea');
    const photoUpload = document.getElementById('photoUpload');
    
    // Show memory form when "Add New Memory" is clicked
    addMemoryBtn.addEventListener('click', function() {
        placeholderContent.style.display = 'none';
        memoryForm.style.display = 'block';
    });
    
    // Hide memory form when cancel is clicked
    cancelBtn.addEventListener('click', function() {
        memoryForm.style.display = 'none';
        placeholderContent.style.display = 'block';
    });
    
    // Handle file upload area click
    uploadArea.addEventListener('click', function() {
        photoUpload.click();
    });
    
    // Handle file selection
    photoUpload.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            const fileName = e.target.files[0].name;
            uploadArea.innerHTML = `
                <i class="fas fa-check-circle" style="color: #4CAF50;"></i>
                <p>File selected: ${fileName}</p>
                <p class="file-types">Click to change photo</p>
            `;
        }
    });
    
    // Handle drag and drop for file upload
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.style.borderColor = '#ffcc00';
        uploadArea.style.background = 'rgba(255, 255, 255, 0.1)';
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        uploadArea.style.background = 'transparent';
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        uploadArea.style.background = 'transparent';
        
        if (e.dataTransfer.files.length > 0) {
            photoUpload.files = e.dataTransfer.files;
            const fileName = e.dataTransfer.files[0].name;
            uploadArea.innerHTML = `
                <i class="fas fa-check-circle" style="color: #4CAF50;"></i>
                <p>File selected: ${fileName}</p>
                <p class="file-types">Click to change photo</p>
            `;
        }
    });
    
    // Handle form submission
    const form = document.querySelector('.memory-form form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const personName = document.getElementById('personName').value;
        const relationship = document.getElementById('relationship').value;
        
        if (!personName || !relationship) {
            alert('Please fill in all required fields');
            return;
        }
        
        // In a real app, you would save the memory data here
        alert(`Memory for ${personName} (${relationship}) has been saved!`);
        
        // Reset form and show placeholder
        form.reset();
        memoryForm.style.display = 'none';
        placeholderContent.style.display = 'block';
        
        // Reset upload area
        uploadArea.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Click to upload photo or drag & drop</p>
            <p class="file-types">JPEG, PNG - Max 5MB</p>
        `;
    });
    
    // Category selection
    const categories = document.querySelectorAll('.categories li');
    categories.forEach(category => {
        category.addEventListener('click', function() {
            categories.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
        });
    });
});
