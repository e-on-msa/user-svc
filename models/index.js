'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];

const db = {};

// Sequelize 인스턴스 생성
const sequelize = new Sequelize(config.database, config.username, config.password, config);

// 모델 불러오기
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    const modelDef = require(path.join(__dirname, file));
    const model = modelDef(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// 관계 설정
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// 테이블 자동 생성
// alter: true → 기존 테이블 유지하면서 변경사항만 반영
// force: true → 절대 쓰지 말 것! 테이블 전부 날림
sequelize.sync({ alter: true })
  .then(() => console.log("✅ eon_user_db 테이블 동기화 완료!"))
  .catch((err) => console.error("❌ 테이블 동기화 실패:", err.message));

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
