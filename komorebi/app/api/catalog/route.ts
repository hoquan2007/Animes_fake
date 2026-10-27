import { products } from "../../../lib/catalog";
export async function GET(req: Request) {
  let source='snapshot',items=products.map(p=>({id:p.id,score:p.score}));
  try {
    const response=await fetch('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({query:'query($ids:[Int]){Page(perPage:30){media(id_in:$ids,type:MANGA,isAdult:false){id averageScore}}}',variables:{ids:products.map(p=>Number(p.id.slice(3)))}}),signal:AbortSignal.timeout(7000),next:{revalidate:3600}});
    const payload:any=await response.json();
    if(!response.ok||payload.errors||!Array.isArray(payload.data?.Page?.media))throw new Error('Unavailable');
    items=payload.data.Page.media.map((m:{id:number;averageScore:number|null})=>({id:`al-${m.id}`,score:m.averageScore?m.averageScore/10:null}));source='anilist';
  }catch{/* Cached metadata keeps the catalogue usable during upstream failures. */}
  const result=Response.json({source,items,updatedAt:Date.now()},{headers:{'Cache-Control':`public, max-age=${source==='anilist'?3600:120}`}});
  return result;
}
