import { z } from "zod";

export type WordKey = string;

export const GeneratedSentence = z.object({
  chinese: z.string(),
  english: z.string(),
  pinyin: z.string(),
});

export type GeneratedSentenceType = z.infer<typeof GeneratedSentence>;

export type ModelSentences = {
  "gpt-3.5-turbo": GeneratedSentenceType[];
  "gpt-4": GeneratedSentenceType[];
};

export type Model = keyof ModelSentences;

export type SentenceMap = Record<WordKey, ModelSentences>;
