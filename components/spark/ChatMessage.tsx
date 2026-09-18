"use client";

import { cn } from "@/design/cn";

type ChatMessageProps = {
  role: "founder" | "cofounder";
  text: string;
  className?: string;
};

/** Ett meddelande i Medgrundarens chattyta (uppdrag 8: ChatMessage). Ingen
 * inmatning i demot — bara förskriven, klickbar-igenom dialog. */
export function ChatMessage({ role, text, className }: ChatMessageProps) {
  const isFounder = role === "founder";

  return (
    <div className={cn("flex", isFounder ? "justify-end" : "justify-start", className)}>
      <p
        className={cn(
          "max-w-lg rounded-lg px-3.5 py-2 text-sm leading-snug",
          isFounder ? "bg-accent-600 text-white" : "border border-slate-200 bg-white text-slate-900",
        )}
      >
        {text}
      </p>
    </div>
  );
}
