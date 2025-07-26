# Current Development Tasks

## Completed ✅
- Merged main branch into dev to get latest fixes
- Chat persistence improvements from main branch
- Environment variable handling for Vercel deployment

## To Do:
1. Fix chat disappearing when changing windows (should be resolved by merge)
2. Fix GitHub authentication (guide user through Supabase OAuth setup)
3. Allow tool browsing without auth (modify landing page and routing)
4. Update text and links (GitHub URL, titles, open source messaging)
5. Add files to .gitignore (claude.md, .claude/ directory)
6. Build basic test suite (E2E tests for chat persistence)

## Environment Variables Note:
- No need for `NEXTAUTH_SECRET` or `NEXTAUTH_URL` (using Supabase Auth, not NextAuth)
- GitHub OAuth configured in Supabase dashboard, not env vars