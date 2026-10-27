const env = process.env;
import { ApiError, body, db, handle, json, settle } from "../../../../lib/server";
import { verify } from "../../../../lib/payment.mjs";
export async function POST(req: Request) {return handle(async()=>{
  if(!env.PAYOS_CHECKSUM_KEY)throw new ApiError(503,"Chưa cấu hình payOS.");
  const event=await body(req);
  if(!event.data||!await verify(event.data,event.signature,env.PAYOS_CHECKSUM_KEY))throw new ApiError(400,"Chữ ký không hợp lệ.");
  const data=event.data;
  const row=await db().prepare("SELECT * FROM orders WHERE order_code=? AND mode='live'").bind(data.orderCode).first<any>();
  // A signed test webhook for an unknown order is acknowledged without creating an order.
  if(!row)return json({received:true});
  if(data.code!=='00'||event.code!=='00'||event.success!==true)return json({received:true});
  if(data.currency!=='VND'||Number(data.amount)!==row.amount||data.paymentLinkId!==row.payment_link_id)throw new ApiError(400,"Thông tin thanh toán không khớp.");
  if(typeof data.reference!=='string'||!data.reference)throw new ApiError(400,"Thiếu mã giao dịch.");
  await settle(row,'PAID',data.reference);
  return json({received:true});
});}
