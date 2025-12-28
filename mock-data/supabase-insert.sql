-- Mock Data for Tarot Channel in jongu-wellness
-- Run this in your Supabase SQL Editor

-- First, update the document_type constraint to include 'tarot_deck'
-- (Run this only if the constraint doesn't already include 'tarot_deck')

ALTER TABLE user_documents
DROP CONSTRAINT IF EXISTS user_documents_document_type_check;

ALTER TABLE user_documents
ADD CONSTRAINT user_documents_document_type_check
CHECK (document_type = ANY (ARRAY[
  'tool_session', 'creative_work', 'preference', 'bookmark',
  'interaction', 'transaction', 'story', 'playlist', 'tarot_deck'
]));

-- Insert the Soul Mirrors Tarot deck as a test deck
-- Uses gen_random_uuid() to generate a proper UUID

INSERT INTO user_documents (
  id,
  user_id,
  document_type,
  is_public,
  document_data,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),  -- Generate a proper UUID
  -- Use your own user ID here, or get the first user from the system
  (SELECT id FROM auth.users LIMIT 1),
  'tarot_deck',
  true,  -- Make it public so it shows in the channel
  '{
    "name": "Soul Mirrors Tarot",
    "description": "A 22-card Major Arcana deck for deep self-reflection and inner exploration. Each card is a mirror reflecting aspects of your soul journey.",
    "creator_name": "Playful Process",
    "cover_image_url": null,
    "card_count": 22,
    "tags": ["major arcana", "self-reflection", "soul work", "inner journey"],
    "cards": [
      {
        "id": "sm-0",
        "name": "The Dreamer",
        "number": 0,
        "arcana": "major",
        "keywords": ["innocence", "new beginnings", "trust", "leap of faith"],
        "summary": "The soul before it awakens to its journey, full of potential and wonder.",
        "interpretation": "The Dreamer represents the part of you that remains eternally innocent, the aspect of your soul that can still be amazed by the world. This card invites you to approach your current situation with beginner mind, releasing expectations.",
        "reversed_interpretation": "When reversed, The Dreamer may indicate fear of the unknown holding you back, or perhaps reckless naivety.",
        "symbols": ["empty hands", "open sky", "first step"],
        "element": "Air",
        "affirmation": "I trust my souls journey into the unknown.",
        "questions": ["What am I afraid to begin?", "Where could beginners mind serve me?"],
        "sort_order": 0
      },
      {
        "id": "sm-1",
        "name": "The Alchemist",
        "number": 1,
        "arcana": "major",
        "keywords": ["manifestation", "will", "creation", "tools"],
        "summary": "The creative force that transforms intention into reality.",
        "interpretation": "The Alchemist reminds you that you have all the tools you need. Your thoughts, emotions, actions, and spirit are the elements you work with to create your reality.",
        "reversed_interpretation": "Reversed, The Alchemist may indicate scattered energy or manipulation.",
        "symbols": ["four elements", "infinity", "focused gaze"],
        "element": "Air",
        "affirmation": "I consciously create my reality with wisdom and intention.",
        "questions": ["What am I creating right now?", "Are my tools in alignment with my highest purpose?"],
        "sort_order": 1
      },
      {
        "id": "sm-2",
        "name": "The Veil",
        "number": 2,
        "arcana": "major",
        "keywords": ["intuition", "mystery", "the unconscious", "inner knowing"],
        "summary": "The wisdom that lives beyond words, in the spaces between thoughts.",
        "interpretation": "The Veil invites you to trust what you cannot explain. Behind the rational mind lies a vast ocean of knowing that speaks through dreams, symbols, body sensations.",
        "reversed_interpretation": "Reversed, The Veil may indicate blocked intuition or secrets being kept.",
        "symbols": ["moon", "water", "hidden doorway"],
        "element": "Water",
        "affirmation": "I honor the wisdom that speaks in silence.",
        "questions": ["What does my intuition already know?", "What am I not ready to see?"],
        "sort_order": 2
      },
      {
        "id": "sm-3",
        "name": "The Garden",
        "number": 3,
        "arcana": "major",
        "keywords": ["abundance", "nurturing", "creativity", "growth"],
        "summary": "The fertile soil where all life flourishes through love and care.",
        "interpretation": "The Garden represents your capacity to nurture - yourself, others, and your creative projects.",
        "reversed_interpretation": "Reversed, The Garden may indicate neglect or over-giving to the point of depletion.",
        "symbols": ["flowers", "fruit", "open arms"],
        "element": "Earth",
        "affirmation": "I nurture myself and others with abundant love.",
        "questions": ["What needs my loving attention?", "Where am I neglecting my own garden?"],
        "sort_order": 3
      },
      {
        "id": "sm-4",
        "name": "The Builder",
        "number": 4,
        "arcana": "major",
        "keywords": ["structure", "authority", "stability", "boundaries"],
        "summary": "The part of you that creates order, sets limits, and builds lasting foundations.",
        "interpretation": "The Builder calls you to examine the structures in your life - both internal and external.",
        "reversed_interpretation": "Reversed, The Builder may indicate rigidity or excessive control.",
        "symbols": ["cornerstone", "throne", "right angles"],
        "element": "Fire",
        "affirmation": "I build structures that support my souls freedom.",
        "questions": ["What structures no longer serve me?", "Where do I need better boundaries?"],
        "sort_order": 4
      },
      {
        "id": "sm-5",
        "name": "The Bridge",
        "number": 5,
        "arcana": "major",
        "keywords": ["tradition", "teaching", "meaning", "connection"],
        "summary": "The wisdom passed down through generations, connecting us to something greater.",
        "interpretation": "The Bridge represents the teachings, traditions, and meaning-making systems that connect you to community and lineage.",
        "reversed_interpretation": "Reversed, The Bridge may indicate dogma or rejected wisdom.",
        "symbols": ["keys", "arches", "two pillars"],
        "element": "Earth",
        "affirmation": "I honor the wisdom of those who walked before me while finding my own path.",
        "questions": ["What teachings have shaped me?", "What wisdom am I called to share?"],
        "sort_order": 5
      },
      {
        "id": "sm-6",
        "name": "The Dance",
        "number": 6,
        "arcana": "major",
        "keywords": ["relationship", "choice", "harmony", "integration"],
        "summary": "The movement between self and other, choosing what and whom we embrace.",
        "interpretation": "The Dance is about relationships of all kinds - with others, with parts of yourself, with values.",
        "reversed_interpretation": "Reversed, The Dance may indicate imbalance in relationship or avoidance of necessary choices.",
        "symbols": ["two figures", "intertwined hands", "choice point"],
        "element": "Air",
        "affirmation": "I choose my partners in lifes dance with awareness and love.",
        "questions": ["What relationships need attention?", "What choice am I avoiding?"],
        "sort_order": 6
      },
      {
        "id": "sm-7",
        "name": "The Journey",
        "number": 7,
        "arcana": "major",
        "keywords": ["willpower", "direction", "momentum", "triumph"],
        "summary": "The soul moving forward with purpose, mastering opposing forces.",
        "interpretation": "The Journey represents forward motion through sheer will and determination.",
        "reversed_interpretation": "Reversed, The Journey may indicate scattered direction or aggression without purpose.",
        "symbols": ["chariot", "stars", "reins"],
        "element": "Water",
        "affirmation": "I move forward with aligned will and clear purpose.",
        "questions": ["Where am I headed?", "Is my ego or soul driving?"],
        "sort_order": 7
      },
      {
        "id": "sm-8",
        "name": "The Heart",
        "number": 8,
        "arcana": "major",
        "keywords": ["compassion", "courage", "gentle power", "taming"],
        "summary": "The strength that comes from the heart, taming the wild with gentleness.",
        "interpretation": "The Heart reminds you that true strength is not domination but loving presence.",
        "reversed_interpretation": "Reversed, The Heart may indicate repressed anger or self-doubt.",
        "symbols": ["lion", "open hands", "infinity"],
        "element": "Fire",
        "affirmation": "My gentleness is my greatest strength.",
        "questions": ["What wild part of me needs compassion?", "Where am I using force when love would work better?"],
        "sort_order": 8
      },
      {
        "id": "sm-9",
        "name": "The Lantern",
        "number": 9,
        "arcana": "major",
        "keywords": ["solitude", "introspection", "wisdom", "guidance"],
        "summary": "The inner light that guides us through periods of solitude and seeking.",
        "interpretation": "The Lantern invites you into a period of solitary reflection.",
        "reversed_interpretation": "Reversed, The Lantern may indicate isolation becoming harmful.",
        "symbols": ["lantern", "mountain", "walking staff"],
        "element": "Earth",
        "affirmation": "I carry my own light into the darkness.",
        "questions": ["What solitude am I being called to?", "What is my inner light showing me?"],
        "sort_order": 9
      },
      {
        "id": "sm-10",
        "name": "The Wheel",
        "number": 10,
        "arcana": "major",
        "keywords": ["cycles", "fate", "change", "turning points"],
        "summary": "The eternal dance of change, reminding us that nothing stays the same.",
        "interpretation": "The Wheel reminds you that you are part of larger cycles - personal, collective, cosmic.",
        "reversed_interpretation": "Reversed, The Wheel may indicate resistance to change or feeling stuck.",
        "symbols": ["wheel", "four directions", "sphinx"],
        "element": "Fire",
        "affirmation": "I surrender to the wisdom of lifes cycles.",
        "questions": ["Where am I in the cycle?", "What am I resisting?"],
        "sort_order": 10
      },
      {
        "id": "sm-11",
        "name": "The Mirror",
        "number": 11,
        "arcana": "major",
        "keywords": ["truth", "balance", "karma", "clarity"],
        "summary": "The unflinching reflection that shows us exactly where we stand.",
        "interpretation": "The Mirror asks you to see clearly, without the distortions of wishful thinking or denial.",
        "reversed_interpretation": "Reversed, The Mirror may indicate injustice or dishonesty.",
        "symbols": ["scales", "sword", "blindfold removed"],
        "element": "Air",
        "affirmation": "I see myself and my situation clearly, with compassion and honesty.",
        "questions": ["What truth am I avoiding?", "Where is balance needed?"],
        "sort_order": 11
      },
      {
        "id": "sm-12",
        "name": "The Pause",
        "number": 12,
        "arcana": "major",
        "keywords": ["surrender", "new perspective", "waiting", "sacrifice"],
        "summary": "The sacred stillness that allows us to see everything differently.",
        "interpretation": "The Pause invites you to stop trying, stop pushing, stop doing - and simply be.",
        "reversed_interpretation": "Reversed, The Pause may indicate stalling or martyrdom.",
        "symbols": ["suspension", "halo", "crossed legs"],
        "element": "Water",
        "affirmation": "I surrender to the wisdom of not-doing.",
        "questions": ["What would happen if I stopped trying so hard?", "What am I being asked to sacrifice?"],
        "sort_order": 12
      },
      {
        "id": "sm-13",
        "name": "The Release",
        "number": 13,
        "arcana": "major",
        "keywords": ["transformation", "ending", "letting go", "rebirth"],
        "summary": "The necessary endings that make space for new life.",
        "interpretation": "The Release is not about literal death but about the deaths we experience throughout life.",
        "reversed_interpretation": "Reversed, The Release may indicate resistance to necessary endings.",
        "symbols": ["skeleton", "sunrise", "fallen petals"],
        "element": "Water",
        "affirmation": "I release what has ended so new life can begin.",
        "questions": ["What is ready to die in my life?", "What new life is waiting to be born?"],
        "sort_order": 13
      },
      {
        "id": "sm-14",
        "name": "The Flow",
        "number": 14,
        "arcana": "major",
        "keywords": ["balance", "patience", "alchemy", "moderation"],
        "summary": "The art of blending opposites into something greater than either.",
        "interpretation": "The Flow represents the middle path, the integration of extremes.",
        "reversed_interpretation": "Reversed, The Flow may indicate imbalance or impatience.",
        "symbols": ["two cups", "water and fire", "one foot in each world"],
        "element": "Fire",
        "affirmation": "I blend all parts of myself into harmonious flow.",
        "questions": ["Where do I need more balance?", "What extremes need to be integrated?"],
        "sort_order": 14
      },
      {
        "id": "sm-15",
        "name": "The Shadow",
        "number": 15,
        "arcana": "major",
        "keywords": ["shadow self", "bondage", "illusion", "hidden forces"],
        "summary": "The parts of ourselves we have exiled that still run the show.",
        "interpretation": "The Shadow asks you to look at what you have hidden from yourself.",
        "reversed_interpretation": "Reversed, The Shadow may indicate breaking free from bondage.",
        "symbols": ["chains", "mask", "hidden figure"],
        "element": "Earth",
        "affirmation": "I embrace my shadow as a source of hidden wisdom and power.",
        "questions": ["What have I disowned in myself?", "What power lies in my shadow?"],
        "sort_order": 15
      },
      {
        "id": "sm-16",
        "name": "The Storm",
        "number": 16,
        "arcana": "major",
        "keywords": ["breakthrough", "destruction", "revelation", "liberation"],
        "summary": "The lightning strike that destroys false structures to reveal truth.",
        "interpretation": "The Storm represents sudden, dramatic change that shatters what was built on false foundations.",
        "reversed_interpretation": "Reversed, The Storm may indicate fear of necessary change.",
        "symbols": ["lightning", "falling tower", "open sky"],
        "element": "Fire",
        "affirmation": "I welcome the storms that set me free from false structures.",
        "questions": ["What false structure is ready to fall?", "How can I surrender to necessary destruction?"],
        "sort_order": 16
      },
      {
        "id": "sm-17",
        "name": "The Spring",
        "number": 17,
        "arcana": "major",
        "keywords": ["hope", "healing", "inspiration", "renewal"],
        "summary": "The eternal source that replenishes the soul after the storm.",
        "interpretation": "The Spring appears after crisis, bringing healing waters and renewed hope.",
        "reversed_interpretation": "Reversed, The Spring may indicate blocked hope or neglected self-care.",
        "symbols": ["water pouring", "stars", "naked vulnerability"],
        "element": "Air",
        "affirmation": "I drink from the eternal spring of hope and healing.",
        "questions": ["What replenishes my soul?", "Am I allowing myself to heal?"],
        "sort_order": 17
      },
      {
        "id": "sm-18",
        "name": "The Deep",
        "number": 18,
        "arcana": "major",
        "keywords": ["illusion", "fear", "the unconscious", "dreams"],
        "summary": "The mysterious depths where fears and gifts swim together.",
        "interpretation": "The Deep invites you into the unconscious waters where things are not as they seem.",
        "reversed_interpretation": "Reversed, The Deep may indicate emerging clarity or deeper confusion.",
        "symbols": ["moon", "water", "path between two pillars"],
        "element": "Water",
        "affirmation": "I navigate the mysterious depths with my inner knowing as my guide.",
        "questions": ["What fears are distorting my perception?", "What lies in the depths I have not explored?"],
        "sort_order": 18
      },
      {
        "id": "sm-19",
        "name": "The Radiance",
        "number": 19,
        "arcana": "major",
        "keywords": ["joy", "vitality", "clarity", "success"],
        "summary": "The brilliant light of conscious awareness illuminating everything.",
        "interpretation": "The Radiance brings warmth, clarity, and the simple joy of being alive.",
        "reversed_interpretation": "Reversed, The Radiance may indicate dimmed joy or false positivity.",
        "symbols": ["sun", "child", "garden wall"],
        "element": "Fire",
        "affirmation": "I shine with the joy of being fully alive.",
        "questions": ["Where is authentic joy available to me?", "What dims my natural radiance?"],
        "sort_order": 19
      },
      {
        "id": "sm-20",
        "name": "The Awakening",
        "number": 20,
        "arcana": "major",
        "keywords": ["calling", "rebirth", "judgment", "purpose"],
        "summary": "The cosmic call to rise up and fulfill your souls purpose.",
        "interpretation": "The Awakening represents the moment of hearing your calling clearly.",
        "reversed_interpretation": "Reversed, The Awakening may indicate a call you are ignoring.",
        "symbols": ["trumpet", "rising figures", "open coffins"],
        "element": "Fire",
        "affirmation": "I hear my souls calling and I rise to answer it.",
        "questions": ["What is my soul calling me to become?", "What part of me is ready to rise?"],
        "sort_order": 20
      },
      {
        "id": "sm-21",
        "name": "The Completion",
        "number": 21,
        "arcana": "major",
        "keywords": ["wholeness", "integration", "fulfillment", "the end and beginning"],
        "summary": "The dance of completed integration, holding all parts in dynamic harmony.",
        "interpretation": "The Completion represents the fulfillment of the souls journey.",
        "reversed_interpretation": "Reversed, The Completion may indicate unfinished business.",
        "symbols": ["wreath", "dancing figure", "four corners"],
        "element": "Earth",
        "affirmation": "I celebrate the wholeness of my journey, complete in this moment.",
        "questions": ["What cycle is completing?", "How am I whole right now?"],
        "sort_order": 21
      }
    ]
  }'::jsonb,
  NOW(),
  NOW()
);

-- Note: If you need to update instead of insert, first delete the old deck:
-- DELETE FROM user_documents WHERE document_type = 'tarot_deck' AND document_data->>'name' = 'Soul Mirrors Tarot';

-- Verify the insert
SELECT id, document_type, is_public,
       document_data->>'name' as deck_name,
       document_data->>'card_count' as card_count
FROM user_documents
WHERE document_type = 'tarot_deck';
