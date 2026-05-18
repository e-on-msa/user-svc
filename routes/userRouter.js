// backend/routes/user.js
const express = require("express");
const {
    getMyInfo,
    updateMyInfo,
    verifyPassword,
    changePassword,
    deactivateAccount,
    deleteAccount,
    getMyBoardRequests,
    getAllUserState,
    updateUserState,
    requestProfileUpdateCode,
    verifyCode,
} = require("../controllers/userController");

const { getActivityHistory } = require("../controllers/mypageController");
const { isLoggedIn } = require("../middleware/auth");

const router = express.Router();

// 활동 이력 조회 라우터
router.get("/activity-history", isLoggedIn, getActivityHistory);

// 내 정보 조회
router.get("/me", isLoggedIn, getMyInfo);

// 내 정보 수정
router.put("/me", isLoggedIn, updateMyInfo);

// 소셜 계정: 회원정보 수정 전 이메일 인증코드 요청
router.post("/me/profile-verify/request", isLoggedIn, requestProfileUpdateCode);

// 비밀번호 인증
router.post("/verify-password", isLoggedIn, verifyPassword);

// 비밀번호 변경
router.put("/me/password", isLoggedIn, changePassword);

// 계정 비활성화
router.delete("/me", isLoggedIn, deleteAccount);

// 계정 탈퇴
router.patch("/me/deactivate", isLoggedIn, deactivateAccount);

// 내 게시판 개설 신청 조회
router.get("/board-requests/me", isLoggedIn, getMyBoardRequests);

// 전체 사용자 계정 상태 조회 (관리자용)
router.get("/state", isLoggedIn, getAllUserState);

// 사용자 계정 상태 업데이트 (관리자용)
router.patch("/state", isLoggedIn, updateUserState);

// 이메일 인증 코드 검증
router.post("/verify-code", isLoggedIn, verifyCode);

module.exports = router;
