const bcrypt = require("bcrypt");
const { sequelize, User } = require("./models"); // 경로는 프로젝트 구조에 맞게 조정

async function manuallyHashPassword() {
  const email = "dltndusi5985@gmail.com";
  const rawPassword = "Luv02!";

  try {
    await sequelize.authenticate();
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log("❌ 유저를 찾을 수 없습니다.");
      return;
    }

    const hashed = await bcrypt.hash(rawPassword, 12);
    user.pw = hashed; // ✅ 실제 컬럼명
    await user.save();

    console.log("✅ 비밀번호 수동 해시 및 저장 완료");
  } catch (err) {
    console.error("❌ 오류 발생:", err);
  } finally {
    await sequelize.close();
  }
}

manuallyHashPassword();
