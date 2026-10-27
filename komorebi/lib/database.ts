import 'server-only';
import { neon } from '@neondatabase/serverless';

function sql() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  return neon(process.env.DATABASE_URL);
}
function normalize(row: Record<string, unknown>) {
  for (const key of ['order_code', 'created_at', 'expires_at', 'received_at', 'n']) {
    if (key in row) row[key] = Number(row[key]);
  }
  return row;
}
// All values remain bound parameters; only our static SQL is translated.
export class Statement {
  values: unknown[] = [];
  text: string;
  constructor(query: string) {
    let index = 0;
    this.text = query.replace(/\?/g, () => `$${++index}`);
    if (this.text.startsWith('INSERT OR IGNORE')) this.text = this.text.replace('INSERT OR IGNORE', 'INSERT') + ' ON CONFLICT DO NOTHING';
  }
  bind(...values: unknown[]) { this.values = values; return this; }
  async all<T = Record<string, unknown>>() { const rows = await sql().query(this.text, this.values); return { results: rows.map(normalize) as T[] }; }
  async first<T = Record<string, unknown>>() { return (await this.all<T>()).results[0] ?? null; }
  async run() { return this.all(); }
}
export const database = {
  prepare(query: string) { return new Statement(query); },
  async batch(statements: Statement[]) {
    const client = sql();
    // Serialize short inventory transactions, including repeated webhooks and cancellations.
    // Read Committed gives each statement the state committed by the previous lock holder.
    return client.transaction([
      client.query('SELECT pg_advisory_xact_lock(19472831)'),
      ...statements.map(s => client.query(s.text, s.values)),
    ], { isolationLevel: 'ReadCommitted' });
  },
};
