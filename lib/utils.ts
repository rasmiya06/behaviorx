import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(ms: number): string {
  const seconds = (ms / 1000).toFixed(2);
  return `00:${seconds.padStart(5, '0')}`;
}
