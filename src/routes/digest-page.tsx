import { Hono } from 'hono';
import type { RigConfig } from '../config.js';
import { readNight } from '../digest/reader.js';
import { lane } from '../lane.js';
import { DigestPage } from '../views/digest.js';
import { Layout } from '../views/layout.js';

// GET /digest/:night. Rows are rendered in the order the reader returns them.
export function digestPageRoute(config: RigConfig) {
  const route = new Hono();

  route.get('/digest/:night', (c) => {
    const night = c.req.param('night');
    const data = readNight(config.runsDir, night);
    if (!data) {
      return c.html(
        <Layout title="digest" lane={lane()}>
          <p class="mute">no digest for this night</p>
        </Layout>,
        404,
      );
    }
    return c.html(
      <Layout title={`digest ${night}`} lane={lane()}>
        <DigestPage night={night} data={data} />
      </Layout>,
    );
  });

  return route;
}
