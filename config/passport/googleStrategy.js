const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../../models'); // config/passport → 루트/models
const User = db.User;

module.exports = (passport) => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: 'http://localhost:4005/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const existingUser = await User.findOne({
            where: { sns_id: profile.id, provider: 'google' },
          });

          if (existingUser) return done(null, existingUser);

          const email = profile.emails?.[0]?.value || null;

          return done(null, {
            provider: 'google',
            sns_id: profile.id,
            email,
            isNewSocialUser: true,
          });
        } catch (err) {
          console.error('❌ 구글 로그인 오류:', err);
          return done(err);
        }
      }
    )
  );
};
