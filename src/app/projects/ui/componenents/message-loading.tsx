"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const ShimmerMessage = () => {
  const messages = [
    "Thinking...",
    "Loading...",
    "Generating...",
    "Build Your Website...",
    "Crafting Components...",
    "Optimized Layout...",
    "Adding Final Touch...",
    "Almost Ready...",
  ];

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((pre) => (pre + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex item-center gap-2">
      <span className="text-base text-muted-foreground animate-pulse">
        {messages[currentMessageIndex]}
      </span>
    </div>
  );
};

export const MessageLoading = () => {
  return (
    <div className="flex flex-col group px-2 pb-4 ">
      <div className="flex item-center gap-2 pl-2 mb-2">
        <Image
          src="/logo.svg"
          alt="Vibe"
          width={18}
          height={18}
          className="shrink-0"
        />

        <span className="text-sm font-medium">Vibe</span>
      </div>
      <div className="pl-8.5 flex flex-col gap-y-4">
        <ShimmerMessage />
      </div>
    </div>
  );
};
