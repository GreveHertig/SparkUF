"use client";

import { EditorialHeading } from "./EditorialHeading";
import { Eyebrow } from "./Eyebrow";
import { useI18n } from "@/i18n/context";

/**
 * Formgivet tillstånd för en del av /app vars liveadapter ännu inte är byggd
 * (avsnitt 5.4, 14.4) — visas i stället för ett fel när adaptern kastar
 * NotImplementedError. Ett Server Component-route kan rendera den som barn
 * utan att själv känna till i18n-kontexten (den är klientbaserad).
 */
export function ComingSoon() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-start gap-3 rounded-md border border-slate-200 bg-white p-8 shadow-lg">
      <Eyebrow>{t.comingSoon.eyebrow}</Eyebrow>
      <EditorialHeading as="h2">{t.comingSoon.title}</EditorialHeading>
      <p className="max-w-md text-sm text-slate-600">{t.comingSoon.body}</p>
    </div>
  );
}
