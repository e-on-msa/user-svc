const localStrategy = require("./localStrategy");

const db = require("../../models"); // config/passport → 루트/models
const User = db.User;

module.exports = (passport) => {
    passport.serializeUser((user, done) => {
        done(null, user.user_id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            if (!id) return done(null, false);
            const user = await User.findByPk(id, {
                attributes: [
                    "user_id",
                    "name",
                    "email",
                    "age",
                    "type",
                    "state_code",
                    "banned_until",
                    "provider",
                    "sns_id",
                    "agreements",
                    "email_notification",
                ],
            });

            if (user) return done(null, user);
            else return done(null, false);
        } catch (err) {
            return done(err);
        }
    });

    localStrategy(passport);
};
