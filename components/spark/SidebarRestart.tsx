"use client";

import { useI18n } from "@/i18n/context";
import { useDemoStore } from "@/adapters/demo/demoStore";

/**
 * Sidomenyns sidfotsknapp (artefaktens `.side-foot .restart`) — demo-bara,
 * precis som `DemoBar`. Samma återställningsåtgärd som demoradens "Återställ"
 * (`useDemoStore().reset`), bara en andra ingång till den, på den plats
 * artefakten har den. `AppShell` känner inte till att den finns — skickas in
 * via en valfri sidfots-slot, samma icke-demo-medvetna mönster som
 * `bottomBar`/`headerLeft`.
 */
export function SidebarRestart() {
  const { t } = useI18n();
  const reset = useDemoStore((state) => state.reset);

  return (
    <button
      type="button"
      onClick={() => {
        if (window.confirm(t.demoBar.resetConfirm)) reset();
      }}
      className="text-left text-xs text-slate-400 transition-colors hover:text-accent-300"
      style={{ transitionDuration: "var(--motion-fast)", transitionTimingFunction: "var(--ease-standard)" }}
    >
      {t.appShell.restartDemo}
    </button>
  );
}
