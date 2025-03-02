/**
 * Social Media Poster
 * Main application file
 */

// Global app state
const appState = {
    // User config
    config: {
        bluesky: { username: '', app_password: '' },
        tumblr: { api_key: '', blog_identifier: '' },
        mastodon: { instance_url: '', access_token: '' },
        instagram: { enabled: false } // Simplified Instagram config for export only
    },
    // Current post data
    currentPost: {
        common: '',
        bluesky: '',
        tumblr: '',
        mastodon: '',
        instagram: '',
        images: []
    },
    // Platform status
    platformStatus: {
        bluesky: { enabled: true },
        tumblr: { enabled: true },
        mastodon: { enabled: true },
        instagram: { enabled: true, exportOnly: true }
    },
    // Theme 
    darkMode: false,
    // Drafts and scheduled posts
    drafts: [],
    scheduledPosts: []
};

// Initialization function
function initApp() {
    console.log('Initializing Social Media Poster App...');
    
    // Load user configuration
    loadConfig();
    
    // Setup UI event listeners
    setupEventListeners();
    
    // Initialize UI components
    UI.initTabSystem();
    UI.updateCharacterCounts();
    UI.setupEventListeners();
    
    // Check for dark mode preference
    checkThemePreference();
    
    // Initialize the composer
    Composer.init();
    
    // Initialize scheduled post checker
    Storage.initScheduledPostChecker();
    
    console.log('App initialization complete');
}

// Load user configuration from localStorage
function loadConfig() {
    try {
        const savedConfig = localStorage.getItem('socialPosterConfig');
        if (savedConfig) {
            appState.config = JSON.parse(savedConfig);
            console.log('Configuration loaded from localStorage');
            
            // Fill settings form with loaded config
            UI.populateSettingsForm();
        } else {
            console.log('No saved configuration found');
        }
        
        // Also load drafts and scheduled posts
        const savedDrafts = localStorage.getItem('socialPosterDrafts');
        if (savedDrafts) {
            appState.drafts = JSON.parse(savedDrafts);
            Storage.renderDrafts();
        }
        
        const savedScheduled = localStorage.getItem('socialPosterScheduled');
        if (savedScheduled) {
            appState.scheduledPosts = JSON.parse(savedScheduled);
            Storage.renderScheduledPosts();
        }
    } catch (error) {
        console.error('Error loading configuration:', error);
    }
}

// Save user configuration to localStorage
function saveConfig() {
    try {
        localStorage.setItem('socialPosterConfig', JSON.stringify(appState.config));
        console.log('Configuration saved to localStorage');
        return true;
    } catch (error) {
        console.error('Error saving configuration:', error);
        return false;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Theme toggle
    document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
    
    // Post button
    document.getElementById('post-btn').addEventListener('click', handlePost);
    
    // Save draft button
    document.getElementById('save-draft-btn').addEventListener('click', () => {
        Storage.saveDraft();
    });
    
    // Schedule button
    document.getElementById('schedule-btn').addEventListener('click', () => {
        UI.openScheduleModal();
    });
    
    // Upload button
    document.getElementById('upload-btn').addEventListener('click', () => {
        document.getElementById('image-upload').click();
    });
    
    // Image upload change
    document.getElementById('image-upload').addEventListener('change', (e) => {
        Composer.handleImageUpload(e);
    });
    
    // Remove image button
    document.getElementById('remove-image').addEventListener('click', () => {
        Composer.removeImages();
    });
    
    // Save settings button
    document.getElementById('save-settings').addEventListener('click', handleSaveSettings);
    
    // Export config button
    document.getElementById('export-config').addEventListener('click', exportConfig);
    
    // Import config button
    document.getElementById('import-config').addEventListener('click', importConfig);
    
    // Schedule modal confirm button
    document.getElementById('confirm-schedule').addEventListener('click', handleSchedulePost);
    
    // Close buttons for modals
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Platform toggles
    document.querySelectorAll('.platform-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const platform = e.target.id.split('-')[0];
            appState.platformStatus[platform].enabled = e.target.checked;
        });
    });
    
    // Text area input for character counting
    document.querySelectorAll('textarea').forEach(textarea => {
        textarea.addEventListener('input', UI.updateCharacterCounts);
    });
}

