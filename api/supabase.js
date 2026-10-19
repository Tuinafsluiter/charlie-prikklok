
const {getSession,isOwner,isViewer,sanitizeUser,tableFromPath,appendFilter,pg,brusselsDate} = require('./_common');

const PENDING_LEAVE = 7777;
const ALLOWED_TABLES = ['werknemers','urenregistratie','hub_items'];
const ALLOWED_PREFER = ['return=representation','return=minimal','count=exact'];

function safeJson(body){
  if(!body) return null;
  if(typeof body === 'object') return body;
  try{return JSON.parse(body)}catch(e){return body}
}
function bodyText(body){
  if(body==null) return undefined;
  return typeof body === 'string' ? body : JSON.stringify(body);
}
function fail(msg,status=403){const e=new Error(msg);e.status=status;return e}
function isWrite(method){return ['POST','PATCH','DELETE'].includes(String(method||'GET').toUpperCase())}
function queryOf(path){const i=path.indexOf('?');return i<0?'':path.slice(i+1)}
function singleIdFilter(path){const m=/^\/[a-z_]+\?id=eq\.(\d+)$/.exec(path);return m?Number(m[1]):null}
function minutesBetween(a,b){return Math.round((new Date(b)-new Date(a))/60000)}

// Alleen eenvoudige paden: /tabel?filters. Geen extra segmenten, geen aliassen
// of gekoppelde tabellen in select (daarmee kon de pincode uitgelezen worden).
function checkPath(path,table){
  if(!new RegExp('^/'+table+'(\\?[^#]*)?$').test(path)) throw fail('Ongeldig pad',400);
  let decoded;
  try{decoded=decodeURIComponent(path).toLowerCase()}catch(e){throw fail('Ongeldig pad',400)}
  if(decoded.includes('pincode')) throw fail('Niet toegestaan',403);
  for(const part of queryOf(path).split('&')){
    if(part.startsWith('select=') && !/^[\w,*]+$/.test(decodeURIComponent(part.slice(7)))) throw fail('Ongeldige select',400);
  }
}
function cleanHeaders(headers){
  const prefer=String(headers?.Prefer||headers?.prefer||'').split(',').map(x=>x.trim()).filter(x=>ALLOWED_PREFER.includes(x));
  return prefer.length?{Prefer:prefer.join(',')}:{};
}

