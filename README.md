# Social Media Poster

A web application that allows you to compose and simultaneously post content across multiple social media platforms, with a simplified Instagram export option.

## Supported Platforms

### Direct Posting
- Bluesky
- Tumblr
- Mastodon

### Export Only
- Instagram (exports content for manual posting)

## Features
- Multi-platform posting with a unified interface
- Platform-specific formatting options
- Image upload and preview
- Rich text composition
- Local authentication
- Draft saving
- Post scheduling
- Instagram content export
- Dark/Light mode theme support

## Setup Instructions

### Quick Start
1. Clone this repository
2. Run `npm install` to install dependencies
3. Start a local server:
   ```bash
   npm start
   ```
4. Open `http://localhost:8000` in your browser
5. Configure your platform credentials in the Settings tab

### Setting Up Platform Credentials

#### Bluesky
1. Create a Bluesky account at [bsky.app](https://bsky.app)
2. Generate an App Password:
   - Go to Settings → Privacy and Security → App Passwords → Create App Password
   - Give it a name like "Social Poster"
   - Copy your app password
3. Enter your username and app password in the application's Settings tab

#### Tumblr
1. Register a new application at [Tumblr Developer](https://www.tumblr.com/oauth/apps)
2. Fill in the required fields:
   - Application Name: "Social Poster" (or your preferred name)
   - Application Website: Your website URL
   - Application Description: Brief description of your app
   - Default Callback URL: `http://localhost:8000` (for local development)
3. After registration, note your API Key (OAuth Consumer Key)
4. Find your blog identifier (it's your blog URL without "https://" and ".tumblr.com")
5. Enter these credentials in the application's Settings tab

#### Mastodon
1. Log in to your Mastodon instance (e.g., mastodon.social)
2. Go to Settings → Development → New Application
3. Fill in the required fields:
   - Application Name: "Social Poster"
   - Website: Your website URL (or leave blank for personal use)
   - Scopes: Select `write:media` and `write:statuses`
4. Click "Submit"
5. Copy the Access Token from the next page
6. Enter your instance URL and access token in the application's Settings tab

#### Instagram (Export Mode)
The application now handles Instagram posts through an export feature rather than direct posting. This approach was chosen to:
- Avoid complex API setup requirements
- Provide more flexibility in how content is posted to Instagram
- Maintain compliance with Instagram's terms of service

When the Instagram export feature is enabled:
1. Compose your post as normal
2. Add any Instagram-specific text in the Instagram text area
3. Upload images if desired
4. Click the "Export for Instagram" button to download a JSON file containing:
   - Your post content
   - Image references
   - Timestamp
5. Use this exported content to manually post to Instagram

The Instagram help modal remains available with information about Instagram's API requirements and alternative posting methods.

## Configuration File

For advanced usage, you can create a `config.json` file with your social media credentials:

```json
{
  "bluesky": {
    "username": "",
    "app_password": ""
  },
  "tumblr": {
    "api_key": "",
    "blog_identifier": ""
  },
  "mastodon": {
    "instance_url": "",
    "access_token": ""
  },
  "instagram": {
    "enabled": false
  }
}
```

## Security Note

This application stores credentials locally. Never share your config.json file or .env file with anyone.

## Instagram Posting Alternatives

If you need automated Instagram posting, consider these alternatives:
1. **Cross-Posting Services**:
   - IFTTT (If This Then That)
   - Zapier
   - Buffer
   - Hootsuite
   - Later

2. **Manual Posting Workflow**:
   - Use the export feature to prepare your content
   - Copy the caption from the exported JSON file
   - Upload the images directly to Instagram
   - Paste the prepared caption

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
