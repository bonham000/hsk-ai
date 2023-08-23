import { type ReactNode } from "react";

export default function HighlightCharacter(
  label: string,
  value: string,
  isReviewSentence: boolean
): ReactNode {
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
}
