require("dotenv").config();
const http = require("http");
const { app } = require("./app");

const PORT = process.env.PORT || 4005;

// HTTP 서버 생성
const server = http.createServer(app);

// 서버 시작
server.listen(PORT, () => {
    console.log(`user-svc running on port ${PORT}`);
});
