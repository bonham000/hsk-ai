import "dotenv/config";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

function generatePrompt(word: string) {
  const PROMPT = `
  You are an experienced Chinese tutor helping someone learn Chinese. We are
  using the HSK vocabulary lists focusing on learning new vocabulary. I will
  provide a HSK new word and your job is to produce 5 example sentences using
  that word. For now, we are targeting HSK Level 4. Please try to compose the
  example sentences of only words from HSK levels 1 to 3 and the target word.
  If you have to include other words that is fine, but the goal is for the
  sentences to be representative of normal Chinese, varied, and easily readable.
  
  Finally, could you structure your response as JSON, e.g.

  Input: 保護
  Output:
  [
    "父母要保護他們的孩子。",
    ... etc.
  ]

  Also, please write in traditional Chinese characters.

  Ok, let's begin with the first word!

  The word is: ${word}
  `;

  return PROMPT;
}

async function generateSentencesForWord(word: string): Promise<void> {
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: generatePrompt(word) }],
    });
    console.log(completion.data);
    console.log(completion.data.choices);
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

const words = ["愛情", "安排", "安全", "暗", "按時"];
const word = words[0]!;

generateSentencesForWord(word).finally(() => null);
