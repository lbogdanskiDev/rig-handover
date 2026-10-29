export type RunStatus = 'ok' | 'retry' | 'fail';

// One row per job in a night's run log. Times keep the offset from the log (styleguide).
export type DigestRow = {
  job: string;
  owner: string | null;
  runs: number;
  retries: number;
  lastStatus: RunStatus;
  lastError: string | null;
  firstAt: string;
  lastAt: string;
};

export type Night = {
  // Already sorted by job. Page and JSON take them as given and never sort (ADR 0001).
  rows: DigestRow[];
  // Lines that did not parse. Counted, never thrown.
  badLines: number;
};

// `night` must match this; anything else is treated as a missing night.
export const NIGHT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Reads runs/<night>.jsonl. Returns null for a missing file or an invalid `night`
// (the page turns that into 404).
export type ReadNight = (runsDir: string, night: string) => Night | null;
