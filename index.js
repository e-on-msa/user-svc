require("dotenv").config();
const http = require("http");
const { app } = require("./app");
const rabbitmq = require("./config/rabbitmq");
const { handleMasterDataEvent } = require("./services/masterDataService");

const PORT = process.env.PORT || 8081;

// HTTP 서버 생성
const server = http.createServer(app);

// RabbitMQ 연결 후 subscribe
rabbitmq.connect().then(() => {
    rabbitmq.subscribe(handleMasterDataEvent);
});

// 서버 시작
server.listen(PORT, () => {
    console.log(`user-svc running on port ${PORT}`);
});