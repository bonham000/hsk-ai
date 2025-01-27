import { execSync } from "child_process";
import "dotenv/config";
import { readFileSync, writeFileSync } from "fs";
import { Configuration, OpenAIApi } from "openai";
import { HSK_MAP } from "~/content/hsk";
import type HskLevel from "~/types/HskLevel";
import {
  type SentenceMap,
  type Model,
  type GeneratedSentenceType,
  GeneratedSentence,
} from "~/types/SentenceMap";
import shuffleArray from "~/utils/shuffleArray";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

function generateStarterPrompt(word: string, seenWords: string[]) {
  const PROMPT = `
  You are an experienced Chinese tutor helping someone learn Chinese. We are
  using the HSK vocabulary lists focusing on learning new vocabulary. I will
  provide a HSK new word and your job is to produce 5 example sentences using
  that word. For now, we are just starting at with HSK Level 1, so try to only
  use vocabulary from that level or other very simple vocabulary. If you have
  to include other words that is fine, but the goal is for the sentences to be
  representative of normal Chinese, varied, and easily readable.

  As we progress through the vocabulary list, feel free to re-introduce some
  words that have already been seen. Here are some words we've seen so far:
  ${seenWords.join(", ")}. However, only do this occasionally.
  
  Finally, could you structure your response as JSON, e.g.

  Input: 保護
  Output:
  [
    {
      chinese: "父母要保護他們的孩子。",
      pinyin: "Parents want to protect their children.",
      english: "Fùmǔ yào bǎohù tāmen de háizi."
    },
    ... etc.
  ]

  The output should ONLY contain the raw JSON array of strings. It must be a
  valid JSON array of strings.

  Also, please write in traditional Chinese characters.

  Ok, let's begin! The current word is: ${word}
  `;

  return PROMPT;
}

function generateIntermediatePrompt(
  word: string,
  seenWords: string[],
  hskLevel: number
) {
  const PROMPT = `
  You are an experienced Chinese tutor helping someone learn Chinese. We are
  using the HSK vocabulary lists focusing on learning new vocabulary. I will
  provide a HSK new word and your job is to produce 5 example sentences using
  that word. For now, we are targeting HSK Level ${hskLevel}. Please try to compose the
  example sentences of only words from HSK levels below ${hskLevel} and the target word.
  If you have to include other words that is fine, but the goal is for the
  sentences to be representative of normal Chinese, varied, and easily readable.

  As we progress through the vocabulary list, feel free to re-introduce some
  HSK Level 4 words that have already been seen. Here are some words we've seen
  so far: ${seenWords.join(", ")}. However, only do this occasionally.
  
  Finally, could you structure your response as JSON, e.g.

  Input: 保護
  Output:
  [
    {
      chinese: "父母要保護他們的孩子。",
      pinyin: "Parents want to protect their children.",
      english: "Fùmǔ yào bǎohù tāmen de háizi."
    },
    ... etc.
  ]

  The output should ONLY contain the raw JSON array of strings. It must be a
  valid JSON array of strings.

  Also, please write in traditional Chinese characters.

  Ok, let's begin! The current word is: ${word}
  `;

  return PROMPT;
}

function updateWordInSentenceMap({
  model,
  sentenceMap,
  sentences,
  word,
}: {
  model: Model;
  sentenceMap: SentenceMap;
  sentences: GeneratedSentenceType[];
  word: string;
}) {
  const existing = sentenceMap[word];
  if (existing != null) {
    const existingModel = existing[model];
    if (existingModel != null) {
      existingModel.push(...sentences);
    } else {
      existing[model] = sentences;
    }
  } else {
    sentenceMap[word] = {
      "gpt-3.5-turbo": model === "gpt-3.5-turbo" ? sentences : [],
      "gpt-4": model === "gpt-4" ? sentences : [],
    };
  }
}

function wordExistsAlready({
  model,
  sentenceMap,
  word,
}: {
  model: Model;
  sentenceMap: SentenceMap;
  word: string;
}) {
  const existingWord = sentenceMap[word];
  if (existingWord != null) {
    const existingSentences = existingWord[model];
    return existingSentences != null;
  }

  return false;
}

async function generateSentences(
  word: string,
  seenWords: string[],
  hskLevel: number
): Promise<GeneratedSentenceType[]> {
  const seenWordsSlice = shuffleArray(seenWords).slice(0, 25);
  const prompt =
    hskLevel === 1
      ? generateStarterPrompt(word, seenWordsSlice)
      : generateIntermediatePrompt(word, seenWordsSlice, hskLevel);
  const completion = await openai.createChatCompletion({
    messages: [{ content: prompt, role: "user" }],
    model: "gpt-3.5-turbo",
  });
  const json = completion.data.choices[0]?.message?.content ?? "";
  const parsed = JSON.parse(json) as GeneratedSentenceType[];
  return parsed.map((val) => GeneratedSentence.parse(val));
}

async function generateSentencesForWord(
  word: string,
  seenWords: string[],
  sentenceMap: SentenceMap,
  hskLevel: number
): Promise<void> {
  try {
    let generatedSentences = [];
    try {
      generatedSentences = await generateSentences(word, seenWords, hskLevel);
    } catch (err) {
      console.warn("Something failed in the first generation. Trying again.");
      generatedSentences = await generateSentences(word, seenWords, hskLevel);
    }

    updateWordInSentenceMap({
      model: "gpt-3.5-turbo",
      sentenceMap,
      sentences: generatedSentences,
      word,
    });
  } catch (error) {
    console.info("An error occurred:");
    if (error.response) {
      console.info(error.response.status);
      console.info(error.response.data);
    } else {
      console.info(error.message);
    }
  }
}

const HSK_LEVEL: HskLevel = 6;
const WORD_LIMIT = 25;
const hsk = HSK_MAP[HSK_LEVEL];
const { level } = hsk;
const words = hsk.words.slice(0, WORD_LIMIT);
const seenWords: string[] = [];

async function run() {
  console.info(`Running sentence generation for HSK level ${HSK_LEVEL}.`);
  console.info(`Generating sentences for ${WORD_LIMIT} words.`);
  console.info("");

  const filepath = `src/chinese/sentences/level-${level}.json`;
  const sentenceMap = JSON.parse(
    readFileSync(filepath, "utf-8")
  ) as SentenceMap;

  for (let i = 0; i < words.length; i++) {
    const wordEntry = words[i]!;
    const word = wordEntry.traditional;

    if (wordExistsAlready({ model: "gpt-3.5-turbo", sentenceMap, word })) {
      console.info(`- Skipping ${word}.`);
      seenWords.push(word);
      continue;
    }

    console.info(`- Current word = ${word} (${i + 1} out of ${words.length}).`);
    await generateSentencesForWord(word, seenWords, sentenceMap, level);
    seenWords.push(word);
  }

  console.info("");
  console.info(
    `A total of ${words.length} out of ${hsk.words.length} have been generated.`
  );

  writeFileSync(filepath, JSON.stringify(sentenceMap), "utf-8");
  console.info(`Saved results in ${filepath}. Formatting results...`);
  execSync("yarn prettier:fix");
}

run()
  .catch((e) => console.error("An error occurred: ", e))
  .finally(() => "Done!\n");
