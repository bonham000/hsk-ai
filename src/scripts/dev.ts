import { execSync } from "child_process";
import "dotenv/config";
import { readFileSync, writeFileSync } from "fs";
import { Configuration, OpenAIApi } from "openai";
import lesson4 from "~/chinese/hsk/level-4";
import { type SentenceMap, type Model } from "~/types/SentenceMap";

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
  words that have already been seen. The words we've already seen so far are:
  ${seenWords.join(", ")}. However, only do this occasionally.
  
  Finally, could you structure your response as JSON, e.g.

  Input: 保護
  Output:
  [
    "父母要保護他們的孩子。",
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
  HSK Level 4 words that have already been seen. The HSK ${hskLevel} words we've
  already seen are: ${seenWords.join(", ")}. However, only do this occasionally.
  
  Finally, could you structure your response as JSON, e.g.

  Input: 保護
  Output:
  [
    "父母要保護他們的孩子。",
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
  sentenceMap,
  word,
  model,
  sentences,
}: {
  sentenceMap: SentenceMap;
  word: string;
  model: Model;
  sentences: string[];
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
      "gpt-4": model === "gpt-4" ? sentences : [],
      "gpt-3.5-turbo": model === "gpt-3.5-turbo" ? sentences : [],
    };
  }
}

function wordExistsAlready({
  sentenceMap,
  word,
  model,
}: {
  sentenceMap: SentenceMap;
  word: string;
  model: Model;
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
): Promise<string[]> {
  console.log(`Current word = ${word}. Seen words = ${seenWords.join(", ")}`);
  const prompt =
    hskLevel === 1
      ? generateStarterPrompt(word, seenWords)
      : generateIntermediatePrompt(word, seenWords, hskLevel);
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });
  const json = completion.data.choices[0]?.message?.content ?? "";
  const parsed = JSON.parse(json) as string[];
  return parsed;
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
      sentenceMap,
      word,
      model: "gpt-3.5-turbo",
      sentences: generatedSentences,
    });
  } catch (error) {
    console.log("An error occurred:");
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
}

const { level } = lesson4;
const words = lesson4.words.slice(0, 25);
const seenWords: string[] = [];

async function run() {
  const filepath = `src/chinese/sentences/level-${level}.json`;
  const sentenceMap = JSON.parse(
    readFileSync(filepath, "utf-8")
  ) as SentenceMap;

  for (const wordEntry of words) {
    const word = wordEntry.traditional;

    if (wordExistsAlready({ word, sentenceMap, model: "gpt-3.5-turbo" })) {
      console.info(`${word} already exists for this model, skipping.`);
      seenWords.push(word);
      continue;
    }

    await generateSentencesForWord(word, seenWords, sentenceMap, level);
    seenWords.push(word);
  }

  writeFileSync(filepath, JSON.stringify(sentenceMap), "utf-8");
  console.log(`Saved results in ${filepath}. Formatting results...`);
  execSync("yarn prettier");
}

run()
  .catch((e) => console.error("An error occurred: ", e))
  .finally(() => "Done!\n");
