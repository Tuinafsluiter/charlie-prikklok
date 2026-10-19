
const {makeToken,cookie,sanitizeUser,pg,clientIpHash} = require('./_common');

// Bescherming tegen pincodes raden: mislukte pogingen worden als hub_item
// 'login_fail' bewaard (alleen een gehashte IP, geen pincode). Er wordt niets gewist.
const WINDOW_MIN = 15;
const MAX_FAILS_PER_IP = 8;
const MAX_FAILS_TOTAL = 60;

async function countFails(extraFilter){
  const since=new Date(Date.now()-WINDOW_MIN*60000).toISOString();
  const out=await pg('/hub_items?select=id&type=eq.login_fail&created_at=gte.'+encodeURIComponent(since)+extraFilter+'&limit=200');
  return JSON.parse(out.text||'[]').length;
}

module.exports = async function handler(req,res){
  try{
    if(req.method!=='POST') return res.status(405).send('Method not allowed');
    const {pin}=req.body || {};
    if(!pin) return res.status(400).send('Pin ontbreekt');
    const ipHash=clientIpHash(req);
    let limited=false;
    try{
      limited = (await countFails('&target=eq.'+ipHash))>=MAX_FAILS_PER_IP || (await countFails(''))>=MAX_FAILS_TOTAL;
    }catch(e){ console.warn('login rate-limit check mislukt', e); }
    if(limited) return res.status(429).send('Te veel foute pogingen. Probeer over 15 minuten opnieuw.');
    const users = /^\d{4,8}$/.test(String(pin))
      ? JSON.parse((await pg('/werknemers?select=*&pincode=eq.'+encodeURIComponent(pin)+'&actief=eq.true&limit=1')).text||'[]')
      : [];
    if(!users[0]){
      try{
        await pg('/hub_items',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({type:'login_fail',author_name:'Systeem',message:'Foute pincode',target:ipHash,meta:{}})});
      }catch(e){ console.warn('login_fail opslaan mislukt', e); }
      return res.status(401).send('Ongeldige pincode');
    }
    const user=sanitizeUser(users[0]);
    res.setHeader('Set-Cookie', cookie('th_session', makeToken(user), 'Max-Age=28800'));
    return res.status(200).json({user});
  }catch(e){return res.status(500).send(String(e.message||e))}
}
