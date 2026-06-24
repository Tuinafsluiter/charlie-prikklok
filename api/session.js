
const {getSession} = require('./_common');
module.exports = async function handler(req,res){
  const user=getSession(req);
  if(!user) return res.status(401).send('Geen sessie');
  return res.status(200).json({user});
}
