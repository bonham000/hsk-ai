import lesson1 from "~/hsk/level-1";
import lesson2 from "~/hsk/level-2";
import lesson3 from "~/hsk/level-3";
import lesson4 from "~/hsk/level-4";
import lesson5 from "~/hsk/level-5";
import lesson6 from "~/hsk/level-6";

export const HSK_MAP = {
  1: lesson1,
  2: lesson2,
  3: lesson3,
  4: lesson4,
  5: lesson5,
  6: lesson6,
};

export const HSK_LIST = Object.values(HSK_MAP);

export const ALL_HSK_WORDS = HSK_LIST.map((hskList) => hskList.words).flat();
