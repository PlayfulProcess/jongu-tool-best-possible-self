// I Ching Type Definitions

export interface Trigram {
  name: string;      // e.g., "Heaven", "Earth", "Thunder"
  chinese: string;   // e.g., "乾", "坤", "震"
}

export interface HexagramData {
  number: number;           // 1-64
  chinese_name: string;     // e.g., "乾"
  pinyin: string;           // e.g., "Qián"
  english_name: string;     // e.g., "The Creative"
  binary: string;           // 6 chars, bottom-to-top, 1=yang, 0=yin (e.g., "111111")
  unicode: string;          // Hexagram symbol (䷀ through ䷿)
  trigram_above: Trigram;
  trigram_below: Trigram;
  judgment: string;         // The Judgment text
  image: string;            // The Image text
  lines: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
  };
  meaning: string;          // Brief overall interpretation
}

export interface Coin {
  isHeads: boolean;
  value: 2 | 3;  // Tails = 2, Heads = 3
}

export interface CoinToss {
  coins: [Coin, Coin, Coin];
  sum: 6 | 7 | 8 | 9;
}

export interface Line {
  position: 1 | 2 | 3 | 4 | 5 | 6;
  toss: CoinToss;
  type: 'yin' | 'yang';
  isChanging: boolean;
  // Visual representation
  symbol: '———' | '— —';  // Solid or broken
  changingSymbol?: '——○——' | '—×—';  // Old yang (○) or old yin (×)
}

export interface HexagramReading {
  id?: string;
  question: string;
  lines: Line[];                    // 6 lines, index 0 = bottom (line 1)
  primaryHexagram: HexagramData;
  changingLines: number[];          // Which line positions (1-6) are changing
  transformedHexagram: HexagramData | null;  // null if no changing lines
  timestamp: Date;
}

export interface IChingSession {
  id: string;
  oderId: string;
  reading: HexagramReading;
  journalContent: string;
  chatMessages: IChingChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  researchConsent: boolean;
}

export interface IChingChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Document data structure for user_documents table
export interface IChingDocumentData {
  title: string;
  question: string;
  reading: {
    lines: Array<{
      position: number;
      value: number;  // 6, 7, 8, or 9
      type: 'yin' | 'yang';
      isChanging: boolean;
    }>;
    primaryHexagram: number;        // Hexagram number 1-64
    transformedHexagram: number | null;
    changingLines: number[];
    castTimestamp: string;
  };
  journalContent: string;
  tool_name: 'I Ching Reader';
  research_consent: boolean;
}

// King Wen sequence: maps binary representation to hexagram number
// Binary is read bottom-to-top: line1 line2 line3 line4 line5 line6
// 1 = yang (solid), 0 = yin (broken)
export const KING_WEN_SEQUENCE: Record<string, number> = {
  '111111': 1,   // ䷀ Qian - The Creative
  '000000': 2,   // ䷁ Kun - The Receptive
  '100010': 3,   // ䷂ Zhun - Difficulty at the Beginning
  '010001': 4,   // ䷃ Meng - Youthful Folly
  '111010': 5,   // ䷄ Xu - Waiting
  '010111': 6,   // ䷅ Song - Conflict
  '010000': 7,   // ䷆ Shi - The Army
  '000010': 8,   // ䷇ Bi - Holding Together
  '111011': 9,   // ䷈ Xiao Chu - Small Taming
  '110111': 10,  // ䷉ Lu - Treading
  '111000': 11,  // ䷊ Tai - Peace
  '000111': 12,  // ䷋ Pi - Standstill
  '101111': 13,  // ䷌ Tong Ren - Fellowship
  '111101': 14,  // ䷍ Da You - Great Possession
  '001000': 15,  // ䷎ Qian - Modesty
  '000100': 16,  // ䷏ Yu - Enthusiasm
  '100110': 17,  // ䷐ Sui - Following
  '011001': 18,  // ䷑ Gu - Work on the Decayed
  '110000': 19,  // ䷒ Lin - Approach
  '000011': 20,  // ䷓ Guan - Contemplation
  '100101': 21,  // ䷔ Shi He - Biting Through
  '101001': 22,  // ䷕ Bi - Grace
  '000001': 23,  // ䷖ Bo - Splitting Apart
  '100000': 24,  // ䷗ Fu - Return
  '100111': 25,  // ䷘ Wu Wang - Innocence
  '111001': 26,  // ䷙ Da Chu - Great Taming
  '100001': 27,  // ䷚ Yi - Nourishment
  '011110': 28,  // ䷛ Da Guo - Great Exceeding
  '010010': 29,  // ䷜ Kan - The Abysmal Water
  '101101': 30,  // ䷝ Li - The Clinging Fire
  '001110': 31,  // ䷞ Xian - Influence
  '011100': 32,  // ䷟ Heng - Duration
  '001111': 33,  // ䷠ Dun - Retreat
  '111100': 34,  // ䷡ Da Zhuang - Great Power
  '000101': 35,  // ䷢ Jin - Progress
  '101000': 36,  // ䷣ Ming Yi - Darkening of the Light
  '101011': 37,  // ䷤ Jia Ren - The Family
  '110101': 38,  // ䷥ Kui - Opposition
  '001010': 39,  // ䷦ Jian - Obstruction
  '010100': 40,  // ䷧ Xie - Deliverance
  '110001': 41,  // ䷨ Sun - Decrease
  '100011': 42,  // ䷩ Yi - Increase
  '111110': 43,  // ䷪ Guai - Breakthrough
  '011111': 44,  // ䷫ Gou - Coming to Meet
  '000110': 45,  // ䷬ Cui - Gathering Together
  '011000': 46,  // ䷭ Sheng - Pushing Upward
  '010110': 47,  // ䷮ Kun - Oppression
  '011010': 48,  // ䷯ Jing - The Well
  '101110': 49,  // ䷰ Ge - Revolution
  '011101': 50,  // ䷱ Ding - The Cauldron
  '100100': 51,  // ䷲ Zhen - The Arousing Thunder
  '001001': 52,  // ䷳ Gen - Keeping Still Mountain
  '001011': 53,  // ䷴ Jian - Development
  '110100': 54,  // ䷵ Gui Mei - The Marrying Maiden
  '101100': 55,  // ䷶ Feng - Abundance
  '001101': 56,  // ䷷ Lu - The Wanderer
  '011011': 57,  // ䷸ Xun - The Gentle Wind
  '110110': 58,  // ䷹ Dui - The Joyous Lake
  '010011': 59,  // ䷺ Huan - Dispersion
  '110010': 60,  // ䷻ Jie - Limitation
  '110011': 61,  // ䷼ Zhong Fu - Inner Truth
  '001100': 62,  // ䷽ Xiao Guo - Small Exceeding
  '101010': 63,  // ䷾ Ji Ji - After Completion
  '010101': 64,  // ䷿ Wei Ji - Before Completion
};

// Reverse lookup: hexagram number to binary
export const HEXAGRAM_TO_BINARY: Record<number, string> = Object.fromEntries(
  Object.entries(KING_WEN_SEQUENCE).map(([binary, num]) => [num, binary])
);
