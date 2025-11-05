# Google OAuth Setup Guide

To enable Google Sign-In functionality, you need to set up a Google OAuth Client ID.

## Steps to Get Your Google Client ID

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create or Select a Project**
   - Click on the project dropdown at the top
   - Click "New Project" or select an existing one
   - Give it a name (e.g., "Convertify App")

3. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" or "Google Identity"
   - Click on it and press "Enable"

4. **Create OAuth Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - If prompted, configure the OAuth consent screen first:
     - Choose "External" (unless you have a Google Workspace)
     - Fill in the required information (App name, support email, etc.)
     - Add scopes: `email`, `profile`, `openid`
     - Add test users if needed

5. **Create OAuth Client ID**
   - Application type: "Web application"
   - Name: "Convertify Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - Add your production URL when deploying
   - Authorized redirect URIs:
     - `http://localhost:5173` (for development)
     - Add your production URL when deploying
   - Click "Create"

6. **Copy Your Client ID**
   - Copy the Client ID that appears
   - It will look like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`

##


3. **Restart your development server** for the changes to take effect

## Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Click the "Sign In" button in the top right
3. Click "Sign in with Google"
4. Select your Google account
5. You should be logged in and see your profile icon

## Notes

- The Client ID is stored in environment variables and is safe to commit to version control
- Never share your Client Secret (if you see one, you don't need it for this implementation)
- For production, make sure to add your production domain to authorized origins and redirect URIs

