// Stub for the real "server-only" package (which throws when imported outside
// Next's react-server condition, a condition vitest does not set). Aliased in
// vitest.config.mts so importing server-only code doesn't blow up the test run.
export {};
