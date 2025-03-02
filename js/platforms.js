/**
 * Platforms Module
 * Handles posting to different social media platforms
 */

const Platforms = {
    // Post to all enabled platforms
    postToAll: async function(postData, platformStatus) {
        const results = [];
        
        // For each enabled platform, try to post
        if (platformStatus.bluesky.enabled) {
            try {
                const result = await this.postToBluesky(postData);
                results.push(result);
            } catch (error) {
                results.push({
                    platform: 'bluesky',
                    success: false,
                    message: `Error: ${error.message}`
                });
            }
        }
        
        if (platformStatus.tumblr.enabled) {
            try {
                const result = await this.postToTumblr(postData);
                results.push(result);
            } catch (error) {
                results.push({
                    platform: 'tumblr',
                    success: false,
                    message: `Error: ${error.message}`
                });
            }
        }
        
        if (platformStatus.mastodon.enabled) {
            try {
                const result = await this.postToMastodon(postData);
                results.push(result);
            } catch (error) {
                results.push({
                    platform: 'mastodon',
                    success: false,
                    message: `Error: ${error.message}`
                });
            }
        }
        
        if (platformStatus.instagram.enabled) {
            try {
                const result = await this.postToInstagram(postData);
                results.push(result);
            } catch (error) {
                results.push({
                    platform: 'instagram',
                    success: false,
                    message: `Error: ${error.message}`
                });
            }
        }
        
        return results;
    },
    
    // Post to Bluesky using ATP
    postToBluesky: async function(postData) {
        UI.updatePlatformStatus('bluesky', false, 'Posting to Bluesky...');
        
        try {
            const content = postData.bluesky || postData.common;
            if (!content && postData.images.length === 0) {
                throw new Error('No content to post');
            }
            
            const { BskyAgent } = window.AtpAgent;
            const agent = new BskyAgent({
                service: 'https://bsky.social'
            });
            
            // Login with credentials
            await agent.login({
                identifier: appState.config.bluesky.username,
                password: appState.config.bluesky.app_password
            });
            
            // Handle image uploads
            let images = [];
            if (postData.images.length > 0) {
                // Process up to 4 images (Bluesky limit)
                const imageFiles = postData.images.slice(0, 4);
                
                for (const img of imageFiles) {
                    // Compress image
                    const compressedFile = await Composer.compressImage(img.file);
                    const blob = await fetch(URL.createObjectURL(compressedFile)).then(r => r.blob());
                    
                    // Upload to Bluesky
                    const upload = await agent.uploadBlob(blob, {
                        encoding: 'image/jpeg'
                    });
                    
                    images.push({
                        image: upload.data.blob,
                        alt: `Image ${images.length + 1}`
                    });
                }
            }
            
            // Create post record
            const postRecord = {
                text: content,
                createdAt: new Date().toISOString()
            };
            
            // Add images if any
            if (images.length > 0) {
                postRecord.embed = {
                    $type: 'app.bsky.embed.images',
                    images: images
                };
            }
            
            // Send the post
            const response = await agent.post(postRecord);
            
            return {
                platform: 'bluesky',
                success: true,
                message: 'Posted successfully to Bluesky',
                data: response
            };
        } catch (error) {
            console.error('Error posting to Bluesky:', error);
            UI.updatePlatformStatus('bluesky', false, `Error: ${error.message}`);
            throw error;
        }
    },
    
    // Post to Tumblr using tumblr.js
    postToTumblr: async function(postData) {
        UI.updatePlatformStatus('tumblr', false, 'Posting to Tumblr...');
        
        try {
            const content = postData.tumblr || postData.common;
            if (!content && postData.images.length === 0) {
                throw new Error('No content to post');
            }
            
            const client = tumblr.createClient({
                credentials: {
                    consumer_key: appState.config.tumblr.api_key
                },
                returnPromises: true
            });
            
            // Prepare post parameters
            const params = {
                type: postData.images.length > 0 ? 'photo' : 'text',
                body: content,
                format: 'markdown'
            };
            
            // Handle images
            if (postData.images.length > 0) {
                params.data = [];
                for (const img of postData.images) {
                    const compressedFile = await Composer.compressImage(img.file);
                    const blob = await fetch(URL.createObjectURL(compressedFile)).then(r => r.blob());
                    params.data.push(blob);
                }
            }
            
            // Create the post
            const response = await client.createPost(
                appState.config.tumblr.blog_identifier,
                params
            );
            
            return {
                platform: 'tumblr',
                success: true,
                message: 'Posted successfully to Tumblr',
                data: response
            };
        } catch (error) {
            console.error('Error posting to Tumblr:', error);
            UI.updatePlatformStatus('tumblr', false, `Error: ${error.message}`);
            throw error;
        }
    },
    
    // Post to Mastodon using masto.js
    postToMastodon: async function(postData) {
        UI.updatePlatformStatus('mastodon', false, 'Posting to Mastodon...');
        
        try {
            const content = postData.mastodon || postData.common;
            if (!content && postData.images.length === 0) {
                throw new Error('No content to post');
            }
            
            const masto = await window.masto.login({
                url: appState.config.mastodon.instance_url,
                accessToken: appState.config.mastodon.access_token
            });
            
            // Upload media if present
            let mediaIds = [];
            if (postData.images.length > 0) {
                for (const img of postData.images) {
                    const compressedFile = await Composer.compressImage(img.file);
                    const blob = await fetch(URL.createObjectURL(compressedFile)).then(r => r.blob());
                    
                    const attachment = await masto.mediaAttachments.create({
                        file: blob,
                        description: `Image ${mediaIds.length + 1}`
                    });
                    
                    mediaIds.push(attachment.id);
                }
            }
            
            // Create the post
            const response = await masto.statuses.create({
                status: content,
                mediaIds: mediaIds.length > 0 ? mediaIds : undefined
            });
            
            return {
                platform: 'mastodon',
                success: true,
                message: 'Posted successfully to Mastodon',
                data: response
            };
        } catch (error) {
            console.error('Error posting to Mastodon:', error);
            UI.updatePlatformStatus('mastodon', false, `Error: ${error.message}`);
            throw error;
        }
    },
    
    // Post to Instagram using the official Graph API
    postToInstagram: async function(postData) {
        UI.updatePlatformStatus('instagram', false, 'Posting to Instagram...');
        
        try {
            const content = postData.instagram || postData.common;
            
            // Instagram requires at least one image
            if (postData.images.length === 0) {
                throw new Error('Instagram requires at least one image');
            }

            // First, ensure we have a valid access token
            if (!appState.config.instagram.accessToken) {
                throw new Error('Instagram access token not found. Please authenticate with Instagram in Settings.');
            }

            // Process images
            const processedImages = [];
            for (const img of postData.images) {
                const compressedFile = await Composer.compressImage(img.file, 1080); // Instagram max width
                const formData = new FormData();
                formData.append('image', compressedFile);

                // Upload image to Instagram
                const uploadResponse = await fetch(`https://graph.facebook.com/v18.0/${appState.config.instagram.businessAccountId}/media`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Authorization': `Bearer ${appState.config.instagram.accessToken}`
                    }
                });

                const uploadResult = await uploadResponse.json();
                if (uploadResult.error) {
                    throw new Error(`Instagram upload error: ${uploadResult.error.message}`);
                }

                processedImages.push(uploadResult.id);
            }

            let response;
            if (processedImages.length === 1) {
                // Create single image post
                response = await fetch(`https://graph.facebook.com/v18.0/${appState.config.instagram.businessAccountId}/media`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${appState.config.instagram.accessToken}`
                    },
                    body: JSON.stringify({
                        image_url: processedImages[0],
                        caption: content,
                        media_type: 'IMAGE'
                    })
                });
            } else {
                // Create carousel post
                response = await fetch(`https://graph.facebook.com/v18.0/${appState.config.instagram.businessAccountId}/media`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${appState.config.instagram.accessToken}`
                    },
                    body: JSON.stringify({
                        media_type: 'CAROUSEL',
                        children: processedImages,
                        caption: content
                    })
                });
            }

            const result = await response.json();
            if (result.error) {
                throw new Error(`Instagram API error: ${result.error.message}`);
            }

            // Publish the container
            const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${appState.config.instagram.businessAccountId}/media_publish`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${appState.config.instagram.accessToken}`
                },
                body: JSON.stringify({
                    creation_id: result.id
                })
            });

            const publishResult = await publishResponse.json();
            if (publishResult.error) {
                throw new Error(`Instagram publish error: ${publishResult.error.message}`);
            }

            return {
                platform: 'instagram',
                success: true,
                message: 'Posted successfully to Instagram',
                data: publishResult
            };
        } catch (error) {
            console.error('Error posting to Instagram:', error);
            UI.updatePlatformStatus('instagram', false, `Error: ${error.message}`);
            throw error;
        }
    }
}; 