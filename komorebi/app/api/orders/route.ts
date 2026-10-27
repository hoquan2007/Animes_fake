const env = process.env;
import { ApiError, body, canLive, checkOrigin, db, ensureInventory, handle, json, owner, payos, publicOrder, settle, limitCheckout } from "../../../lib/server";
import { products } from "../../../lib/catalog";
import { priceOrder, sign, validateCustomer } from "../../../lib/payment.mjs";

export async function GET() { return handle(async()=>{const userId=await owner(); const rows=await db().prepare("SELECT * FROM orders WHERE owner_id=? ORDER BY created_at DESC LIMIT 50").bind(userId).all<any>(); return json({orders:rows.results.map(publicOrder)});}); }

export async function POST(req: Request) { return handle(async()=>{
  checkOrigin(req); const userId=await owner(); const input=await body(req);
  await limitCheckout(req);
  if (typeof input.idempotencyKey !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(input.idempotencyKey)) throw new ApiError(400,"Mã yêu cầu không hợp lệ.");
  const previous=await db().prepare("SELECT * FROM orders WHERE owner_id=? AND idempotency_key=?").bind(userId,input.idempotencyKey).first<any>();
  if (previous) return json({order:publicOrder(previous)},previous.status === 'CREATING' ? 202 : 200);
  if (!['demo','live'].includes(input.mode)) throw new ApiError(400,"Phương thức thanh toán không hợp lệ.");
  if (input.mode==='live' && !canLive()) throw new ApiError(503,"Thanh toán payOS chưa được cấu hình.");
  let priced, customer;
  try { priced=priceOrder(input.items,products); customer=validateCustomer(input.customer); } catch(e) {throw new ApiError(400,(e as Error).message);}
  const rate=await db().prepare("SELECT COUNT(*) AS n FROM orders WHERE owner_id=? AND created_at>?").bind(userId,Date.now()-60000).first<{n:number}>();
  if ((rate?.n||0)>=5) throw new ApiError(429,"Bạn đã tạo nhiều đơn liên tiếp. Vui lòng chờ một phút.");
  // Release old demo reservations on new checkout. Live reservations require payOS reconciliation.
  const stale=await db().prepare("SELECT * FROM orders WHERE owner_id=? AND mode='demo' AND status='PENDING' AND expires_at<?").bind(userId,Date.now()).all<any>();
  for(const row of stale.results) await settle(row,'EXPIRED');
  await ensureInventory();
  const id=crypto.randomUUID(); const orderCode=Date.now()*1000+crypto.getRandomValues(new Uint16Array(1))[0]%1000;
  const now=Date.now(), expiresAt=now+15*60*1000;
  const statements=[db().prepare("INSERT INTO orders (id,owner_id,order_code,idempotency_key,status,mode,amount,subtotal,shipping,customer_json,items_json,created_at,expires_at) VALUES (?,?,?,?,'CREATING',?,?,?,?,?,?,?,?)").bind(id,userId,orderCode,input.idempotencyKey,input.mode,priced.amount,priced.subtotal,priced.shipping,JSON.stringify(customer),JSON.stringify(priced.lines),now,expiresAt),...priced.lines.map(l=>db().prepare("UPDATE inventory SET stock=stock-? WHERE product_id=?").bind(l.quantity,l.productId))];
  try { await db().batch(statements); } catch { const concurrent=await db().prepare("SELECT * FROM orders WHERE owner_id=? AND idempotency_key=?").bind(userId,input.idempotencyKey).first<any>(); if(concurrent)return json({order:publicOrder(concurrent)},202); throw new ApiError(409,"Số lượng còn lại không đủ. Vui lòng giảm số lượng và thử lại."); }
  const row=await db().prepare("SELECT * FROM orders WHERE id=?").bind(id).first<any>();
  if(input.mode==='demo') { await db().prepare("UPDATE orders SET status='PENDING' WHERE id=?").bind(id).run(); return json({order:publicOrder({...row,status:'PENDING'})},201); }
  const base=env.APP_URL;
  if(!base) {await settle(row,'FAILED');throw new ApiError(503,"Chưa cấu hình URL thanh toán.");}
  const payload={orderCode,amount:priced.amount,description:`KM${String(orderCode).slice(-7)}`,returnUrl:`${base}/?order=${id}`,cancelUrl:`${base}/?order=${id}&cancel=1`};
  try {
    const signature=await sign(payload,env.PAYOS_CHECKSUM_KEY!);
    const remote=await payos('/v2/payment-requests',{...payload,signature,buyerName:customer.name,buyerEmail:customer.email,buyerPhone:customer.phone,items:[...priced.lines.map(l=>({name:l.name,quantity:l.quantity,price:l.price})),...(priced.shipping?[{name:'Phí giao hàng',quantity:1,price:priced.shipping}]:[])],expiredAt:Math.floor(expiresAt/1000)});
    if(remote.orderCode!==orderCode || remote.amount!==priced.amount || !/^https:\/\/(pay\.payos\.vn|payos\.vn)\//.test(remote.checkoutUrl)) throw new Error('Invalid link');
    await db().prepare("UPDATE orders SET status='PENDING',checkout_url=?,payment_link_id=? WHERE id=?").bind(remote.checkoutUrl,remote.paymentLinkId,id).run();
    return json({order:publicOrder({...row,status:'PENDING',checkout_url:remote.checkoutUrl,payment_link_id:remote.paymentLinkId})},201);
  } catch {
    // A timeout may still have created the payOS link: keep reservation and reconcile by orderCode.
    await db().prepare("UPDATE orders SET status='PENDING',payment_link_id=? WHERE id=?").bind(String(orderCode),id).run();
    throw new ApiError(502,`Chưa xác nhận được link payOS. Mở Đơn hàng để kiểm tra đơn ${orderCode}; không cần tạo lại.`);
  }
}); }
