import { ApiError, body, checkOrigin, db, findOrder, handle, json, owner, payos, publicOrder, reconcile, settle } from "../../../../lib/server";
export async function GET(req: Request,{params}:{params:Promise<{id:string}>}) {return handle(async()=>{const {id}=await params;const userId=await owner();const row=await reconcile(await findOrder(id,userId));return json({order:publicOrder(row)});});}
export async function POST(req: Request,{params}:{params:Promise<{id:string}>}) {return handle(async()=>{
  checkOrigin(req);const {id}=await params;const row=await findOrder(id,await owner());const input=await body(req);
  if(input.action==='complete-demo') {
    if(row.mode!=='demo')throw new ApiError(400,"Đơn payOS chỉ được xác nhận từ payOS.");
    if(row.status==='DEMO_COMPLETE')return json({order:publicOrder(row)});
    if(row.status!=='PENDING'||row.expires_at<Date.now())throw new ApiError(409,"Đơn minh họa không còn hiệu lực.");
    // Demo completion is a distinct state and restores sample inventory exactly once.
    await db().batch([...JSON.parse(row.items_json).map((l:any)=>db().prepare("UPDATE inventory SET stock=stock+? WHERE product_id=? AND EXISTS (SELECT 1 FROM orders WHERE id=? AND status='PENDING')").bind(l.quantity,l.productId,id)),db().prepare("UPDATE orders SET status='DEMO_COMPLETE' WHERE id=? AND status='PENDING'").bind(id)]);
  } else if(input.action==='cancel') {
    if(!['PENDING','CREATING'].includes(row.status))throw new ApiError(409,"Không thể hủy đơn này.");
    if(row.mode==='live') {
      const remote=await payos(`/v2/payment-requests/${row.order_code}/cancel`,{cancellationReason:'Khách hủy đơn'});
      if(remote.status==='PAID')throw new ApiError(409,"Đơn đã thanh toán, vui lòng kiểm tra lại trạng thái.");
      if(remote.status!=='CANCELLED')throw new ApiError(502,"Chưa xác nhận được việc hủy từ payOS.");
    }
    await settle(row,'CANCELLED');
  } else throw new ApiError(400,"Thao tác không hợp lệ.");
  return json({order:publicOrder(await findOrder(id,row.owner_id))});
});}
