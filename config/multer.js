// config/multer.js
const multer = require('multer');
const path   = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 최상위 프로젝트 폴더에 있는 "uploads/" 디렉터리로 저장
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    // 원본 파일명에서 확장자만 추출 (예: ".pdf", ".jpg" 등)
    const ext      = path.extname(file.originalname);
    // Date.now 기반의 랜덤한 문자열 + 원본 확장자 조합
    const filename = Date.now().toString(36) + ext;
    cb(null, filename);
  }
});

module.exports = multer({ storage });
