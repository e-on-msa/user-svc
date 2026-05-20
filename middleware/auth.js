const db = require('../models');
const User = db.User;

// 로그인 여부 확인
// 기존: req.isAuthenticated() + passport 세션
// 변경: Gateway가 전달한 헤더로 확인
exports.isLoggedIn = async (req, res, next) => {
    const userId = req.headers['x-user-id'];

    if (!userId) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    try {
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(401).json({ message: '유저 정보를 찾을 수 없습니다.' });
        }

        // 버그 수정: accountStatus → state_code
        if (user.state_code === 'inactive') {
            return res.status(403).json({ message: '비활성화된 계정입니다.' });
        }

        req.user = user; // 하위 호환성 유지 (Day 3에서 전부 교체 예정)
        next();
    } catch (err) {
        next(err);
    }
};

// 비로그인 상태 확인 (회원가입/로그인 라우트용)
exports.isNotLoggedIn = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return next();
    res.status(403).json({ message: '이미 로그인 상태' });
};

// 관리자 권한 확인
exports.isAdmin = (req, res, next) => {
    const userType = req.headers['x-user-type'];

    if (!userType) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    if (userType !== 'admin') {
        return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
    }

    next();
};
