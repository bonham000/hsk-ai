"use client";

import Head from "next/head";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from "react";
import NoSSR from "react-no-ssr";
import { useInterval, useLocalStorage, useWindowSize } from "usehooks-ts";
import { HSK_MAP } from "~/chinese/hsk";
import { HSK_SENTENCE_MAP } from "~/chinese/sentences";
import SelectHskLevel from "~/components/SelectHskLevel";
import Toast from "~/components/Toast";
import type HskEntry from "~/types/HskEntry";
import type HskLevel from "~/types/HskLevel";
import type MaybeNull from "~/types/MaybeNull";
import { type GeneratedSentenceType } from "~/types/SentenceMap";
import lastInArray from "~/utils/lastInArray";
import randomInRange from "~/utils/randomInRange";
import shuffleArray from "~/utils/shuffleArray";

const highlightCharacter = (
  label: string,
  value: string,
  isReviewSentence: boolean
): ReactNode => {
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
            <span
              className={
                isReviewSentence ? "text-emerald-400" : "text-rose-400"
              }
              key={value + current}
            >
              {value}
            </span>,
            current
          );
        }, [] as ReactNode[])}
    </span>
  );
};

type TypedContentProps = {
  character?: string;
  className?: React.ComponentProps<"div">["className"];
  content: string;
  isCurrent?: boolean;
  isReviewSentence?: boolean;
  setFinishedTyping?: () => void;
  typingDelay?: number;
};

function TypedContent(props: TypedContentProps) {
  const {
    character,
    className,
    content,
    isCurrent = false,
    isReviewSentence = false,
    setFinishedTyping,
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
        : highlightCharacter(revealed, character, isReviewSentence)}
    </p>
  );
}

type StudySentence = GeneratedSentenceType & {
  character: string;
  isReviewSentence: boolean;
};

type CharacterCardProps = {
  characterRevealed: boolean;
  contentRevealedIndex: ContentRevealedIndex;
  hskWordLength: number;
  sentenceRevealIndex: number;
  studySentences: StudySentence[];
  updateCheckpoints: () => void;
  word: HskEntry;
  wordIndex: number;
};

function CharacterCard(props: CharacterCardProps) {
  const {
    characterRevealed,
    contentRevealedIndex,
    hskWordLength,
    sentenceRevealIndex,
    studySentences,
    updateCheckpoints,
    word,
    wordIndex,
  } = props;
  const [finishedTyping, setFinishedTyping] = useState(false);

  useEffect(() => {
    setFinishedTyping(false);
  }, [word.traditional]);

  const character = word.traditional;
  let fontSize = 204;
  if (character.length === 2) {
    fontSize = 164;
  }
  if (character.length === 3) {
    fontSize = 94;
  }
  const currentSentences = studySentences.slice(0, sentenceRevealIndex + 1);
  const hasMoreSentences = currentSentences.length < studySentences.length;
  const currentSentence = lastInArray(currentSentences) ?? null;
  return (
    <div className="flex flex-row p-6 gap-6 w-11/12 h-4/6 bg-slate-950 rounded-lg">
      <div className="relative w-4/12 p-8 flex justify-around items-center bg-slate-800 rounded-lg">
        <div className="absolute top-2">
          <p className="text-slate-400">
            {wordIndex + 1}/{hskWordLength}
          </p>
        </div>
        <div className="-mt-16">
          <p className="whitespace-nowrap text-rose-400" style={{ fontSize }}>
            {character}
          </p>
          {characterRevealed && (
            <div className="flex gap-6 mt-4 flex-col text-slate-300 items-center">
              <p className="text-6xl">{word.pinyin}</p>
              <p className="text-3xl">{word.english}</p>
            </div>
          )}
        </div>
        <div className="absolute bottom-2">
          <Toast
            description={`Progress for this HSK level saved at ${word.traditional}.`}
            text="Save Checkpoint"
            title="Checkpoint Saved!"
          />
        </div>
      </div>
      <div className="w-8/12 p-4 flex flex-col flex-grow justify-start bg-slate-800 rounded-lg">
        {currentSentences.map((sentence, index) => {
          const isCurrent = index === currentSentences.length - 1;
          return (
            <TypedContent
              character={sentence.character}
              className={`text-4xl leading-normal font-normal ${
                isCurrent ? "text-slate-200 font-light" : "text-slate-600"
              }`}
              content={sentence.chinese}
              isCurrent={isCurrent}
              isReviewSentence={sentence.isReviewSentence}
              key={sentence.chinese.replaceAll(" ", "")}
              setFinishedTyping={() => setFinishedTyping(true)}
            />
          );
        })}
        {contentRevealedIndex > 0 && currentSentence != null && (
          <div className="flex gap-2 mt-4 flex-col text-slate-400">
            {contentRevealedIndex >= 1 && (
              <TypedContent
                className="text-2xl"
                content={currentSentence.pinyin}
                isReviewSentence
                typingDelay={8}
              />
            )}
            {contentRevealedIndex === 2 && (
              <TypedContent
                className="text-xl"
                content={currentSentence.english}
                typingDelay={6}
              />
            )}
          </div>
        )}
        {hasMoreSentences &&
          sentenceRevealIndex === 0 &&
          finishedTyping &&
          !contentRevealedIndex && (
            <TypedContent
              className="mt-4 text-slate-400"
              content="Press 'spacebar' to reveal the next sentence or press 'r' to reveal Pinyin/English."
              isCurrent={false}
              typingDelay={5}
            />
          )}
      </div>
    </div>
  );
}

