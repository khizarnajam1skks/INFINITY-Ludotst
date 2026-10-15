// Infinity Ludo server: zero dependencies. Run: node server.js  (PORT env optional)
const http=require('http'),fs=require('fs'),path=require('path');
const FILE=path.join(__dirname,'data.json');let DB={};
try{DB=JSON.parse(fs.readFileSync(FILE,'utf8'))}catch(e){}
let t=null;const save=()=>{clearTimeout(t);t=setTimeout(()=>fs.writeFile(FILE,JSON.stringify(DB),()=>{}),300)};
const parent=p=>p.split('/').slice(0,-1).join('/');
const setDeep=(o,k,v)=>{const a=k.split('.');let c=o;for(let i=0;i<a.length-1;i++){if(typeof c[a[i]]!=='object'||c[a[i]]===null)c[a[i]]={};c=c[a[i]]}c[a[a.length-1]]=v};
const getDeep=(o,k)=>k.split('.').reduce((c,x)=>c==null?c:c[x],o);
function op(b){
 const p=b.path;
 switch(b.op){
  case'get':return{exists:p in DB,data:DB[p]||null};
  case'set':DB[p]=b.data;save();return{ok:1};
  case'update':{DB[p]=DB[p]||{};for(const k in b.data)setDeep(DB[p],k,b.data[k]);save();return{ok:1}}
  case'delete':delete DB[p];save();return{ok:1};
  case'add':{const id=Math.random().toString(36).slice(2,12)+Date.now().toString(36);DB[p+'/'+id]=b.data;save();return{id,path:p+'/'+id}}
  case'list':{let r=Object.keys(DB).filter(k=>parent(k)===p).map(k=>({id:k.split('/').pop(),data:DB[k]}));
   for(const [f,o,v] of b.where||[]){r=r.filter(d=>{const x=getDeep(d.data,f);return o==='=='?x===v:o==='!='?x!==v:o==='>'?x>v:o==='>='?x>=v:o==='<'?x<v:o==='<='?x<=v:true})}
   if(b.order)r.sort((a,c)=>{const x=getDeep(a.data,b.order[0]),y=getDeep(c.data,b.order[0]);return(x>y?1:x<y?-1:0)*(b.order[1]==='desc'?-1:1)});
   if(b.limit)r=r.slice(0,b.limit);return{docs:r}}
 }
 return{error:'bad op'};
}
const H={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type','Access-Control-Allow-Methods':'POST,GET,OPTIONS'};
http.createServer((q,s)=>{
 if(q.method==='OPTIONS'){s.writeHead(204,H);return s.end()}
 if(q.method==='POST'&&q.url==='/api'){let d='';q.on('data',c=>{d+=c;if(d.length>1e6)q.destroy()});q.on('end',()=>{try{s.writeHead(200,{...H,'content-type':'application/json'});s.end(JSON.stringify(op(JSON.parse(d))))}catch(e){s.writeHead(400,H);s.end('{"error":"bad"}')}});return}
 if(q.url==='/health'){s.writeHead(200,H);return s.end('ok')}
 const f=path.join(__dirname,'index.html');
 if(fs.existsSync(f)){s.writeHead(200,{'content-type':'text/html; charset=utf-8'});return fs.createReadStream(f).pipe(s)}
 s.writeHead(404,H);s.end('Infinity Ludo server running');
}).listen(process.env.PORT||3000,()=>console.log('Infinity Ludo server on',process.env.PORT||3000));
