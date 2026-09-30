
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uwtkopnjwewkodozvkxi.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SESSION_SECRET = process.env.APP_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'CHANGE_ME';

function b64url(input){
  return Buffer.from(input).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function sign(payload){
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function makeToken(user){
  const payload = b64url(JSON.stringify({id:user.id, naam:user.naam, rol:user.rol, exp:Date.now()+1000*60*60*8}));
  return payload + '.' + sign(payload);
}
function parseCookies(req){
  return Object.fromEntries(String(req.headers.cookie||'').split(';').map(x=>x.trim()).filter(Boolean).map(x=>{
    const i=x.indexOf('='); return [decodeURIComponent(x.slice(0,i)), decodeURIComponent(x.slice(i+1))];
  }));
}
function getSession(req){
  const token=parseCookies(req).th_session;
  if(!token) return null;
  const [payload,sig]=token.split('.');
  if(!payload||!sig||sign(payload)!==sig) return null;
  try{
    const data=JSON.parse(Buffer.from(payload.replace(/-/g,'+').replace(/_/g,'/'),'base64').toString());
    if(!data.exp || data.exp<Date.now()) return null;
    return data;
  }catch(e){return null}
}
function cookie(name,value,opts=''){
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Secure; ${opts}`;
}
function clearCookie(name){return `${name}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;}
function isOwner(u){return String(u?.rol||'').toLowerCase().includes('admin')||String(u?.rol||'').toLowerCase().includes('beheerder')||String(u?.naam||'').toLowerCase()==='jos'}
function isViewer(u){let r=String(u?.rol||'').toLowerCase();return r.includes('meekijk')||r.includes('kijk')||r.includes('viewer')||String(u?.naam||'').toLowerCase()==='rhani'}
function sanitizeUser(u){if(!u)return u; const {pincode, ...safe}=u; return safe;}
function tableFromPath(path){return String(path||'').split('?')[0].replace(/^\/+/,'').split('/')[0];}
function appendFilter(path, filter){
  return path + (path.includes('?') ? '&' : '?') + filter;
}
async function pg(path, options={}){
  if(!SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY ontbreekt in Vercel Environment Variables');
  const res=await fetch(SUPABASE_URL+'/rest/v1'+path,{
    method: options.method || 'GET',
    headers:{apikey:SERVICE_KEY, Authorization:'Bearer '+SERVICE_KEY, 'Content-Type':'application/json', ...(options.headers||{})},
    body: options.body
  });
  const text=await res.text();
  if(!res.ok) throw new Error(text || res.statusText);
  return {status:res.status, text};
}
module.exports={makeToken,getSession,cookie,clearCookie,isOwner,isViewer,sanitizeUser,tableFromPath,appendFilter,pg};