const MODEL = "gpt-3.5-turbo";

type ReviewSentence = GeneratedSentenceType & {
  character: string;
};

function getPreviousHskSentences(
  currentHskLevel: HskLevel,
  currentHskIndex: number
) {
  const previous: ReviewSentence[] = [];
  let level = currentHskLevel;
  while (level > 0) {
    const hskSentences = Object.entries(HSK_SENTENCE_MAP[level]);
    const finalIndex =
      level === currentHskLevel ? currentHskIndex : hskSentences.length;

    const reviewSentences: ReviewSentence[] = hskSentences
      .slice(0, finalIndex)
      .map(([character, modelSentences]) => {
        const generatedSentences = modelSentences[MODEL];
        return generatedSentences.map((sentence) => {
          return {
            ...sentence,
            character,
          };
        });
      })
      .flat();

    previous.push(...reviewSentences);
    level--;
  }
  return previous;
}

const PROBABILITY_OF_ADDING_REVIEW_SENTENCES_PER_CARD = 100;
const NUMBER_OF_REVIEW_SENTENCES_PER_CARD = 3;

function getCurrentContent(hskLevel: HskLevel, currentIndex: number) {
  console.log("HI!", currentIndex);

  const hsk = HSK_MAP[hskLevel];
  const words = hsk.words;
  const word = words[currentIndex]!;
  const nextWord = words[currentIndex + 1];
  const hskSentenceMap = HSK_SENTENCE_MAP[hskLevel];
  const hasNext = nextWord != null && nextWord.traditional in hskSentenceMap;
  const sentences = hskSentenceMap[word.traditional]!;
  const modelSentences = sentences[MODEL];

  let studySentences: StudySentence[] = modelSentences.map((sentence) => {
    return {
      ...sentence,
      character: word.traditional,
      isReviewSentence: false,
    };
  });

  const probability = randomInRange(0, 100);
  if (probability < PROBABILITY_OF_ADDING_REVIEW_SENTENCES_PER_CARD) {
    const previousHskSentences = getPreviousHskSentences(
      hskLevel,
      currentIndex
    );

    const randomStudySentences = shuffleArray(previousHskSentences)
      .slice(0, NUMBER_OF_REVIEW_SENTENCES_PER_CARD)
      .map((val) => {
        return {
          ...val,
          isReviewSentence: true,
        };
      });
    studySentences = shuffleArray(studySentences.concat(randomStudySentences));
  }

  return {
    hasNext,
    studySentences,
    word,
  };
}

type ContentRevealedIndex = 0 | 1 | 2;

const HSK_REVIEW_CHECKPOINTS = "HSK_REVIEW_CHECKPOINTS";
const HSK_REVIEW_INDEX_MAP: Record<HskLevel, number> = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
  6: 0,
};

const HSK_LEVEL = "HSK_LEVEL";
const DEFAULT_HSK_LEVEL: HskLevel = 1;

