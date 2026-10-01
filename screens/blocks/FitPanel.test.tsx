import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { FitPanel } from "./FitPanel";

afterEach(() => cleanup());

function renderPanel(onSave = vi.fn()) {
  render(
    <LocaleProvider>
      <FitPanel evidence={[]} onSave={onSave} scoreHref="/app/poang" />
    </LocaleProvider>,
  );
  return onSave;
}

describe("FitPanel", () => {
  it("sparar ett svar och visar den nya poängen som en länk till Poäng-sidan", async () => {
    const onSave = renderPanel(vi.fn().mockResolvedValue({ ok: true, total: 4, delta: 3 }));
    const [field] = screen.getAllByLabelText(sv.fitPanel.answerLabel);
    fireEvent.change(field, { target: { value: "Ekonomi och sälj" } });
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: sv.fitPanel.save })[0]);
    });
    expect(onSave).toHaveBeenCalledWith("skills", "Ekonomi och sälj");
    expect(screen.getByRole("link", { name: "Poängen är nu 4 (+3)." })).toHaveAttribute("href", "/app/poang");
  });

  it("säger när poängen inte ändrades, och när sparningen misslyckades", async () => {
    renderPanel(vi.fn().mockResolvedValueOnce({ ok: true, total: 10, delta: 0 }).mockResolvedValueOnce({ ok: false }));
    const fields = screen.getAllByLabelText(sv.fitPanel.answerLabel);
    const buttons = screen.getAllByRole("button", { name: sv.fitPanel.save });
    fireEvent.change(fields[0], { target: { value: "a" } });
    fireEvent.change(fields[1], { target: { value: "b" } });
    await act(async () => {
      fireEvent.click(buttons[0]);
    });
    expect(screen.getByText(sv.fitPanel.scoreUnchanged)).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(buttons[1]);
    });
    expect(screen.getByRole("alert")).toHaveTextContent(sv.fitPanel.failed);
  });

  it("knappen är avstängd tills något är skrivet", () => {
    renderPanel();
    expect(screen.getAllByRole("button", { name: sv.fitPanel.save })[0]).toBeDisabled();
  });
});
