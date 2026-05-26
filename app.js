require("dotenv").config();
const express = require("express");
const path = require("path");
const helmet = require("helmet");
const csrf = require("csurf");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const { RedisStore } = require("connect-redis");
const { createClient } = require("redis");

require("./config/passport")(passport);

const { sequelize } = require("./config/database");
const app = express();

app.set("trust proxy", 1);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(helmet());

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
    })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

const redisClient = createClient({
    socket: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT) || 6379,
    },
});
//redisClient.connect().catch(console.error);
redisClient.connect()
    .then(() => console.log("Redis 연결 성공"))
    .catch((err) => {
        console.warn("Redis 연결 실패 (나중에 Docker로 띄울 예정):", err.message);
    });

const sessionStore = new RedisStore({
    client: redisClient,
    prefix: "sess:",
});

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
    },
});
app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

const csrfProtection = csrf();
app.use((req, res, next) => {
    if (req.path.startsWith("/internal")) {
        return next();
    }
    return csrfProtection(req, res, next);
});

app.get("/csrf-token", (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

app.use("/api/auth", require("./routes/authRouter"));
app.use("/api/mySchool", require("./routes/mySchoolRouter"));
app.use("/api/user", require("./routes/userRouter"));
app.use("/api/interests", require("./routes/interestRouter"));
app.use("/api/visions", require("./routes/visionRouter"));
app.use("/api/select", require("./routes/select"));
app.use("/api/preferences", require("./routes/preferencesRoutes"));
app.use("/internal", require("./routes/internalRouter"));

app.use((err, req, res, next) => {
    if (err.code === "EBADCSRFTOKEN") {
        return res.status(403).json({
            code: "EBADCSRFTOKEN",
            message: "Invalid CSRF token",
        });
    }
    return next(err);
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
});

module.exports = { app, sessionMiddleware };
