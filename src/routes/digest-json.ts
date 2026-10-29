import { Hono } from 'hono';
import type { RigConfig } from '../config.js';
import { readNight } from '../digest/reader.js';

// GET /api/digest/:night. The same rows as the page, in the same order, plus badLines.
// Rows are passed through as the reader returns them; no sorting here (ADR 0001).
export function digestJsonRoute(config: RigConfig) {
  const route = new Hono();

  route.get('/api/digest/:night', (c) => {
    const data = readNight(config.runsDir, c.req.param('night'));
    if (!data) return c.json({ error: 'no digest for this night' }, 404);
    return c.json(data);
  });

  return route;
}
