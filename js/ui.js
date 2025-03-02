/**
 * UI Module
 * Handles UI interactions and updates
 */

const UI = {
    // Initialize tab system
    initTabSystem: function() {
        // Get all tab buttons and tab panes
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        // Add click event to each tab button
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Get the target tab
                const targetTab = button.dataset.tab;
                
                // Remove active class from all buttons and panes
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                // Add active class to clicked button and corresponding pane
                button.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
            });
        });
    },
    
    // Update character counts for all text areas
    updateCharacterCounts: function() {
        const updateCount = (elementId, limit) => {
            const textarea = document.getElementById(elementId);
            const counter = document.getElementById(`${elementId.split('-')[0]}-counter`);
            
            if (textarea && counter) {
                const count = textarea.value.length;
                counter.textContent = count;
                
                // Check if over limit
                if (count > limit) {
                    counter.style.color = 'var(--error-color)';
                } else {
                    counter.style.color = '';
                }
            }
        };
        
        // Update counts for each platform
        updateCount('bluesky-text', 300);
        updateCount('tumblr-text', 500);
        updateCount('mastodon-text', 500);
        updateCount('instagram-text', 2200);
    },
    
    // Populate settings form with config data
    populateSettingsForm: function() {
        document.getElementById('bluesky-username').value = appState.config.bluesky.username || '';
        document.getElementById('bluesky-password').value = appState.config.bluesky.app_password || '';
        
        document.getElementById('tumblr-api-key').value = appState.config.tumblr.api_key || '';
        document.getElementById('tumblr-blog-identifier').value = appState.config.tumblr.blog_identifier || '';
        
        document.getElementById('mastodon-instance').value = appState.config.mastodon.instance_url || '';
        document.getElementById('mastodon-token').value = appState.config.mastodon.access_token || '';
        
        document.getElementById('instagram-username').value = appState.config.instagram.username || '';
        document.getElementById('instagram-password').value = appState.config.instagram.password || '';
    },
    
    // Show status modal with message
    showStatusModal: function(title, message, isPosting = false) {
        const modal = document.getElementById('status-modal');
        const titleElement = document.getElementById('status-title');
        const messageElement = document.getElementById('status-message');
        
        titleElement.textContent = title;
        
        if (isPosting) {
            // Show loading indicators for each platform
            let html = '<div class="status-container">';
            
            for (const [platform, status] of Object.entries(appState.platformStatus)) {
                if (status.enabled) {
                    html += `
                        <div class="status-item" id="${platform}-status">
                            <span class="status-icon status-pending">
                                <i class="fas fa-spinner fa-spin"></i>
                            </span>
                            <span class="status-text">Posting to ${this.capitalizeFirstLetter(platform)}...</span>
                        </div>
                    `;
                }
            }
            
            html += '</div>';
            messageElement.innerHTML = html;
        } else {
            // Show simple message
            messageElement.innerHTML = `<p>${message}</p>`;
        }
        
        // Display the modal
        modal.style.display = 'flex';
    },
    
    // Update status modal with post results
    updateStatusModal: function(title, results) {
        const titleElement = document.getElementById('status-title');
        const messageElement = document.getElementById('status-message');
        
        titleElement.textContent = title;
        
        let html = '<div class="status-container">';
        
        // Loop through each result
        for (const result of results) {
            const iconClass = result.success ? 'status-success' : 'status-error';
            const icon = result.success ? 'fa-check-circle' : 'fa-times-circle';
            
            html += `
                <div class="status-item">
                    <span class="status-icon ${iconClass}">
                        <i class="fas ${icon}"></i>
                    </span>
                    <span class="status-text">
                        <strong>${this.capitalizeFirstLetter(result.platform)}:</strong> ${result.message}
                    </span>
                </div>
            `;
        }
        
        html += '</div>';
        messageElement.innerHTML = html;
    },
    
    // Open schedule modal
    openScheduleModal: function() {
        const modal = document.getElementById('schedule-modal');
        
        // Set min date and time to today
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        document.getElementById('schedule-date').min = dateStr;
        
        // Set default to an hour from now
        const hourFromNow = new Date(today.getTime() + 60 * 60 * 1000);
        document.getElementById('schedule-date').value = hourFromNow.toISOString().split('T')[0];
        
        // Format the time (HH:MM)
        const hours = String(hourFromNow.getHours()).padStart(2, '0');
        const minutes = String(hourFromNow.getMinutes()).padStart(2, '0');
        document.getElementById('schedule-time').value = `${hours}:${minutes}`;
        
        // Show the modal
        modal.style.display = 'flex';
    },
    
    // Create item card (for drafts and scheduled posts)
    createItemCard: function(item, type) {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.dataset.id = item.id;
        
        // Get content text (prefer common, fallback to first non-empty platform)
        const content = item.post.common || 
                      item.post.bluesky || 
                      item.post.tumblr || 
                      item.post.mastodon || 
                      item.post.instagram || 
                      'No text content';
                      
        // Truncate content if too long
        const truncatedContent = content.length > 100 ? 
            content.substring(0, 97) + '...' : 
            content;
        
        // Format date
        const dateOptions = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        const dateCreated = new Date(item.created).toLocaleDateString('en-US', dateOptions);
        
        // Get enabled platforms
        const enabledPlatforms = Object.entries(item.platforms)
            .filter(([_, status]) => status.enabled)
            .map(([platform, _]) => platform);
        
        // Create platforms badges
        const platformBadges = enabledPlatforms.map(platform => 
            `<span class="platform-badge">${this.capitalizeFirstLetter(platform)}</span>`
        ).join('');
        
        // Card content
        let cardContent = `
            <div class="item-header">
                <span class="item-title">${type === 'draft' ? 'Draft' : 'Scheduled Post'}</span>
                <span class="item-date">${dateCreated}</span>
            </div>
            <div class="item-content">${truncatedContent}</div>
            <div class="item-platforms">${platformBadges}</div>
            <div class="item-actions">
        `;
        
        // Different actions based on type
        if (type === 'draft') {
            cardContent += `
                <button class="secondary-btn edit-draft-btn" data-id="${item.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="secondary-btn delete-draft-btn" data-id="${item.id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;
        } else {
            // Add scheduled time
            const scheduledTime = new Date(item.scheduledTime).toLocaleDateString('en-US', dateOptions);
            cardContent = cardContent.replace(`</div>
            <div class="item-content">`, `</div>
            <div class="item-scheduled">Scheduled for: ${scheduledTime}</div>
            <div class="item-content">`);
            
            cardContent += `
                <button class="secondary-btn edit-scheduled-btn" data-id="${item.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="secondary-btn delete-scheduled-btn" data-id="${item.id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;
        }
        
        cardContent += `</div>`;
        card.innerHTML = cardContent;
        
        return card;
    },
    
    // Update platform status in posting modal
    updatePlatformStatus: function(platform, success, message) {
        const statusElement = document.getElementById(`${platform}-status`);
        if (!statusElement) return;
        
        const iconClass = success ? 'status-success' : 'status-error';
        const icon = success ? 'fa-check-circle' : 'fa-times-circle';
        
        statusElement.innerHTML = `
            <span class="status-icon ${iconClass}">
                <i class="fas ${icon}"></i>
            </span>
            <span class="status-text">
                <strong>${this.capitalizeFirstLetter(platform)}:</strong> ${message}
            </span>
        `;
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Instagram help link
        document.getElementById('instagram-auth-help').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('instagram-help-modal').style.display = 'flex';
        });
        
        // Instagram export button
        document.getElementById('export-instagram').addEventListener('click', (e) => {
            e.preventDefault();
            handleInstagramExport();
        });
        
        // Close buttons for all modals including the Instagram help modal
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
            });
        });
    },
    
    // Helper function to capitalize first letter
    capitalizeFirstLetter: function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}; 