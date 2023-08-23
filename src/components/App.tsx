"use client";

import Head from "next/head";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useLocalStorage, useWindowSize } from "usehooks-ts";
import SelectHskLevel from "~/components/SelectHskLevel";
import Toast from "~/components/Toast";
import TypedContent from "~/components/TypedContent";
import { HSK_MAP } from "~/content/hsk";
import { HSK_SENTENCE_MAP } from "~/content/sentences";
import type HskEntry from "~/types/HskEntry";
import type HskLevel from "~/types/HskLevel";
import { type GeneratedSentenceType } from "~/types/SentenceMap";
import lastInArray from "~/utils/lastInArray";
import randomInRange from "~/utils/randomInRange";
import shuffleArray from "~/utils/shuffleArray";

type StudySentence = GeneratedSentenceType & {
  character: string;
  isReviewSentence: boolean;
};

type CharacterCardProps = {
  characterRevealed: boolean;
  contentRevealed: boolean;
  hskWordLength: number;
  isMobileView: boolean;
  onTapCharacterPanel: () => void;
  onTapSentence: () => void;
  onTapSentencePanel: () => void;
  sentenceRevealIndex: number;
  studySentences: StudySentence[];
  word: HskEntry;
  wordIndex: number;
};

const SENTENCE_PANEL_ID = "SENTENCE_PANEL_ID";

