import type { ImgHTMLAttributes } from "react";

export const BUBBLE_COLOURS = [
  "rose",
  "mint",
  "amber",
  "violet",
  "sky",
  "coral",
] as const;

export type BubbleColour = (typeof BUBBLE_COLOURS)[number];

/**
 * Computes a deterministic bubble avatar colour for a given seed (e.g. user or admin name).
 * Algorithm:
 * 1. Trim the seed. If empty, return "rose".
 * 2. Take the first whitespace-separated word, lower-cased. If empty, return "rose".
 * 3. Sum the UTF-16 code units of that word.
 * 4. Return BUBBLE_COLOURS[sum % 6].
 */
export function bubbleColourFor(seed: string): BubbleColour {
  const trimmed = seed.trim();
  if (!trimmed) {
    return "rose";
  }

  const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase() ?? "";
  if (!firstWord) {
    return "rose";
  }

  let sum = 0;
  for (let i = 0; i < firstWord.length; i += 1) {
    sum += firstWord.charCodeAt(i);
  }

  const index = sum % BUBBLE_COLOURS.length;
  return BUBBLE_COLOURS[index] ?? "rose";
}

export interface BubbleAvatarProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  seed?: string | null;
  size?: number;
}

export function BubbleAvatar({
  seed = "",
  size = 40,
  className = "",
  ...rest
}: BubbleAvatarProps) {
  const colour = bubbleColourFor(seed ?? "");

  return (
    <img
      src={`/avatars/bubble_${colour}.png`}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={`inline-block shrink-0 select-none object-contain ${className}`.trim()}
      {...rest}
    />
  );
}
