const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const db = require('../../models'); // config/passport → 루트/models
const User = db.User;

module.exports = (passport) => {
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({
          where: { email },
          attributes: ['user_id', 'email', 'password', 'state_code', 'type', 'provider']
        });

        if (!user) {
          return done(null, false, { message: '가입되지 않은 회원입니다.' });
        }

        if (!user.password) {
          return done(null, false, {
            message: '소셜 로그인 계정입니다. 해당 로그인 버튼을 이용해주세요.',
          });
        }

        if (user.state_code === 'inactive') {
          return done(null, false, { message: '비활성화된 계정입니다.' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
          return done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));
};
