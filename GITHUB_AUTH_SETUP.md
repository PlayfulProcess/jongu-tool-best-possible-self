# GitHub Authentication Setup Guide

## Important: Using Supabase Auth (Not NextAuth)

Your app uses **Supabase Auth** with GitHub OAuth, not NextAuth. This means you do NOT need `NEXTAUTH_SECRET` or `NEXTAUTH_URL` environment variables.

## Setup Steps

### 1. Configure GitHub OAuth in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **GitHub** in the list and click to configure
4. Enable the GitHub provider

### 2. Create GitHub OAuth App

1. Go to GitHub Settings > Developer Settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: `TherapyToolsHub` (or your preferred name)
   - **Homepage URL**: `https://your-domain.com` (or localhost for development)
   - **Authorization callback URL**: `https://your-supabase-project.supabase.co/auth/v1/callback`
     - Replace `your-supabase-project` with your actual Supabase project reference
     - You can find this in your Supabase project settings

### 3. Configure Supabase with GitHub Credentials

1. Copy the **Client ID** and **Client Secret** from your GitHub OAuth app
2. In Supabase Dashboard > Authentication > Providers > GitHub:
   - Paste the **Client ID**
   - Paste the **Client Secret**
   - Click **Save**

### 4. Update Redirect URLs (if needed)

In your Supabase Auth settings, make sure these redirect URLs are configured:
- `http://localhost:3000/auth/callback` (for development)
- `https://your-production-domain.com/auth/callback` (for production)

## Testing

1. Start your development server: `npm run dev`
2. Go to the auth form
3. You should see a "Continue with GitHub" button
4. Clicking it should redirect to GitHub for authorization
5. After authorization, you should be redirected back to your app and logged in

## Troubleshooting

- **"Authorization callback URL mismatch"**: Make sure the callback URL in GitHub matches your Supabase auth callback URL exactly
- **"Client not found"**: Double-check that you copied the Client ID and Secret correctly
- **Redirecting to localhost in production**: Update your GitHub OAuth app settings:
  1. Go to GitHub Settings > Developer Settings > OAuth Apps > Your App
  2. Update "Homepage URL" to your production domain (e.g., `https://your-app.vercel.app`)
  3. Update "Authorization callback URL" to `https://your-supabase-project.supabase.co/auth/v1/callback`
  4. Save the changes
- **Still not working**: Check the Supabase Auth logs in your dashboard for specific error messages

## Environment Variables You Actually Need

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key

# NOT needed (you're not using NextAuth):
# NEXTAUTH_SECRET=...
# NEXTAUTH_URL=...
# GITHUB_CLIENT_ID=...
# GITHUB_CLIENT_SECRET=...
```

The GitHub credentials go directly into Supabase dashboard, not environment variables.