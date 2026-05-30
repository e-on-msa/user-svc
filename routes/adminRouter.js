const router  = require("express").Router();
const { isAdmin } = require("../middleware/auth");
const { banUser, unbanOrExtend } = require("../controllers/adminController");

// 관리자용 커뮤니티 제재 라우트

// 지정 시간(또는 영구) 이용 정지
// POST /admin/ban
router.post("/ban", isAdmin, banUser);

// 정지 해제 OR 연장
// PATCH /admin/ban/:user_id
router.patch("/ban/:user_id", isAdmin, unbanOrExtend);

module.exports = router;
