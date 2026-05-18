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

const mypageController = require('../controllers/mypageController');

// 🔒 활동 이력 조회 (로그인 필요 + 필터/페이징)
router.get('/activity-history', isLoggedIn, mypageController.getActivityHistory);

// 내 정보 조회
router.get('/me', isLoggedIn, getMyInfo);

// 내 정보 수정
router.put('/me', isLoggedIn, updateMyInfo);

// 비밀번호 변경
router.put('/me/password', isLoggedIn, changePassword);

// 계정 탈퇴
router.delete('/me', isLoggedIn, deactivateAccount);

module.exports = router;
