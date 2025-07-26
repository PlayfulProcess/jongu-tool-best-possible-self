# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a strong database password
3. Wait for the project to be ready
4. Note your project URL and anon key from the Settings > API section

## 2. Configure Environment Variables

Update your `.env.local` file with your Supabase credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# OpenAI (existing)
OPENAI_API_KEY=your_openai_api_key
```

## 3. Run Database Schema

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Click "Run" to execute the schema

This will create:
- `profiles` table for user data
- `journal_entries` table for journal content
- `chat_messages` table for AI conversations
- Row Level Security (RLS) policies
- Triggers for automatic user profile creation

## 4. Configure Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Configure email authentication (enabled by default)
3. **Enable OAuth providers** (to fix "provider is not enabled" errors):
   
   **For GitHub:**
   - Go to Authentication > Providers in your Supabase dashboard
   - Toggle GitHub to "Enabled"
   - Create a GitHub OAuth app at https://github.com/settings/developers
   - Add your GitHub Client ID and Client Secret
   - Set redirect URL to: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
   
   **Note:** Google auth has been removed from the app to simplify setup.

4. Set up custom SMTP for email sending (recommended for production)

### Email Templates (Optional)
Customize the email templates in Authentication > Templates:
- Confirm signup
- Magic link
- Password recovery

## 5. HIPAA Compliance (Future Enhancement)

**Note: HIPAA compliance is not enabled in the current beta version.**

For future production use with HIPAA compliance:
1. Contact Supabase support for HIPAA compliance enablement
2. This requires a Pro plan or higher
3. Sign Business Associate Agreement (BAA) with Supabase
4. Enable additional security features:
   - Point-in-time recovery
   - Daily backups
   - Enhanced monitoring

## 6. Configure Row Level Security Policies

The schema includes RLS policies, but verify they're working:

1. Go to Authentication > Policies in your Supabase dashboard
2. Ensure policies exist for all tables:
   - `profiles`: Users can only access their own profile
   - `journal_entries`: Users can only access their own entries
   - `chat_messages`: Users can only access their own messages

## 7. Test the Setup

1. Start your development server: `npm run dev`
2. Try creating an account
3. Test the journal writing functionality
4. Verify data is being saved in Supabase
5. Test the AI assistant and chat saving

## 8. Production Considerations

### Security
- Use custom SMTP for email delivery
- Enable 2FA for your Supabase account
- Set up monitoring and alerts
- Regular security audits

### Performance
- Enable connection pooling
- Set up read replicas if needed
- Monitor database performance
- Optimize queries and indexes

### Backup
- Verify automatic backups are working
- Test recovery procedures
- Set up additional backup strategies if needed

### Monitoring
- Set up Supabase monitoring
- Configure alerts for critical issues
- Monitor usage and billing

## 9. Privacy Settings Implementation

The database schema supports four privacy levels:
- `private`: No data saved (handled in app logic)
- `save_private`: Data saved but private to user
- `public_blog`: Data can be shared publicly
- `research_consent`: Data can be used for research

## 10. Troubleshooting

### Common Issues

**Authentication not working:**
- Check if email confirmation is required
- Verify redirect URLs are configured correctly
- Check browser console for errors

**Database connection issues:**
- Verify environment variables are correct
- Check if RLS policies are blocking access
- Review Supabase logs in the dashboard

**Data not saving:**
- Check browser network tab for API errors
- Verify user is authenticated
- Check RLS policies and permissions

### Support Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Community Forum](https://github.com/supabase/supabase/discussions)
- [Discord Community](https://discord.supabase.com/)

## 11. Database Schema Reference

### Tables Structure

```sql
-- User profiles
profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Journal entries
journal_entries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  title TEXT,
  content TEXT,
  privacy_setting TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Chat messages
chat_messages (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  journal_entry_id UUID REFERENCES journal_entries(id),
  message TEXT,
  role TEXT,
  privacy_setting TEXT,
  created_at TIMESTAMPTZ
)
```

This completes the basic Supabase setup for the Best Possible Self application with HIPAA-compliant data handling and comprehensive privacy controls.