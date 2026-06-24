
const {getSession,isOwner,isViewer,sanitizeUser,tableFromPath,appendFilter,pg} = require('./_common');

function safeJson(body){
  if(!body) return null;
  if(typeof body === 'object') return body;
  try{return JSON.parse(body)}catch(e){return body}
}
function bodyText(body){
  if(body==null) return undefined;
  return typeof body === 'string' ? body : JSON.stringify(body);
}
function ensureAllowedTable(table){
  if(!['werknemers','urenregistratie','hub_items'].includes(table)) throw new Error('Tabel niet toegestaan');
}
function isWrite(method){return ['POST','PATCH','DELETE'].includes(String(method||'GET').toUpperCase())}
function filterHubItems(items,user){
  if(isOwner(user) || isViewer(user)) return items;
  return items.filter(i=>{
    const type=String(i.type||'');
    const target=String(i.target||'all');
    return (type==='chat'||type==='announcement'||type==='config') && (target==='all'||target===String(user.id)||target===String(user.naam).toLowerCase());
  });
}

module.exports = async function handler(req,res){
  try{
    if(req.method!=='POST') return res.status(405).send('Method not allowed');
    const user=getSession(req);
    if(!user) return res.status(401).send('Geen geldige sessie');
    let {path,method='GET',headers={},body=null}=req.body || {};
    if(!path || typeof path!=='string') return res.status(400).send('Path ontbreekt');
    method=String(method||'GET').toUpperCase();
    const table=tableFromPath(path);
    ensureAllowedTable(table);

    let data=safeJson(body);

    if(isWrite(method) && table==='werknemers' && !isOwner(user)) throw new Error('Geen rechten voor werknemersbeheer');

    if(table==='urenregistratie' && !isOwner(user) && !isViewer(user)){
      if(method==='GET'){
        path=appendFilter(path,'medewerker_id=eq.'+encodeURIComponent(user.id));
      }else if(method==='POST'){
        const rows=Array.isArray(data)?data:[data];
        rows.forEach(r=>{ if(Number(r.medewerker_id)!==Number(user.id)) throw new Error('Je mag alleen eigen registraties maken'); });
      }else if(method==='PATCH' || method==='DELETE'){
        path=appendFilter(path,'medewerker_id=eq.'+encodeURIComponent(user.id));
      }
    }

    if(table==='hub_items'){
      if(!isOwner(user) && !isViewer(user)){
        if(method==='DELETE') throw new Error('Geen rechten om hub-items te wissen');
        if(method==='POST'){
          const rows=Array.isArray(data)?data:[data];
          rows.forEach(r=>{
            const type=String(r.type||'');
            if(!['chat','audit'].includes(type)) throw new Error('Geen rechten voor dit hub-item');
            r.author_id=user.id; r.author_name=user.naam;
          });
          body=data;
        }
        if(method==='PATCH'){
          // Werknemers mogen enkel read_by bijwerken via bestaande app.
          if(data && Object.keys(data).some(k=>k!=='read_by')) throw new Error('Alleen read_by mag aangepast worden');
        }
      }
    }

    const out=await pg(path,{method,headers,body:bodyText(data ?? body)});
    if(out.status===204) return res.status(204).end();
    let text=out.text||'';
    if(method==='GET' && text){
      let parsed=JSON.parse(text);
      if(table==='werknemers'){
        parsed=Array.isArray(parsed)?parsed.map(sanitizeUser):sanitizeUser(parsed);
      }
      if(table==='hub_items' && Array.isArray(parsed)){
        parsed=filterHubItems(parsed,user);
      }
      return res.status(200).json(parsed);
    }
    return res.status(out.status).send(text);
  }catch(e){return res.status(400).send(String(e.message||e))}
}
