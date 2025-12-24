// I Ching Core Casting Logic
// Implements the three-coin method for casting hexagrams

import {
  Coin,
  CoinToss,
  Line,
  HexagramReading,
  HexagramData,
  KING_WEN_SEQUENCE,
  HEXAGRAM_TO_BINARY,
} from '@/types/iching.types';
import { getHexagramByNumber } from './hexagram-lookup';

/**
 * Simulate a single coin toss
 * Heads = 3 (yang value), Tails = 2 (yin value)
 */
function tossCoin(): Coin {
  const isHeads = Math.random() < 0.5;
  return {
    isHeads,
    value: isHeads ? 3 : 2,
  };
}

/**
 * Toss three coins and calculate the sum
 * Sum determines the line type:
 * - 6 (2+2+2): Old Yin (changing) - yin that becomes yang
 * - 7 (2+2+3): Young Yang (stable)
 * - 8 (2+3+3): Young Yin (stable)
 * - 9 (3+3+3): Old Yang (changing) - yang that becomes yin
 */
function tossThreeCoins(): CoinToss {
  const coins: [Coin, Coin, Coin] = [tossCoin(), tossCoin(), tossCoin()];
  const sum = (coins[0].value + coins[1].value + coins[2].value) as 6 | 7 | 8 | 9;
  return { coins, sum };
}

/**
 * Determine line properties from the coin toss sum
 */
function getLineFromSum(sum: 6 | 7 | 8 | 9): {
  type: 'yin' | 'yang';
  isChanging: boolean;
  symbol: '———' | '— —';
  changingSymbol?: '——○——' | '—×—';
} {
  switch (sum) {
    case 6: // Old Yin - changing (becomes yang)
      return {
        type: 'yin',
        isChanging: true,
        symbol: '— —',
        changingSymbol: '—×—',
      };
    case 7: // Young Yang - stable
      return {
        type: 'yang',
        isChanging: false,
        symbol: '———',
      };
    case 8: // Young Yin - stable
      return {
        type: 'yin',
        isChanging: false,
        symbol: '— —',
      };
    case 9: // Old Yang - changing (becomes yin)
      return {
        type: 'yang',
        isChanging: true,
        symbol: '———',
        changingSymbol: '——○——',
      };
  }
}

/**
 * Cast a single line (one of six in a hexagram)
 */
function castLine(position: 1 | 2 | 3 | 4 | 5 | 6): Line {
  const toss = tossThreeCoins();
  const lineProps = getLineFromSum(toss.sum);

  return {
    position,
    toss,
    ...lineProps,
  };
}

/**
 * Convert an array of 6 lines to a binary string
 * Lines are ordered bottom-to-top (index 0 = line 1 = bottom)
 * Yang = 1, Yin = 0
 */
function linesToBinary(lines: Line[]): string {
  return lines.map((line) => (line.type === 'yang' ? '1' : '0')).join('');
}

/**
 * Get the hexagram number from lines
 */
function getHexagramNumber(lines: Line[]): number {
  const binary = linesToBinary(lines);
  const hexNumber = KING_WEN_SEQUENCE[binary];
  if (!hexNumber) {
    throw new Error(`Invalid binary pattern: ${binary}`);
  }
  return hexNumber;
}

/**
 * Calculate the transformed hexagram (after changing lines flip)
 */
function getTransformedLines(lines: Line[]): Line[] {
  return lines.map((line) => {
    if (!line.isChanging) return line;

    // Flip the line type
    const newType = line.type === 'yin' ? 'yang' : 'yin';
    return {
      ...line,
      type: newType,
      isChanging: false, // Transformed lines are stable
      symbol: newType === 'yang' ? '———' : '— —',
      changingSymbol: undefined,
    };
  });
}

/**
 * Cast a complete hexagram reading
 * @param question - The question being asked of the oracle
 * @returns A complete HexagramReading object
 */
export async function castHexagram(question: string): Promise<HexagramReading> {
  // Cast 6 lines (bottom to top)
  const lines: Line[] = [
    castLine(1),
    castLine(2),
    castLine(3),
    castLine(4),
    castLine(5),
    castLine(6),
  ];

  // Identify changing lines
  const changingLines = lines
    .filter((line) => line.isChanging)
    .map((line) => line.position);

  // Get primary hexagram number and data
  const primaryHexagramNumber = getHexagramNumber(lines);
  const primaryHexagram = await getHexagramByNumber(primaryHexagramNumber);

  // Calculate transformed hexagram if there are changing lines
  let transformedHexagram: HexagramData | null = null;
  if (changingLines.length > 0) {
    const transformedLines = getTransformedLines(lines);
    const transformedHexagramNumber = getHexagramNumber(transformedLines);
    transformedHexagram = await getHexagramByNumber(transformedHexagramNumber);
  }

  return {
    question,
    lines,
    primaryHexagram,
    changingLines,
    transformedHexagram,
    timestamp: new Date(),
  };
}

/**
 * Create a reading from saved data (for loading from database)
 */
export async function reconstructReading(
  question: string,
  lineData: Array<{ position: number; value: number; type: 'yin' | 'yang'; isChanging: boolean }>,
  primaryHexagramNumber: number,
  transformedHexagramNumber: number | null,
  changingLines: number[],
  timestamp: Date
): Promise<HexagramReading> {
  const lines: Line[] = lineData.map((ld) => ({
    position: ld.position as 1 | 2 | 3 | 4 | 5 | 6,
    toss: {
      coins: [
        { isHeads: false, value: 2 },
        { isHeads: false, value: 2 },
        { isHeads: false, value: 2 },
      ],
      sum: ld.value as 6 | 7 | 8 | 9,
    },
    type: ld.type,
    isChanging: ld.isChanging,
    symbol: ld.type === 'yang' ? '———' : '— —',
    changingSymbol: ld.isChanging
      ? ld.type === 'yang'
        ? '——○——'
        : '—×—'
      : undefined,
  }));

  const primaryHexagram = await getHexagramByNumber(primaryHexagramNumber);
  const transformedHexagram = transformedHexagramNumber
    ? await getHexagramByNumber(transformedHexagramNumber)
    : null;

  return {
    question,
    lines,
    primaryHexagram,
    changingLines,
    transformedHexagram,
    timestamp,
  };
}

/**
 * Get the binary representation for a hexagram number
 */
export function getBinaryForHexagram(hexagramNumber: number): string {
  return HEXAGRAM_TO_BINARY[hexagramNumber] || '';
}

/**
 * Generate a visual representation of the hexagram
 */
export function renderHexagramText(lines: Line[], showChanging: boolean = true): string {
  // Display from top (line 6) to bottom (line 1)
  const renderedLines = [...lines].reverse().map((line) => {
    if (showChanging && line.isChanging && line.changingSymbol) {
      return line.changingSymbol;
    }
    return line.symbol;
  });

  return renderedLines.join('\n');
}

/**
 * Get line position names (Chinese traditional naming)
 */
export function getLinePositionName(position: number, type: 'yin' | 'yang'): string {
  const yangNames = ['初九', '九二', '九三', '九四', '九五', '上九'];
  const yinNames = ['初六', '六二', '六三', '六四', '六五', '上六'];

  const names = type === 'yang' ? yangNames : yinNames;
  return names[position - 1] || '';
}
