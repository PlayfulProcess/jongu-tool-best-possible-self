# Prompt 3: Tarot Viewer Component

Use this prompt in **recursive-creator** OR create as a standalone page in **recursive-landing**.

---

## Prompt

I need a Tarot Viewer that displays all cards in a custom tarot deck. Unlike the existing gallery viewer (one image at a time), this shows all cards in a grid where users can flip and explore each card.

### Route

`/tarot-viewer/[deckId]`

Or if passing data directly: `/tarot-viewer?data={base64EncodedDeckData}`

### Features

1. **Header Section**
   - Deck name (large)
   - Creator name
   - Description
   - Card count
   - Optional: Filter by arcana/suit

2. **Card Grid**
   - Responsive grid: 6 columns on large screens, 4 on medium, 2-3 on mobile
   - All cards start face-down (showing card back)
   - Card back image from deck's `cover_image_url` or default mystical design

3. **Card Flip Interaction**
   - Click card to flip (CSS 3D transform)
   - Smooth 0.6s animation
   - Card flips to show:
     - Card image
     - Card name (overlay at bottom)
     - Keywords as small tags
     - "Details" button

4. **Card Details Modal**
   - Opens when clicking "Details" on a flipped card
   - Shows:
     - Large card image
     - Name, Number, Arcana, Suit, Element
     - Divider
     - Summary (if available)
     - Full Interpretation
     - Reversed Interpretation (collapsible)
     - Symbols (as tags)
     - Affirmation (styled quote)
     - Reflective Questions (as list)
   - Close button (X) and click-outside-to-close

5. **Flip All Toggle**
   - Button to flip all cards face-up or face-down
   - Useful for browsing the full deck

### Data Fetching

```typescript
// Option 1: Fetch from Tarot Channel API
async function loadDeck(deckId: string) {
  const res = await fetch(
    `${TAROT_CHANNEL_API}/api/tarot-channel/decks/${deckId}`
  );
  const { deck, cards } = await res.json();
  return { deck, cards };
}

// Option 2: Receive data via URL parameter (for preview before publish)
function loadDeckFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const data = params.get('data');
  if (data) {
    return JSON.parse(atob(data));
  }
}
```

### Card Type

```typescript
interface TarotCard {
  id: string;
  name: string;
  number?: number;
  arcana?: string;
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

interface TarotDeck {
  id: string;
  name: string;
  creator_name?: string;
  description?: string;
  cover_image_url?: string;
  card_count: number;
}
```

### CSS for Flip Animation

```css
.card-container {
  perspective: 1000px;
}

.card {
  position: relative;
  width: 100%;
  aspect-ratio: 2/3; /* Standard tarot card ratio */
  transition: transform 0.6s;
  transform-style: preserve-3d;
  cursor: pointer;
}

.card.flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 8px;
  overflow: hidden;
}

.card-back {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  /* Or use deck's cover image */
}

.card-front {
  transform: rotateY(180deg);
}
```

### Styling Theme

- Dark mystical background: `#0a0a0f` to `#1a1a2e`
- Accent color: Gold `#d4af37` or Purple `#8b5cf6`
- Card shadows: `box-shadow: 0 10px 40px rgba(0,0,0,0.5)`
- Fonts: Elegant serif for card names, clean sans for body

### Implementation Steps

1. Create the page/route structure
2. Build the Card component with flip animation
3. Create the grid layout
4. Add the details modal
5. Implement data fetching
6. Add filtering and "Flip All" controls
7. Style and polish

Start with the Card component and flip animation, then build the grid.

### Example Default Card Back (if no cover image)

```jsx
<div className="card-back flex items-center justify-center">
  <div className="text-center">
    <div className="text-4xl mb-2">✧</div>
    <div className="text-xs uppercase tracking-widest opacity-50">
      {deckName}
    </div>
  </div>
</div>
```
