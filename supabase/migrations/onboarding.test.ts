// Statisk vakt för onboardingmigreringen, samma idé som migrations.test.ts:
// läser SQL-texten och körs i CI utan Postgres. Låser att databasens
// längdgränser och giltiga ingångar är desamma som i core/onboarding.ts och
// core/domain.ts, så att zod i server actions och databasen aldrig glider isär.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PROFILE_ANSWER_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  PROJECT_ONE_LINER_MAX_LENGTH,
} from "@/core/onboarding";

const sql = readFileSync(path.join(import.meta.dirname, "20260930120000_onboarding.sql"), "utf8")
  .replace(/--[^\n]*/g, "")
  .replace(/\s+/g, " ");

describe("supabase/migrations: onboardingen", () => {
  it.each(["role", "bio", "time_available", "money_available", "risk_appetite"])(
    "profiles.%s har samma tak som PROFILE_ANSWER_MAX_LENGTH",
    (column) => {
      expect(sql).toContain(`check (char_length(${column}) <= ${PROFILE_ANSWER_MAX_LENGTH})`);
    },
  );

  it("projects.name och one_liner har samma gränser som core/onboarding.ts", () => {
    expect(sql).toContain(`check (char_length(btrim(name)) between 1 and ${PROJECT_NAME_MAX_LENGTH})`);
    expect(sql).toContain(`check (char_length(btrim(one_liner)) between 1 and ${PROJECT_ONE_LINER_MAX_LENGTH})`);
  });

  it("onboarding_entry tillåter exakt ingångarna i OnboardingEntry", () => {
    expect(sql).toContain("check (onboarding_entry in ('noIdea', 'hasIdea'))");
  });

  it("körs i en transaktion, så att ett fällt villkor inte lämnar ett halvt läge", () => {
    expect(sql.trim().startsWith("begin;")).toBe(true);
    expect(sql.trim().endsWith("commit;")).toBe(true);
  });

  it("öppnar inga nya tabeller och ändrar inga policyer", () => {
    expect(sql).not.toMatch(/create table/i);
    expect(sql).not.toMatch(/(create|drop|alter) policy/i);
    expect(sql).not.toMatch(/\bgrant\b/i);
  });
});
