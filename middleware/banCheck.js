module.exports = (req, _res, next) => {
  if (!req.user?.banned_until) return next();

  const now = Date.now();
  const bannedUntil = new Date(req.user.banned_until).getTime();

  if (bannedUntil > now) {
    return _res.status(403).json({
      message: `커뮤니티 이용 정지 ~ ${req.user.banned_until}`,
    });
  }

  // 기간 만료 → 자동 해제
  req.user.update({ banned_until: null }).finally(() => next());
};
