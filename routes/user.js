// backend/routes/user.js
const express = require('express');
const {
  getMyInfo,
  updateMyInfo,
  changePassword,
  deactivateAccount
} = require('../controllers/user');
const { isLoggedIn } = require('../middleware/auth');

const router = express.Router();

// 내 정보 조회
router.get('/me', isLoggedIn, getMyInfo);

// 내 정보 수정
router.put('/me', isLoggedIn, updateMyInfo);

// 비밀번호 변경
router.put('/me/password', isLoggedIn, changePassword);

// 계정 탈퇴
router.delete('/me', isLoggedIn, deactivateAccount);

module.exports = router;
