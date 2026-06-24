
const {clearCookie} = require('./_common');
module.exports = async function handler(req,res){
  res.setHeader('Set-Cookie', clearCookie('th_session'));
  return res.status(200).json({ok:true});
}
