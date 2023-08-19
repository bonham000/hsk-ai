import Head from "next/head";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { useInterval } from "usehooks-ts";
import { HSK_MAP } from "~/chinese/hsk";
import { HSK_SENTENCE_MAP } from "~/chinese/sentences";
import type HskEntry from "~/types/HskEntry";
import type MaybeNull from "~/types/MaybeNull";
import { type ModelSentences } from "~/types/SentenceMap";
import lastInArray from "~/utils/lastInArray";

const formatLabel = (label: string, value: string): ReactNode => {
  if (!value) {
    return label;
  }

  return (
    <span>
      {label
        .split(value)
        .reduce((prev: ReactNode[], current: string, i: number) => {
          if (!i) {
            return [current];
          }

          return prev.concat(
            <span className="text-rose-400" key={value + current}>
              {value}
            </span>,
            current
          );
        }, [] as ReactNode[])}
    </span>
  );
};

type TypeSentenceProps = {
  character?: string;
  className?: React.ComponentProps<"div">["className"];
  content: string;
  isCurrent: boolean;
  setFinishedTyping?: () => void;
  typingDelay?: number;
};

function TypedContent(props: TypeSentenceProps) {
  const {
    content,
    setFinishedTyping,
    character,
    isCurrent,
    className,
    typingDelay = 40,
  } = props;
  const [revealIndex, setRevealedIndex] = useState(0);

  const delay = revealIndex < content.length ? typingDelay : null;
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

  const revealed = content.slice(0, revealIndex);
  return (
    <p className={className}>
      {character == null || !isCurrent
        ? revealed
        : formatLabel(revealed, character)}
    </p>
  );
}

type WordCardProps = {
  contentRevealed: boolean;
  modelSentences: ModelSentences;
  sentenceRevealIndex: number;
  word: HskEntry;
};

function WordCard(props: WordCardProps) {
  const { word, modelSentences, sentenceRevealIndex, contentRevealed } = props;
  const [finishedTyping, setFinishedTyping] = useState(false);

  useEffect(() => {
    setFinishedTyping(false);
  }, [word.traditional]);

  const character = word.traditional;
  let fontSize = 164;
  if (character.length === 2) {
    fontSize = 124;
  }
  if (character.length === 3) {
    fontSize = 72;
  }
  const sentences = modelSentences["gpt-3.5-turbo"];
  const currentSentences = sentences.slice(0, sentenceRevealIndex + 1);
  const hasMoreSentences = currentSentences.length < sentences.length;
  const currentSentence = lastInArray(currentSentences) ?? null;
  return (
    <div className="flex flex-row p-6 gap-6 w-11/12 h-4/6 bg-slate-950 rounded-3xl">
      <div className="w-4/12 p-8 flex justify-around items-center bg-slate-800 rounded-3xl">
        <p className="whitespace-nowrap text-rose-400" style={{ fontSize }}>
          {character}
        </p>
      </div>
      <div className="w-8/12 p-8 flex flex-col flex-grow justify-start bg-slate-800 rounded-3xl">
        {currentSentences.map((sentence, index) => {
          const isCurrent = index === currentSentences.length - 1;
          return (
            <TypedContent
              character={character}
              className={`text-4xl leading-normal font-normal ${
                isCurrent ? "text-slate-200 font-light" : "text-slate-600"
              }`}
              content={sentence.chinese}
              isCurrent={isCurrent}
              key={sentence.chinese.replaceAll(" ", "")}
              setFinishedTyping={() => setFinishedTyping(true)}
            />
          );
        })}
        {contentRevealed && currentSentence != null && (
          <div className="flex gap-2 mt-4 flex-col text-slate-400">
            <p className="text-2xl">{currentSentence.pinyin}</p>
            <p className="text-xl">{currentSentence.english}</p>
          </div>
        )}
        {hasMoreSentences &&
          sentenceRevealIndex === 0 &&
          finishedTyping &&
          !contentRevealed && (
            <TypedContent
              className="mt-4 text-slate-400"
              content="Press 'spacebar' to reveal the next sentence, or press 'r' to reveal Pinyin/English."
              isCurrent={false}
              typingDelay={5}
            />
          )}
      </div>
    </div>
  );
}

const HSK_LEVEL = 2;

export default function Home() {
  const [index, setIndex] = useState(0);
  const [sentenceRevealIndex, setSentenceRevealIndex] = useState(0);
  const [contentRevealed, setContentRevealed] = useState(false);
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
    setContentRevealed(false);
  }, [hasNext, setIndex]);

  const previous = useCallback(() => {
    setIndex((cur) => (cur > 0 ? cur - 1 : cur));
    setSentenceRevealIndex(0);
    setContentRevealed(false);
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
        setContentRevealed(false);
      }
      if (event.key === "r") {
        setContentRevealed((cur) => !cur);
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
        <meta content="Generated by create-t3-app" name="description" />
        <link href="/favicon.ico" rel="icon" />
      </Head>
      <main className="flex min-h-screen justify-center">
        <div className="container flex flex-col items-center justify-between px-4">
          <div className="flex flex-col items-center bg-slate-950 p-4 rounded-b-3xl">
            <h1 className="text-5xl mb-2">
              <span className="text-slate-300 font-light">漢語水平考試</span>
              <span className="ml-4 text-rose-400 font-normal">AI</span>
            </h1>
            <p className="text-slate-400 text-s">
              Master 5,000 HSK words with the help of AI.
            </p>
          </div>
          <WordCard
            contentRevealed={contentRevealed}
            modelSentences={sentences}
            sentenceRevealIndex={sentenceRevealIndex}
            word={word}
          />
          <div className="flex gap-6 bg-slate-950 p-6 rounded-t-3xl">
            <button
              className="bg-slate-800 hover:bg-rose-400 w-64 text-slate-300 font-light py-4 px-8 text-3xl rounded-full"
              disabled={index === 0}
              onClick={previous}
            >
              上一張
            </button>
            <button
              className="bg-slate-800 hover:bg-rose-400 w-64 text-slate-300 font-light py-4 px-8 text-3xl rounded-full"
              disabled={!hasNext}
              onClick={next}
            >
              下一張
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
