import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Sändspärr (docs/moduler/utskick-och-svar.md): inga mejlpaket i repot.
// Komplement till lib/server/noMailer.guard.test.ts. Täcker bara statiska imports;
// dynamisk import() och fetch mot mejl-API:er fångas av vakttestet.
const mailPattern = {
  group: [
    "nodemailer",
    "nodemailer-*",
    "googleapis",
    "@googleapis/*",
    "@sendgrid/*",
    "resend",
    "postmark",
    "mailgun*",
    "@aws-sdk/client-ses*",
  ],
  message:
    "Sändning är avstängd tills Theodor och grundaren uttryckligen sagt ja. Se docs/moduler/utskick-och-svar.md, Sändspärr.",
};

// Registergrinden (docs/moduler/registret.md, "Säkerhet" punkt a): transporterna
// anropar själva assertRegistryAccessAllowed(), och bara liveadaptern (och
// tester) får importera dem, så att en framtida route inte når registret förbi
// adaptern.
const registryTransportPattern = {
  group: ["**/lib/server/bolagsverket", "**/lib/server/scb", "./bolagsverket", "./scb"],
  message:
    "Registertransporterna importeras bara av adapters/live/RegistryProvider.ts. Se docs/moduler/registret.md, Säkerhet.",
};
// Registercachen (lib/server/registryCache.ts) bär service role-nyckeln och går
// förbi RLS. Bara registrets liveadapter och tester får importera den
// (docs/beslut.md 2026-09-23, docs/arkitektur.md avsnitt 9).
const registryCachePattern = {
  group: ["**/lib/server/registryCache", "./registryCache"],
  message:
    "Registercachen (service role) importeras bara av adapters/live/RegistryProvider.ts. Se docs/arkitektur.md, avsnitt 9.",
};
// Poänghistoriken (lib/server/scoreSnapshots.ts) bär också service role-nyckeln.
// Bara bevisens skrivadapter och tester får importera den (docs/beslut.md 2026-10-01).
// Systembevisen (lib/server/systemEvidence.ts) bär samma nyckel och har samma
// enda importör (docs/beslut.md 2026-10-04).
const scoreSnapshotsPattern = {
  group: ["**/lib/server/scoreSnapshots", "./scoreSnapshots", "**/lib/server/systemEvidence", "./systemEvidence"],
  message:
    "Poänghistoriken och systembevisen (service role) importeras bara av adapters/live/EvidenceRecorder.ts. Se docs/beslut.md 2026-10-01 och 2026-10-04.",
};
// Medgrundarens svar (lib/server/cofounderReplies.ts) bär också service
// role-nyckeln. Bara samtalets liveadapter och tester får importera den
// (docs/beslut.md 2026-10-03, "Medgrundarens rader skrivs bara av servern").
const cofounderRepliesPattern = {
  group: ["**/lib/server/cofounderReplies", "./cofounderReplies"],
  message:
    "Medgrundarens svar (service role) importeras bara av adapters/live/CofounderConversation.ts. Se docs/beslut.md 2026-10-03.",
};
// Transporterna och cachen har samma tillåtna importörer.
const registryAdapter = ["adapters/live/RegistryProvider.ts"];
const snapshotImporters = ["adapters/live/EvidenceRecorder.ts"];
const cofounderReplyImporters = ["adapters/live/CofounderConversation.ts"];
const testFiles = ["**/*.test.ts"];
const registryImporters = [...registryAdapter, ...testFiles];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Demon importerar aldrig liveadaptrar (CLAUDE.md, avsnitt Arkitektur;
  // docs/uppdrag.md 14.6) — så att demot aldrig kan läcka nycklar eller
  // röra riktig data.
  {
    files: ["app/demo/**/*.{ts,tsx}", "adapters/demo/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            mailPattern,
            registryTransportPattern,
            registryCachePattern,
            scoreSnapshotsPattern,
            cofounderRepliesPattern,
            {
              group: [
                "@/adapters/live",
                "@/adapters/live/*",
                "@/adapters/live/**",
                "**/adapters/live/*",
                "**/adapters/live/**",
              ],
              message: "Demon importerar aldrig liveadaptrar. Se CLAUDE.md, avsnitt Arkitektur.",
            },
          ],
        },
      ],
    },
  },
  // Sändspärr, registergrinden, registercachen, poänghistoriken och
  // Medgrundarens svar: se mailPattern, registryTransportPattern,
  // registryCachePattern, scoreSnapshotsPattern och cofounderRepliesPattern ovan. Gäller alla filer
  // utom demofilerna, som har egen regel (flat config ersätter regelns
  // inställningar, slår inte ihop dem).
  {
    ignores: [
      "app/demo/**",
      "adapters/demo/**",
      ...registryImporters,
      ...snapshotImporters,
      ...cofounderReplyImporters,
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            mailPattern,
            registryTransportPattern,
            registryCachePattern,
            scoreSnapshotsPattern,
            cofounderRepliesPattern,
          ],
        },
      ],
    },
  },
  {
    files: registryAdapter,
    rules: {
      "no-restricted-imports": ["error", { patterns: [mailPattern, scoreSnapshotsPattern, cofounderRepliesPattern] }],
    },
  },
  {
    files: snapshotImporters,
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [mailPattern, registryTransportPattern, registryCachePattern, cofounderRepliesPattern] },
      ],
    },
  },
  {
    files: cofounderReplyImporters,
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [mailPattern, registryTransportPattern, registryCachePattern, scoreSnapshotsPattern] },
      ],
    },
  },
  {
    files: testFiles,
    ignores: ["app/demo/**", "adapters/demo/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [mailPattern] }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Gitignorerad arbetsmapp för lokala provskript och buntar, inte appkod.
    "scratchpad/**",
  ]),
]);

export default eslintConfig;
