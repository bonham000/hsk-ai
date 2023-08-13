import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import { useInterval } from "usehooks-ts";
import { HSK_MAP } from "~/chinese/hsk";
import { HSK_SENTENCE_MAP } from "~/chinese/sentences";
import type HskEntry from "~/types/HskEntry";
import type MaybeNull from "~/types/MaybeNull";
import { type ModelSentences } from "~/types/SentenceMap";

type TypeSentenceProps = {
  sentence: string;
  className?: React.ComponentProps<"div">["className"];
  setFinishedTyping?: () => void;
  typingDelay?: number;
};

function TypeSentence(props: TypeSentenceProps) {
  const { sentence, setFinishedTyping, className, typingDelay = 40 } = props;
  const [revealIndex, setRevealedIndex] = useState(0);

  const delay = revealIndex < sentence.length ? typingDelay : null;
  useInterval(() => {
    setRevealedIndex((cur) => cur + 1);
  }, delay);

  useEffect(() => {
    let timeout: MaybeNull<ReturnType<typeof setTimeout>> = null;
    if (delay == null) {
      timeout = setTimeout(() => {
        if (setFinishedTyping != null) {
          setFinishedTyping();
        }
      }, 250);
    }
    return () => {
      if (timeout != null) {
        clearTimeout(timeout);
      }
    };
  }, [delay, setFinishedTyping]);

  const revealed = sentence.slice(0, revealIndex);
  return <p className={className}>{revealed}</p>;
}

type WordCardProps = {
  word: HskEntry;
  modelSentences: ModelSentences;
  sentenceRevealIndex: number;
};

function WordCard(props: WordCardProps) {
  const { word, modelSentences, sentenceRevealIndex } = props;
  const [finishedTyping, setFinishedTyping] = useState(false);

  useEffect(() => {
    setFinishedTyping(false);
  }, [word.traditional]);

  const characters = word.traditional;
  let fontSize = 164;
  if (characters.length === 2) {
    fontSize = 124;
  }
  if (characters.length === 3) {
    fontSize = 72;
  }
  const sentences = modelSentences["gpt-3.5-turbo"];
  const currentSentences = sentences.slice(0, sentenceRevealIndex + 1);
  const hasMoreSentences = currentSentences.length < sentences.length;
  return (
    <div className="flex flex-row p-6 gap-6 w-3/4 h-1/2 bg-slate-900 rounded-2xl">
      <div className="w-4/12 p-8 flex justify-around items-center bg-slate-800 rounded-2xl">
        <p style={{ fontSize }} className="whitespace-nowrap text-indigo-600">
          {characters}
        </p>
      </div>
      <div className="w-8/12 p-8 flex flex-col flex-grow justify-start bg-slate-800 rounded-2xl">
        {currentSentences.map((sentence, index) => {
          const isCurrent = index === currentSentences.length - 1;
          return (
            <TypeSentence
              className={`text-[36px] font-light ${
                isCurrent ? "text-indigo-500 font-normal" : "text-slate-600"
              }`}
              sentence={sentence}
              key={sentence.replaceAll(" ", "")}
              setFinishedTyping={() => setFinishedTyping(true)}
            />
          );
        })}
        {hasMoreSentences && sentenceRevealIndex === 0 && finishedTyping && (
          <TypeSentence
            className="mt-4 text-slate-400"
            sentence="Press spacebar to reveal the next sentence."
            typingDelay={5}
          />
        )}
      </div>
    </div>
  );
}

const HSK_LEVEL = 4;

export default function Home() {
  const [index, setIndex] = useState(0);
  const [sentenceRevealIndex, setSentenceRevealIndex] = useState(0);
  const hsk = HSK_MAP[HSK_LEVEL];
  const words = hsk.words;
  const word = words[index]!;
  const nextWord = words[index + 1];
  const hskSentenceMap = HSK_SENTENCE_MAP[HSK_LEVEL];
  const hasNext = nextWord != null && nextWord.traditional in hskSentenceMap;
  const sentences = hskSentenceMap[word.traditional]!;

  const next = useCallback(() => {
    setIndex((cur) => (hasNext ? cur + 1 : cur));
    setSentenceRevealIndex(0);
  }, [hasNext, setIndex]);

  const previous = useCallback(() => {
    setIndex((cur) => (cur > 0 ? cur - 1 : cur));
    setSentenceRevealIndex(0);
  }, [setIndex]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        next();
      }
      if (event.key === "ArrowLeft") {
        previous();
      }
      if (event.key === " ") {
        setSentenceRevealIndex((cur) => cur + 1);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return function cleanup() {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [next, previous]);

  return (
    <>
      <Head>
        <title>HSK AI</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen justify-center">
        <div className="container flex flex-col items-center justify-around px-4 py-16 ">
          <h1 className="text-5xl tracking-tight sm:text-[5rem] m-2">
            <span className="text-slate-300">漢語水平考試</span>
            <span className="ml-4 text-indigo-500 font-normal">
              Chat Gippity
            </span>
          </h1>
          <WordCard
            modelSentences={sentences}
            sentenceRevealIndex={sentenceRevealIndex}
            word={word}
          />
          <div className="flex gap-6 bg-slate-900 p-6 rounded-2xl">
            <button
              disabled={index === 0}
              onClick={previous}
              className="bg-slate-800 hover:bg-indigo-500 w-64 text-slate-200 py-4 px-8 text-3xl rounded-2xl"
            >
              上一張
            </button>
            <button
              disabled={!hasNext}
              onClick={next}
              className="bg-slate-800 hover:bg-indigo-500 w-64 text-slate-200 py-4 px-8 text-3xl rounded-2xl"
            >
              下一張
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
