// controllers/vision.js
const db = require("../models");
const { Visions, SelectVisions } = db;

/**
 * [GET] /api/visions/my
 * 내가 선택한 진로희망 조회
 */
exports.getMy = async (req, res, next) => {
    try {
        const rows = await SelectVisions.findAll({
            where: { user_id: req.user.user_id },
            attributes: ["vision_id"],
        });

        // ✅ response는 vision_id 배열만 전달 (관심사 API 구조와 통일)
        const my = rows.map((r) => r.vision_id);
        console.log("사용자의 진로 희망: ", my);

        res.json({ success: true, my });
    } catch (err) {
        next(err); // ✅ 에러 처리 미들웨어로 넘김
    }
};

// 디테일까지 넘기기
exports.getMyVisions = async (req, res, next) => {
    try {
        const rows = await SelectVisions.findAll({
            where: { user_id: req.user.user_id },
            attributes: ["vision_id"],
        });

        const my = rows.map((r) => ({ vision_id: r.vision_id }));

        res.json({ success: true, my });
    } catch (err) {
        next(err); // ✅ 에러 처리 미들웨어로 넘김
    }
};
