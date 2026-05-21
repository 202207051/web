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
        
        // 검색어 조건에 따른 동적 SQL 조건절 구성
        let whereSql = "";
        if (word !== "") {
            if (key === 'title') {
                whereSql = "WHERE title LIKE :word ";
            } else if (key === 'body') {
                whereSql = "WHERE body LIKE :word ";
            } else if (key === 'writer') {
                whereSql = "WHERE writer LIKE :word ";
            }
        }

        // 전체 게시글 개수(페이징 계산용)를 구하는 쿼리
        let countSql = `SELECT COUNT(*) AS total FROM posts ${whereSql}`;
        let bindParams = word !== "" ? { word: `%${word}%` } : {};
        
        const countResult = await con.execute(countSql, bindParams, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        const totalRows = countResult.rows[0].TOTAL;
        
        // 현재 한 페이지당 5개 혹은 10개씩 노출 기준 처리 (여기서는 전체 리스트 우선 처리 예시)
        // 오라클 버전에 맞추어 날짜를 가공(fdate)하여 바인딩 객체로 추출합니다.
        let sql = `
            SELECT pid, title, writer, viewcnt,
                   TO_CHAR(regdate, 'YYYY-MM-DD HH24:MI') AS fdate 
            FROM posts 
            ${whereSql}
            ORDER BY pid DESC
        `;
        
        const result = await con.execute(sql, bindParams, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        // 프론트엔드 list.ejs가 요구하는 규격(list 배열 및 total 정보)에 맞춰 반환합니다.
        res.send({
            list: result.rows,
            total: Math.ceil(totalRows / 5) || 1 // 페이징 컴포넌트 연동용 (필요시 조정 가능)
        });

    } catch (err) {
        console.error("게시판 목록 조회 에러:", err);
        res.status(500).send(err.message);
    } finally {
        if (con) {
            try { await con.close(); } catch (e) { console.error(e); }
        }
    }
});

module.exports = router;