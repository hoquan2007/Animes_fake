import { checkOrigin, handle, json } from '../../../lib/server';
import { ensureSession } from '../../../lib/session';
export async function POST(req: Request) {
  return handle(async () => { checkOrigin(req); await ensureSession(); return json({ ready: true }); });
}