// Handle saving settings
function handleSaveSettings() {
    // Get values from form
    appState.config.bluesky.username = document.getElementById('bluesky-username').value;
    appState.config.bluesky.app_password = document.getElementById('bluesky-password').value;
    
    appState.config.tumblr.api_key = document.getElementById('tumblr-api-key').value;
    appState.config.tumblr.blog_identifier = document.getElementById('tumblr-blog-identifier').value;
    
    appState.config.mastodon.instance_url = document.getElementById('mastodon-instance').value;
    appState.config.mastodon.access_token = document.getElementById('mastodon-token').value;
    
    appState.config.instagram.accessToken = document.getElementById('instagram-access-token').value;
    appState.config.instagram.businessAccountId = document.getElementById('instagram-business-account-id').value;
    appState.config.instagram.appId = document.getElementById('instagram-app-id').value;
    appState.config.instagram.appSecret = document.getElementById('instagram-app-secret').value;
    appState.config.instagram.facebookPageId = document.getElementById('instagram-facebook-page-id').value;
    
    // Save to localStorage
    if (saveConfig()) {
        UI.showStatusModal('Settings Saved', 'Your settings have been saved successfully.');
    } else {
        UI.showStatusModal('Error', 'There was an error saving your settings. Please try again.');
    }
}

// Handle post submission
async function handlePost() {
    // Update current post state
    updateCurrentPostData();
    
    // Validate inputs
    if (!validatePost()) {
        return;
    }
    
    // Show posting status modal
    UI.showStatusModal('Posting', 'Sending your post to selected platforms...', true);
    
    // Handle Instagram export if enabled
    if (appState.platformStatus.instagram.enabled) {
        handleInstagramExport();
    }
    
    // Post to each enabled platform (excluding Instagram)
    const results = await Platforms.postToAll(appState.currentPost, {
        ...appState.platformStatus,
        instagram: { enabled: false } // Ensure Instagram is not included in actual posting
    });
    
    // Update status modal with results
    UI.updateStatusModal('Post Results', results);
}

// Handle Instagram export
function handleInstagramExport() {
    const content = appState.currentPost.instagram || appState.currentPost.common;
    const images = appState.currentPost.images;
    
    // Create export data
    const exportData = {
        caption: content,
        images: images,
        timestamp: new Date().toISOString()
    };
    
    // Convert to JSON and create download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `instagram-post-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show success message
    UI.showStatusModal('Instagram Export', 'Your Instagram post content has been exported successfully. You can now use this to post manually to Instagram.');
}

// Handle scheduling a post
function handleSchedulePost() {
    // Update current post state
    updateCurrentPostData();
    
    // Validate inputs
    if (!validatePost()) {
        return;
    }
    
    // Get scheduled date and time
    const scheduleDate = document.getElementById('schedule-date').value;
    const scheduleTime = document.getElementById('schedule-time').value;
    
    if (!scheduleDate || !scheduleTime) {
        UI.showStatusModal('Error', 'Please select a date and time for scheduling.');
        return;
    }
    
    // Create scheduled post object
    const scheduledPost = {
        id: Date.now(),
        post: {...appState.currentPost},
        platforms: {...appState.platformStatus},
        scheduledTime: new Date(`${scheduleDate}T${scheduleTime}`),
        created: new Date()
    };
    
    // Add to scheduled posts
    appState.scheduledPosts.push(scheduledPost);
    
    // Save to localStorage
    Storage.saveScheduledPosts();
    
    // Render scheduled posts
    Storage.renderScheduledPosts();
    
    // Close modal and show confirmation
    document.getElementById('schedule-modal').style.display = 'none';
    UI.showStatusModal('Post Scheduled', `Your post has been scheduled for ${new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString()}`);
    
    // Clear form if user wants
    if (confirm('Would you like to clear the post form?')) {
        Composer.clearForm();
    }
}

