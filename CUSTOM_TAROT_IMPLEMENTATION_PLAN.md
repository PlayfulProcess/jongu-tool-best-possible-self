# Custom Tarot Deck Implementation Plan

## Overview

This plan outlines the implementation of a custom tarot deck feature across 4 repositories:

1. **jongu-tool-best-possible-self** - Main BPS tool (add deck selection)
2. **jongu-wellness** - New tarot channel (deck publishing/API)
3. **recursive-creator** - Deck creation interface (CSV/JSON import + Drive images)
4. **recursive-creator** - New tarot viewer (all cards visible)

## MVP Philosophy

- Simple over complex - no RAG, pass full context to AI
- Use existing `user_documents` table with JSONB - no new tables
- Get working across repos first, optimize later

## Claude Code Prompts

See the `/prompts` folder for ready-to-use prompts:
- `01-jongu-wellness-tarot-channel.md` - API endpoints
- `02-recursive-creator-deck-creation.md` - Deck creation UI
- `03-tarot-viewer.md` - Card viewer component
- `04-bps-deck-selection.md` - Deck selection in this project

---

## Phase 1: Data Schema & API Foundation

### 1.1 Custom Deck Data Schema

```typescript
// Shared across all projects
interface CustomTarotDeck {
  id: string;                    // UUID
  name: string;                  // "Soul Mirrors Tarot"
  creator_id: string;            // User who created it
  creator_name: string;          // Display name
  description: string;           // Deck description
  card_count: number;            // Total cards (e.g., 78, 40, 22)
  cover_image_url: string;       // Deck cover/back image
  is_published: boolean;         // Available in channel
  created_at: string;
  updated_at: string;
  tags?: string[];               // For filtering
}

interface CustomTarotCard {
  id: string;                    // UUID
  deck_id: string;               // FK to deck
  name: string;                  // Card name
  number?: number;               // Card number (0-77 or custom)
  arcana?: 'major' | 'minor' | 'custom';
  suit?: string;                 // Custom suit names allowed
  image_url: string;             // From Google Drive or uploaded

  // Interpretation data (from CSV/JSON)
  keywords: string[];            // Short keywords
  summary: string;               // Brief summary (shown on flip)
  interpretation: string;        // Full interpretation
  reversed_interpretation?: string;
  symbols?: string[];            // Key symbols in the card
  element?: string;              // Fire, Water, Air, Earth, Spirit
  numerology?: string;           // Numerological meaning
  affirmation?: string;          // Card affirmation
  questions?: string[];          // Reflective questions

  // Metadata
  sort_order: number;            // Display order
  custom_fields?: Record<string, string>; // Extensible
}
```

### 1.2 CSV Import Format

The CSV should support these columns (flexible - not all required):

```csv
number,name,suit,arcana,keywords,summary,interpretation,reversed_interpretation,symbols,element,affirmation,questions,image_filename
0,The Fool,,major,"beginnings,innocence,leap of faith","A leap into the unknown","Full interpretation text...","Reversed meaning...","cliff,dog,sun","Air","I trust the journey","What new beginning calls to you?",fool.jpg
1,Ace of Wands,Wands,minor,"inspiration,potential,spark","New creative energy","Full text...","Blocked creativity...","wand,fire,hand","Fire","I ignite my passion","",ace_wands.jpg
```

---

## Phase 2: jongu-wellness - Tarot Channel

### 2.1 Database Schema (Supabase)

