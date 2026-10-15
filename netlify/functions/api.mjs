import {getStore} from '@netlify/blobs';
const setDeep=(o,k,v)=>{const a=k.split('.');let c=o;for(let i=0;i<a.length-1;i++){if(typeof c[a[i]]!=='object'||c[a[i]]===null)c[a[i]]={};c=c[a[i]]}c[a[a.length-1]]=v};
const getDeep=(o,k)=>k.split('.').reduce((c,x)=>c==null?c:c[x],o);
export default async (req)=>{
  const url=new URL(req.url);
  if(url.pathname==='/health')return new Response('ok');
  if(req.method!=='POST')return new Response('Infinity Ludo API');
  const S=getStore({name:'ludo',consistency:'strong'});
  const b=await req.json();const p=b.path;
  const J=o=>new Response(JSON.stringify(o),{headers:{'content-type':'application/json'}});
  const rd=async k=>{const v=await S.get(k,{type:'json'});return v===undefined?null:v};
  if(b.op==='get'){const d=await rd(p);return J({exists:d!==null,data:d})}
  if(b.op==='set'){await S.setJSON(p,b.data);return J({ok:1})}
  if(b.op==='update'){const d=(await rd(p))||{};for(const k in b.data)setDeep(d,k,b.data[k]);await S.setJSON(p,d);return J({ok:1})}
  if(b.op==='delete'){await S.delete(p);return J({ok:1})}
  if(b.op==='add'){const id=Math.random().toString(36).slice(2,12)+Date.now().toString(36);await S.setJSON(p+'/'+id,b.data);return J({id,path:p+'/'+id})}
  if(b.op==='list'){
    const pre=p+'/';const {blobs}=await S.list({prefix:pre});
    const keys=blobs.map(x=>x.key).filter(k=>!k.slice(pre.length).includes('/'));
    let r=(await Promise.all(keys.map(async k=>({id:k.slice(pre.length),data:await rd(k)})))).filter(x=>x.data!==null);
    for(const [f,o,v] of b.where||[])r=r.filter(d=>{const x=getDeep(d.data,f);return o==='=='?x===v:o==='!='?x!==v:o==='>'?x>v:o==='>='?x>=v:o==='<'?x<v:o==='<='?x<=v:true});
    if(b.order)r.sort((a,c)=>{const x=getDeep(a.data,b.order[0]),y=getDeep(c.data,b.order[0]);return(x>y?1:x<y?-1:0)*(b.order[1]==='desc'?-1:1)});
    if(b.limit)r=r.slice(0,b.limit);
    return J({docs:r});
  }
  return J({error:'bad op'});
};
export const config={path:['/api','/health']};
