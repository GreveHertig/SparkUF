"use client";

import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LockedState } from "@/components/ui/LockedState";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import { formatCount } from "@/i18n/format";
import type { CampaignRow, OutreachStatus } from "@/ports/OutreachProvider";

export type CustomersData = {
  rows: CampaignRow[];
};

const statusToneClasses: Record<OutreachStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-slate-100 text-slate-600",
  opened: "bg-data-register-bg text-data-register",
  responded: "bg-data-customer-bg text-data-customer",
};

/** Kunder (avsnitt 6): kundlistan, utskick, öppningar och svar. */
export function Customers({ data }: { data: CustomersData }) {
  const { locale, t } = useI18n();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <Eyebrow>{t.appShell.nav.customers}</Eyebrow>
        <EditorialHeading as="h1" className="mt-2">
          {t.customersPage.title}
        </EditorialHeading>
        <p className="mt-2 text-sm text-slate-600">{t.customersPage.subtitle}</p>
      </div>

      {data.rows.length === 0 ? (
        <LockedState unlockHint={`${t.homePage.unlocksAfterStepBefore} 03`} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                <th className="px-4 py-3">{t.customersPage.tableCompany}</th>
                <th className="px-4 py-3">{t.customersPage.tableSni}</th>
                <th className="px-4 py-3">{t.customersPage.tableEmployees}</th>
                <th className="px-4 py-3">{t.customersPage.tableRevenue}</th>
                <th className="px-4 py-3">{t.customersPage.tableStatus}</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.companyName} className="border-b border-slate-100 last:border-0 align-top">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {row.companyName}
                    {row.quote && (
                      <p className="mt-1 text-xs italic text-slate-600">
                        {t.customersPage.responseQuoteLabel}: &quot;{row.quote}&quot;
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-600">{row.sniCode}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-600">{row.employees}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-600">
                    {formatCount(row.revenueKsek, locale)} tkr
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-pill px-2 py-0.5 text-xs font-semibold uppercase",
                        statusToneClasses[row.status],
                      )}
                      style={{ letterSpacing: "var(--tracking-label)" }}
                    >
                      {t.customersPage.status[row.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
