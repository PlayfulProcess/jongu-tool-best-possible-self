// I Ching AI Prompt Builder
// Constructs system prompts for AI interpretation of I Ching readings

import { HexagramReading, HexagramData, Line } from '@/types/iching.types';
import { getLinePositionName } from './iching';

/**
 * Build the system prompt for an I Ching reading consultation
 */
export function buildIChingSystemPrompt(
  reading: HexagramReading,
  journalContent?: string
): string {
  const { question, primaryHexagram, changingLines, transformedHexagram, lines } = reading;

  // Build changing lines section
  const changingLinesText = buildChangingLinesSection(lines, primaryHexagram, changingLines);

  // Build transformation section
  const transformationText = buildTransformationSection(transformedHexagram);

  return `You are a wise and compassionate I Ching oracle assistant. You help users understand their I Ching readings and apply the ancient wisdom to their modern lives.

CONTEXT FOR THIS READING:

USER'S QUESTION:
"${question}"

PRIMARY HEXAGRAM (#${primaryHexagram.number} - ${primaryHexagram.english_name} / ${primaryHexagram.chinese_name} ${primaryHexagram.pinyin}):
${primaryHexagram.unicode}

The Judgment: ${primaryHexagram.judgment}

The Image: ${primaryHexagram.image}

Overall Meaning: ${primaryHexagram.meaning}
${changingLinesText}
${transformationText}

USER'S JOURNAL REFLECTION:
${journalContent || '(No reflection written yet)'}

---

YOUR ROLE:
- Help the user understand how this reading applies to their question
- Explain symbolism and imagery in accessible terms
- Be supportive but honest - I Ching readings can contain warnings
- Connect ancient wisdom to modern situations
- If the user asks about specific lines, provide detailed interpretation
- Encourage self-reflection rather than giving prescriptive advice
- Remember: the I Ching offers guidance, not fortune-telling
- The changing lines are especially significant - they show the dynamic aspect of the situation

INTERPRETATION APPROACH:
1. Consider the overall energy of the hexagram
2. Pay special attention to changing lines - they indicate where transformation is occurring
3. If there's a transformed hexagram, it shows where the situation is heading
4. Connect the imagery (dragons, mountains, water, etc.) to practical situations
5. Honor the philosophical depth while making it accessible

TONE:
- Wise and contemplative
- Compassionate but grounded
- Respectful of the tradition
- Non-dogmatic - there are multiple valid interpretations
- Encouraging of the user's own insight

Format your responses with clear paragraph breaks for readability.`;
}

/**
 * Build the section describing changing lines
 */
function buildChangingLinesSection(
  lines: Line[],
  hexagram: HexagramData,
  changingLines: number[]
): string {
  if (changingLines.length === 0) {
    return '\nCHANGING LINES:\nNo changing lines in this reading. The situation described is relatively stable.';
  }

  const lineDescriptions = changingLines.map((lineNum) => {
    const line = lines[lineNum - 1];
    const positionName = getLinePositionName(lineNum, line.type);
    const lineText = hexagram.lines[lineNum as keyof typeof hexagram.lines];

    return `Line ${lineNum} (${positionName}): ${lineText}
   - This is a ${line.type === 'yang' ? 'yang (solid)' : 'yin (broken)'} line that is changing
   - It will transform into ${line.type === 'yang' ? 'yin' : 'yang'}`;
  });

  return `

CHANGING LINES (these are especially significant):
${lineDescriptions.join('\n\n')}`;
}

/**
 * Build the section describing the transformed hexagram
 */
function buildTransformationSection(transformedHexagram: HexagramData | null): string {
  if (!transformedHexagram) {
    return '';
  }

  return `

TRANSFORMED HEXAGRAM (#${transformedHexagram.number} - ${transformedHexagram.english_name} / ${transformedHexagram.chinese_name}):
${transformedHexagram.unicode}

The changing lines indicate this situation will evolve into:
- Judgment: ${transformedHexagram.judgment}
- Image: ${transformedHexagram.image}
- Meaning: ${transformedHexagram.meaning}

The transformation from ${transformedHexagram.number === 1 ? 'the current hexagram' : 'Hexagram ' + transformedHexagram.number} shows the direction of change.`;
}

/**
 * Build a concise summary of the reading for display
 */
export function buildReadingSummary(reading: HexagramReading): string {
  const { primaryHexagram, changingLines, transformedHexagram } = reading;

  let summary = `Hexagram ${primaryHexagram.number}: ${primaryHexagram.english_name} (${primaryHexagram.chinese_name})`;

  if (changingLines.length > 0) {
    summary += `\nChanging lines: ${changingLines.join(', ')}`;
  }

  if (transformedHexagram) {
    summary += `\n→ Transforms to: Hexagram ${transformedHexagram.number}: ${transformedHexagram.english_name}`;
  }

  return summary;
}

/**
 * Build prompt for asking about a specific line
 */
export function buildLineQuestionPrompt(
  reading: HexagramReading,
  lineNumber: number
): string {
  const line = reading.lines[lineNumber - 1];
  const lineText = reading.primaryHexagram.lines[lineNumber as keyof typeof reading.primaryHexagram.lines];
  const positionName = getLinePositionName(lineNumber, line.type);

  return `The user is asking about Line ${lineNumber} (${positionName}) of their reading.

Line text: "${lineText}"

This line is ${line.type === 'yang' ? 'solid (yang)' : 'broken (yin)'} and ${
    line.isChanging ? 'IS changing (this is significant!)' : 'is not changing'
  }.

In the context of their question "${reading.question}", help them understand what this line means for their situation.`;
}

/**
 * Build a prompt for comparing primary and transformed hexagrams
 */
export function buildTransformationPrompt(reading: HexagramReading): string {
  if (!reading.transformedHexagram) {
    return 'There is no transformation in this reading as there are no changing lines.';
  }

  return `The user wants to understand the transformation in their reading.

FROM: Hexagram ${reading.primaryHexagram.number} - ${reading.primaryHexagram.english_name}
TO: Hexagram ${reading.transformedHexagram.number} - ${reading.transformedHexagram.english_name}

The changing lines (${reading.changingLines.join(', ')}) show where movement and transformation are occurring.

Help them understand:
1. What is the current situation (primary hexagram)?
2. What is it evolving toward (transformed hexagram)?
3. What do the changing lines reveal about HOW this transformation happens?
4. How does this journey relate to their question: "${reading.question}"`;
}

/**
 * Build a greeting/introduction for the AI assistant
 */
export function buildInitialGreeting(reading: HexagramReading): string {
  const { primaryHexagram, changingLines, transformedHexagram } = reading;

  let greeting = `I see you've cast ${primaryHexagram.unicode} **Hexagram ${primaryHexagram.number}: ${primaryHexagram.english_name}** (${primaryHexagram.chinese_name}, ${primaryHexagram.pinyin}).`;

  if (changingLines.length > 0) {
    greeting += ` You have ${changingLines.length} changing line${changingLines.length > 1 ? 's' : ''} at position${changingLines.length > 1 ? 's' : ''} ${changingLines.join(', ')}.`;
  } else {
    greeting += ' There are no changing lines, suggesting a stable situation.';
  }

  if (transformedHexagram) {
    greeting += ` This reading transforms into **Hexagram ${transformedHexagram.number}: ${transformedHexagram.english_name}**, showing where your situation is heading.`;
  }

  greeting += '\n\nHow can I help you understand this reading in relation to your question?';

  return greeting;
}
