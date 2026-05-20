const db = require('../models');
const User = db.User;

// 정지 여부 확인
// 기존: req.user.banned_until
// 변경: Gateway 헤더 x-user-banned-until
module.exports = async (req, res, next) => {
    const bannedUntil = req.headers['x-user-banned-until'];

    if (!bannedUntil || bannedUntil === 'null') return next();

    const now = Date.now();
    const bannedUntilTime = new Date(bannedUntil).getTime();

    if (bannedUntilTime > now) {
        return res.status(403).json({
            message: `커뮤니티 이용 정지 ~ ${bannedUntil}`,
        });
    }

    // 기간 만료 → DB에서 자동 해제
    try {
        const userId = req.headers['x-user-id'];
        if (userId) {
            await User.update(
                { banned_until: null },
                { where: { user_id: userId } }
            );
        }
    } catch (err) {
        console.error('banCheck 자동 해제 실패:', err.message);
    }

    next();
};
