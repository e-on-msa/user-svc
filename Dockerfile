FROM node:20-slim

WORKDIR /app

# 패키지 파일 먼저 복사 (의존성 캐시 활용)
COPY package*.json ./

RUN npm install

# 소스코드 복사
COPY . .

# user-svc 포트
EXPOSE 4005

CMD ["node", "index.js"]
