import lesson1 from "~/chinese/hsk/level-1";
import lesson2 from "~/chinese/hsk/level-2";
import lesson3 from "~/chinese/hsk/level-3";
import lesson4 from "~/chinese/hsk/level-4";
import lesson5 from "~/chinese/hsk/level-5";
import lesson6 from "~/chinese/hsk/level-6";
import type HskLevel from "~/types/HskLevel";
import type HskList from "~/types/HskList";

export const HSK_MAP: Record<HskLevel, HskList> = {
  1: lesson1,
  2: lesson2,
  3: lesson3,
  4: lesson4,
  5: lesson5,
  6: lesson6,
};

export const HSK_LIST = Object.values(HSK_MAP);

export const ALL_HSK_WORDS = HSK_LIST.map((hskList) => hskList.words).flat();
