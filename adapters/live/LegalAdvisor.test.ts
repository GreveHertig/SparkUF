import { describe, it, expect, vi, beforeEach } from "vitest";
import { liveLegalAdvisor } from "@/adapters/live/LegalAdvisor";
import { generateJson } from "@/lib/server/gemini";
import { KURERADE_KÄLLOR } from "@/adapters/live/legalSources";
import type { Bolagsform } from "@/core/domain";

vi.mock("@/lib/server/gemini", () => ({
  generateJson: vi.fn(),
}));

const mockedGenerateJson = vi.mocked(generateJson);

function svar(krav: unknown[]) {
  return JSON.stringify({ krav });
}

beforeEach(() => {
  mockedGenerateJson.mockReset();
});

describe("liveLegalAdvisor.getLegalMap", () => {
  it("kastar på en ogiltig bolagsform, utan att anropa Gemini", async () => {
    await expect(
      liveLegalAdvisor.getLegalMap("ab" as unknown as Bolagsform),
    ).rejects.toThrow();
    expect(mockedGenerateJson).not.toHaveBeenCalled();
  });

  it("kastar på tom sträng som bolagsform, utan att anropa Gemini", async () => {
    await expect(
      liveLegalAdvisor.getLegalMap("" as unknown as Bolagsform),
    ).rejects.toThrow();
    expect(mockedGenerateJson).not.toHaveBeenCalled();
  });

  it("returnerar [] när Gemini legitimt inte hittar något tillämpligt krav", async () => {
    mockedGenerateJson.mockResolvedValue(svar([]));
    const result = await liveLegalAdvisor.getLegalMap("aktiebolag");
    expect(result).toEqual([]);
  });

  it("kastar på trasig JSON i stället för att returnera []", async () => {
    mockedGenerateJson.mockResolvedValue("det här är inte json");
    await expect(liveLegalAdvisor.getLegalMap("aktiebolag")).rejects.toThrow();
  });

  it("kastar på ett topicId som inte finns i katalogen", async () => {
    mockedGenerateJson.mockResolvedValue(
      svar([
        {
          topicId: "hittat_pa_amne",
          rubrik: "Något",
          beskrivning: "En påhittad beskrivning som är tillräckligt lång.",
          tillamplighet: "applicable",
        },
      ]),
    );
    await expect(liveLegalAdvisor.getLegalMap("aktiebolag")).rejects.toThrow();
  });

  it("kastar om modellen bifogar extra fält, t.ex. en egen källa", async () => {
    mockedGenerateJson.mockResolvedValue(
      svar([
        {
          topicId: "registrering",
          rubrik: "Registrera företaget",
          beskrivning: "Registrera aktiebolaget hos Bolagsverket.",
          tillamplighet: "applicable",
          källa: { namn: "Påhittad källa", hämtad: "2020-01-01" },
        },
      ]),
    );
    await expect(liveLegalAdvisor.getLegalMap("aktiebolag")).rejects.toThrow();
  });

  it("kastar om beskrivningen innehåller en url", async () => {
    mockedGenerateJson.mockResolvedValue(
      svar([
        {
          topicId: "registrering",
          rubrik: "Registrera företaget",
          beskrivning: "Läs mer på https://exempel.se om hur du gör.",
          tillamplighet: "applicable",
        },
      ]),
    );
    await expect(liveLegalAdvisor.getLegalMap("aktiebolag")).rejects.toThrow();
  });

  it("filtrerar bort ett ämne som modellen valt men som inte gäller bolagsformen", async () => {
    mockedGenerateJson.mockResolvedValue(
      svar([
        {
          // aktiekapital gäller bara aktiebolag, inte enskild firma
          topicId: "aktiekapital",
          rubrik: "Aktiekapital",
          beskrivning: "Sätt in aktiekapitalet på en bank innan registrering.",
          tillamplighet: "applicable",
        },
        {
          topicId: "f_skatt",
          rubrik: "F-skatt",
          beskrivning: "Ansök om F-skatt hos Skatteverket.",
          tillamplighet: "applicable",
        },
      ]),
    );
    const result = await liveLegalAdvisor.getLegalMap("enskild_firma");
    expect(result.map((k) => k.id)).toEqual(["f_skatt"]);
  });

  it("filtrerar bort ämnen modellen märkt not_applicable", async () => {
    mockedGenerateJson.mockResolvedValue(
      svar([
        {
          topicId: "f_skatt",
          rubrik: "F-skatt",
          beskrivning: "Ansök om F-skatt hos Skatteverket.",
          tillamplighet: "not_applicable",
        },
      ]),
    );
    const result = await liveLegalAdvisor.getLegalMap("aktiebolag");
    expect(result).toEqual([]);
  });

  it("dubblettordnar bort samma topicId två gånger", async () => {
    mockedGenerateJson.mockResolvedValue(
      svar([
        {
          topicId: "f_skatt",
          rubrik: "F-skatt (första)",
          beskrivning: "Ansök om F-skatt hos Skatteverket.",
          tillamplighet: "applicable",
        },
        {
          topicId: "f_skatt",
          rubrik: "F-skatt (andra)",
          beskrivning: "Ansök om F-skatt hos Skatteverket, igen.",
          tillamplighet: "applicable",
        },
      ]),
    );
    const result = await liveLegalAdvisor.getLegalMap("aktiebolag");
    expect(result).toHaveLength(1);
    expect(result[0]?.rubrik).toBe("F-skatt (första)");
  });

  it("låter applicable vinna över en tidigare not_applicable-dubblett av samma ämne", async () => {
    mockedGenerateJson.mockResolvedValue(
      svar([
        {
          topicId: "f_skatt",
          rubrik: "F-skatt (fel bedömning)",
          beskrivning: "Ansök om F-skatt hos Skatteverket.",
          tillamplighet: "not_applicable",
        },
        {
          topicId: "f_skatt",
          rubrik: "F-skatt (rätt bedömning)",
          beskrivning: "Ansök om F-skatt hos Skatteverket innan start.",
          tillamplighet: "applicable",
        },
      ]),
    );
    const result = await liveLegalAdvisor.getLegalMap("aktiebolag");
    expect(result.map((k) => k.id)).toEqual(["f_skatt"]);
    expect(result[0]?.rubrik).toBe("F-skatt (rätt bedömning)");
  });

  it("injicerar alltid den kuraterade källan, aldrig något modellen skickat", async () => {
    mockedGenerateJson.mockResolvedValue(
      svar([
        {
          topicId: "f_skatt",
          rubrik: "F-skatt",
          beskrivning: "Ansök om F-skatt hos Skatteverket.",
          tillamplighet: "applicable",
        },
      ]),
    );
    const result = await liveLegalAdvisor.getLegalMap("aktiebolag");
    expect(result[0]?.källa).toEqual(KURERADE_KÄLLOR.skatteverket);
  });

  it("slår ihop ett Gemini-fel till ett tydligt fel i stället för att låta det passera opåverkat", async () => {
    mockedGenerateJson.mockRejectedValue(new Error("nätverksfel"));
    await expect(liveLegalAdvisor.getLegalMap("aktiebolag")).rejects.toThrow();
  });
});
