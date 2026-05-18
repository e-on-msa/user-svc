const KakaoStrategy = require('passport-kakao').Strategy;
const db = require('../../models'); // config/passport → 루트/models
const User = db.User;

module.exports = (passport) => {
  passport.use(
    new KakaoStrategy(
      {
        clientID: process.env.KAKAO_ID,
        callbackURL: 'http://localhost:4005/auth/kakao/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const snsId = profile.id.toString();
          const kakaoAccount = profile._json.kakao_account || {};
          const email = kakaoAccount.email || `${snsId}@kakao.com`;

          let user = await User.findOne({
            where: { sns_id: snsId, provider: 'kakao' },
          });

          if (!user) {
            return done(null, {
              sns_id: snsId,
              provider: 'kakao',
              email,
              isNewSocialUser: true,
            });
          } else {
            user.user_id = user.user_id || user.id;
            user.isNewSocialUser = false;
            return done(null, user);
          }
        } catch (err) {
          console.error('❌ KakaoStrategy error:', err);
          return done(err);
        }
      }
    )
  );
};
