export type WordKey = string;

export type ModelSentences = {
  "gpt-3.5-turbo": string[];
  "gpt-4": string[];
};

export type Model = keyof ModelSentences;

export type SentenceMap = Record<WordKey, ModelSentences>;
