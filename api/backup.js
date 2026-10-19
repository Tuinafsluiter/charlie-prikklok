
const crypto = require('crypto');
const {sanitizeUser,pg} = require('./_common');

// Volledige back-up (alleen lezen) voor het maandelijkse script op de pc.
// Werkt enkel met de geheime sleutel BACKUP_TOKEN uit de Vercel-instellingen.
const TOKEN = process.env.BACKUP_TOKEN || '';

function tokenOk(req){
  const given=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  if(TOKEN.length<32 || !given) return false;
  const a=crypto.createHash('sha256').update(given).digest(), b=crypto.createHash('sha256').update(TOKEN).digest();
  return crypto.timingSafeEqual(a,b);
}
async function all(path){
  let out=[];
  for(let offset=0;offset<1000000;){
    const page=JSON.parse((await pg(path+'&limit=1000&offset='+offset)).text||'[]');
    if(!page.length) break;
    out=out.concat(page); offset+=page.length;
  }
  return out;
}

module.exports = async function handler(req,res){
  try{
    if(req.method!=='GET') return res.status(405).send('Method not allowed');
    if(!TOKEN) return res.status(404).send('Niet gevonden');
    if(!tokenOk(req)) return res.status(401).send('Geen toegang');
    const data={
      gemaakt_op:new Date().toISOString(),
      app:'Tuinafsluiter Hub',
      bron:'automatische back-up',
      werknemers:(await all('/werknemers?select=*&order=id.asc')).map(sanitizeUser),
      urenregistratie:await all('/urenregistratie?select=*&order=id.asc'),
      hub_items:await all('/hub_items?select=*&type=neq.login_fail&order=id.asc')
    };
    res.setHeader('Cache-Control','no-store');
    return res.status(200).json(data);
  }catch(e){return res.status(500).send(String(e.message||e))}
}
