"use server";

import { revalidatePath } from "next/cache";
import { liveRegistryProvider } from "@/adapters/live/RegistryProvider";
import { recordRegistryEvidence, type RegistryEvidenceItem } from "@/adapters/live/EvidenceRecorder";
import { EmptyStateError, RegistryInputError, RegistryLockedError, RegistryTransportError } from "@/core/errors";
import { fill } from "@/i18n/fill";
import { sv } from "@/i18n/sv";

/** Samma form som sidan tar emot (`?sni=69.201`). */
const SNI_PATTERN = /^\d{2}\.\d{3}$/;

export type SaveMarketEvidenceResult =
  | { ok: true; total: number; delta: number }
  | { ok: false; reason: "invalid" | "closed" | "failed" | "empty" | "noProject" };

/**
 * Sparar registerbilden för en bransch som underlag i resan (beslut i
 * docs/beslut.md 2026-10-04): antalet verksamma aktiebolag som
 * `registerMarketCount` (steg 03) och konkurrenterna som
 * `registerCompetitorSet` (steg 04), båda som systembevis.
 *
 * Bara SNI-koden tas emot. Siffrorna hämtas på nytt här på servern, bakom
 * licensgrinden, och kommer aldrig från klienten. En sida som läses skriver
 * aldrig något (beslut B10); det här är grundarens uttryckliga handling.
 * Citaten bär antal, aldrig bolagsnamn (dataspiken §6 fråga 4).
 */
export async function saveMarketEvidence(sniCode: unknown): Promise<SaveMarketEvidenceResult> {
  if (typeof sniCode !== "string" || !SNI_PATTERN.test(sniCode.trim())) return { ok: false, reason: "invalid" };
  const sni = sniCode.trim();
  const subject = `sni:${sni.replace(".", "")}`;
  const copy = sv.marketPage.evidence;

  let overview;
  try {
    overview = await liveRegistryProvider.getMarketOverview("sv", sni);
  } catch (error) {
    if (error instanceof RegistryLockedError) return { ok: false, reason: "closed" };
    if (error instanceof RegistryInputError) return { ok: false, reason: "invalid" };
    if (error instanceof RegistryTransportError) return { ok: false, reason: "failed" };
    throw error;
  }

  const items: RegistryEvidenceItem[] = [];
  if (overview.companyCount > 0) {
    items.push({
      kind: "registerMarketCount",
      subjectRef: `${subject}:antal`,
      source: overview.source,
      quote: fill(copy.countQuote, { count: overview.companyCount, sni }),
      stepNumber: 3,
    });
  }
  if (overview.competitors.length > 0) {
    items.push({
      kind: "registerCompetitorSet",
      subjectRef: `${subject}:konkurrenter`,
      source: overview.source,
      quote: fill(copy.competitorsQuote, { count: overview.competitors.length, sni }),
      stepNumber: 4,
    });
  }
  if (items.length === 0) return { ok: false, reason: "empty" };

  try {
    const snapshot = await recordRegistryEvidence(items, "sv");
    revalidatePath("/app", "layout");
    return { ok: true, total: snapshot.total, delta: snapshot.delta };
  } catch (error) {
    if (error instanceof EmptyStateError) return { ok: false, reason: "noProject" };
    throw error;
  }
}