```sql
-- Custom Tarot Decks table
CREATE TABLE custom_tarot_decks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  creator_id UUID REFERENCES auth.users(id),
  creator_name TEXT,
  description TEXT,
  card_count INTEGER DEFAULT 0,
  cover_image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  tags TEXT[]
);

-- Custom Tarot Cards table
CREATE TABLE custom_tarot_cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  deck_id UUID REFERENCES custom_tarot_decks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  number INTEGER,
  arcana TEXT,
  suit TEXT,
  image_url TEXT,
  keywords TEXT[],
  summary TEXT,
  interpretation TEXT,
  reversed_interpretation TEXT,
  symbols TEXT[],
  element TEXT,
  numerology TEXT,
  affirmation TEXT,
  questions TEXT[],
  sort_order INTEGER DEFAULT 0,
  custom_fields JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE custom_tarot_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_tarot_cards ENABLE ROW LEVEL SECURITY;

-- Anyone can read published decks
CREATE POLICY "Public can view published decks" ON custom_tarot_decks
  FOR SELECT USING (is_published = true);

-- Creators can manage their own decks
CREATE POLICY "Creators can manage own decks" ON custom_tarot_decks
  FOR ALL USING (auth.uid() = creator_id);
```

### 2.2 API Endpoints

```
GET  /api/tarot-channel/decks          - List published decks
GET  /api/tarot-channel/decks/:id      - Get deck with all cards
POST /api/tarot-channel/decks          - Create deck (auth required)
PUT  /api/tarot-channel/decks/:id      - Update deck (owner only)
DELETE /api/tarot-channel/decks/:id    - Delete deck (owner only)
POST /api/tarot-channel/decks/:id/publish - Publish to channel
```

---

## Phase 3: recursive-creator - Deck Creation

### 3.1 New Features Needed

1. **Deck Type Selector**
   - "Playlist" (existing)
   - "Tarot Deck" (new)

2. **CSV/JSON Import Component**
   ```typescript
   interface DeckImportProps {
     onImport: (cards: CustomTarotCard[]) => void;
   }

   // Supports:
   // - CSV file upload
   // - JSON file upload
   // - Google Sheets URL (optional enhancement)
   ```

3. **Google Drive Image Integration**
   - User provides Drive folder URL
   - System lists images in folder
   - Match images to cards by filename
   - Store public URLs or copy to storage

4. **Viewer Selection**
   - "View in Gallery" (existing recursive-landing)
   - "View in Tarot Viewer" (new)

5. **Publish Options**
   - "Publish to Personal Gallery"
   - "Publish to Tarot Channel" (jongu-wellness)

### 3.2 Claude Code Prompt for recursive-creator

```
PROMPT FOR RECURSIVE-CREATOR:

I need to add tarot deck creation functionality. Currently the app creates
playlists of images. I want to add a "Tarot Deck" option that:

1. Add a type selector on creation: "Playlist" or "Tarot Deck"

2. When "Tarot Deck" is selected, show:
   - Deck name, description fields
   - CSV/JSON import button for card data
   - Google Drive folder URL input for images
   - Preview of matched cards (image + data)
   - Option to manually edit any card

3. CSV Import should:
   - Parse headers dynamically
   - Map to CustomTarotCard schema
   - Match image_filename to Drive images
   - Show validation errors

4. The schema for cards:
   [Include CustomTarotCard interface]

5. Publish options:
   - View in current viewer (recursive-landing)
   - View in Tarot Viewer (new - link to viewer route)
   - Publish to Tarot Channel (API call to jongu-wellness)

6. API integration:
   - POST to [jongu-wellness-url]/api/tarot-channel/decks
   - Include auth token from shared auth

Please implement step by step, starting with the type selector UI.
```

---

## Phase 4: Tarot Viewer (New Component)

### 4.1 Location Decision

**Option A: In recursive-creator**
- Pro: Same codebase as creation
- Pro: Next.js features (Image optimization, SSR)
- Con: More coupled

**Option B: In recursive-landing**
- Pro: Separate concerns
- Pro: Pure HTML/CSS for design flexibility
- Con: May need API integration

**Recommendation:** Start in recursive-creator for faster iteration, can extract later.

### 4.2 Viewer Features

```typescript
interface TarotViewerProps {
  deckId: string;
  // OR
  cards: CustomTarotCard[];
}

// Features:
// 1. Grid of all cards (face down initially or face up)
// 2. Click to flip - shows card image
// 3. Hover/click again - shows summary overlay
// 4. Click "More" - opens modal with full interpretation
// 5. Back button - flip back to card back
// 6. Optional: search/filter by suit/arcana/keywords
```

