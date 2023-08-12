type WordKey = string;

type Sentences = {
  "gpt-4": string[];
  "gpt-3.5-turbo": string[];
};

export type Model = keyof Sentences;

export type SentenceMap = Record<WordKey, Sentences>;
