const express = require('express');
const router = express.Router();
const db = require('../models'); // database/db → models로 교체 (Sequelize 방식)
const { isLoggedIn } = require('../middleware/auth'); // 인증 미들웨어 추가 (버그 수정)

// 관심분야 선택
router.post('/selectInterest', isLoggedIn, async (req, res) => {
    const { interestId } = req.body;
    const userId = req.headers['x-user-id'] || req.user?.user_id; // MSA 헤더 방식

    try {
        await db.SelectInterests.create({
            user_id: userId,
            interest_id: interestId,
        });
        res.status(201).json({ message: '관심분야 선택 완료' });
    } catch (err) {
        console.error('❌ 관심분야 선택 오류:', err.message);
        res.status(500).json({ error: '관심분야 선택 실패' });
    }
});

// 진로희망 선택
router.post('/selectVision', isLoggedIn, async (req, res) => {
    const { visionId } = req.body;
    const userId = req.headers['x-user-id'] || req.user?.user_id; // MSA 헤더 방식

    try {
        await db.SelectVisions.create({
            user_id: userId,
            vision_id: visionId,
        });
        res.status(201).json({ message: '진로희망 선택 완료' });
    } catch (err) {
        console.error('❌ 진로희망 선택 오류:', err.message);
        res.status(500).json({ error: '진로희망 선택 실패' });
    }
});

module.exports = router;
