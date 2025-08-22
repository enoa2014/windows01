const DBM = require('./src/database/DatabaseManager');
const FSM = require('./src/services/FamilyServiceManager');

(async () => {
    const db = new DBM();
    await db.initialize();
    const fsm = new FSM(db);
    
    console.log('直接查询前3条记录:');
    const direct = await db.all('SELECT * FROM family_service_records ORDER BY year_month DESC LIMIT 3');
    direct.forEach(r => console.log(`${r.year_month}: 家庭${r.family_count}, 服务${r.total_service_count}`));
    
    console.log('\n通过Manager查询前3条:');
    const managed = await fsm.getRecords({}, { currentPage: 1, pageSize: 3 });
    managed.forEach(r => console.log(`${r.year_month}: 家庭${r.family_count}, 服务${r.total_service_count}`));
    
    await db.close();
})().catch(console.error);