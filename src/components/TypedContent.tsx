import { type MouseEvent, useState, useEffect } from "react";
import { useInterval } from "usehooks-ts";
import HighlightCharacter from "~/components/HighlightCharacter";
import type MaybeNull from "~/types/MaybeNull";
import noop from "~/utils/noop";

type TypedContentProps = {
  character?: string;
  className?: React.ComponentProps<"div">["className"];
  content: string;
  isCurrent?: boolean;
  isReviewSentence?: boolean;
  onClick?: (e: MouseEvent<HTMLParagraphElement>) => void;
  onStartedTyping?: () => void;
  setFinishedTyping?: () => void;
  typingDelay?: number;
};

export default function TypedContent(props: TypedContentProps) {
  const {
    character,
    className,
    content,
    isCurrent = false,
    isReviewSentence = false,
    onClick = noop,
    onStartedTyping = noop,
    setFinishedTyping = noop,
    typingDelay = 40,
  } = props;
  const [startedTyping, setStartedTyping] = useState(false);
  const [revealIndex, setRevealedIndex] = useState(0);

  const delay = revealIndex < content.length ? typingDelay : null;
  useInterval(() => {
    if (startedTyping === false) {
      onStartedTyping();
      setStartedTyping(true);
    }
    setRevealedIndex((cur) => cur + 1);
  }, delay);

  useEffect(() => {
    let timeout: MaybeNull<ReturnType<typeof setTimeout>> = null;
    if (delay == null) {
      timeout = setTimeout(() => {
        setFinishedTyping();
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
    <p className={className} onClick={onClick}>
      {character == null || !isCurrent
        ? revealed
        : HighlightCharacter(revealed, character, isReviewSentence)}
    </p>
  );
}
