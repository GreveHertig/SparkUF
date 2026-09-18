"use client";

import { useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { saraBeats } from "@/adapters/demo/sara";

/**
 * Demoraden (avsnitt 9.1): fast rad nederst i /demo/app, hopfällbar, med
 * tangentbordsstyrning (← → navigerar, T rundtur, R återställer). Demo-bara
 * komponent — importerar demomotorn direkt i stället för att ta emot data
 * via en port, eftersom /app inte har någon demorad att vara agnostisk om.
 */
export function DemoBar() {
  const { locale, t } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const tourOn = useDemoStore((state) => state.tourOn);
  const collapsed = useDemoStore((state) => state.collapsed);
  const next = useDemoStore((state) => state.next);
  const back = useDemoStore((state) => state.back);
  const goTo = useDemoStore((state) => state.goTo);
  const toggleTour = useDemoStore((state) => state.toggleTour);
  const toggleCollapsed = useDemoStore((state) => state.toggleCollapsed);
  const setEntry = useDemoStore((state) => state.setEntry);
  const reset = useDemoStore((state) => state.reset);

  const beat = saraBeats[beatIndex];
  const atStart = beatIndex === 0;
  const atEnd = beatIndex === saraBeats.length - 1;

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        back();
      } else if (event.key === "t" || event.key === "T") {
        toggleTour();
      } else if (event.key === "r" || event.key === "R") {
        if (window.confirm(t.demoBar.resetConfirm)) reset();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [next, back, toggleTour, reset, t]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-700 bg-ink-800 text-paper-50">
      <div className="flex items-center gap-2 px-4 py-1.5">
        <span
          className="rounded-pill bg-slate-700 px-2.5 py-1 text-xs font-semibold uppercase text-paper-50"
          style={{ letterSpacing: "var(--tracking-label)" }}
        >
          {t.demoBar.personaLabel}
        </span>

        {!collapsed && (
          <span className="text-xs text-slate-300">
            {t.demoBar.stepLabel} {beat.stepNumber} {t.demoBar.stepOf} · {t.demoBar.phaseLabel}{" "}
            {t.demoBar.phases[beat.phase]} · {beat.momentLabel[locale]}
          </span>
        )}

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? t.demoBar.expand : t.demoBar.collapse}
          className="ml-auto rounded-md px-2 py-1 text-xs font-semibold text-slate-300 hover:text-paper-50 focus-visible:outline-2 focus-visible:outline-accent-300"
        >
          {collapsed ? "▲" : "▼"}
        </button>
      </div>

      {!collapsed && (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-700 px-4 py-2">
          <button
            type="button"
            onClick={back}
            disabled={atStart}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-paper-50 hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-accent-300 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            ◀ {t.demoBar.back}
          </button>
          <button
            type="button"
            onClick={next}
            disabled={atEnd}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-paper-50 hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-accent-300 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            {t.demoBar.next} ▶
          </button>

          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                type="button"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-paper-50 hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-accent-300"
              >
                {t.demoBar.jumpToStep}
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                side="top"
                align="start"
                sideOffset={8}
                className="z-50 flex flex-col gap-1 rounded-md border border-slate-200 bg-white p-2 shadow-lg"
              >
                {saraBeats.map((scenarioBeat, index) => (
                  <Popover.Close asChild key={scenarioBeat.id}>
                    <button
                      type="button"
                      onClick={() => goTo(index)}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100",
                        index === beatIndex && "bg-accent-100 font-semibold text-accent-700",
                      )}
                    >
                      {t.demoBar.stepLabel} {scenarioBeat.stepNumber} · {scenarioBeat.momentLabel[locale]}
                    </button>
                  </Popover.Close>
                ))}
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>

          <button
            type="button"
            aria-pressed={tourOn}
            onClick={toggleTour}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-paper-50 hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-accent-300"
          >
            {tourOn ? t.demoBar.tourOn : t.demoBar.tourOff}
          </button>

          <button
            type="button"
            onClick={() => setEntry(entry === "noIdea" ? "hasIdea" : "noIdea")}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-paper-50 hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-accent-300"
          >
            {t.demoBar.switchEntry} ({entry === "noIdea" ? t.demoBar.entryNoIdea : t.demoBar.entryHasIdea})
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm(t.demoBar.resetConfirm)) reset();
            }}
            // `text-score-red` är bara kontrasttestad mot score-red-bg (ljus
            // yta, DESIGN.md/Session 1) — mot ink-800 ger den ~2.5:1, under
            // WCAG AA. paper-50 håller kontrasten, destruktiviteten kommuniceras
            // av bekräftelsedialogen i stället för av färgen.
            className="ml-auto rounded-md px-3 py-1.5 text-sm font-medium text-paper-50 hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-accent-300"
          >
            {t.demoBar.reset}
          </button>
        </div>
      )}
    </div>
  );
}
