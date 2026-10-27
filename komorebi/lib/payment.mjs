/** Canonical payOS HMAC: sort keys, normalize null and nested array objects. */
export function canonical(data) {
  return Object.keys(data).sort().map(key => {
    const value = data[key];
    const normalized = value == null || value === 'null' || value === 'undefined' ? ''
      : Array.isArray(value) ? JSON.stringify(value.map(item => item && typeof item === 'object' ? Object.fromEntries(Object.keys(item).sort().map(k => [k, item[k]])) : item))
      : String(value);
    return `${key}=${normalized}`;
  }).join('&');
}
export async function sign(data, checksumKey) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(checksumKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(canonical(data))))).map(v => v.toString(16).padStart(2,'0')).join('');
}
export async function verify(data, signature, checksumKey) {
  if (typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = await sign(data, checksumKey);
  let difference = 0;
  for (let i = 0; i < 64; i++) difference |= expected.charCodeAt(i) ^ signature.toLowerCase().charCodeAt(i);
  return difference === 0;
}
export function priceOrder(items, catalogue) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 30) throw new Error('Giỏ hàng không hợp lệ.');
  const seen = new Set();
  const lines = items.map(item => {
    const product = catalogue.find(p => p.id === item.productId);
    if (!product || seen.has(item.productId) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) throw new Error('Sản phẩm hoặc số lượng không hợp lệ.');
    seen.add(item.productId);
    return { productId: product.id, name: `${product.title} — Tập 1`, price: product.price, quantity: item.quantity, cover: product.cover };
  });
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const shipping = subtotal >= 199000 ? 0 : 25000;
  return { lines, subtotal, shipping, amount: subtotal + shipping };
}
export function validateCustomer(customer) {
  if (!customer || typeof customer.name !== 'string' || customer.name.trim().length < 2 || customer.name.length > 100) throw new Error('Vui lòng nhập họ tên hợp lệ.');
  if (typeof customer.phone !== 'string' || !/^(0|\+84)[0-9]{9}$/.test(customer.phone.replace(/\s/g,''))) throw new Error('Vui lòng nhập số điện thoại Việt Nam hợp lệ.');
  if (typeof customer.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) || customer.email.length > 200) throw new Error('Vui lòng nhập email hợp lệ.');
  if (typeof customer.address !== 'string' || customer.address.trim().length < 10 || customer.address.length > 500) throw new Error('Vui lòng nhập địa chỉ giao hàng đầy đủ.');
  return { name: customer.name.trim(), phone: customer.phone.replace(/\s/g,''), email: customer.email.trim(), address: customer.address.trim() };
}
