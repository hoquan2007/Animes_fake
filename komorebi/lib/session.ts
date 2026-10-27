import 'server-only';
import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { sign, verify } from './payment.mjs';

const cookieName = 'komorebi_session';
const lifetime = 60 * 60 * 24 * 30;
export async function readSession() {
  const raw = (await cookies()).get(cookieName)?.value;
  const secret = process.env.SESSION_SECRET;
  if (!raw || !secret) return null;
  const [id, expiry, signature] = raw.split('.');
  if (!/^[a-f0-9]{64}$/.test(id) || !/^\d+$/.test(expiry) || Number(expiry) < Date.now()) return null;
  return await verify({ id, expiry }, signature, secret) ? id : null;
}
export async function ensureSession() {
  const current = await readSession();
  if (current) return current;
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET is not configured');
  const id = randomBytes(32).toString('hex');
  const expiry = String(Date.now() + lifetime * 1000);
  const signature = await sign({ id, expiry }, secret);
  (await cookies()).set(cookieName, `${id}.${expiry}.${signature}`, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: lifetime,
  });
  return id;
}
