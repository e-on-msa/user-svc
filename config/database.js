require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
    process.env.DB_NAME || "eon_user_db",
    process.env.DB_USER || "root",
    process.env.DB_PASS || "",
    {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        dialect: "mysql",
        logging: false, // SQL 로그 끄기 (개발 중엔 console.log로 변경)
    }
);

(async () => {
    try {
        await sequelize.authenticate();
        console.log("eon_user_db 연결 성공");
    } catch (err) {
        console.error("eon_user_db 연결 실패:", err.message);
    }
})();

module.exports = { sequelize, Sequelize };
