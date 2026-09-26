// Hiasynth och Lovable är koncept och ska alltid bära ConceptBadge
// (CLAUDE.md, produktregler). Namnen är egennamn i demodatan, inte i18n-text,
// så de är desamma på båda språken.
const CONCEPT_NAMES = /\b(Lovable|Hiasynth)\b/;

export function mentionsConcept(text: string): boolean {
  return CONCEPT_NAMES.test(text);
}
