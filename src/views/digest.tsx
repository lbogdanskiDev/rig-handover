import type { DigestRow, Night } from '../digest/types.js';

// Retries of 3 or more and any fail get marked (plan: morning-digest, 2a).
function flag(row: DigestRow): string | null {
  if (row.lastStatus === 'fail') return 'fail';
  if (row.retries >= 3) return `${row.retries} retries`;
  return null;
}

export function DigestPage({ night, data }: { night: string; data: Night }) {
  const { rows, badLines } = data;
  return (
    <>
      <h1>digest {night}</h1>
      {badLines > 0 && <p class="mute">{badLines === 1 ? '1 line skipped' : `${badLines} lines skipped`}</p>}
      {rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last status</th>
              <th>last error</th>
              <th>first</th>
              <th>last</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr>
                <td>{r.job}</td>
                <td>{r.owner ?? '—'}</td>
                <td>{r.runs}</td>
                <td>{r.retries}</td>
                <td>{r.lastStatus}</td>
                <td>{r.lastError ?? '—'}</td>
                <td>{r.firstAt}</td>
                <td>{r.lastAt}</td>
                <td class="warn">{flag(r) ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