function CharacterCard(props: CharacterCardProps) {
  const {
    characterRevealed,
    contentRevealed,
    hskWordLength,
    isMobileView,
    onTapCharacterPanel,
    onTapSentence,
    onTapSentencePanel,
    sentenceRevealIndex,
    studySentences,
    word,
    wordIndex,
  } = props;
  const [finishedTyping, setFinishedTyping] = useState(false);

  useEffect(() => {
    setFinishedTyping(false);
  }, [word.traditional]);

  const scrollToBottomOfSentencePanel = () => {
    const el = document.getElementById(SENTENCE_PANEL_ID);
    if (el != null) {
      el.scrollTop = el.scrollHeight;
    }
  };

  const character = word.traditional;
  let fontSize = 204;
  if (character.length === 2) {
    fontSize = 164;
  }
  if (character.length === 3) {
    fontSize = 94;
  }
  if (character.length > 3) {
    fontSize = 78;
  }
  if (isMobileView) {
    fontSize = 0.35 * fontSize;
  }
  const currentSentences = studySentences.slice(0, sentenceRevealIndex + 1);
  const hasMoreSentences = currentSentences.length < studySentences.length;
  const currentSentence = lastInArray(currentSentences) ?? null;
  const percentProgress = ((wordIndex + 1) / hskWordLength) * 100;
  return (
    <div className="flex flex-col items-center md:items-stretch cursor-pointer md:flex-row p-2 md:p-6 gap-2 md:gap-6 w-11/12 md:h-4/6 md:max-h-full h-[464px] max-h-[520px] bg-slate-950 rounded-lg">
      <div
        className="relative w-full md:w-4/12 p-4 md:p-8 flex justify-around items-center h-[132px] md:h-auto bg-slate-800 rounded-lg"
        onClick={onTapCharacterPanel}
      >
        <div className="absolute right-2 top-2">
          <p className="text-slate-400 text-xs md:text-md">
            {wordIndex + 1}/{hskWordLength} ({Math.round(percentProgress)}%)
          </p>
        </div>
        <div className="flex flex-row items-center md:flex-col gap-8 md:gap-0 md:-mt-16">
          <p className="whitespace-nowrap text-rose-400" style={{ fontSize }}>
            {character}
          </p>
          {characterRevealed && (
            <div className="flex gap-2 md:gap-6 flex-col text-slate-300 items-center">
              <p className="text-md md:text-6xl">{word.pinyin}</p>
              <p className="text-sm md:text-3xl">{word.english}</p>
            </div>
          )}
        </div>
      </div>
      <div
        className="w-full md:w-8/12 p-4 flex overflow-y-scroll gap-2 md:gap-6 flex-col flex-grow justify-start bg-slate-800 rounded-lg"
        id={SENTENCE_PANEL_ID}
        onClick={onTapSentencePanel}
      >
        {currentSentences.map((sentence, index) => {
          const isCurrent = index === currentSentences.length - 1;
          return (
            <TypedContent
              character={sentence.character}
              className={`text-2xl md:text-5xl font-normal ${
                isCurrent ? "text-slate-200 font-light" : "text-slate-500"
              }`}
              content={sentence.chinese}
              isCurrent={isCurrent}
              isReviewSentence={sentence.isReviewSentence}
              key={sentence.chinese.replaceAll(" ", "")}
              onClick={(e) => {
                if (isCurrent) {
                  e.preventDefault();
                  e.stopPropagation();
                  onTapSentence();
                }
              }}
              onStartedTyping={scrollToBottomOfSentencePanel}
              setFinishedTyping={() => {
                setFinishedTyping(true);
                scrollToBottomOfSentencePanel();
              }}
            />
          );
        })}
        {contentRevealed && currentSentence != null && (
          <div className="flex gap-2 flex-col text-slate-400">
            <TypedContent
              className="text-md md:text-2xl"
              content={currentSentence.pinyin}
              isReviewSentence
              setFinishedTyping={scrollToBottomOfSentencePanel}
              typingDelay={8}
            />
            <TypedContent
              className="text-md md:text-xl"
              content={currentSentence.english}
              setFinishedTyping={scrollToBottomOfSentencePanel}
              typingDelay={6}
            />
          </div>
        )}
        {hasMoreSentences &&
          sentenceRevealIndex === 0 &&
          finishedTyping &&
          !contentRevealed && (
            <TypedContent
              className="text-xs md:text-lg text-slate-400"
              content={
                isMobileView
                  ? "Tap to reveal the next sentence. Tap the sentence to reveal the meaning."
                  : "Press 'spacebar' to reveal the next sentence or press 'r' to reveal Pinyin/English."
              }
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
): ReviewSentence[] {
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

const HSK_REVIEW_CHECKPOINTS_KEY = "HSK_REVIEW_CHECKPOINTS";
const HSK_REVIEW_INDEX_MAP: Record<HskLevel, number> = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
  6: 0,
};

const HSK_LEVEL_KEY = "HSK_LEVEL";
const DEFAULT_HSK_LEVEL: HskLevel = 1;

export default function App() {
  const [checkpoints, setCheckpoints] = useLocalStorage(
    HSK_REVIEW_CHECKPOINTS_KEY,
    HSK_REVIEW_INDEX_MAP
  );

  const [hskLevel, setHskLevel] = useLocalStorage(
    HSK_LEVEL_KEY,
    DEFAULT_HSK_LEVEL
  );
  const [index, setIndex] = useState(checkpoints[hskLevel]);
  const [sentenceRevealIndex, setSentenceRevealIndex] = useState(0);
  const [contentRevealed, setContentRevealed] = useState(false);
  const [characterRevealed, setCharacterRevealed] = useState(false);
  const { hasNext, studySentences, word } = useMemo(
    () => getCurrentContent(hskLevel, index),
    [hskLevel, index]
  );
  const { width } = useWindowSize();
  const isMobileView = width < 768;
  const hskSentenceKeys = Object.keys(HSK_SENTENCE_MAP[hskLevel]);
  const percentComplete = (index + 1) / hskSentenceKeys.length;
  const widthPercentComplete = Math.round(percentComplete * width);

  const updateCheckpoints = () => {
    const updatedCheckpoints = {
      ...checkpoints,
      [hskLevel]: index,
    };
    setCheckpoints(() => updatedCheckpoints);
  };

  useEffect(() => {
    setSentenceRevealIndex(0);
    setContentRevealed(false);
    setCharacterRevealed(false);
  }, [hskLevel]);

  const handleSelectHskLevel = (hskLevel: HskLevel) => {
    setHskLevel(hskLevel);
    setIndex(checkpoints[hskLevel]);
  };

  const next = useCallback(() => {
    setIndex((cur) => (hasNext ? cur + 1 : cur));
    setSentenceRevealIndex(0);
    setContentRevealed(false);
    setCharacterRevealed(false);
  }, [hasNext, setIndex]);

  const previous = useCallback(() => {
    setIndex((cur) => (cur > 0 ? cur - 1 : cur));
    setSentenceRevealIndex(0);
    setContentRevealed(false);
    setCharacterRevealed(false);
  }, [setIndex]);

  const revealCharacter = () => {
    setCharacterRevealed((cur) => !cur);
  };

  const revealNextSentence = () => {
    setSentenceRevealIndex((cur) => cur + 1);
    setContentRevealed(false);
  };

  const revealSentence = () => {
    setContentRevealed(true);
  };

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        next();
      }
      if (event.key === "ArrowLeft") {
        previous();
      }
      if (event.key === " ") {
        revealNextSentence();
      }
      if (event.key === "r") {
        revealSentence();
      }
      if (event.key === "c") {
        revealCharacter();
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
        <meta content="Learn Chinese with AI" name="description" />
        <link href="/favicon.ico" rel="icon" />
      </Head>
      <main className="flex md:min-h-screen w-screen justify-center">
        <div className="w-screen flex flex-col items-center justify-between gap-4 md:gap-0">
          <div className="w-full flex items-center flex-col">
            <div className="h-2 w-full flex flex-row">
              {new Array(width).fill(null).map((_, i) => {
                if (i + 1 < widthPercentComplete) {
                  return <div className="bg-emerald-400 h-2 w-1" key={i} />;
                } else {
                  return <div className="bg-slate-950 h-2 w-1" key={i} />;
                }
              })}
            </div>
            <div className="flex flex-col md:w-5/12 w-3/4 items-center bg-slate-950 p-4 rounded-b-3xl">
              <h1 className="md:text-5xl text-3xl mb-2">
                <span className="text-slate-300 font-light">漢語水平考試</span>
                <span className="ml-4 text-rose-400 font-normal">AI</span>
              </h1>
              <p className="text-slate-400 md:text-lg text-xs">
                Master 5,000 HSK words with the help of AI
              </p>
            </div>
          </div>
          <div className="flex flex-row items-center gap-4">
            <p className="text-xs md:text-lg text-slate-400">HSK Level</p>
            <SelectHskLevel
              onValueChanged={handleSelectHskLevel}
              value={hskLevel}
            />
          </div>
          <CharacterCard
            characterRevealed={characterRevealed}
            contentRevealed={contentRevealed}
            hskWordLength={hskSentenceKeys.length}
            isMobileView={isMobileView}
            onTapCharacterPanel={revealCharacter}
            onTapSentence={revealSentence}
            onTapSentencePanel={revealNextSentence}
            sentenceRevealIndex={sentenceRevealIndex}
            studySentences={studySentences}
            word={word}
            wordIndex={index}
          />
          <div className="flex md:relative absolute bottom-0 gap-2 md:gap-6 bg-slate-950 p-2 md:p-6 rounded-t-3xl">
            <button
              className="bg-slate-800 hover:bg-slate-700 md:w-64 text-slate-300 font-normal py-4 px-8 text-md md:text-3xl rounded-full"
              disabled={index === 0}
              onClick={previous}
            >
              上一張
            </button>
            <Toast
              description={`Progress for this HSK level saved at ${word.traditional}.`}
              onPress={updateCheckpoints}
              text={isMobileView ? "Save" : "Save Checkpoint"}
              title="Checkpoint Saved!"
            />
            <button
              className="bg-slate-800 hover:bg-slate-700 md:w-64 text-slate-300 font-normal py-4 px-8 text-md md:text-3xl rounded-full"
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
