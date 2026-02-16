const pool = require('../backend/dist/database').default;
(async ()=>{
  try{
    const res = pool.query(`SELECT a.*, u.username as created_by_username, u.first_name, u.last_name FROM activities a JOIN users u ON a.created_by_id = u.id ORDER BY a.date, a.time`);
    console.log('pool rows:', res.rows.length);
    console.dir(res.rows, { depth: 2 });
  } catch(e){ console.error('err', e); }
})();
