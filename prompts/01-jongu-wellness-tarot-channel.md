# Prompt 1: jongu-wellness - Create Tarot Channel API (Simplified)

Use this prompt in the **jongu-wellness** repository.

---

## Prompt

I want to add a Tarot Channel feature using the existing `user_documents` table. Instead of creating new tables, we'll use `document_type = 'tarot_deck'` and store everything in `document_data` JSONB.

### Schema Approach (No New Tables!)

Add 'tarot_deck' to the existing document_type check constraint:

```sql
-- Update the check constraint to include 'tarot_deck'
ALTER TABLE user_documents
DROP CONSTRAINT user_documents_document_type_check;

ALTER TABLE user_documents
ADD CONSTRAINT user_documents_document_type_check
CHECK (document_type = ANY (ARRAY[
  'tool_session', 'creative_work', 'preference', 'bookmark',
  'interaction', 'transaction', 'story', 'playlist', 'tarot_deck'
]));
```

### Document Data Structure for Tarot Decks

```typescript
// document_data for document_type = 'tarot_deck'
interface TarotDeckDocument {
  name: string;
  description?: string;
  creator_name?: string;
  cover_image_url?: string;
  tags?: string[];
  card_count: number;
  cards: TarotCard[];
}

interface TarotCard {
  id: string;            // UUID for this card
  name: string;
  number?: number;
  arcana?: 'major' | 'minor' | 'custom';
  suit?: string;
  image_url?: string;
  keywords?: string[];
  summary?: string;
  interpretation?: string;
  reversed_interpretation?: string;
  symbols?: string[];
  element?: string;
  affirmation?: string;
  questions?: string[];
  sort_order: number;
}
```

### API Routes

Create these API routes in `/app/api/tarot-channel/`:

1. **GET /api/tarot-channel/decks** - List published decks
   ```typescript
   // Returns all user_documents where:
   // - document_type = 'tarot_deck'
   // - is_public = true

   const { data } = await supabase
     .from('user_documents')
     .select('id, user_id, document_data, created_at')
     .eq('document_type', 'tarot_deck')
     .eq('is_public', true)
     .order('created_at', { ascending: false });

   // Return mapped to simpler format
   return decks.map(d => ({
     id: d.id,
     ...d.document_data,
     created_at: d.created_at
   }));
   ```

2. **GET /api/tarot-channel/decks/[id]** - Get single deck with cards
   ```typescript
   const { data } = await supabase
     .from('user_documents')
     .select('*')
     .eq('id', deckId)
     .eq('document_type', 'tarot_deck')
     .single();

   // Check if public or owner
   if (!data.is_public && data.user_id !== currentUserId) {
     return { error: 'Not found' };
   }

   return {
     id: data.id,
     ...data.document_data
   };
   ```

3. **POST /api/tarot-channel/decks** - Create deck (auth required)
   ```typescript
   const deck = await supabase
     .from('user_documents')
     .insert({
       user_id: userId,
       document_type: 'tarot_deck',
       is_public: false,  // Draft by default
       document_data: {
         name: body.name,
         description: body.description,
         creator_name: body.creator_name || userProfile?.display_name,
         cover_image_url: body.cover_image_url,
         tags: body.tags,
         card_count: body.cards?.length || 0,
         cards: body.cards || []
       }
     })
     .select()
     .single();
   ```

4. **PUT /api/tarot-channel/decks/[id]** - Update deck (owner only)
   ```typescript
   // Update document_data with new cards/info
   ```

5. **PUT /api/tarot-channel/decks/[id]/publish** - Publish deck
   ```typescript
   await supabase
     .from('user_documents')
     .update({ is_public: true })
     .eq('id', deckId)
     .eq('user_id', userId);  // Must be owner
   ```

### CORS Headers

Add CORS for cross-origin access:

```typescript
// In each route handler
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // Or specific domains
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS preflight
if (request.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

### Implementation Steps

1. Update the document_type check constraint in Supabase SQL editor
2. Create `/app/api/tarot-channel/decks/route.ts` (GET list, POST create)
3. Create `/app/api/tarot-channel/decks/[id]/route.ts` (GET single, PUT update)
4. Create `/app/api/tarot-channel/decks/[id]/publish/route.ts` (PUT)
5. Add CORS headers to all routes
6. Test with Postman or curl

Start by updating the constraint and creating the list endpoint.
