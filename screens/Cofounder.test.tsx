import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { Cofounder, type CofounderData, type CofounderLive } from "./Cofounder";

afterEach(() => cleanup());

const moment: CofounderData["moment"] = {
  label: "03 · Marknaden",
  items: [
    { kind: "message", role: "cofounder", text: { sv: "Jag tittar i registret.", en: "Looking at the registry." } },
    { kind: "tool", label: { sv: "Registret", en: "Registry" }, steps: { sv: ["Hämtar bolag"], en: ["Fetching companies"] } },
    { kind: "timeSkip", label: { sv: "4 dagar senare", en: "4 days later" } },
    { kind: "message", role: "founder", text: { sv: "Kan Lovable bygga det?", en: "Can Lovable build it?" } },
  ],
};

function renderCofounder(data: CofounderData, live?: CofounderLive) {
  return render(
    <LocaleProvider>
      <Cofounder data={data} live={live} />
    </LocaleProvider>,
  );
}

describe("Cofounder (PR 10)", () => {
  it("visar momentets etikett och alla tre sorters inslag, utan Kommer snart", () => {
    renderCofounder({ moment, context: [] });
    expect(screen.getByRole("heading", { level: 1, name: sv.cofounderPage.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "03 · Marknaden" })).toBeInTheDocument();
    expect(screen.getByText("Jag tittar i registret.")).toBeInTheDocument();
    expect(screen.getByText(`${sv.cofounderPage.toolRunningLabel}: Registret`)).toBeInTheDocument();
    expect(screen.getByText("Hämtar bolag")).toBeInTheDocument();
    expect(screen.getByText("4 dagar senare")).toBeInTheDocument();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
  });

  it("ett koncept i samtalet eller i kontexten bär koncept-etiketten", () => {
    renderCofounder({ moment, context: [{ id: "a", text: "Prissimuleringen (Hiasynth)" }] });
    expect(screen.getAllByText(sv.common.conceptBadge)).toHaveLength(2);
  });

  it("en tom kontext döljer spalten, en ifylld visas i ordning", () => {
    renderCofounder({ moment, context: [] });
    expect(screen.queryByRole("heading", { name: sv.cofounderPage.contextTitle })).not.toBeInTheDocument();
    cleanup();

    renderCofounder({ moment, context: [{ id: "a", text: "Första" }, { id: "b", text: "Andra" }] });
    const aside = screen.getByRole("complementary");
    expect(within(aside).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Första", "Andra"]);
  });

  it("ett moment utan inslag visar tomläget", () => {
    renderCofounder({ moment: { label: "01 · Om dig", items: [] }, context: [] });
    expect(screen.getByText(sv.cofounderPage.emptyStateBody)).toBeInTheDocument();
  });

  it("platshållare per sektion: saknat moment och saknad kontext ger var sin Kommer snart", () => {
    renderCofounder({ moment: null, context: [{ id: "a", text: "Känt sedan tidigare" }] });
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(1);
    expect(screen.getByText("Känt sedan tidigare")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: sv.cofounderPage.title })).toBeInTheDocument();
    cleanup();

    renderCofounder({ moment, context: null });
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(1);
    expect(screen.getByText("Jag tittar i registret.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: sv.cofounderPage.contextTitle })).toBeInTheDocument();
  });

  it("promptfältet är avstängt", () => {
    renderCofounder({ moment: null, context: null });
    expect(screen.getByRole("textbox", { name: sv.cofounderPage.promptPlaceholder })).toBeDisabled();
    expect(screen.getByRole("button", { name: sv.cofounderPage.promptSendLabel })).toBeDisabled();
  });
});

describe("Cofounder, den levande chatten (/app)", () => {
  const liveMoment: CofounderData["moment"] = { label: "02 · Möjligheter", items: [] };

  function type(text: string) {
    fireEvent.change(screen.getByRole("textbox", { name: sv.cofounderPage.promptPlaceholder }), { target: { value: text } });
  }

  it("visar det sparade samtalet och ett aktivt fält, men aldrig demots inslag", () => {
    renderCofounder({ moment: { ...liveMoment, items: moment!.items }, context: [] }, {
      messages: [{ role: "cofounder", text: "Vad gör du i dag?" }],
      onSend: vi.fn(),
    });
    expect(screen.getByText("Vad gör du i dag?")).toBeInTheDocument();
    expect(screen.queryByText("Jag tittar i registret.")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeEnabled();
  });

  it("skickar meddelandet och visar svaret", async () => {
    const onSend = vi.fn().mockResolvedValue({ ok: true, reply: { role: "cofounder", text: "Ring tre kunder." } });
    renderCofounder({ moment: liveMoment, context: [] }, { messages: [], onSend });
    expect(screen.getByText(sv.cofounderPage.live.emptyBody)).toBeInTheDocument();
    type("  Var börjar jag?  ");
    fireEvent.click(screen.getByRole("button", { name: sv.cofounderPage.promptSendLabel }));
    expect(onSend).toHaveBeenCalledWith("Var börjar jag?");
    expect(await screen.findByText("Ring tre kunder.")).toBeInTheDocument();
    expect(screen.getByText("Var börjar jag?")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("visar Medgrundarens uppgift som ett eget kort med rubriken Din uppgift (spec v4 §3.1)", async () => {
    const onSend = vi.fn().mockResolvedValue({
      ok: true,
      reply: { role: "cofounder", text: "Idén är svag: ingen har bett om den.", nextTask: "Fråga fem elever i veckan om de skulle betala." },
    });
    renderCofounder(
      { moment: liveMoment, context: [] },
      {
        messages: [
          { role: "founder", text: "Hej" },
          { role: "cofounder", text: "Vad gör du i dag?", nextTask: "Skriv ner tre saker du gör varje vecka." },
        ],
        onSend,
      },
    );
    const first = screen.getByRole("heading", { name: sv.cofounderPage.live.taskTitle });
    expect(first.parentElement).toHaveTextContent("Skriv ner tre saker du gör varje vecka.");
    type("Jag vill sälja läxhjälp.");
    fireEvent.click(screen.getByRole("button", { name: sv.cofounderPage.promptSendLabel }));
    expect(await screen.findByText("Fråga fem elever i veckan om de skulle betala.")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: sv.cofounderPage.live.taskTitle })).toHaveLength(2);
    // Uppgiften är ett eget kort, inte en del av bubblan.
    expect(screen.getByText("Idén är svag: ingen har bett om den.")).not.toHaveTextContent("Fråga fem elever");
  });

  it("ett svar utan uppgift (från före v4) visas utan kort", () => {
    renderCofounder({ moment: liveMoment, context: [] }, { messages: [{ role: "cofounder", text: "Gammalt svar" }], onSend: vi.fn() });
    expect(screen.queryByRole("heading", { name: sv.cofounderPage.live.taskTitle })).not.toBeInTheDocument();
  });

  it("Enter skickar, Skift+Enter gör det inte", async () => {
    const onSend = vi.fn().mockResolvedValue({ ok: true, reply: { role: "cofounder", text: "Svar" } });
    renderCofounder({ moment: liveMoment, context: [] }, { messages: [], onSend });
    type("Hej");
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter", shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(onSend).toHaveBeenCalledWith("Hej");
    await screen.findByText("Svar");
  });

  it("vid taket visas texten ur i18n och meddelandet läggs tillbaka i fältet", async () => {
    const onSend = vi.fn().mockResolvedValue({ ok: false, reason: "dailyLimit" });
    renderCofounder({ moment: liveMoment, context: [] }, { messages: [], onSend });
    type("En fråga till");
    fireEvent.click(screen.getByRole("button", { name: sv.cofounderPage.promptSendLabel }));
    expect(await screen.findByRole("alert")).toHaveTextContent(sv.cofounderPage.live.dailyLimitReached.replace("{limit}", "40"));
    expect(screen.getByRole("textbox")).toHaveValue("En fråga till");
    expect(screen.getByText(sv.cofounderPage.live.emptyBody)).toBeInTheDocument();
  });

  it("ett fel eller ett kastat anrop ger sendFailed, aldrig felets egen text", async () => {
    const onSend = vi.fn().mockRejectedValue(new Error("HEMLIGT serverfel"));
    renderCofounder({ moment: liveMoment, context: [] }, { messages: [], onSend });
    type("Hej");
    fireEvent.click(screen.getByRole("button", { name: sv.cofounderPage.promptSendLabel }));
    expect(await screen.findByRole("alert")).toHaveTextContent(sv.cofounderPage.live.sendFailed);
    expect(screen.queryByText(/HEMLIGT/)).not.toBeInTheDocument();
  });

  it("svarar modellen inte står meddelandet kvar (det är sparat), och fokus kommer tillbaka", async () => {
    const onSend = vi.fn().mockResolvedValue({ ok: false, reason: "failed" });
    renderCofounder({ moment: liveMoment, context: [] }, { messages: [], onSend });
    type("Hej igen");
    fireEvent.click(screen.getByRole("button", { name: sv.cofounderPage.promptSendLabel }));
    expect(await screen.findByRole("alert")).toHaveTextContent(sv.cofounderPage.live.sendFailed);
    expect(screen.getByText("Hej igen")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("");
    await waitFor(() => expect(screen.getByRole("textbox")).toHaveFocus());
  });

  it("längden räknas i tecken: 2000 emoji går att skicka", () => {
    renderCofounder({ moment: liveMoment, context: [] }, { messages: [], onSend: vi.fn() });
    type("😀".repeat(2000));
    expect(screen.getByRole("button", { name: sv.cofounderPage.promptSendLabel })).toBeEnabled();
  });

  it("tomt eller för långt meddelande går inte att skicka", async () => {
    const onSend = vi.fn();
    renderCofounder({ moment: liveMoment, context: [] }, { messages: [], onSend });
    const button = screen.getByRole("button", { name: sv.cofounderPage.promptSendLabel });
    expect(button).toBeDisabled();
    type("x".repeat(2001));
    expect(button).toBeDisabled();
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(sv.cofounderPage.live.tooLong.replace("{max}", "2000")));
    expect(onSend).not.toHaveBeenCalled();
  });

  it("utan moment visas Kommer snart och ett avstängt fält, även med live", () => {
    renderCofounder({ moment: null, context: null }, { messages: [], onSend: vi.fn() });
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(2);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});
