# Prompt 2: recursive-creator - Tarot Deck Creation

Use this prompt in the **recursive-creator** repository.

---

## Prompt

I want to add the ability to create Tarot Decks in addition to Playlists. When creating a new project, users should be able to choose between "Playlist" (existing) or "Tarot Deck" (new).

### Tarot Deck Creation Flow

1. **Type Selection**
   - Add a toggle/selector on the creation page: "Playlist" or "Tarot Deck"
   - When "Tarot Deck" is selected, show tarot-specific fields

2. **Deck Information**
   - Deck Name (required)
   - Description (optional)
   - Cover/Back Image URL (optional)
   - Tags (optional, comma-separated)

3. **CSV/JSON Import Component**

   Create a `TarotDeckImport` component that:
   - Accepts CSV or JSON file upload
   - Parses the file and maps to card schema
   - Shows preview of parsed cards
   - Handles validation errors gracefully

   **CSV columns to support:**
   ```
   number, name, suit, arcana, keywords, summary, interpretation,
   reversed_interpretation, symbols, element, affirmation, questions, image_filename
   ```

   - `keywords`, `symbols`, `questions` are comma-separated lists within the cell
   - `image_filename` will be matched to images later
   - All columns except `name` are optional

   **JSON format:**
   ```json
   {
     "cards": [
       {
         "number": 0,
         "name": "The Fool",
         "arcana": "major",
         "keywords": ["beginnings", "innocence"],
         "summary": "A leap into the unknown",
         "interpretation": "Full interpretation...",
         "image_filename": "fool.jpg"
       }
     ]
   }
   ```

4. **Google Drive Image Integration**

   Create a `DriveImageMatcher` component that:
   - Takes a Google Drive folder URL input
   - Lists images in the folder (using Drive API or public folder listing)
   - Matches `image_filename` from CSV to actual files
   - Shows which cards have matched images vs missing
   - Stores the public image URLs

   **Note:** For MVP, we can use the direct Drive URL format:
   `https://drive.google.com/uc?export=view&id={FILE_ID}`

5. **Card Editor**

   After import, show a grid/list of cards where users can:
   - See the matched image thumbnail
   - Edit any field
   - Re-order cards
   - Delete cards
   - Add new cards manually

6. **Preview Options**
   - "Preview in Gallery" - Opens current recursive-landing viewer
   - "Preview in Tarot Viewer" - Opens new tarot viewer (we'll build this)

7. **Publish Options**
   - "Save Draft" - Saves locally or to user account
   - "Publish to Tarot Channel" - Calls jongu-wellness API

### API Integration

When publishing to Tarot Channel:

```typescript
async function publishToTarotChannel(deck: DeckData) {
  const API_URL = process.env.NEXT_PUBLIC_TAROT_CHANNEL_API;

  // 1. Create deck
  const deckRes = await fetch(`${API_URL}/api/tarot-channel/decks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}` // If using shared auth
    },
    body: JSON.stringify({
      name: deck.name,
      description: deck.description,
      cover_image_url: deck.coverImage,
      tags: deck.tags
    })
  });
  const { deck: createdDeck } = await deckRes.json();

  // 2. Add cards
  await fetch(`${API_URL}/api/tarot-channel/decks/${createdDeck.id}/cards`, {
    method: 'POST',
    headers: { /* same */ },
    body: JSON.stringify({ cards: deck.cards })
  });

  // 3. Publish
  await fetch(`${API_URL}/api/tarot-channel/decks/${createdDeck.id}/publish`, {
    method: 'PUT',
    headers: { /* same */ }
  });

  return createdDeck.id;
}
```

### Card Type Interface

```typescript
interface TarotCardInput {
  name: string;
  number?: number;
  suit?: string;
  arcana?: 'major' | 'minor' | 'custom';
  image_url?: string;
  image_filename?: string; // For matching before URL is resolved
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

### Implementation Steps

1. First, add the type selector to the creation page
2. Create the `TarotDeckImport` component with CSV parsing
3. Add the `DriveImageMatcher` component
4. Build the card editor/preview grid
5. Add the publish functionality
6. Test the full flow

Start with step 1 and 2 - the type selector and CSV import.