### 4.3 Claude Code Prompt for Tarot Viewer

```
PROMPT FOR TAROT VIEWER:

Create a new Tarot Viewer component/page that displays a full custom tarot deck.

Requirements:

1. Route: /tarot-viewer/[deckId]
   - Fetches deck data from API or props

2. Layout:
   - Header with deck name, creator, description
   - Grid layout showing all cards (responsive: 4-6 columns on desktop, 2-3 on mobile)
   - Each card shows card back image initially

3. Card Interactions:
   - Click card: Flip animation, show card face
   - Flipped card shows:
     - Card image
     - Card name
     - Keywords (small chips)
     - "View Details" button
   - Click "View Details": Opens modal/drawer with:
     - Full card image
     - Name, arcana, suit, element
     - Full interpretation
     - Reversed interpretation (if available)
     - Symbols, affirmation, questions

4. Flip Animation:
   - CSS 3D transform
   - 0.6s transition
   - Card rotates Y-axis

5. Data Schema:
   [Include CustomTarotCard interface]

6. Styling:
   - Dark mystical theme
   - Gold accents
   - Card shadows on hover

Please implement starting with the basic grid and flip animation.
```

---

## Phase 5: jongu-tool-best-possible-self - Deck Selection

### 5.1 Changes Needed

1. **DeckSelector Component**
   - Dropdown/modal to select deck
   - Options: "Rider-Waite (Classic)" + published custom decks
   - "Preview Deck" button opens viewer in new tab

2. **Modified TarotOracle**
   - Accept `selectedDeck` prop
   - Load cards from selected deck
   - Handle different card structures

3. **Modified AI Context**
   - Support different data formats
   - Consider RAG for large interpretation texts

### 5.2 New Files

```
src/
  components/
    TarotDeckSelector.tsx    # Deck selection UI
  lib/
    custom-tarot.ts          # Fetch custom decks & cards
  types/
    custom-tarot.types.ts    # CustomTarotDeck, CustomTarotCard
```

### 5.3 AI Context Strategy

**Option A: Full Context (Recommended for MVP)**
```typescript
// Pass all card data to AI
oracleContext.tarot = {
  deck: deckName,
  readings: readings.map(r => ({
    cards: r.cards.map(c => ({
      name: c.name,
      keywords: c.keywords,
      interpretation: c.interpretation,  // NEW: full text
      reversed: c.reversed_interpretation,
      symbols: c.symbols,
      // ... all available fields
    }))
  }))
};
```

**Option B: RAG (For Large Decks/Interpretations)**
```typescript
// Store interpretations in vector DB
// Pass only card IDs + retrieve relevant context
// Better for decks with 1000+ words per card
```

**Option C: Card IDs Only + System Prompt**
```typescript
// If deck is well-known, just pass IDs
// Include deck description in system prompt
// AI uses its knowledge to interpret
```

### 5.4 Claude Code Prompt for jongu-tool-best-possible-self

```
PROMPT FOR JONGU-TOOL-BEST-POSSIBLE-SELF:

I want to add custom tarot deck selection to the existing tarot oracle.

Current state:
- TarotOracle.tsx loads Rider-Waite from /data/tarot-cards.json
- tarot.ts has drawThreeCards() function
- Types in tarot.types.ts

Changes needed:

1. Create src/types/custom-tarot.types.ts with:
   [Include CustomTarotDeck and CustomTarotCard interfaces]

2. Create src/lib/custom-tarot.ts with:
   - fetchPublishedDecks(): Fetches from [jongu-wellness-url]/api/tarot-channel/decks
   - fetchDeckWithCards(deckId): Fetches full deck data
   - Cache deck data locally after first fetch

3. Create src/components/TarotDeckSelector.tsx:
   - Dropdown with deck options
   - First option: "Rider-Waite (Classic)" - uses existing
   - Other options: Published custom decks from API
   - "Preview Deck" link - opens tarot viewer in new tab
   - Stores selection in localStorage for persistence

4. Modify src/components/TarotOracle.tsx:
   - Add DeckSelector above the question input
   - When custom deck selected:
     - Load cards from API instead of JSON
     - Use custom deck's card back image
     - Adjust display for custom card fields

5. Modify src/lib/tarot.ts:
   - Update drawThreeCards to accept cards array parameter
   - Or create drawCardsFromDeck(deck: CustomTarotDeck) variant

6. Modify src/app/api/ai/chat/route.ts:
   - Enhance buildSingleTarotReadingSection() to include:
     - Deck name/description
     - Full interpretation text (if available)
     - Symbols, affirmations, questions
   - Add deck context to system prompt

7. Update src/app/page.tsx:
   - Add selectedDeck state
   - Pass to TarotOracle

Start with step 1-3 (types, fetching, selector UI).
```

