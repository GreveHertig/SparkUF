"use client";

import type { Källa } from "@/types/evidence";
import type { DataType } from "@/design/tokens";
import { useI18n } from "@/i18n/context";
import { formatDate } from "@/i18n/format";

/**
 * Källstämpel i /experiment/fri-stil: källa och hämtningsdatum, alltid
 * synliga (samma innehåll som SourceTag). Simuleringar bär alltid den
 * synliga etiketten "Simulering" och en streckad ram, aldrig bara en färg.
 */
export function FriSource({ source, dataType = "register" }: { source: Källa; dataType?: DataType }) {
  const { t, locale } = useI18n();
  const content = (
    <>
      {dataType === "simulation" && <b>{t.common.simulationLabel} ·</b>}
      <span>{source.namn}</span>
      <span aria-hidden="true">·</span>
      <span>{formatDate(source.hämtad, locale)}</span>
    </>
  );

  if (source.url) {
    return (
      <a className={`fri-src ${dataType}`} href={source.url} target="_blank" rel="noreferrer noopener">
        {content}
      </a>
    );
  }
  return <span className={`fri-src ${dataType}`}>{content}</span>;
}
