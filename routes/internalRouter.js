const express = require("express");
const router = express.Router();
const db = require("../models"); // models/index.js에서 db 불러오기

// GET /internal/users/batch?user_ids=1,2,3
// community-svc가 게시글 작성자 이름 조회할 때 사용
router.get("/users/batch", async (req, res) => {
    try {
        const { user_ids } = req.query;

        if (!user_ids) {
            return res.status(400).json({ message: "user_ids 필요" });
        }

        const ids = user_ids.split(",").map(Number);

        const users = await db.User.findAll({
            where: { user_id: ids },
            attributes: ["user_id", "name", "type"],
        });

        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// GET /internal/users/:id/status
// banCheck용 — 계정 정지 여부 확인
router.get("/users/:id/status", async (req, res) => {
    try {
        const user = await db.User.findOne({
            where: { user_id: req.params.id },
            attributes: ["user_id", "state_code", "banned_until"],
        });

        if (!user) {
            return res.status(404).json({ message: "유저 없음" });
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// GET /internal/users/:id/profile
// AI 추천용 — 관심사, 진로, 나이 조회
router.get("/users/:id/profile", async (req, res) => {
    try {
        const user = await db.User.findOne({
            where: { user_id: req.params.id },
            attributes: ["user_id", "name", "age", "type"],
        });

        if (!user) {
            return res.status(404).json({ message: "유저 없음" });
        }

        const interests = await db.SelectInterests.findAll({
            where: { user_id: req.params.id },
            attributes: ["interest_id"],
        });

        const visions = await db.SelectVisions.findAll({
            where: { user_id: req.params.id },
            attributes: ["vision_id"],
        });

        res.json({
            ...user.dataValues,
            interest_ids: interests.map((i) => i.interest_id),
            vision_ids: visions.map((v) => v.vision_id),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