---

## Phase 6: Integration & Testing

### 6.1 End-to-End Flow

```
1. User goes to recursive-creator
2. Creates new "Tarot Deck"
3. Uploads CSV with card data
4. Provides Drive folder URL with images
5. System matches images to cards
6. User previews in Tarot Viewer
7. User publishes to Tarot Channel

8. User goes to jongu-tool-best-possible-self
9. Opens Tarot Oracle
10. Selects custom deck from dropdown
11. Can click "Preview" to open Tarot Viewer in new tab
12. Draws cards - uses custom deck
13. AI interpretation includes custom interpretation data
```

### 6.2 Testing Checklist

- [ ] CSV import handles missing columns gracefully
- [ ] Drive images load and cache properly
- [ ] Deck publishing creates correct API records
- [ ] Deck selection persists across sessions
- [ ] Card drawing works with custom decks
- [ ] AI context includes custom interpretation data
- [ ] Tarot viewer displays all cards correctly
- [ ] Flip animations work on mobile

---

## Implementation Order (Suggested)

### Batch 1: Foundation
1. Create shared types package or copy types to each repo
2. Set up Supabase tables in jongu-wellness
3. Create basic API endpoints in jongu-wellness

### Batch 2: Creation
4. Add tarot deck type to recursive-creator
5. Implement CSV/JSON import
6. Add Drive folder integration
7. Create publish to channel functionality

### Batch 3: Viewer
8. Build Tarot Viewer component
9. Add route and API integration
10. Implement flip animations and detail modal

### Batch 4: Selection
11. Add DeckSelector to jongu-tool-best-possible-self
12. Modify TarotOracle for custom decks
13. Update AI context handling

### Batch 5: Polish
14. Add loading states and error handling
15. Optimize image loading
16. Add search/filter to viewer
17. Add deck rating/favorites (optional)

---

## Your Example Deck

For the deck at: https://drive.google.com/drive/folders/19KT5zhq01kuQAMiPb_m58xr78MNxKMNi

You'll need:
1. Create a CSV with columns matching the schema above
2. Ensure image filenames in CSV match files in Drive folder
3. Upload via recursive-creator's new import feature
4. Publish to tarot channel
5. Select in jongu-tool-best-possible-self

---

## Environment Variables Needed

```env
# jongu-wellness
NEXT_PUBLIC_SUPABASE_URL=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# recursive-creator
GOOGLE_DRIVE_API_KEY=xxx  # For Drive folder access
TAROT_CHANNEL_API_URL=https://jongu-wellness.vercel.app/api

# jongu-tool-best-possible-self
TAROT_CHANNEL_API_URL=https://jongu-wellness.vercel.app/api
```

---

## Notes on RAG vs Full Context

For MVP, **full context is recommended** because:
- Simpler implementation
- Custom decks likely have <5000 tokens per reading
- GPT-4 context window is large enough
- No additional infrastructure needed

Consider RAG later if:
- Decks have very long interpretations (1000+ words per card)
- You want semantic search across interpretations
- Multiple decks need to be cross-referenced

---

This plan provides a complete roadmap. Each phase can be implemented incrementally, and the Claude Code prompts can be used directly to guide implementation in each repository.
