import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { canonical, sign, verify, priceOrder, validateCustomer } from '../lib/payment.mjs';
const catalogue=[{id:'book-1',title:'Book',price:25000,cover:'/a.jpg'},{id:'book-2',title:'Book 2',price:35000,cover:'/b.jpg'}];
test('server price ignores client-supplied amount and price',()=>{
  const result=priceOrder([{productId:'book-1',quantity:2,price:1,amount:1}],catalogue);
  assert.equal(result.subtotal,50000);assert.equal(result.shipping,25000);assert.equal(result.amount,75000);
});
test('reject duplicates, unknown SKUs, negative, fractional and excessive quantities',()=>{
  for(const items of [[],[{productId:'unknown',quantity:1}],[{productId:'book-1',quantity:-1}],[{productId:'book-1',quantity:1.5}],[{productId:'book-1',quantity:11}],[{productId:'book-1',quantity:1},{productId:'book-1',quantity:1}]])assert.throws(()=>priceOrder(items,catalogue));
});
test('shipping is deterministic at free-shipping threshold',()=>{
  assert.equal(priceOrder([{productId:'book-1',quantity:7}],catalogue).shipping,25000);
  assert.equal(priceOrder([{productId:'book-1',quantity:8}],catalogue).shipping,0);
});
test('payOS creation signature agrees with independent Node crypto HMAC',async()=>{
  const data={returnUrl:'https://example.com/return',orderCode:123,description:'KM123',cancelUrl:'https://example.com/cancel',amount:50000};
  const text='amount=50000&cancelUrl=https://example.com/cancel&description=KM123&orderCode=123&returnUrl=https://example.com/return';
  assert.equal(canonical(data),text);
  assert.equal(await sign(data,'test-checksum'),createHmac('sha256','test-checksum').update(text).digest('hex'));
});
test('reject a tampered webhook, wrong key, malformed signature',async()=>{
  const data={orderCode:123,amount:50000,currency:'VND',code:'00'};const signature=await sign(data,'secret');
  assert.equal(await verify(data,signature,'secret'),true);
  assert.equal(await verify({...data,amount:1},signature,'secret'),false);
  assert.equal(await verify(data,signature,'other-secret'),false);
  assert.equal(await verify(data,'not-hex','secret'),false);
});
test('canonical nested fields and null values follow payOS signature format',()=>{
  assert.equal(canonical({z:null,b:[{z:2,a:1}],a:'undefined'}),'a=&b=[{"a":1,"z":2}]&z=');
});
test('customer input rejects malformed data and trims values',()=>{
  const customer={name:' Demo User ',phone:'090 123 4567',email:'demo@example.com',address:'12 Test Street, Test City'};
  assert.equal(validateCustomer(customer).name,'Demo User');
  assert.equal(validateCustomer(customer).phone,'0901234567');
  assert.throws(()=>validateCustomer({...customer,phone:'abc'}));assert.throws(()=>validateCustomer({...customer,email:'bad'}));
});
