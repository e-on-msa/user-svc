require("dotenv").config();
const http = require("http");
const { app } = require("./app");
const rabbitmq = require("./config/rabbitmq");

const PORT = process.env.PORT || 4005;

// HTTP 서버 생성
const server = http.createServer(app);

// RabbitMQ 연결 시도 (실패해도 서버 실행에 영향X)
rabbitmq.connect();

// 서버 시작
server.listen(PORT, () => {
    console.log(`user-svc running on port ${PORT}`);
});