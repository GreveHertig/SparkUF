import type { RegistryCompany } from "@/ports/RegistryProvider";
import { SIZE_CLASSES, type SizeClass } from "./sizeClass";

export type SizeBucket = { key: SizeClass["key"]; count: number };

/**
 * Marknadens storleksfördelning, rubrikens spann och den vanligaste klassen
 * (PR 8, docs/plan-en-design.md punkt 5: logik i sidorna flyttas till core/
 * så att demot och appen räknar likadant). Skärmen visar klasser, aldrig ett
 * enskilt bolags exakta antal anställda.
 */
export function sizeDistribution(companies: readonly RegistryCompany[]): SizeBucket[] {
  return SIZE_CLASSES.map((size) => ({
    key: size.key,
    count: companies.filter((c) => c.employees >= size.min && c.employees <= size.max).length,
  }));
}

/** Den vanligaste klassen (den första vid lika), eller `null` utan bolag. */
export function dominantBucket(
  distribution: readonly SizeBucket[],
  total: number,
): (SizeBucket & { percent: number }) | null {
  if (total === 0 || distribution.length === 0) return null;
  const dominant = distribution.reduce((best, bucket) => (bucket.count > best.count ? bucket : best), distribution[0]);
  return { ...dominant, percent: Math.round((dominant.count / total) * 100) };
}

/** Minsta och största antal anställda i urvalet, till sidans rubrik. */
export function employeeSpan(companies: readonly RegistryCompany[]): { min: number; max: number } | null {
  if (companies.length === 0) return null;
  const sizes = companies.map((company) => company.employees);
  return { min: Math.min(...sizes), max: Math.max(...sizes) };
}
