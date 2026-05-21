// DB 연결
const oracledb = require('oracledb'); //

async function getConnection(){ //
    let connection; //
    try{ //
        connection = await oracledb.getConnection({ //
            user: 'board', //
            password: 'pass', //
            connectString: 'localhost/xe' //
        }); //
        console.log('DB 연결 성공'); //
        return connection; //
    }catch(err){ //
        console.log('DB 연결 오류', err.message); //
    } //
} //

module.exports = {getConnection}; //