// Hub-items die een werknemer mag zien: chat/mededelingen/config voor iedereen of voor hem,
// plus de eigen markeringen voor handmatige uren en het soort werkdag (nodig voor een correct saldo).
function employeeHubFilter(user){
  const id=String(user.id), naam=String(user.naam||'').toLowerCase().replace(/"/g,'');
  return 'or=('+encodeURIComponent(
    `and(type.in.(chat,announcement,config),target.in.("all","${id}","${naam}")),`+
    `and(type.eq.manual_hours,meta->>medewerker_id.eq.${id}),`+
    `and(type.eq.work_classification,target.like."${id}:*")`
  )+')';
}
function employeeCanSeeHub(i,user){
  const type=String(i.type||''), target=String(i.target||'all'), id=String(user.id);
  if(['chat','announcement','config'].includes(type)) return target==='all'||target===id||target===String(user.naam||'').toLowerCase();
  if(type==='manual_hours') return String(i.meta?.medewerker_id)===id;
  if(type==='work_classification') return target.startsWith(id+':');
  return false;
}

// Werknemers mogen alleen: inklokken (nu), verlof aanvragen, en hun open registratie afsluiten / pauze bijwerken.
function employeeInsertRows(data,user){
  const rows=Array.isArray(data)?data:[data];
  if(!rows.length||rows.length>60) throw fail('Ongeldige registratie',400);
  return rows.map(r=>{
    if(Number(r?.medewerker_id)!==Number(user.id)) throw fail('Je mag alleen eigen registraties maken');
    if(Number(r.pauze_minuten)===PENDING_LEAVE){
      if(!/^\d{4}-\d{2}-\d{2}$/.test(String(r.datum||''))) throw fail('Ongeldige datum',400);
      return {medewerker_id:user.id,datum:r.datum,pauze_minuten:PENDING_LEAVE,totaal_minuten:0,inkloktijd:null,uitkloktijd:null};
    }
    if(r.inkloktijd && !r.uitkloktijd && rows.length===1){
      return {medewerker_id:user.id,datum:brusselsDate(),inkloktijd:new Date().toISOString(),pauze_minuten:0};
    }
    throw fail('Werknemers kunnen alleen in- en uitklokken of verlof aanvragen');
  });
}
async function employeePatch(path,data,user){
  const id=singleIdFilter(path);
  if(!id) throw fail('Ongeldige wijziging',400);
  const keys=Object.keys(data||{});
  if(!keys.length||keys.some(k=>!['uitkloktijd','pauze_minuten','totaal_minuten'].includes(k))) throw fail('Deze wijziging is niet toegestaan');
  const row=JSON.parse((await pg('/urenregistratie?select=*&id=eq.'+id+'&medewerker_id=eq.'+encodeURIComponent(user.id)+'&limit=1')).text||'[]')[0];
  if(!row||!row.inkloktijd||row.uitkloktijd) throw fail('Alleen je eigen open registratie kan aangepast worden');
  const oldPause=Number(row.pauze_minuten||0);
  const pause=data.pauze_minuten==null?oldPause:Math.round(Number(data.pauze_minuten));
  if(!Number.isFinite(pause)||pause<oldPause) throw fail('Ongeldige pauze',400);
  const out={pauze_minuten:pause};
  if(data.uitkloktijd!=null){
    const t=new Date(data.uitkloktijd);
    if(isNaN(t)||t<=new Date(row.inkloktijd)||t.getTime()>Date.now()+2*60000) throw fail('Ongeldig uitkloktijdstip',400);
    const span=minutesBetween(row.inkloktijd,t);
    if(pause>span) throw fail('Pauze is langer dan de werktijd',400);
    out.uitkloktijd=t.toISOString();
    out.totaal_minuten=Math.max(0,span-pause);
  }else if(pause>minutesBetween(row.inkloktijd,new Date())+2){
    throw fail('Pauze is langer dan de werktijd',400);
  }
  return {path:'/urenregistratie?id=eq.'+id+'&medewerker_id=eq.'+encodeURIComponent(user.id)+'&uitkloktijd=is.null',data:out};
}

module.exports = async function handler(req,res){
  try{
    if(req.method!=='POST') return res.status(405).send('Method not allowed');
    const user=getSession(req);
    if(!user) return res.status(401).send('Geen geldige sessie');
    // Een reeds ingelogde werknemer die intussen inactief werd gezet,
    // mag zijn oude sessie niet blijven gebruiken. Controleer dit op elke API-call.
    const activeCheck=await pg('/werknemers?select=id,actief&id=eq.'+encodeURIComponent(user.id)+'&actief=eq.true&limit=1');
    const activeRows=JSON.parse(activeCheck.text||'[]');
    if(!activeRows[0]) return res.status(401).send('Account is inactief');
    let {path,method='GET',headers={},body=null}=req.body || {};
    if(!path || typeof path!=='string') return res.status(400).send('Path ontbreekt');
    method=String(method||'GET').toUpperCase();
    if(!['GET','POST','PATCH','DELETE'].includes(method)) throw fail('Methode niet toegestaan',405);
    const table=tableFromPath(path);
    if(!ALLOWED_TABLES.includes(table)) throw fail('Tabel niet toegestaan');
    checkPath(path,table);
    headers=cleanHeaders(headers);

    const owner=isOwner(user), viewer=!owner&&isViewer(user), employee=!owner&&!viewer;
    let data=safeJson(body);

    // Niets mag in bulk gewist worden; alleen één regel per keer door de beheerder.
    if(method==='DELETE'){
      if(!owner || table==='werknemers' || !singleIdFilter(path)) throw fail('Verwijderen is niet toegestaan. Zet werknemers op inactief of corrigeer de registratie.');
    }

    if(table==='werknemers' && isWrite(method) && !owner) throw fail('Geen rechten voor werknemersbeheer');

    if(table==='urenregistratie'){
      if(viewer && isWrite(method)) throw fail('Meekijk-account kan geen uren wijzigen');
      if(employee){
        if(method==='GET') path=appendFilter(path,'medewerker_id=eq.'+encodeURIComponent(user.id));
        else if(method==='POST') data=employeeInsertRows(data,user);
        else if(method==='PATCH') ({path,data}=await employeePatch(path,data,user));
      }
    }

    if(table==='hub_items' && !owner){
      if(method==='GET' && employee) path=appendFilter(path,employeeHubFilter(user));
      if(method==='POST'){
        const allowed=viewer?['chat','announcement','audit']:['chat','audit'];
        const rows=Array.isArray(data)?data:[data];
        rows.forEach(r=>{
          if(!allowed.includes(String(r?.type||''))) throw fail('Geen rechten voor dit hub-item');
          r.author_id=user.id; r.author_name=user.naam;
        });
      }
      if(method==='PATCH'){
        // Niet-beheerders mogen enkel read_by bijwerken via bestaande app.
        if(!singleIdFilter(path) || !data || Object.keys(data).some(k=>k!=='read_by')) throw fail('Alleen read_by mag aangepast worden');
      }
    }

    let out;
    try{
      out=await pg(path,{method,headers,body:bodyText(data ?? body)});
    }catch(e){
      // Vangnet: lukt de databasefilter voor werknemers niet, dan het oude gedrag (filteren hieronder).
      if(!(table==='hub_items' && employee && method==='GET')) throw e;
      out=await pg(path.slice(0,path.lastIndexOf('&or=')),{method,headers});
    }
    if(out.status===204) return res.status(204).end();
    let text=out.text||'';
    if(text && (method==='GET' || table==='werknemers')){
      let parsed=JSON.parse(text);
      if(table==='werknemers'){
        parsed=Array.isArray(parsed)?parsed.map(sanitizeUser):sanitizeUser(parsed);
      }
      if(table==='hub_items' && employee && method==='GET' && Array.isArray(parsed)){
        parsed=parsed.filter(i=>employeeCanSeeHub(i,user));
      }
      return res.status(out.status).json(parsed);
    }
    return res.status(out.status).send(text);
  }catch(e){return res.status(e.status||400).send(String(e.message||e))}
}
