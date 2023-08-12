import { ALL_HSK_WORDS } from "~/chinese/hsk";

const unique = new Set();
const duped: string[] = [];

for (const word of ALL_HSK_WORDS) {
  if (unique.has(word.traditional)) {
    duped.push(word.traditional);
  } else {
    unique.add(word.traditional);
  }
}

console.log(`${duped.length} duplicated words:`);
for (const word of duped) {
  console.log(word);
}
console.log(`Checked ${ALL_HSK_WORDS.length} words.`);
