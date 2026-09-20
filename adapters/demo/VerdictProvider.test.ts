import { beforeEach, describe, expect, it } from "vitest";
import { useDemoStore } from "./demoStore";
import { demoVerdictProvider } from "./VerdictProvider";
import { getBeatAt } from "./sara";

function goToBeat(id: string) {
  for (let i = 0; i < 200; i++) {
    if (getBeatAt(i).id === id) return useDemoStore.getState().goTo(i);
  }
  throw new Error(`beat ${id} saknas`);
}

describe("demoVerdictProvider", () => {
  beforeEach(() => {
    useDemoStore.getState().setEntry("noIdea");
  });

  it("Sara efter svaren: refine med citat, siffror och källa", async () => {
    goToBeat("05b-svaren-efter");
    const report = await demoVerdictProvider.getVerdictReport("sv");
    expect(report).not.toBeNull();
    expect(report!.verdict.stats.responded).toBe(9);
    expect(report!.verdict.decision).toBe("refine");
    expect(report!.verdict.reasonCodes).toEqual(expect.arrayContaining(["priceTooHigh", "segmentSkew"]));
    expect(report!.quotes.length).toBeGreaterThan(0);
    for (const q of report!.quotes) expect(q.source.hämtad).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(report!.pivotTraceEvent).toBeNull();
  });

  it("ingång B (Jonas) har inga svar att döma på: null", async () => {
    useDemoStore.getState().setEntry("hasIdea");
    expect(await demoVerdictProvider.getVerdictReport("sv")).toBeNull();
  });

  it("före utskicket: null", async () => {
    useDemoStore.getState().goTo(0);
    expect(await demoVerdictProvider.getVerdictInput("en")).toBeNull();
  });
});
