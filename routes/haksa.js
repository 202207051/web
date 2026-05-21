var express = require('express');
var router = express.Router();
var {getConnection} = require('./connect');
var oracledb = require('oracledb');

/* 교수관리 페이지*/
router.get('/pro', function(req, res, next) {
    res.render('index', {title:'교수관리', pageName:'haksa/professors.ejs'});
});

/* 교수 데이터 생성 */
router.get('/pro/list.json', async function(req, res){
    var con;
    try{
       con = await getConnection();
       let sql="select p.*, to_char(hiredate, 'YYYY-MM-DD') fdate, to_char(salary, '999,999,999') fsalary from professors p ";
       sql += "order by pcode";
       const result = await con.execute(sql, {}, 
            {outFormat:oracledb.OUT_FORMAT_OBJECT});
       res.send(result.rows);
    }catch(err){
        console.error(err);
        res.status(500).send(err.message);
    }finally{
        if(con) await con.close();
    }
});

/* 교수 등록 페이지*/
router.get('/pro/insert', async function(req, res, next){
    let code;
    let con;
    try{
        con = await getConnection();
        // 데이터가 없는 첫 등록 상황을 대비해 NVL 예외 로직 추가
        const sql="select nvl(max(pcode), 0)+1 from professors";
        const result= await con.execute(sql);
        code = result.rows[0][0];
        res.render('index.ejs', {title:'교수등록', pageName:'haksa/professors_insert.ejs', code});
    }catch(err){
        console.error(err);
        res.status(500).send("교수 번호 생성 오류");
    }finally{
        if(con) await con.close();
    }
});

//교수등록
router.post('/pro/insert', async function(req, res){
    console.log('교수등록');
    const pcode = req.body.pcode;
    const pname = req.body.pname;
    const dept = req.body.dept;
    const title = req.body.title;
    const hiredate = req.body.hiredate;
    const salary = req.body.salary;
    console.log(pcode, pname, dept, title, hiredate, salary);
    let con;
    try{
        con = await getConnection();
        let sql = "insert into professors(pcode, pname, dept, title, hiredate, salary) values(:pcode, :pname, :dept, :title, :hiredate, :salary)";
        await con.execute(sql, {pcode, pname, dept, title, hiredate, salary},{autoCommit:true});
        res.sendStatus(200); // 무한 루프 방지를 위해 성공 시점에서 즉시 응답 반환
    }catch(err){
        console.error(err);
        res.sendStatus(500);
    }finally{
        if(con) await con.close();
    }
});

//교수 삭제 REST API
router.post('/pro/delete', async function(req,res){
    const pcode=req.body.pcode;
    let con;
    try{
        con = await getConnection();
        let sql = "delete from professors where pcode=:pcode";
        await con.execute(sql, {pcode}, {autoCommit:true});
        res.sendStatus(200);
    }catch(err){
        res.sendStatus(500);
    }finally{
        if(con) await con.close();
    }
});

/* 학생관리 페이지*/
router.get('/stu', function(req, res, next) {
    res.render('index', {title:'학생관리', pageName:'haksa/students.ejs'});
});

/* 학생목록 데이터*/
router.get('/stu/list.json', async function(req, res){
    let con;
    try{
        con = await getConnection();
        let sql= "select * from view_students order by scode desc";
        let result = await con.execute(sql, {}, {outFormat:oracledb.OUT_FORMAT_OBJECT});
        res.send(result.rows);
    }catch(err){
        console.error(err);
        res.sendStatus(500);
    }finally{
       if(con) await con.close(); 
    }
});

/*학생등록 페이지*/
router.get('/stu/insert', async function(req,res){
    let code;
    let con;
    try{
        con = await getConnection();
        const sql = "select nvl(max(scode), 0)+1 from students";
        let result = await con.execute(sql);
        code = result.rows[0][0];
        res.render('index', {title:'학생등록', pageName:'haksa/students_insert.ejs', code});
    }catch(err){
        console.error(err);
        res.status(500).send("학번 생성 오류");
    }finally{
        if(con) await con.close();
    }
});

// 학생등록
router.post('/stu/insert', async function(req,res){
    const scode=req.body.scode; 
    const sname=req.body.sname;
    const dept=req.body.dept;
    const birthday=req.body.birthday;
    const year=req.body.year;
    const advisor=req.body.pcode;
    console.log(scode, sname, dept, birthday, year, advisor);
    let con;
    try{
        con = await getConnection();
        let sql = "insert into students(scode, sname, dept, birthday, year, advisor)";
        sql += "values(:scode, :sname, :dept, :birthday, :year, :advisor)";
        await con.execute(sql, {scode, sname, dept, birthday, year, advisor}, {autoCommit:true});
        res.sendStatus(200); // 서버 크래시를 방지하기 위해 try 내 블록으로 안전하게 이동 안착
    }catch(err){
        console.error(err);
        res.sendStatus(500);
    }finally{
        if(con) await con.close();
    }
});

//학생삭제
router.post('/stu/delete', async function(req, res){
    const scode=req.body.scode;
    let con;
    try{
        con = await getConnection();
        let sql = "delete from students where scode=:scode";
        await con.execute(sql, {scode}, {autoCommit:true});
        res.sendStatus(200);
    }catch(err){
        res.sendStatus(500);
    }finally{
        if(con) await con.close();
    }
});

/* 강좌관리 페이지*/
router.get('/cou', function(req, res, next) {
    res.render('index', {title:'강좌관리', pageName:'haksa/courses.ejs'});
});

module.exports = router;