/**
 * Storage Module
 * Handles local storage operations for drafts and scheduled posts
 */

const Storage = {
    // Save current post as draft
    saveDraft: function() {
        try {
            // Update current post data from form inputs
            updateCurrentPostData();
            
            // Check if there's any content
            if (!appState.currentPost.common && 
                !appState.currentPost.bluesky && 
                !appState.currentPost.tumblr && 
                !appState.currentPost.mastodon && 
                !appState.currentPost.instagram && 
                appState.currentPost.images.length === 0) {
                
                UI.showStatusModal('Error', 'Please enter some content or add an image before saving a draft.');
                return;
            }
            
            // Create draft object
            const draft = {
                id: Date.now(),
                post: {...appState.currentPost},
                platforms: {...appState.platformStatus},
                created: new Date()
            };
            
            // Add to drafts array
            appState.drafts.push(draft);
            
            // Save to localStorage
            this.saveDraftsToLocalStorage();
            
            // Render drafts
            this.renderDrafts();
            
            // Show confirmation
            UI.showStatusModal('Draft Saved', 'Your draft has been saved successfully.');
            
            // Clear form if user wants
            if (confirm('Would you like to clear the post form?')) {
                Composer.clearForm();
            }
        } catch (error) {
            console.error('Error saving draft:', error);
            UI.showStatusModal('Error', `Could not save draft: ${error.message}`);
        }
    },
    
    // Save drafts to localStorage
    saveDraftsToLocalStorage: function() {
        try {
            localStorage.setItem('socialPosterDrafts', JSON.stringify(appState.drafts));
            return true;
        } catch (error) {
            console.error('Error saving drafts to localStorage:', error);
            return false;
        }
    },
    
    // Render drafts in the drafts tab
    renderDrafts: function() {
        const container = document.getElementById('drafts-container');
        
        // Clear container
        container.innerHTML = '';
        
        if (appState.drafts.length === 0) {
            container.innerHTML = '<p class="empty-state">No drafts saved yet</p>';
            return;
        }
        
        // Sort drafts by date (newest first)
        const sortedDrafts = [...appState.drafts].sort((a, b) => 
            new Date(b.created) - new Date(a.created)
        );
        
        // Create and append draft cards
        sortedDrafts.forEach(draft => {
            const card = UI.createItemCard(draft, 'draft');
            container.appendChild(card);
        });
        
        // Add event listeners to edit/delete buttons
        this.addDraftEventListeners();
    },
    
    // Add event listeners to draft cards
    addDraftEventListeners: function() {
        // Edit draft buttons
        document.querySelectorAll('.edit-draft-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const draftId = parseInt(e.target.closest('.edit-draft-btn').dataset.id);
                this.editDraft(draftId);
            });
        });
        
        // Delete draft buttons
        document.querySelectorAll('.delete-draft-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const draftId = parseInt(e.target.closest('.delete-draft-btn').dataset.id);
                this.deleteDraft(draftId);
            });
        });
    },
    
    // Edit a draft
    editDraft: function(draftId) {
        const draft = appState.drafts.find(d => d.id === draftId);
        if (!draft) {
            UI.showStatusModal('Error', 'Draft not found.');
            return;
        }
        
        // Confirm edit as it will replace current content
        if (document.getElementById('common-text').value.trim() !== '' &&
            !confirm('Loading this draft will replace your current content. Continue?')) {
            return;
        }
        
        // Load draft data into form
        Composer.loadPostData(draft);
        
        // Show confirmation
        UI.showStatusModal('Draft Loaded', 'Your draft has been loaded for editing.');
    },
    
    // Delete a draft
    deleteDraft: function(draftId) {
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this draft?')) {
            return;
        }
        
        // Filter out the draft
        appState.drafts = appState.drafts.filter(d => d.id !== draftId);
        
        // Save to localStorage
        this.saveDraftsToLocalStorage();
        
        // Re-render drafts
        this.renderDrafts();
        
        // Show confirmation
        UI.showStatusModal('Draft Deleted', 'Your draft has been deleted.');
    },
    
    // Save scheduled posts to localStorage
    saveScheduledPosts: function() {
        try {
            localStorage.setItem('socialPosterScheduled', JSON.stringify(appState.scheduledPosts));
            return true;
        } catch (error) {
            console.error('Error saving scheduled posts to localStorage:', error);
            return false;
        }
    },
    
    // Render scheduled posts in the scheduled tab
    renderScheduledPosts: function() {
        const container = document.getElementById('scheduled-container');
        
        // Clear container
        container.innerHTML = '';
        
        if (appState.scheduledPosts.length === 0) {
            container.innerHTML = '<p class="empty-state">No scheduled posts</p>';
            return;
        }
        
        // Sort scheduled posts by scheduled time (soonest first)
        const sortedPosts = [...appState.scheduledPosts].sort((a, b) => 
            new Date(a.scheduledTime) - new Date(b.scheduledTime)
        );
        
        // Create and append scheduled post cards
        sortedPosts.forEach(post => {
            const card = UI.createItemCard(post, 'scheduled');
            container.appendChild(card);
        });
        
        // Add event listeners to edit/delete buttons
        this.addScheduledEventListeners();
    },
    
    // Add event listeners to scheduled post cards
    addScheduledEventListeners: function() {
        // Edit scheduled post buttons
        document.querySelectorAll('.edit-scheduled-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const postId = parseInt(e.target.closest('.edit-scheduled-btn').dataset.id);
                this.editScheduledPost(postId);
            });
        });
        
        // Delete scheduled post buttons
        document.querySelectorAll('.delete-scheduled-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const postId = parseInt(e.target.closest('.delete-scheduled-btn').dataset.id);
                this.deleteScheduledPost(postId);
            });
        });
    },
    
    // Edit a scheduled post
    editScheduledPost: function(postId) {
        const post = appState.scheduledPosts.find(p => p.id === postId);
        if (!post) {
            UI.showStatusModal('Error', 'Scheduled post not found.');
            return;
        }
        
        // Confirm edit as it will replace current content
        if (document.getElementById('common-text').value.trim() !== '' &&
            !confirm('Loading this scheduled post will replace your current content. Continue?')) {
            return;
        }
        
        // Load post data into form
        Composer.loadPostData(post);
        
        // Delete the scheduled post (it will be rescheduled after editing)
        this.deleteScheduledPost(postId, false);
        
        // Show confirmation
        UI.showStatusModal('Scheduled Post Loaded', 'Your scheduled post has been loaded for editing. You will need to reschedule it after making changes.');
    },
    
    // Delete a scheduled post
    deleteScheduledPost: function(postId, showConfirmation = true) {
        // Confirm deletion if not silently deleting
        if (showConfirmation && !confirm('Are you sure you want to delete this scheduled post?')) {
            return;
        }
        
        // Filter out the scheduled post
        appState.scheduledPosts = appState.scheduledPosts.filter(p => p.id !== postId);
        
        // Save to localStorage
        this.saveScheduledPosts();
        
        // Re-render scheduled posts
        this.renderScheduledPosts();
        
        // Show confirmation if not silently deleting
        if (showConfirmation) {
            UI.showStatusModal('Scheduled Post Deleted', 'Your scheduled post has been deleted.');
        }
    },
    
    // Check for posts that need to be published
    checkScheduledPosts: function() {
        const now = new Date();
        const postsToPublish = appState.scheduledPosts.filter(post => 
            new Date(post.scheduledTime) <= now
        );
        
        if (postsToPublish.length > 0) {
            console.log(`Publishing ${postsToPublish.length} scheduled posts`);
            
            // For each post to publish
            postsToPublish.forEach(async post => {
                // Show notification
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Scheduled Post Published', {
                        body: 'Your scheduled post is being published now.',
                        icon: '/favicon.ico'
                    });
                }
                
                try {
                    // Publish post
                    await Platforms.postToAll(post.post, post.platforms);
                    
                    // Remove from scheduled posts
                    this.deleteScheduledPost(post.id, false);
                    
                    console.log(`Successfully published scheduled post ${post.id}`);
                } catch (error) {
                    console.error(`Error publishing scheduled post ${post.id}:`, error);
                }
            });
        }
    },
    
    // Initialize scheduled post checker
    initScheduledPostChecker: function() {
        // Request notification permission if not granted
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
        
        // Check every minute for posts to publish
        setInterval(() => this.checkScheduledPosts(), 60000);
        
        // Also check once on initialization
        this.checkScheduledPosts();
    }
}; 