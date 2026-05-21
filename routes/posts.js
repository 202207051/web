var express = require('express');
var router = express.Router();
var { getConnection } = require('./connect'); // connect.js 모듈 호출
var oracledb = require('oracledb');

/* 1. 게시판 메인 목록 페이지 렌더링 */
router.get('/', function(req, res, next) {
    res.render('index', { title: '게시판', pageName: 'posts/list.ejs' });
});

/* 2. 게시판 목록 데이터 및 검색/페이징 처리 API (GET /posts/list.json) */
router.get('/list.json', async function(req, res) {
    let con;
    try {
        con = await getConnection();
        
        // 프론트엔드에서 넘어오는 쿼리 스트링 파라미터 받기 (기본값 설정)
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const key = req.query.key ? req.query.key : 'title';
        const word = req.query.word ? req.query.word : '';
        const size = 5; // 한 페이지당 보여줄 게시글 수
        
        // 검색어 조건에 따른 동적 SQL 조건절 구성
        let whereSql = "";
        let bindParams = {};
        
        if (word !== "") {
            bindParams.word = `%${word}%`;
            if (key === 'title') {
                whereSql = "WHERE title LIKE :word ";
            } else if (key === 'content') { // 테이블 정의에 맞춰 body 대신 content 사용
                whereSql = "WHERE content LIKE :word ";
            } else if (key === 'writer') {
                whereSql = "WHERE writer LIKE :word ";
            }
        }

        // 전체 게시글 개수(페이징 계산용)를 구하는 쿼리
        let countSql = `SELECT COUNT(*) AS total FROM posts ${whereSql}`;
        const countResult = await con.execute(countSql, bindParams, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        const totalRows = countResult.rows[0].TOTAL;
        
        // 페이징 위치(시작 행 번호) 계산
        const offset = (page - 1) * size;
        
        // ORA-01745 에러 방지를 위해 OFFSET과 FETCH 구문에는 변수 값을 직접 주입
        // 테이블 스키마에 맞춰 id, regDate(fdate) 컬럼 사용 (viewcnt 제외)
        let sql = `
            SELECT id, title, writer,
                   TO_CHAR(regDate, 'YYYY-MM-DD HH24:MI') AS fdate 
            FROM posts 
            ${whereSql}
            ORDER BY id DESC
            OFFSET ${offset} ROWS FETCH NEXT ${size} ROWS ONLY
        `;
        
        // 데이터 조회 실행 (검색어 파라미터만 바인딩)
        const result = await con.execute(sql, bindParams, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        // 프론트엔드 list.ejs가 요구하는 규격(list 배열 및 total 정보)에 맞춰 반환
        res.send({
            list: result.rows,
            total: Math.ceil(totalRows / size) || 1  // 전체 페이지 개수 계산
        });

    } catch (err) {
        console.error("게시판 목록 조회 에러:", err);
        res.status(500).send(err.message);
    } finally {
        if (con) {
            try { 
                await con.close(); 
            } catch (e) { 
                console.error("연결 종료 중 에러:", e); 
            }
        }
    }
});

module.exports = router;