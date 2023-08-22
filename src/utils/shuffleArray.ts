// From: https://stackoverflow.com/a/2450976/6420189
export default function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length;
  let randomIndex = undefined;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // @ts-ignore
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }

  return array;
}
