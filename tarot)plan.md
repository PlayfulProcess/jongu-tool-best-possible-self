🎴 Tarot Feature Implementation Plan

  Strategy: Build in current app, design for future extraction

  ---
  📋 Phase 1: Foundation (Week 1)

  1.1 Restore AI Prompt Editor to Templates

  Goal: Let users/admins create custom AI prompts with variables

  Files to modify:
  - src/app/api/templates/route.ts - Add ai_prompt to API
  - src/app/api/templates/[id]/route.ts - Include in updates
  - Create src/components/TemplateEditor.tsx - UI for editing prompts

  Template Editor Component:
  // src/components/TemplateEditor.tsx
  'use client';

  export default function TemplateEditor({ template, onSave }) {
    const [aiPrompt, setAiPrompt] = useState(template?.ai_prompt || '');

    return (
      <div className="space-y-6">
        {/* Name, Description, UI Prompt */}

        <div className="border-t pt-6">
          <label className="block text-sm font-medium mb-2">
            AI Prompt (Advanced)
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Customize how the AI understands this exercise. Use variables:
          </p>
          <div className="bg-gray-50 p-3 rounded mb-3 text-xs font-mono">
            {'{template.name}'} {'{template.description}'} {'{journal_content}'}
            {'{document_data}'} {'{document_data.cards}'} {'{user.name}'}
          </div>
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={12}
            className="w-full font-mono text-sm border rounded-lg p-3"
            placeholder="You are helping with {template.name}...&#10;&#10;Context: {journal_content}&#10;&#10;Additional data: {document_data}"
          />
        </div>

        <button onClick={() => onSave({ ...template, ai_prompt: aiPrompt })}>
          Save Template
        </button>
      </div>
    );
  }

  1.2 Implement Dynamic AI Prompt System

  File: src/app/api/ai/chat/route.ts

  Add before openai.chat.completions.create:
  async function buildDynamicPrompt(
    templateId: string,
    journalContent: string,
    documentData: any,
    user: any,
    supabase: SupabaseClient
  ): Promise<string> {

    // Base personality (always included)
    const basePersonality = `You are a compassionate empathy buddy with thorough understanding of psychology, mythology, religion, and sociology.

  Core Principles:
  - **Validation First** (DBT): Always acknowledge and validate feelings before offering perspectives
  - **Empathy**: Listen deeply with genuine care and understanding
  - **Insight**: Draw from psychology, mythology, and spiritual wisdom
  - **Support**: Help process emotions and gain clarity
  - **Non-judgmental**: Accept all feelings and experiences as valid

  Format responses with clear paragraph breaks for readability. Be warm and conversational.

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  `;

    // Fetch template if provided
    let templatePrompt = '';
    if (templateId) {
      const { data: template } = await supabase
        .from('journal_templates')
        .select('name, description, ai_prompt')
        .eq('uuid', templateId)
        .single();

      if (template?.ai_prompt) {
        templatePrompt = template.ai_prompt;
      } else {
        // Fallback: basic template info
        templatePrompt = `EXERCISE: ${template?.name || 'Journal Reflection'}
  ${template?.description || ''}

  JOURNAL ENTRY:
  {journal_content}
  `;
      }
    } else {
      // No template: simple journal
      templatePrompt = `JOURNAL ENTRY:
  {journal_content}`;
    }

    // Build variable map
    const variables: Record<string, string> = {
      'journal_content': journalContent || '',
      'document_data': documentData ? JSON.stringify(documentData, null, 2) : '{}',
      'user.name': user?.user_metadata?.full_name || '',
    };

    // Add document_data fields for convenience
    if (documentData && typeof documentData === 'object') {
      Object.keys(documentData).forEach(key => {
        const value = documentData[key];
        variables[`document_data.${key}`] =
          typeof value === 'string' ? value : JSON.stringify(value, null, 2);
      });
    }

    // Replace variables
    let finalPrompt = basePersonality + templatePrompt;
    Object.entries(variables).forEach(([key, value]) => {
      finalPrompt = finalPrompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });

    return finalPrompt;
  }

  // Update main POST handler:
  export async function POST(request: NextRequest) {
    try {
      // ... auth checks ...

      const {
        message,
        template_id,      // NEW: template UUID
        journal_content,  // NEW: rename from 'content'
        document_data,    // NEW: for tarot cards, etc.
        history = []      // NEW: conversation history
      } = await request.json();

      // Build dynamic prompt
      const systemPrompt = await buildDynamicPrompt(
        template_id,
        journal_content,
        document_data,
        user,
        supabase
      );

      // Call OpenAI with history
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,  // Full conversation history
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      // ... rest of handler ...
    }
  }

  1.3 Update AIAssistant to Send New Format

  File: src/components/AIAssistant.tsx

  Props interface:
  interface AIAssistantProps {
    content: string;           // Journal text
    documentData?: any;        // NEW: Tarot cards, I Ching, etc.
    templateId?: string;       // NEW: Template UUID
    entryId?: string | null;
    // ... other props
  }

  Update sendMessage (line ~375):
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: input,
      template_id: templateId,      // NEW
      journal_content: content,     // RENAMED from 'content'
      document_data: documentData,  // NEW
      history: messages             // NEW
    }),
  });

  ---
  📋 Phase 2: Tarot Data Structure (Week 2)

  2.1 Create Tarot Template

  SQL Migration:
  -- File: z.Supabase/migration_add_tarot_template.sql

  INSERT INTO journal_templates (
    name,
    description,
    ui_prompt,
    ai_prompt,
    is_system
  ) VALUES (
    'Tarot Reading',
    'Explore archetypal wisdom through symbolic card interpretation',
    'Draw cards and discover their meaning for your situation',
    'EXERCISE: Tarot Reading
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Deck: {document_data.deck_name}
  Spread: {document_data.spread_name}
  User''s Question: "{document_data.question}"

  CARDS DRAWN:
  {document_data.cards}

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Interpret these cards through psychological, mythological, and spiritual lenses.
  - Connect the symbolism to the user''s personal journey
  - Honor their intuition and interpretation
  - Provide insight without being prescriptive
  - Weave the cards into a coherent narrative
  - Validate their feelings about the reading',
    true
  );

  2.2 Tarot Data Storage (No New Tables!)

  Structure in user_documents.document_data:
  {
    "deck_name": "Rider-Waite Tarot",
    "spread_name": "Three Card Spread",
    "question": "What should I focus on for career growth?",
    "cards": [
      {
        "position": "Past",
        "name": "The Fool",
        "reversed": false,
        "image_url": "https://example.com/fool.jpg",
        "keywords": ["new beginnings", "innocence", "spontaneity"],
        "upright_meaning": "You recently took a leap of faith...",
        "reversed_meaning": "Recklessness, not looking before you leap...",
        "mythology": "The eternal wanderer, the sacred fool...",
        "psychology": "The archetypal Child, beginner's mind...",
        "questions": [
          "Where in your life are you being called to take a leap?",
          "What would happen if you trusted the process?"
        ]
      },
      {
        "position": "Present",
        "name": "The Magician",
        "reversed": false,
        "image_url": "https://example.com/magician.jpg",
        "keywords": ["manifestation", "resourcefulness", "power"],
        "upright_meaning": "You have all the tools you need...",
        "items": [
          {
            "type": "video",
            "url": "https://youtu.be/...",
            "title": "Understanding The Magician"
          },
          {
            "type": "image",
            "image_url": "https://...",
            "narration": "Notice the infinity symbol..."
          }
        ]
      }
    ]
  }

  Save to database:
  // When user completes tarot reading
  await supabase.from('user_documents').insert({
    user_id: user.id,
    document_type: 'tool_session',
    tool_slug: 'tarot-reading',
    document_data: {
      deck_name: selectedDeck.name,
      spread_name: selectedSpread.name,
      question: userQuestion,
      cards: drawnCards
    }
  });

  ---
  📋 Phase 3: Tarot UI (Week 3-4)

  3.1 Create Tarot Pages

  File structure:
  src/app/tarot/
  ├── page.tsx              # Main tarot entry (select spread)
  ├── reading/
  │   └── [id]/
  │       └── page.tsx      # Active reading session
  └── history/
      └── page.tsx          # Past readings

  3.2 Minimal Tarot Components

  No database for decks/spreads initially. Hardcode 1 deck + 2 spreads:

  // src/lib/tarot-data.ts

  export const RIDER_WAITE_DECK = {
    name: "Rider-Waite Tarot",
    cards: [
      {
        id: "fool",
        name: "The Fool",
        number: 0,
        image_url: "/tarot/rider-waite/00-fool.jpg",
        keywords: ["new beginnings", "innocence", "spontaneity", "free spirit"],
        upright_meaning: "The Fool represents new beginnings, having faith in the future, being inexperienced, not knowing what to expect, having beginner's luck, improvisation and believing in     
  the universe.",
        reversed_meaning: "Reversed, The Fool indicates recklessness, taking foolish risks, and not looking before you leap.",
        mythology: "The Fool is the eternal wanderer, the sacred clown who speaks truth to power...",
        psychology: "Represents the archetypal Child and the concept of beginner's mind from Zen Buddhism..."
      },
      // ... Add 5-10 major arcana cards to start
    ]
  };

  export const SPREADS = {
    'one-card': {
      name: "Single Card",
      positions: [
        { name: "Guidance", meaning: "What you need to know right now" }
      ]
    },
    'three-card': {
      name: "Past-Present-Future",
      positions: [
        { name: "Past", meaning: "What brought you to this moment" },
        { name: "Present", meaning: "Current situation and energies" },
        { name: "Future", meaning: "Potential outcome or direction" }
      ]
    }
  };

  3.3 Simple Tarot Reading Flow

  File: src/app/tarot/page.tsx

  'use client';

  import { useState } from 'react';
  import { useRouter } from 'next/navigation';
  import { RIDER_WAITE_DECK, SPREADS } from '@/lib/tarot-data';

  export default function TarotPage() {
    const router = useRouter();
    const [question, setQuestion] = useState('');
    const [selectedSpread, setSelectedSpread] = useState('three-card');

    const handleStartReading = async () => {
      // Draw random cards
      const spread = SPREADS[selectedSpread];
      const shuffled = [...RIDER_WAITE_DECK.cards].sort(() => Math.random() - 0.5);
      const drawn = shuffled.slice(0, spread.positions.length).map((card, i) => ({
        ...card,
        position: spread.positions[i].name,
        reversed: Math.random() > 0.7
      }));

      // Save reading
      const { data, error } = await fetch('/api/tarot/create-reading', {
        method: 'POST',
        body: JSON.stringify({
          deck_name: RIDER_WAITE_DECK.name,
          spread_name: spread.name,
          question,
          cards: drawn
        })
      }).then(r => r.json());

      if (data?.id) {
        router.push(`/tarot/reading/${data.id}`);
      }
    };

    return (
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Tarot Reading</h1>

        <div className="space-y-6">
          <div>
            <label className="block mb-2">What question do you seek guidance on?</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full border rounded-lg p-3"
              rows={3}
              placeholder="What should I focus on..."
            />
          </div>

          <div>
            <label className="block mb-2">Choose a spread</label>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(SPREADS).map(([key, spread]) => (
                <button
                  key={key}
                  onClick={() => setSelectedSpread(key)}
                  className={`p-4 border-2 rounded-lg ${
                    selectedSpread === key ? 'border-purple-600' : 'border-gray-300'
                  }`}
                >
                  <div className="font-semibold">{spread.name}</div>
                  <div className="text-sm text-gray-600">{spread.positions.length} cards</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStartReading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700"
          >
            Draw Cards
          </button>
        </div>
      </div>
    );
  }

  3.4 Reading Session Page

  File: src/app/tarot/reading/[id]/page.tsx

  'use client';

  import { useEffect, useState } from 'react';
  import AIAssistant from '@/components/AIAssistant';
  import Image from 'next/image';

  export default function ReadingPage({ params }: { params: { id: string } }) {
    const [reading, setReading] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetch(`/api/tarot/reading/${params.id}`)
        .then(r => r.json())
        .then(data => {
          setReading(data);
          setLoading(false);
        });
    }, [params.id]);

    if (loading) return <div>Loading...</div>;
    if (!reading) return <div>Reading not found</div>;

    return (
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Your Reading</h1>

        {/* Cards Display */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {reading.document_data.cards.map((card, i) => (
            <div key={i} className="text-center">
              <div className="mb-2 font-semibold text-purple-700">
                {card.position}
              </div>
              <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
                {card.image_url && (
                  <Image
                    src={card.image_url}
                    alt={card.name}
                    width={200}
                    height={350}
                    className={`mx-auto ${card.reversed ? 'rotate-180' : ''}`}
                  />
                )}
                <div className="mt-3 font-bold">{card.name}</div>
                {card.reversed && (
                  <div className="text-sm text-red-600">(Reversed)</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* AI Chat */}
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">
            Explore Your Reading
          </h2>
          <AIAssistant
            content=""
            documentData={reading.document_data}
            templateId={reading.template_id}  // Tarot template UUID
            entryId={reading.id}
          />
        </div>
      </div>
    );
  }

  3.5 API Routes for Tarot

  File: src/app/api/tarot/create-reading/route.ts

  import { NextRequest, NextResponse } from 'next/server';
  import { createClient } from '@/lib/supabase-server';

  export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Get tarot template ID
    const { data: template } = await supabase
      .from('journal_templates')
      .select('uuid')
      .eq('name', 'Tarot Reading')
      .single();

    // Save reading
    const { data, error } = await supabase
      .from('user_documents')
      .insert({
        user_id: user.id,
        document_type: 'tool_session',
        tool_slug: 'tarot-reading',
        document_data: {
          deck_name: body.deck_name,
          spread_name: body.spread_name,
          question: body.question,
          cards: body.cards
        }
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, template_id: template?.uuid });
  }

  ---
  📋 Phase 4: Testing & Polish (Week 5)

  4.1 Test Checklist

  - AI remembers conversation within a reading
  - AI interprets cards correctly
  - Dynamic prompts work with {variables}
  - Can create custom templates with AI prompts
  - Tarot readings save to database
  - Can view past readings
  - Card images display (reversed cards rotate)
  - Mobile responsive

  4.2 Add Card Images

  Option 1: Use public domain Rider-Waite cards
  # Download from Sacred Texts or similar
  mkdir -p public/tarot/rider-waite
  # Add 00-fool.jpg, 01-magician.jpg, etc.

  Option 2: Use URLs from external source
  image_url: "https://upload.wikimedia.org/wikipedia/commons/..."

  ---
  📋 Phase 5: Future Extraction (When Ready)

  When to Extract:

  - ✅ 100+ active tarot users
  - ✅ Tarot generates revenue
  - ✅ Want different branding
  - ✅ Need different pricing model

  How to Extract:

  1. Create new Next.js app:
  npx create-next-app@latest jongu-tarot
  cd jongu-tarot

  2. Copy shared code:
  # Copy components
  cp -r ../jongu-tool-best-possible-self/src/components/AIAssistant.tsx .
  cp -r ../jongu-tool-best-possible-self/src/lib/supabase* .

  # Copy tarot-specific
  cp -r ../jongu-tool-best-possible-self/src/app/tarot/* ./src/app/
  cp -r ../jongu-tool-best-possible-self/src/lib/tarot-data.ts .

  3. New Supabase project:
  # Create tarot-specific database
  # Copy only: users, user_documents, journal_templates, user_ai_wallets

  4. Deploy separately:
  # Vercel
  vercel --prod
  # Point tarot.jongu.app domain

  ---
  🎯 Success Metrics

  Phase 1-2 (Foundation):

  - AI prompts editable in UI
  - Template variables working
  - Conversation history functional

  Phase 3-4 (Tarot MVP):

  - 10 users complete a reading
  - Average 5+ messages per reading session
  - Users return for second reading

  Phase 5 (Extraction):

  - 100+ tarot users
  - $100+ monthly revenue from tarot
  - Decision: keep integrated or extract?

  ---
  📝 Next Steps

  1. This week: Implement Phase 1 (AI prompts + dynamic system)
  2. Test: Create Best Possible Self template with custom AI prompt
  3. Next week: Add tarot template + basic UI
  4. Week 3: Build tarot reading flow
  5. Week 4: Polish & test with users
