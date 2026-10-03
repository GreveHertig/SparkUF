"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
import { useI18n } from "@/i18n/context";
import { fill } from "@/i18n/fill";
import type { CofounderMessage } from "@/ports/CofounderAgent";
import { charLength, COFOUNDER_DAILY_LIMIT, COFOUNDER_INPUT_MAX } from "@/core/cofounder";
import { ChatLine } from "./ChatBlocks";

export type SendCofounderMessageResult =
  | { ok: true; reply: CofounderMessage }
  | { ok: false; reason: "invalid" | "dailyLimit" | "failed" };

export type SendCofounderMessage = (text: string) => Promise<SendCofounderMessageResult>;

/**
 * Den levande chatten med Medgrundaren på /app (docs/moduler/medgrundaren.md).
 * Visar samtalet och ett aktivt promptfält. Skärmen vet inte vem som svarar:
 * `onSend` är en server action som skickar meddelandet och sparar svaret.
 * Vid taket eller ogiltig text sparas inget, så meddelandet tas bort ur listan
 * och läggs tillbaka i fältet. Svarar modellen inte är meddelandet redan
 * sparat (och räknat mot taket), så det står kvar utan svar, som efter en
 * omladdning. Texterna är ren text, aldrig HTML.
 */
export function CofounderChat({
  initialMessages,
  onSend,
  initialDraft,
}: {
  initialMessages: CofounderMessage[];
  onSend: SendCofounderMessage;
  /** Förifylld text i fältet (en signal från Pulsen). Inget skickas förrän grundaren trycker Skicka. */
  initialDraft?: string;
}) {
  const { t } = useI18n();
  const copy = t.cofounderPage;
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState(initialDraft ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wasPending = useRef(false);

  // Fältet stängs medan svaret hämtas och tappar då fokus. Lägg tillbaka
  // fokus när svaret (eller felet) kommit, för tangentbord och skärmläsare.
  useEffect(() => {
    if (wasPending.current && !pending) inputRef.current?.focus();
    wasPending.current = pending;
  }, [pending]);

  const tooLong = charLength(draft) > COFOUNDER_INPUT_MAX;
  const canSend = !pending && draft.trim().length > 0 && !tooLong;

  function errorText(reason: "invalid" | "dailyLimit" | "failed"): string {
    if (reason === "dailyLimit") return fill(copy.live.dailyLimitReached, { limit: COFOUNDER_DAILY_LIMIT });
    if (reason === "invalid") return copy.live.invalidMessage;
    return copy.live.sendFailed;
  }

  function send() {
    if (!canSend) return;
    const text = draft.trim();
    const before = messages;
    setMessages([...before, { role: "founder", text }]);
    setDraft("");
    setError(null);
    startTransition(async () => {
      let result: SendCofounderMessageResult;
      try {
        result = await onSend(text);
      } catch {
        result = { ok: false, reason: "failed" };
      }
      if (result.ok) {
        setMessages([...before, { role: "founder", text }, result.reply]);
      } else if (result.reason === "failed") {
        setError(errorText(result.reason));
      } else {
        setMessages(before);
        setDraft(text);
        setError(errorText(result.reason));
      }
    });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    send();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter skickar, Skift+Enter ger en ny rad.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  }

  return (
    <>
      {messages.length === 0 ? (
        <p className="fdd-muted">{copy.live.emptyBody}</p>
      ) : (
        <div className="fdd-conversation" aria-live="polite">
          {messages.map((message, index) => (
            <ChatLine key={index} role={message.role} text={message.text} />
          ))}
          {pending && <p className="fdd-muted">{copy.live.sending}</p>}
        </div>
      )}
      <form className="fdd-prompt" onSubmit={onSubmit}>
        <textarea
          ref={inputRef}
          rows={2}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          disabled={pending}
          placeholder={copy.promptPlaceholder}
          aria-label={copy.promptPlaceholder}
          aria-invalid={tooLong || undefined}
          className="fdd-prompt__input"
        />
        <button type="submit" disabled={!canSend} className="fd-btn fd-btn--primary fd-btn--sm">
          {copy.promptSendLabel}
        </button>
      </form>
      {(error || tooLong) && (
        <p className="fdd-prompt__error" role="alert">
          {tooLong ? fill(copy.live.tooLong, { max: COFOUNDER_INPUT_MAX }) : error}
        </p>
      )}
    </>
  );
}
