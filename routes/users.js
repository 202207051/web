var express = require('express');
var router = express.Router();

/* 로그인 페이지 */
router.get('/login', function(req, res, next) {
  res.render('index', {title: '로그인', pageName: 'login.ejs'});
});

module.exports = router;