// Update current post data from form inputs
function updateCurrentPostData() {
    appState.currentPost.common = document.getElementById('common-text').value;
    appState.currentPost.bluesky = document.getElementById('bluesky-text').value;
    appState.currentPost.tumblr = document.getElementById('tumblr-text').value;
    appState.currentPost.mastodon = document.getElementById('mastodon-text').value;
    appState.currentPost.instagram = document.getElementById('instagram-text').value;
}

// Validate post data before submission
function validatePost() {
    // Check if any platform is enabled
    const anyPlatformEnabled = Object.values(appState.platformStatus)
        .some(p => p.enabled && !p.exportOnly);
    
    if (!anyPlatformEnabled) {
        UI.showStatusModal('Error', 'Please enable at least one posting platform (Bluesky, Tumblr, or Mastodon).');
        return false;
    }
    
    // Check for content
    if (!appState.currentPost.common && !Object.values(appState.currentPost)
        .some(content => content && content !== appState.currentPost.common)) {
        UI.showStatusModal('Error', 'Please enter some content for your post.');
        return false;
    }
    
    // Validate credentials for enabled platforms
    for (const [platform, status] of Object.entries(appState.platformStatus)) {
        if (status.enabled && !status.exportOnly) {
            switch (platform) {
                case 'bluesky':
                    if (!appState.config.bluesky.username || !appState.config.bluesky.app_password) {
                        UI.showStatusModal('Error', 'Please provide your Bluesky credentials in Settings.');
                        return false;
                    }
                    break;
                case 'tumblr':
                    if (!appState.config.tumblr.api_key || !appState.config.tumblr.blog_identifier) {
                        UI.showStatusModal('Error', 'Please provide your Tumblr credentials in Settings.');
                        return false;
                    }
                    break;
                case 'mastodon':
                    if (!appState.config.mastodon.instance_url || !appState.config.mastodon.access_token) {
                        UI.showStatusModal('Error', 'Please provide your Mastodon credentials in Settings.');
                        return false;
                    }
                    break;
            }
        }
    }
    
    return true;
}

// Toggle between light and dark themes
function toggleTheme() {
    appState.darkMode = !appState.darkMode;
    
    if (appState.darkMode) {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('theme-toggle-btn').innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('socialPosterTheme', 'dark');
    } else {
        document.body.removeAttribute('data-theme');
        document.getElementById('theme-toggle-btn').innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('socialPosterTheme', 'light');
    }
}

// Check user's theme preference
function checkThemePreference() {
    const savedTheme = localStorage.getItem('socialPosterTheme');
    
    if (savedTheme === 'dark') {
        appState.darkMode = true;
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('theme-toggle-btn').innerHTML = '<i class="fas fa-sun"></i>';
    } else if (savedTheme === 'light') {
        appState.darkMode = false;
        document.body.removeAttribute('data-theme');
        document.getElementById('theme-toggle-btn').innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            appState.darkMode = true;
            document.body.setAttribute('data-theme', 'dark');
            document.getElementById('theme-toggle-btn').innerHTML = '<i class="fas fa-sun"></i>';
        }
    }
}

// Export configuration to a file
function exportConfig() {
    const config = JSON.stringify(appState.config, null, 2);
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'social-poster-config.json';
    a.click();
    
    URL.revokeObjectURL(url);
    
    UI.showStatusModal('Configuration Exported', 'Your configuration has been exported. Keep this file secure as it contains your credentials.');
}

// Import configuration from a file
function importConfig() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const config = JSON.parse(event.target.result);
                
                // Validate config structure
                const requiredPlatforms = ['bluesky', 'tumblr', 'mastodon', 'instagram'];
                const isValid = requiredPlatforms.every(platform => platform in config);
                
                if (isValid) {
                    appState.config = config;
                    saveConfig();
                    UI.populateSettingsForm();
                    UI.showStatusModal('Configuration Imported', 'Your configuration has been imported successfully.');
                } else {
                    UI.showStatusModal('Import Error', 'The configuration file is invalid. Please check the file format.');
                }
            } catch (error) {
                console.error('Error importing configuration:', error);
                UI.showStatusModal('Import Error', 'Error parsing the configuration file. Please make sure it\'s a valid JSON file.');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp); 