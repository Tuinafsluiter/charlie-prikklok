const {getSession,pg} = require('./_common');
module.exports = async function handler(req,res){
  try{
    const user=getSession(req);
    if(!user) return res.status(401).send('Geen sessie');
    const out=await pg('/werknemers?select=id,actief&id=eq.'+encodeURIComponent(user.id)+'&actief=eq.true&limit=1');
    const rows=JSON.parse(out.text||'[]');
    if(!rows[0]) return res.status(401).send('Account is inactief');
    return res.status(200).json({user});
  }catch(e){return res.status(500).send(String(e.message||e))}
}
