import type MaybeNull from "~/types/MaybeNull";

export default function lastInArray<T>(arr: T[]): MaybeNull<T> {
  return arr.length > 0 ? (arr[arr.length - 1] as T) : null;
}
