import { BusinessPlan, type BusinessPlanData } from "@/screens/BusinessPlan";

/**
 * Affärsplanen i /app (PR 10, docs/plan-en-design.md). Planen har ingen egen
 * port: den sätts samman av `buildBusinessPlan` (core/businessPlan.ts) ur
 * kontrollpunkter som någon måste samla ihop ur portarna. I demot gör
 * demots egen hopsamling det; för /app finns ingen sådan hopsamling
 * än. Varje avsnitt visar därför "Kommer snart" och mognaden luckan "—".
 * Ingen plan sätts samman av halva underlaget, och demots plan används aldrig.
 */
export default function LiveBusinessPlanPage() {
  const data: BusinessPlanData = { plan: null };
  return <BusinessPlan data={data} />;
}
