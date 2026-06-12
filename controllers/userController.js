const bcrypt = require("bcrypt");
const db = require("../models");
const User = db.User;
const { Op } = require("sequelize");
const { EmailCode } = db;
const transporter = require("../config/mail");
const axios = require("axios");
const rabbitmq = require("../config/rabbitmq");

// BoardRequest 직접 import 제거 (community-svc 소유)

/**
 * [GET] /api/user/me
 */
exports.getMyInfo = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({ success: false, message: "로그인이 필요합니다." });
        }
        const me = await User.findByPk(userId, {
            attributes: { exclude: ["pw", "refresh_token"] },
        });
        if (!me) {
            return res.status(404).json({ success: false, message: "유저를 찾을 수 없습니다." });
        }
        res.json({ success: true, user: me });
    } catch (err) {
        next(err);
    }
};

/**
 * [PUT] /api/user/me
 */
exports.updateMyInfo = async (req, res, next) => {
    const { name, age, emailNotification, currentPassword, email, code } = req.body;
    const userId = req.headers['x-user-id'];

    if (email) {
        return res.status(400).json({ message: "이메일은 별도 절차로 변경하세요." });
    }

    if (name !== undefined) {
        return res.status(400).json({ message: "이름은 변경할 수 없습니다." });
    }

    try {
        const user = await User.scope("withPassword").findByPk(userId);
        if (!user) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

        if (user.provider === "local") {
            if (!currentPassword) {
                return res.status(400).json({ message: "현재 비밀번호를 입력해주세요." });
            }
            const match = await bcrypt.compare(currentPassword, user.password || "");
            if (!match) {
                return res.status(400).json({ message: "현재 비밀번호가 일치하지 않습니다." });
            }
        } else {
            if (!code) {
                return res.status(400).json({ message: "이메일 인증 코드가 필요합니다." });
            }
            const emailCode = await EmailCode.findOne({
                where: { email: user.email, purpose: "profile_update" },
                order: [["createdAt", "DESC"]],
            });
            if (!emailCode) {
                return res.status(400).json({ message: "인증 코드를 먼저 발급받으세요." });
            }
            if (new Date(emailCode.expiresAt).getTime() < Date.now()) {
                return res.status(400).json({ message: "인증 코드가 만료되었습니다." });
            }
            if (emailCode.code !== code) {
                return res.status(400).json({ message: "인증 코드가 올바르지 않습니다." });
            }
            try { await emailCode.destroy(); } catch (_) {}
        }

        const updatedData = {};
        if (age !== undefined) updatedData.age = age;
        if (emailNotification !== undefined) updatedData.email_notification = !!emailNotification;

        Object.assign(user, updatedData);
        await user.save();

        return res.json({ success: true, message: "회원 정보가 수정되었습니다." });
    } catch (err) {
        console.error("[server error]", err);
        return res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

/**
 * [POST] /api/user/verify-password
 */
exports.verifyPassword = async (req, res, next) => {
    const { password } = req.body;
    const userId = req.headers['x-user-id'];

    if (!password) {
        return res.status(400).json({ message: "비밀번호를 입력해주세요." });
    }

    try {
        const user = await User.scope("withPassword").findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ message: "비밀번호가 일치하지 않습니다." });
        }

        return res.json({ success: true, message: "비밀번호 확인 완료" });
    } catch (err) {
        console.error("[password verify error]", err);
        return res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

/**
 * [PUT] /api/user/me/password
 */
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.headers['x-user-id'];

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "필수 입력값 누락" });
    }

    const user = await User.scope("withPassword").findByPk(userId);
    if (!user || !user.password) {
        return res.status(404).json({ message: "사용자 정보 없음 또는 비밀번호 설정 안됨" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        return res.status(403).json({ message: "현재 비밀번호가 일치하지 않습니다." });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "비밀번호가 변경되었습니다." });
};

/**
 * [PATCH] /api/user/me/deactivate - 계정 비활성화(soft-delete)
 */
exports.deactivateAccount = async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    try {
        await User.update(
            { state_code: "inactive", deactivated_at: new Date() },
            { where: { user_id: userId } }
        );
        req.logout(() => {});
        res.json({ success: true, message: "계정이 비활성화되었습니다." });
    } catch (err) {
        next(err);
    }
};

/**
 * [DELETE] /api/user/me - 계정 탈퇴(hard-delete)
 * RabbitMQ: user.deactivated 이벤트 발행
 * community-svc: 게시글/댓글 HIDDEN 처리
 * challenge-svc: 챌린지 참여 차단
 */
