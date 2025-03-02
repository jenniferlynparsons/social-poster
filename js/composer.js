/**
 * Composer Module
 * Handles post composition, rich text formatting, and image uploads
 */

const Composer = {
    // Initialize composer
    init: function() {
        // Set up rich text toolbar functionality
        this.setupRichTextToolbar();
        
        // Initialize any composer state
        appState.currentPost.images = [];
    },
    
    // Setup the rich text toolbar
    setupRichTextToolbar: function() {
        const toolbarButtons = document.querySelectorAll('.toolbar-btn');
        const textarea = document.getElementById('common-text');
        
        toolbarButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = button.getAttribute('data-action');
                
                // Handle different formatting actions
                switch (action) {
                    case 'bold':
                        this.insertFormatting(textarea, '**', '**');
                        break;
                    case 'italic':
                        this.insertFormatting(textarea, '*', '*');
                        break;
                    case 'link':
                        const url = prompt('Enter the URL:');
                        if (url) {
                            this.insertFormatting(textarea, '[', `](${url})`);
                        }
                        break;
                    case 'image':
                        document.getElementById('image-upload').click();
                        break;
                }
                
                // Toggle active state for the button
                if (action !== 'link' && action !== 'image') {
                    button.classList.toggle('active');
                }
            });
        });
    },
    
    // Insert formatting around selected text
    insertFormatting: function(textarea, beforeText, afterText) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        const beforeContent = textarea.value.substring(0, start);
        const afterContent = textarea.value.substring(end);
        
        // If text is selected, wrap it in formatting
        if (selectedText.length > 0) {
            textarea.value = beforeContent + beforeText + selectedText + afterText + afterContent;
            textarea.selectionStart = start + beforeText.length;
            textarea.selectionEnd = end + beforeText.length;
        } else {
            // If no text is selected, insert formatting and place cursor between
            textarea.value = beforeContent + beforeText + afterText + afterContent;
            textarea.selectionStart = start + beforeText.length;
            textarea.selectionEnd = start + beforeText.length;
        }
        
        // Update character counts
        UI.updateCharacterCounts();
        
        // Focus back on textarea
        textarea.focus();
    },
    
    // Handle image upload
    handleImageUpload: function(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        // Process each file
        Array.from(files).forEach(file => {
            // Check if it's an image
            if (!file.type.startsWith('image/')) {
                alert('Please upload only image files.');
                return;
            }
            
            // Check file size (limit to 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size should be less than 5MB.');
                return;
            }
            
            // Read and preview the image
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target.result;
                
                // Add image to state
                appState.currentPost.images.push({
                    file: file,
                    url: imageUrl
                });
                
                // Show image preview
                this.updateImagePreview();
            };
            
            reader.readAsDataURL(file);
        });
        
        // Reset file input
        event.target.value = null;
    },
    
    // Update image preview
    updateImagePreview: function() {
        const previewContainer = document.querySelector('.image-preview-container');
        const previewElement = document.getElementById('image-preview');
        
        // Clear previous previews
        previewElement.innerHTML = '';
        
        // If we have images, show them
        if (appState.currentPost.images.length > 0) {
            previewContainer.classList.remove('hidden');
            
            // Add each image to preview
            appState.currentPost.images.forEach((image, index) => {
                const imgElement = document.createElement('img');
                imgElement.src = image.url;
                imgElement.alt = `Uploaded image ${index + 1}`;
                imgElement.onclick = () => this.removeImage(index);
                imgElement.title = 'Click to remove';
                
                previewElement.appendChild(imgElement);
            });
        } else {
            previewContainer.classList.add('hidden');
        }
    },
    
    // Remove a specific image
    removeImage: function(index) {
        if (confirm('Remove this image?')) {
            appState.currentPost.images.splice(index, 1);
            this.updateImagePreview();
        }
    },
    
    // Remove all images
    removeImages: function() {
        if (appState.currentPost.images.length === 0) return;
        
        if (confirm('Remove all uploaded images?')) {
            appState.currentPost.images = [];
            this.updateImagePreview();
        }
    },
    
    // Compress image before upload
    compressImage: function(imageFile, maxWidth = 1200, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                
                img.onload = () => {
                    // Create canvas for resizing
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    // Calculate new dimensions
                    if (width > maxWidth) {
                        height = Math.round(height * maxWidth / width);
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Draw resized image
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert to blob
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(new File([blob], imageFile.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            }));
                        } else {
                            reject(new Error('Canvas to Blob conversion failed'));
                        }
                    }, 'image/jpeg', quality);
                };
                
                img.onerror = () => {
                    reject(new Error('Error loading image'));
                };
            };
            
            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };
        });
    },
    
    // Clear the composition form
    clearForm: function() {
        document.getElementById('common-text').value = '';
        document.getElementById('bluesky-text').value = '';
        document.getElementById('tumblr-text').value = '';
        document.getElementById('mastodon-text').value = '';
        document.getElementById('instagram-text').value = '';
        
        // Reset image state
        appState.currentPost.images = [];
        this.updateImagePreview();
        
        // Update character counts
        UI.updateCharacterCounts();
    },
    
    // Load post data into the form (for editing drafts/scheduled)
    loadPostData: function(postData) {
        document.getElementById('common-text').value = postData.post.common || '';
        document.getElementById('bluesky-text').value = postData.post.bluesky || '';
        document.getElementById('tumblr-text').value = postData.post.tumblr || '';
        document.getElementById('mastodon-text').value = postData.post.mastodon || '';
        document.getElementById('instagram-text').value = postData.post.instagram || '';
        
        // Set platform toggles
        for (const [platform, status] of Object.entries(postData.platforms)) {
            document.getElementById(`${platform}-toggle`).checked = status.enabled;
            appState.platformStatus[platform].enabled = status.enabled;
        }
        
        // Load images if any
        appState.currentPost.images = postData.post.images || [];
        this.updateImagePreview();
        
        // Update character counts
        UI.updateCharacterCounts();
        
        // Switch to compose tab
        document.querySelector('.tab-btn[data-tab="compose"]').click();
    }
}; 