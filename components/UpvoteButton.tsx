"use client";

import { useState, useTransition } from "react";
import { toggleUpvote } from "@/features/requests/actions";

interface UpvoteButtonProps {
  requestId: string;
  userId: string;
  initiallyUpvoted: boolean;
  upvoteCount: number;
}

export function UpvoteButton({ requestId, userId, initiallyUpvoted, upvoteCount }: UpvoteButtonProps) {
  const [upvoted, setUpvoted] = useState(initiallyUpvoted);
  const [count, setCount] = useState(upvoteCount);
  const [pending, startTransition] = useTransition();

  const handleToggle = () => {
    const newUpvoted = !upvoted;
    setUpvoted(newUpvoted);
    setCount((c) => (newUpvoted ? c + 1 : c - 1));

    startTransition(async () => {
      await toggleUpvote(requestId, userId, upvoted);
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      className={`upvote ${upvoted ? "voted" : ""}`}
    >
      {upvoted ? "▲ Upvoted" : "▲ Upvote"}
    </button>
  );
}
