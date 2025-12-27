# Mock Data for Testing Custom Tarot Decks

This folder contains mock data you can use to test the custom tarot deck feature
before implementing the full jongu-wellness Tarot Channel.

## Files

1. **tarot-channel-mock-api.ts** - A mock API that can be used locally
2. **soul-mirrors-deck.json** - A sample custom tarot deck with 22 Major Arcana cards
3. **supabase-insert.sql** - SQL to insert test data into jongu-wellness database

## Local Testing (Without jongu-wellness)

1. Copy `tarot-channel-mock-api.ts` to `/src/app/api/tarot-channel/`
2. Or set `NEXT_PUBLIC_TAROT_CHANNEL_API` to empty and uncomment the mock data in `custom-tarot.ts`

## Database Testing (With jongu-wellness)

1. Run the SQL in `supabase-insert.sql` in your jongu-wellness Supabase SQL editor
2. Set `NEXT_PUBLIC_TAROT_CHANNEL_API=https://your-jongu-wellness-url.vercel.app`
