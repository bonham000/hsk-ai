export type WordKey = string;

export type ModelSentences = {
  "gpt-4": string[];
  "gpt-3.5-turbo": string[];
};

export type Model = keyof ModelSentences;

export type SentenceMap = Record<WordKey, ModelSentences>;
