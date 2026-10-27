// Explicit opt-in: creates one unpaid production payOS link, then cancels it.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
if (process.env.CONFIRM_LIVE_LINK_TEST !== 'yes') throw new Error('Set CONFIRM_LIVE_LINK_TEST=yes to create and cancel one unpaid payOS link.');
const origin = 'https://komorebi-manga-hnquan.vercel.app';
const results = [];
const pass = name => { results.push({ name, passed: true }); console.log('PASS', name); };
assert.equal((await fetch(origin)).status, 200); pass('Public storefront responds');
const config = await (await fetch(origin + '/api/config')).json();
assert.equal(config.liveAvailable, true); pass('Live payment is configured');
const session = await fetch(origin + '/api/session', {method:'POST',headers:{Origin:origin}});
assert.equal(session.status, 200);
const cookies = session.headers.getSetCookie();
assert.ok(cookies.some(c => /HttpOnly/i.test(c) && /Secure/i.test(c) && /SameSite=Lax/i.test(c)));
const headers = { Origin:origin, Cookie:cookies.map(c=>c.split(';')[0]).join('; '), 'Content-Type':'application/json' };
pass('Signed secure guest session starts on production');
const payload = {mode:'live',idempotencyKey:crypto.randomUUID(),items:[{productId:'al-30013',quantity:1,price:1}],customer:{name:'Kiem Thu Do An',phone:'0901234567',email:'demo@example.com',address:'12 Duong Minh Hoa, Thanh pho Demo'}};
const response = await fetch(origin+'/api/orders',{method:'POST',headers,body:JSON.stringify(payload)});
const created = await response.json();
if(response.status!==201) { console.log({status:response.status,error:created.error}); process.exit(1); }
const order = created.order;
writeFileSync('work/live-smoke-order.json',JSON.stringify({order,cookie:headers.Cookie}));
try {
  assert.equal(order.amount,50000); assert.equal(order.status,'PENDING');
  assert.ok(order.checkoutUrl.startsWith('https://pay.payos.vn/'));
  pass('payOS returns a genuine unpaid checkout link for 50,000 VND');
  const repeat = await (await fetch(origin+'/api/orders',{method:'POST',headers,body:JSON.stringify(payload)})).json();
  assert.equal(repeat.order.id,order.id); pass('Live creation is idempotent');
  const read = await (await fetch(origin+`/api/orders/${order.id}?status=PAID`,{headers})).json();
  assert.equal(read.order.status,'PENDING'); pass('Return query cannot forge payment success; payOS reconciliation works');
  const forged = await fetch(origin+'/api/webhooks/payos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:{orderCode:order.orderCode},signature:'0'.repeat(64)})});
  assert.equal(forged.status,400); pass('Public webhook rejects forged signatures');
} finally {
  const cancel = await fetch(origin+`/api/orders/${order.id}`,{method:'POST',headers,body:JSON.stringify({action:'cancel'})});
  const data = await cancel.json();
  assert.equal(data.order?.status,'CANCELLED'); pass('Unpaid test link is cancelled with payOS');
}
writeFileSync('docs/live-payment-results.json',JSON.stringify({checkedAt:new Date().toISOString(),origin,orderCode:order.orderCode,scope:'Created, reconciled and cancelled an unpaid live link. No bank transfer or real PAID webhook was performed.',results},null,2));