exports.deleteAccount = async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        await User.destroy({ where: { user_id: userId } });

        // user.deactivated 이벤트 발행
        await rabbitmq.publish('user.events', 'user.deactivated', {
            user_id: userId,
            deactivated_at: new Date(),
        });

        req.logout(() => {});
        res.json({ success: true, message: "계정이 탈퇴되었습니다." });
    } catch (err) {
        next(err);
    }
};

/**
 * [GET] /api/user/board-requests/me
 * Day 5에서 community-svc HTTP 호출로 교체 예정
 */
exports.getMyBoardRequests = async (req, res) => {
    try {
        // TODO Day 5: community-svc HTTP 호출로 교체
        res.json([]);
    } catch (error) {
        console.error("board request fetch error:", error);
        res.status(500).json({ message: "서버 오류" });
    }
};

/**
 * [GET] /api/user/state - 관리자용 전체 유저 상태 조회
 */
exports.getAllUserState = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ["user_id", "name", "age", "email", "type", "state_code"],
            order: [["user_id", "ASC"]],
        });
        res.status(200).json(users);
    } catch (error) {
        console.error("user state fetch error:", error);
        res.status(500).json({ message: "서버 오류" });
    }
};

/**
 * [PATCH] /api/user/state - 관리자용 유저 상태 변경
 * RabbitMQ:
 *   state_code = 'banned'  → user.suspended 발행
 *   state_code = 'active'  → user.unsuspended 발행
 */
exports.updateUserState = async (req, res) => {
    // isAdmin 미들웨어에서 이미 관리자 확인
    // req.user?.type 체크 제거

    const { user_id, state_code, banned_until } = req.body;
    if (!user_id || !state_code) {
        return res.status(400).json({ error: "user_id와 state_code는 필수입니다." });
    }

    try {
        const user = await User.findByPk(user_id);
        if (!user) {
            return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
        }

        user.state_code = state_code;
        if (banned_until) user.banned_until = banned_until;
        await user.save();

        // 정지 이벤트 발행
        if (state_code === 'banned') {
            await rabbitmq.publish('user.events', 'user.suspended', {
                user_id,
                banned_until: user.banned_until,
            });
        }

        // 정지 해제 이벤트 발행
        if (state_code === 'active') {
            await rabbitmq.publish('user.events', 'user.unsuspended', {
                user_id,
            });
        }

        res.status(200).json({ message: "사용자 상태가 업데이트되었습니다." });
    } catch (err) {
        console.error("user state update error:", err);
        res.status(500).json({ error: "사용자 상태 업데이트 중 오류가 발생했습니다." });
    }
};

/**
 * [POST] /api/user/me/profile-verify/request
 */
exports.requestProfileUpdateCode = async (req, res) => {
    const userId = req.headers['x-user-id'];
    try {
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

        if (user.provider === "local") {
            return res.status(400).json({ message: "로컬 계정은 비밀번호 확인으로 인증하세요." });
        }
        if (!user.email) {
            return res.status(400).json({ message: "계정에 이메일이 없습니다. 관리자에게 문의하세요." });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await EmailCode.create({
            email: user.email,
            code,
            purpose: "profile_update",
            expiresAt,
        });

        await transporter.sendMail({
            to: user.email,
            subject: "[E-ON] 회원정보 수정 인증 코드",
            text: `인증 코드: ${code} (유효기간 5분)`,
        });

        return res.json({ success: true, message: "인증 코드를 전송했습니다." });
    } catch (err) {
        console.error("requestProfileUpdateCode error:", err);
        return res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

/**
 * [POST] /api/user/verify-code
 */
exports.verifyCode = async (req, res) => {
    const { code } = req.body;
    const userId = req.headers['x-user-id'];

    if (!code) {
        return res.status(400).json({ message: "인증 코드를 입력해주세요." });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        if (user.provider === "local") {
            return res.status(400).json({ message: "로컬 계정은 비밀번호로 인증하세요." });
        }

        const emailCode = await EmailCode.findOne({
            where: { email: user.email, purpose: "profile_update" },
            order: [["createdAt", "DESC"]],
        });

        if (!emailCode) {
            return res.status(400).json({ message: "인증 코드를 먼저 발급받으세요." });
        }

        if (new Date(emailCode.expiresAt).getTime() < Date.now()) {
            return res.status(400).json({ message: "인증 코드가 만료되었습니다." });
        }

        if (emailCode.code !== code) {
            return res.status(400).json({ message: "인증 코드가 올바르지 않습니다." });
        }

        try { await emailCode.destroy(); } catch (_) {}

        return res.json({ success: true, message: "인증이 완료되었습니다." });
    } catch (err) {
        console.error("verifyCode error:", err);
        return res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};