function App() {
  const [checkpoints, setCheckpoints] = useLocalStorage(
    HSK_REVIEW_CHECKPOINTS,
    HSK_REVIEW_INDEX_MAP
  );

  const [hskLevel, setHskLevel] = useLocalStorage(HSK_LEVEL, DEFAULT_HSK_LEVEL);
  const [index, setIndex] = useState(checkpoints[hskLevel]);
  const [sentenceRevealIndex, setSentenceRevealIndex] = useState(0);
  const [contentRevealedIndex, setContentRevealedIndex] =
    useState<ContentRevealedIndex>(0);
  const [characterRevealed, setCharacterRevealed] = useState(false);
  const { hasNext, studySentences, word } = useMemo(
    () => getCurrentContent(hskLevel, index),
    [hskLevel, index]
  );
  const { width } = useWindowSize();
  const hskWordLength = HSK_MAP[hskLevel].words.length;
  const percentComplete = index / hskWordLength;
  const widthPercentComplete = Math.round(percentComplete * width);

  const updateCheckpoints = () => {
    const updatedCheckpoints = {
      ...checkpoints,
      [hskLevel]: index,
    };
    setCheckpoints(updatedCheckpoints);
  };

  useEffect(() => {
    setIndex(checkpoints[hskLevel]);
    setSentenceRevealIndex(0);
    setContentRevealedIndex(0);
    setCharacterRevealed(false);
  }, [hskLevel, checkpoints]);

  const next = useCallback(() => {
    setIndex((cur) => (hasNext ? cur + 1 : cur));
    setSentenceRevealIndex(0);
    setContentRevealedIndex(0);
  }, [hasNext, setIndex]);

  const previous = useCallback(() => {
    setIndex((cur) => (cur > 0 ? cur - 1 : cur));
    setSentenceRevealIndex(0);
    setContentRevealedIndex(0);
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
        setContentRevealedIndex(0);
      }
      if (event.key === "r") {
        setContentRevealedIndex((cur) => {
          return cur === 2 ? 0 : ((cur + 1) as ContentRevealedIndex);
        });
      }
      if (event.key === "c") {
        setCharacterRevealed((cur) => !cur);
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
      <main className="flex min-h-screen w-screen justify-center">
        <div className="w-screen flex flex-col items-center justify-between">
          <div className="w-full flex items-center flex-col">
            <div className="h-2 w-full flex flex-row">
              {new Array(width).fill(null).map((_, i) => {
                if (i + 1 < widthPercentComplete) {
                  return <div className="bg-emerald-400 h-2 w-1" key={i} />;
                } else {
                  return <div className="h-2 w-1" key={i} />;
                }
              })}
            </div>
            <div className="flex flex-col w-1/4 items-center bg-slate-950 p-4 rounded-b-3xl">
              <h1 className="text-5xl mb-2">
                <span className="text-slate-300 font-light">漢語水平考試</span>
                <span className="ml-4 text-rose-400 font-normal">AI</span>
              </h1>
              <p className="text-slate-400 text-s">
                Master 5,000 HSK words with the help of AI
              </p>
            </div>
          </div>
          <div className="flex flex-row items-center gap-4">
            <p className="text-slate-400">HSK Level</p>
            <SelectHskLevel onValueChanged={setHskLevel} value={hskLevel} />
          </div>
          <CharacterCard
            characterRevealed={characterRevealed}
            contentRevealedIndex={contentRevealedIndex}
            hskWordLength={hskWordLength}
            sentenceRevealIndex={sentenceRevealIndex}
            studySentences={studySentences}
            updateCheckpoints={updateCheckpoints}
            word={word}
            wordIndex={index}
          />
          <div className="flex gap-6 bg-slate-950 p-6 rounded-t-3xl">
            <button
              className="bg-slate-800 hover:bg-slate-700 w-64 text-slate-300 font-light py-4 px-8 text-3xl rounded-full"
              disabled={index === 0}
              onClick={previous}
            >
              上一張
            </button>
            <button
              className="bg-slate-800 hover:bg-slate-700 w-64 text-slate-300 font-light py-4 px-8 text-3xl rounded-full"
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

export default function Home() {
  return (
    <NoSSR>
      <App />
    </NoSSR>
  );
}
