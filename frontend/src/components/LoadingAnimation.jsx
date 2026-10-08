import React, { useEffect, useState } from "react";

const STATUS_LABELS = ["Thinking", "Analyzing", "Reasoning", "Searching"];
const STATUS_INTERVAL_MS = 1000;

const LoadingAnimation = () => {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStatusIndex((index) => (index + 1) % STATUS_LABELS.length);
    }, STATUS_INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  const label = STATUS_LABELS[statusIndex];

  return (
    <div
      role="status"
      aria-label="Generating response"
      aria-live="polite"
      className="flex items-center gap-2.5 rounded-2xl border border-white/[0.06] px-3.5 py-2.5 w-fit max-w-[88%] sm:max-w-[80%]"
    >
      <span
        className="thinking-pulse-dot h-2 w-2 shrink-0 rounded-full bg-indigo-400"
        aria-hidden="true"
      />
      <span
        key={label}
        className="thinking-status-label text-[14px] font-medium tracking-tight text-slate-400"
      >
        {label}
      </span>
      <span className="flex items-center gap-1" aria-hidden="true">
        <span className="thinking-dot h-1 w-1 rounded-full bg-slate-500" />
        <span className="thinking-dot thinking-dot-delay-1 h-1 w-1 rounded-full bg-slate-500" />
        <span className="thinking-dot thinking-dot-delay-2 h-1 w-1 rounded-full bg-slate-500" />
      </span>
    </div>
  );
};

export default LoadingAnimation;
