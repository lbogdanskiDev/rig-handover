import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

// runs/ is read-only: every case that needs a special night writes it to a temp dir.
function appWith(files: Record<string, string>) {
  const runsDir = mkdtempSync(join(tmpdir(), 'rig-routes-'));
  for (const [name, text] of Object.entries(files)) writeFileSync(join(runsDir, name), text);
  return createApp({ adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir });
}

const line = (job: string, status = 'ok', owner: string | null = 'rook') =>
  JSON.stringify({ at: '2026-01-01T01:00:00+01:00', job, status, owner });

type Json = { rows: { job: string }[]; badLines: number };

describe('digest routes', () => {
  it('200: page and JSON for a real night list the same jobs in the same order', async () => {
    const app = appWith({ '2026-01-01.jsonl': [line('b/two'), line('a/one')].join('\n') + '\n' });
    const page = await app.request('/digest/2026-01-01');
    const json = await app.request('/api/digest/2026-01-01');
    expect(page.status).toBe(200);
    expect(json.status).toBe(200);
    const html = await page.text();
    const jobs = ((await json.json()) as Json).rows.map((r) => r.job);
    expect(jobs).toEqual(['a/one', 'b/two']);
    expect(html.indexOf('a/one')).toBeLessThan(html.indexOf('b/two'));
  });

  it('404: a night with no file', async () => {
    const app = appWith({});
    expect((await app.request('/digest/2026-01-01')).status).toBe(404);
    expect((await app.request('/api/digest/2026-01-01')).status).toBe(404);
  });

  it('empty night: the page says nothing ran, the JSON has no rows', async () => {
    const app = appWith({ '2026-01-01.jsonl': '' });
    const page = await app.request('/digest/2026-01-01');
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('nothing ran');
    expect(await (await app.request('/api/digest/2026-01-01')).json()).toEqual({ rows: [], badLines: 0 });
  });

  it('bad line: counted, the night still renders, owner null shows as a dash', async () => {
    const app = appWith({ '2026-01-01.jsonl': [line('a/one', 'ok', null), '{"at":"2026-01-01T0'].join('\n') });
    const page = await app.request('/digest/2026-01-01');
    const html = await page.text();
    expect(page.status).toBe(200);
    expect(html).toContain('1 line skipped');
    expect(html).toContain('<td>—</td>');
    expect(((await (await app.request('/api/digest/2026-01-01')).json()) as Json).badLines).toBe(1);
  });

  it('invalid :night such as ../x is a missing night', async () => {
    const app = appWith({ '2026-01-01.jsonl': line('a/one') });
    for (const bad of ['..%2Fx', '..%2Fruns%2F2026-10-28', '2026-1-1', '2026-01-01.jsonl']) {
      expect((await app.request(`/digest/${bad}`)).status).toBe(404);
      expect((await app.request(`/api/digest/${bad}`)).status).toBe(404);
    }
  });
});
