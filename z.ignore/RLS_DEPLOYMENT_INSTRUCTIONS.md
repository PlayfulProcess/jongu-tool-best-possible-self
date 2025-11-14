# Journal Entries RLS Policy Deployment Instructions

## What This Does
This migration adds Row Level Security (RLS) policies to the `journal_entries` table so that **each user can only see their own journal entries**. No user can see another user's private journal content.

## Safe to Deploy
✅ **Safe for your situation** - You mentioned you don't have other users yet, so there's no risk of data access issues.

✅ **Idempotent** - Safe to run multiple times without errors

✅ **No data loss** - Only adds security policies, doesn't modify or delete data

## Deployment Options

### Option 1: Supabase Dashboard (Recommended - Easiest)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "+ New query"

3. **Copy & Paste the Migration**
   - Open the file: `supabase/migrations/20250110_add_journal_entries_rls.sql`
   - Copy ALL the contents
   - Paste into the SQL Editor

4. **Run the Migration**
   - Click "Run" button (bottom right)
   - Wait for "Success" message

5. **Verify** (Optional but recommended)
   - Create a new query
   - Run this verification SQL:
   ```sql
   SELECT
     schemaname, tablename, policyname, permissive, roles, cmd
   FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'journal_entries'
   ORDER BY policyname;
   ```
   - You should see 4 policies listed:
     - Users can delete own journal entries
     - Users can insert own journal entries
     - Users can update own journal entries
     - Users can view own journal entries

### Option 2: Supabase CLI (For Developers)

If you have Supabase CLI installed:

```bash
cd jongu-tool-best-possible-self
supabase db push
```

This will apply all pending migrations including the new RLS policies.

### Option 3: Manual Application

If neither option works, you can manually create the policies:

1. Go to Supabase Dashboard → Database → Tables
2. Click on `journal_entries` table
3. Go to "Policies" tab
4. Click "Enable RLS" if not already enabled
5. Create 4 new policies (copy from migration file)

## What Changes After Deployment

### Before (Insecure):
- Any authenticated user could potentially see all journal entries
- No privacy protection

### After (Secure):
- ✅ Users can ONLY see their own journal entries
- ✅ Users can ONLY edit/delete their own entries
- ✅ Complete privacy between users
- ✅ System templates remain visible to all (separate table)

## Testing After Deployment

1. **Login with your account**
2. **Create a journal entry**
3. **Verify you can see it**
4. **Verify RLS is active:**
   ```sql
   -- Run in SQL Editor - should return TRUE
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE tablename = 'journal_entries';
   ```

## Rollback (If Needed)

If you need to remove the policies (not recommended):

```sql
DROP POLICY IF EXISTS "Users can view own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can insert own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can update own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can delete own journal entries" ON public.journal_entries;

ALTER TABLE public.journal_entries DISABLE ROW LEVEL SECURITY;
```

## Support

If you encounter any issues:
- Check Supabase logs in Dashboard → Logs
- Verify your user is authenticated (check auth.users table)
- Email pp@playfulprocess.com for support

---

**Created:** 2025-01-10
**Safe for production:** ✅ Yes
**Backup required:** ❌ No (you have no other users)
