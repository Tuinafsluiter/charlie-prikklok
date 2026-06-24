
const {makeToken,cookie,sanitizeUser,pg} = require('./_common');

module.exports = async function handler(req,res){
  try{
    if(req.method!=='POST') return res.status(405).send('Method not allowed');
    const {pin}=req.body || {};
    if(!pin) return res.status(400).send('Pin ontbreekt');
    const out=await pg('/werknemers?select=*&pincode=eq.'+encodeURIComponent(pin)+'&actief=eq.true&limit=1');
    const users=JSON.parse(out.text||'[]');
    if(!users[0]) return res.status(401).send('Ongeldige pincode');
    const user=sanitizeUser(users[0]);
    res.setHeader('Set-Cookie', cookie('th_session', makeToken(user), 'Max-Age=28800'));
    return res.status(200).json({user});
  }catch(e){return res.status(500).send(String(e.message||e))}
}
