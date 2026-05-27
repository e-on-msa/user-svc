const { createClient } = require("redis");

const redisClient = createClient({
    socket: {
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || 6379,
    },
});

redisClient.connect()
    .then(() => console.log("Redis 연결 성공"))
    .catch((err) => {
        console.warn("Redis 연결 실패 (나중에 Docker로 띄울 예정):", err.message);
    });

module.exports = redisClient;
