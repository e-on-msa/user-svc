const express = require("express");
const router = express.Router();
const db = require("../models");
const bcrypt = require("bcrypt");

// POST /internal/auth/login
// Gateway가 로그인 처리를 user-svc에 위임할 때 사용
// localStrategy.js 로직을 그대로 옮긴 것
router.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "이메일과 비밀번호를 입력해주세요." });
        }

        const user = await db.User.scope("withPassword").findOne({
            where: { email },
            attributes: ["user_id", "email", "password", "name", "type", "state_code", "provider", "sns_id"],
        });

        if (!user) {
            return res.status(401).json({ message: "가입되지 않은 회원입니다." });
        }

        if (!user.password) {
            return res.status(401).json({ message: "소셜 로그인 계정입니다." });
        }

        if (user.state_code === "inactive") {
            return res.status(401).json({ message: "비활성화된 계정입니다." });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
        }

        return res.json({
            user: {
                user_id: user.user_id,
                email: user.email,
                name: user.name,
                type: user.type,
                state_code: user.state_code,
                provider: user.provider,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// GET /internal/users/batch?ids=1,2,3
// community-svc, challenge-svc가 이름/이메일 조회할 때 사용
// ids, user_ids 둘 다 지원 (서비스마다 파라미터 이름이 달라서)
router.get("/users/batch", async (req, res) => {
    try {
        const rawIds = req.query.ids || req.query.user_ids;

        if (!rawIds) {
            return res.status(400).json({ message: "ids 또는 user_ids 필요" });
        }

        const ids = rawIds.split(",").map(Number);

        const users = await db.User.findAll({
            where: { user_id: ids },
            attributes: ["user_id", "name", "email", "type"],
        });

        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// GET /internal/users/:id
// Gateway가 세션에서 user_id 꺼내서 유저 정보 복원할 때 사용
// passport의 deserializeUser 역할
router.get("/users/:id", async (req, res) => {
    try {
        const user = await db.User.findOne({
            where: { user_id: req.params.id },
            attributes: [
                "user_id", "name", "email", "age", "type",
                "state_code", "provider", "sns_id",
                "agreements", "email_notification", "banned_until",
            ],
        });

        if (!user) {
            return res.status(404).json({ message: "존재하지 않는 유저입니다." });
        }

        res.json(user);
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

// GET /internal/users/:userId/my-school
// schedule-svc가 학사일정 조회 시 유저 학교 정보 조회할 때 사용
router.get("/users/:userId/my-school", async (req, res) => {
    try {
        const mySchool = await db.MySchool.findOne({
            where: { user_id: req.params.userId },
            attributes: ["user_id", "school_code", "region_id"],
        });

        if (!mySchool) {
            return res.status(404).json({ message: "학교 정보 없음" });
        }

        res.json(mySchool);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// GET /internal/preferences/user/:userId
// recommendation-svc가 추천 계산할 때 유저 관심사/진로/나이 조회용
router.get("/preferences/user/:userId", async (req, res) => {
    try {
        const user = await db.User.findOne({
            where: { user_id: req.params.userId },
            attributes: ["user_id", "age"],
        });

        if (!user) {
            return res.status(404).json({ message: "유저 없음" });
        }

        const interests = await db.SelectInterests.findAll({
            where: { user_id: req.params.userId },
            attributes: ["interest_id"],
        });

        const visions = await db.SelectVisions.findAll({
            where: { user_id: req.params.userId },
            attributes: ["vision_id"],
        });

        res.json({
            user_id: user.user_id,
            age: user.age,
            interests: interests.map((i) => i.interest_id),
            visions: visions.map((v) => v.vision_id),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
