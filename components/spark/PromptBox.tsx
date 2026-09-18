"use client";

import { useI18n } from "@/i18n/context";
import { cn } from "@/design/cn";

/**
 * Centrerad promptruta (designuppdatering: high-tech dashboard,
 * design-referens/dashboard/). Medgrundaren i demot är helt förskriven
 * (se ChatMessage.tsx) — den här rutan är därför en visuell affordans, inte
 * en riktig inmatning: disabled textarea + disabled skicka-knapp, ingen
 * koppling till demomotorn eller nytt innehåll.
 */
export function PromptBox({ className }: { className?: string }) {
  const { t } = useI18n();

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-4px_rgba(38,43,49,0.12)]",
        className,
      )}
    >
      <div className="flex items-end gap-3 px-4 py-3">
        <textarea
          disabled
          rows={1}
          placeholder={t.cofounderPage.promptPlaceholder}
          aria-label={t.cofounderPage.promptPlaceholder}
          className="max-h-24 flex-1 resize-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus-visible:outline-none disabled:cursor-not-allowed"
        />
        <button
          type="button"
          disabled
          aria-label={t.cofounderPage.promptSendLabel}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-600 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 19V5M12 5l-6 6M12 5l6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
