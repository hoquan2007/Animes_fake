const env = process.env;
import { readSession } from "./session";
import { database, type Statement } from "./database";
import { products } from "./catalog";
import { verify } from "./payment.mjs";
import { createHmac } from "node:crypto";

export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
export function db() { if (!env.DATABASE_URL) throw new ApiError(503,"Cơ sở dữ liệu chưa sẵn sàng."); return database; }
export function json(data: unknown, status = 200) { return Response.json(data, {status, headers:{"Cache-Control":"no-store"}}); }
export async function handle(action: () => Promise<Response>) { try { return await action(); } catch (e) { return json({error:e instanceof ApiError ? e.message : "Không thể xử lý yêu cầu. Vui lòng thử lại."}, e instanceof ApiError ? e.status : 500); } }
export async function owner() { const id = await readSession(); if (!id) throw new ApiError(401,"Phiên đặt hàng đã hết hạn. Vui lòng tải lại trang."); return id; }
export async function limitCheckout(req: Request) {
  const ip = process.env.VERCEL ? req.headers.get('x-vercel-forwarded-for') || 'unknown' : 'local';
  const key = createHmac('sha256', process.env.SESSION_SECRET!).update(ip).digest('hex');
  const window = Math.floor(Date.now() / 60000) * 60000;
  const row = await db().prepare('INSERT INTO request_limits(key,window_start,attempts) VALUES (?,?,1) ON CONFLICT(key) DO UPDATE SET window_start=EXCLUDED.window_start,attempts=CASE WHEN request_limits.window_start=EXCLUDED.window_start THEN request_limits.attempts+1 ELSE 1 END RETURNING attempts').bind(key,window).first<{attempts:number}>();
  if ((row?.attempts || 0) > 30) throw new ApiError(429,'Quá nhiều yêu cầu đặt hàng. Vui lòng thử lại sau một phút.');
}
export function checkOrigin(req: Request) {
  const expected = env.APP_URL || new URL(req.url).origin;
  if (req.headers.get("origin") !== new URL(expected).origin) throw new ApiError(403, "Yêu cầu không hợp lệ.");
}
export async function body(req: Request) {
  if (Number(req.headers.get('content-length') || 0) > 20000) throw new ApiError(413, "Yêu cầu quá lớn.");
  let text = await req.text(); if (text.length > 20000) throw new ApiError(413, "Yêu cầu quá lớn.");
  try { const value=JSON.parse(text); if(!value || typeof value!=='object' || Array.isArray(value))throw new Error();return value; } catch { throw new ApiError(400,"Dữ liệu không hợp lệ."); }
}
export async function ensureInventory() {
  await db().batch(products.map(p=>db().prepare("INSERT OR IGNORE INTO inventory (product_id, stock) VALUES (?,20)").bind(p.id)));
}
export function canLive() { return env.PAYMENT_MODE === "live" && !!env.PAYOS_CLIENT_ID && !!env.PAYOS_API_KEY && !!env.PAYOS_CHECKSUM_KEY; }
export async function payos(path: string, payload?: unknown) {
  const r = await fetch(`https://api-merchant.payos.vn${path}`, {
    method: payload ? "POST" : "GET",
    headers: {"Content-Type":"application/json","x-client-id": env.PAYOS_CLIENT_ID!,"x-api-key":env.PAYOS_API_KEY!},
    ...(payload ? {body:JSON.stringify(payload)} : {}), signal:AbortSignal.timeout(12000),
  });
  const result: any = await r.json();
  if (!r.ok || result.code !== "00") throw new ApiError(502,"payOS chưa xử lý được yêu cầu. Vui lòng thử lại hoặc chọn đơn minh họa.");
  if (result.signature && !await verify(result.data, result.signature, env.PAYOS_CHECKSUM_KEY!)) throw new ApiError(502,"Không xác minh được phản hồi payOS.");
  return result.data;
}
export async function findOrder(id: string, userId: string) {
  const row = await db().prepare("SELECT * FROM orders WHERE id = ? AND owner_id = ?").bind(id,userId).first<any>();
  if (!row) throw new ApiError(404,"Không tìm thấy đơn hàng."); return row;
}
export function publicOrder(row: any) { return {id:row.id,orderCode:row.order_code,status:row.status,mode:row.mode,amount:row.amount,subtotal:row.subtotal,shipping:row.shipping,items:JSON.parse(row.items_json),customer:JSON.parse(row.customer_json),createdAt:row.created_at,checkoutUrl:row.checkout_url,expiresAt:row.expires_at}; }

// SQL batch changes payment state and restores reserved inventory exactly once.
export async function settle(row: any, status: string, reference?: string) {
  if (row.status === "PAID" || row.status === "DEMO_COMPLETE") return;
  const statements: Statement[] = [];
  if (status === "CANCELLED" || status === "EXPIRED" || status === "FAILED") {
    for (const line of JSON.parse(row.items_json)) statements.push(db().prepare("UPDATE inventory SET stock = stock + ? WHERE product_id = ? AND EXISTS (SELECT 1 FROM orders WHERE id = ? AND status IN ('PENDING','CREATING'))").bind(line.quantity,line.productId,row.id));
  }
  if (status === "PAID") {
    // A late genuine payment for a released order re-reserves its stock atomically.
    for (const line of JSON.parse(row.items_json)) statements.push(db().prepare("UPDATE inventory SET stock = stock - ? WHERE product_id = ? AND EXISTS (SELECT 1 FROM orders WHERE id = ? AND status IN ('CANCELLED','EXPIRED','FAILED'))").bind(line.quantity,line.productId,row.id));
  }
  statements.push(db().prepare("UPDATE orders SET status = ? WHERE id = ? AND status NOT IN ('PAID','DEMO_COMPLETE')").bind(status,row.id));
  if (reference) statements.push(db().prepare("INSERT OR IGNORE INTO payment_events(reference,order_id,received_at) VALUES (?,?,?)").bind(reference,row.id,Date.now()));
  await db().batch(statements);
}
export async function reconcile(row: any) {
  if (row.mode !== 'live' || !row.payment_link_id || ['PAID','DEMO_COMPLETE'].includes(row.status)) return row;
  const remote = await payos(`/v2/payment-requests/${row.order_code}`);
  if (Number(remote.orderCode) !== row.order_code || Number(remote.amount) !== row.amount) throw new ApiError(502,"Thông tin thanh toán không khớp đơn hàng.");
  if (!row.checkout_url && typeof remote.id === 'string' && /^[a-zA-Z0-9-]{16,80}$/.test(remote.id)) {
    await db().prepare("UPDATE orders SET payment_link_id=?,checkout_url=? WHERE id=?").bind(remote.id,`https://pay.payos.vn/web/${remote.id}`,row.id).run();
  }
  if (remote.status === 'PAID' && Number(remote.amountPaid) >= row.amount) await settle(row,'PAID');
  else if (['CANCELLED','EXPIRED'].includes(remote.status)) await settle(row,remote.status);
  return db().prepare("SELECT * FROM orders WHERE id=?").bind(row.id).first<any>();
}
