import { canLive, json } from "../../../lib/server";
export async function GET() { return json({liveAvailable:canLive(),shippingFee:25000,freeShippingFrom:199000}); }
