"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../ui/Button";
import type { ChapterNavigation } from "@/lib/bible/types";

type ChapterNavigatorProps = {
  version: string;
  book: string;
  chapter: number;
  maxChapter: number;
  previous: ChapterNavigation;
  next: ChapterNavigation;
};

export default function ChapterNavigator({
  version,
  book,
  chapter,
  maxChapter,
  previous,
  next,
}: ChapterNavigatorProps) {
  const router = useRouter();
  const [value, setValue] = useState(String(chapter));

  const goTo = (targetBook: string, targetChapter: number) => {
    router.push(`/bible/${version}/${targetBook}/${targetChapter}`);
  };

  const handleChapterJump = () => {
    const target = Number(value);
    if (!Number.isFinite(target) || target < 1 || target > maxChapter) return;
    goTo(book, target);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={!previous}
          onClick={() => previous && goTo(previous.book, previous.chapter)}
          className="px-3! py-1.5! text-sm"
        >
          Prev
        </Button>
        <Button
          variant="outline"
          disabled={!next}
          onClick={() => next && goTo(next.book, next.chapter)}
          className="px-3! py-1.5! text-sm"
        >
          Next
        </Button>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleChapterJump();
        }}
        className="flex items-center gap-2"
      >
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="w-16 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm dark:border-white/15 dark:bg-slate-950"
          aria-label={`Chapter number (1-${maxChapter})`}
        />
        <Button type="submit" className="px-3! py-1.5! text-sm">
          Go
        </Button>
        <span className="text-xs text-slate-500">of {maxChapter}</span>
      </form>
    </div>
  );
}
