# Prompt 1: jongu-wellness - Create Tarot Channel

Use this prompt in the **jongu-wellness** repository.

---

## Prompt

I want to add a new Tarot Channel to jongu-wellness. This should follow the existing channel pattern - just adding a new markdown file that defines the channel.

### What to Create

1. **New Channel MD File** at `content/channels/tarot.md` (or wherever other channels are defined):

```md
---
title: Tarot Channel
slug: tarot
description: Community-created tarot decks for self-reflection and divination
icon: 🃏
tool_type: tarot_deck
---

Explore tarot decks created by the community. Each deck offers unique imagery and interpretations for your readings.
```

2. **Channel Page** should:
   - Query the `tools` table for submitted tarot decks (where `tool_type = 'tarot_deck'` or similar field)
   - Display deck cards showing: name, creator, card count, cover image
   - Link to the deck viewer/detail page

### Important Notes

- **Only SUBMITTED decks are visible** - decks must go through the normal tool submission flow to appear in the channel
- Decks can exist in `user_documents` with `is_public=true` but they're NOT discoverable until submitted to tools table
- Don't change the existing tool submission flow
- The channel page just reads from the tools table like other channels

### Deck Data Location

When a deck is submitted, the tools table entry should reference the `user_documents` record:
- `tools.document_id` → points to `user_documents.id` where full deck data lives
- Or `tools.metadata` contains the deck UUID

The channel page fetches the tool entry, then loads full deck data from `user_documents` using that reference.

### Implementation

1. Create the channel markdown file
2. Ensure the channel page template handles `tool_type: tarot_deck`
3. Test that submitted decks appear in the channel
