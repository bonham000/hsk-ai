import sentencesLevel1 from "~/content/sentences/level-1.json";
import sentencesLevel2 from "~/content/sentences/level-2.json";
import sentencesLevel3 from "~/content/sentences/level-3.json";
import sentencesLevel4 from "~/content/sentences/level-4.json";
import sentencesLevel5 from "~/content/sentences/level-5.json";
import sentencesLevel6 from "~/content/sentences/level-6.json";
import type HskLevel from "~/types/HskLevel";
import { type SentenceMap } from "~/types/SentenceMap";

export const sentenceMapLevel1: SentenceMap = sentencesLevel1;
export const sentenceMapLevel2: SentenceMap = sentencesLevel2;
export const sentenceMapLevel3: SentenceMap = sentencesLevel3;
export const sentenceMapLevel4: SentenceMap = sentencesLevel4;
export const sentenceMapLevel5: SentenceMap = sentencesLevel5;
export const sentenceMapLevel6: SentenceMap = sentencesLevel6;

export const HSK_SENTENCE_MAP: Record<HskLevel, SentenceMap> = {
  1: sentenceMapLevel1,
  2: sentenceMapLevel2,
  3: sentenceMapLevel3,
  4: sentenceMapLevel4,
  5: sentenceMapLevel5,
  6: sentenceMapLevel6,
};

export const HSK_SENTENCE_LIST = Object.values(HSK_SENTENCE_MAP);

export const ALL_HSK_SENTENCES = HSK_SENTENCE_LIST.flat();
