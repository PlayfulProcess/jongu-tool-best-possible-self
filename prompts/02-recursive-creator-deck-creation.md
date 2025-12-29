# Prompt 2: recursive-creator - Tarot Deck Creation

Use this prompt in the **recursive-creator** repository.

---

## Prompt

I want to add the ability to create Tarot Decks. This should integrate with the existing tool creation flow, not replace it.

### Deck Creation Flow

1. **New Project Type**
   - When creating a new project, add "Tarot Deck" as an option alongside existing types
   - When selected, show tarot-specific fields

2. **Deck Information Form**
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

4. **Google Drive Image Integration**

   Create a `DriveImageMatcher` component that:
   - Takes a Google Drive folder URL input
   - Lists images in the folder
   - Matches `image_filename` from CSV to actual files
   - Shows which cards have matched images vs missing
   - Stores the public image URLs using format: `https://drive.google.com/uc?export=view&id={FILE_ID}`

5. **Card Editor**

   After import, show a grid/list of cards where users can:
   - See the matched image thumbnail
   - Edit any field
   - Re-order cards
   - Delete cards
   - Add new cards manually

6. **Save & Submit Flow**

   **Important:** Use the existing tool submission flow!

   - **Save Draft**: Saves deck to `user_documents` with `document_type='tarot_deck'`, `is_public=false`
   - **Submit to Channel**: Goes through the EXISTING tool submission flow - this adds it to the `tools` table
   - Only decks in the `tools` table appear in the Tarot Channel

   When saving to user_documents:
   ```typescript
   await supabase.from('user_documents').insert({
     user_id: userId,
     document_type: 'tarot_deck',
     is_public: true,  // Public so it can be read, but NOT discoverable until submitted
     document_data: {
       name: deck.name,
       description: deck.description,
       creator_name: userProfile?.display_name,
       cover_image_url: deck.coverImage,
       tags: deck.tags,
       card_count: deck.cards.length,
       cards: deck.cards
     }
   });
   ```

   When submitting to channel, use the existing tool submission form/flow, passing:
   - `tool_type: 'tarot_deck'`
   - Reference to the `user_documents` record ID

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

1. Add "Tarot Deck" as a project type option
2. Create the deck info form
3. Create `TarotDeckImport` component with CSV/JSON parsing
4. Add `DriveImageMatcher` component
5. Build the card editor/preview grid
6. Connect to existing tool submission flow
7. Test the full flow: create → save → submit → appears in channel
