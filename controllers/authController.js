const VALID_USER_TYPES = ["student", "parent", "municipality"];
const bcrypt = require("bcrypt");
const passport = require("passport");
const transporter = require("../config/mail");
const db = require("../models");
const { User, EmailCode } = require("../models");
const { Op } = require("sequelize");

// 1단계: 회원 구분 저장
exports.signupStep1 = (req, res) => {
    //const { userType } = req.body;
    const userType = req.body.userType ?? req.body.type;
    if (userType === "admin") {
        return res.status(403).json({ message: "권한이 없습니다." });
    }
    if (!VALID_USER_TYPES.includes(userType)) {
        return res
            .status(400)
            .json({ message: "유효하지 않은 회원 유형입니다." });
    }
    req.session.signup = { type: userType };
    req.session.save(() => {
        res.json({ success: true });
    });
    console.log("🔥 [STEP1] 세션 전체:", req.session);
};

// 2단계: 약관 동의 저장
exports.signupStep2 = (req, res) => {
    if (!req.session.signup) {
        return res.status(400).json({ message: "Step1 먼저 진행해주세요." });
    }
    req.session.signup.agreements = req.body.agreements;
    req.session.save(() => {
        console.log("🔥 [STEP2] 세션 전체:", req.session);
        res.json({ success: true });
    });
};

// 이메일 인증번호 발송
exports.sendEmailCode = async (req, res, next) => {
    try {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        req.session.emailCode = code;
        req.session.emailForCode = req.body.email;
        req.session.emailCodeExpires = Date.now() + 5 * 60 * 1000;

        await transporter.sendMail({
            from: `"E-ON" <${process.env.SMTP_USER}>`,
            to: req.body.email,
            subject: "E-ON 이메일 인증번호",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f7f8fc; border-radius: 8px;">
                    <h2 style="color: #333;">🔐 E-ON 이메일 인증번호</h2>
                    <p>안녕하세요, <strong>E-ON</strong>입니다.</p>
                    <p>아래의 인증번호를 입력해 주세요. 유효 시간은 <strong>5분</strong>입니다.</p>
                    <div style="padding: 15px; background: #ffffff; border: 2px dashed #007bff; border-radius: 6px; font-size: 22px; font-weight: bold; text-align: center;">
                        인증번호: <span style="color: #007bff;">${code}</span>
                    </div>
                    <p style="margin-top: 20px;">감사합니다.<br/>E-ON 드림</p>
                </div>
            `,
        });

        req.session.save(() => {
            console.log("📮 인증번호 세션 저장 완료:", code);
            res.json({ success: true });
        });
    } catch (err) {
        next(err);
    }
};

// 이메일 인증번호 검증
exports.verifyEmailCode = (req, res) => {
    const now = Date.now();
    if (!req.session.emailCodeExpires || now > req.session.emailCodeExpires) {
        return res
            .status(400)
            .json({ success: false, message: "인증코드가 만료되었습니다." });
    }
    if (
        req.body.email !== req.session.emailForCode ||
        req.body.code !== req.session.emailCode
    ) {
        return res.status(400).json({
            success: false,
            message: "이메일 또는 코드가 일치하지 않습니다.",
        });
    }
    res.json({ success: true });
};

// 3단계: 실제 회원 생성
exports.signupStep3 = async (req, res, next) => {
    console.log("🔥 [STEP3] 세션 전체:", req.session);
    const { name, email, code, password, confirm, age } = req.body;
    const su = req.session.signup || {};

    if (!su.type || !su.agreements) {
        clearSignupSession(req);
        return res
            .status(400)
            .json({ message: "이전 단계가 완료되지 않았습니다." });
    }
    if (su.type === "admin") {
        clearSignupSession(req);
        return res
            .status(403)
            .json({ message: "관리자 계정은 생성할 수 없습니다." });
    }
    if (email !== req.session.emailForCode || code !== req.session.emailCode) {
        clearSignupSession(req);
        return res.status(400).json({ message: "이메일 또는 인증 코드 오류" });
    }
    if (password !== confirm) {
        clearSignupSession(req);
        return res
            .status(400)
            .json({ message: "비밀번호와 확인이 일치하지 않습니다." });
    }

    try {
        if (await User.findOne({ where: { email } })) {
            clearSignupSession(req);
            return res
                .status(409)
                .json({ message: "이미 사용 중인 이메일입니다." });
        }

        const newUser = await User.create({
            name,
            email,
            age,
            password,
            state_code: "active",
            type: su.type,
            agreements: su.agreements,
        });

        clearSignupSession(req);
        res.status(201).json({ success: true, user: newUser.toJSON() });
    } catch (err) {
        next(err);
    }
};

// clearSignupSession
function clearSignupSession(req) {
    if (req.session.signup) {
        delete req.session.signup;
    }
    if (req.session.emailCode) {
        delete req.session.emailCode;
        delete req.session.emailForCode;
        delete req.session.emailCodeExpires;
    }
}

// 로그인
exports.login = (req, res, next) => {
    passport.authenticate("local", async (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ message: info.message });

        try {
            const foundUser = await User.findByPk(user.user_id, {
                attributes: ["user_id", "email", "state_code", "type", "name"],
            });

            if (!foundUser) {
                return res.status(403).json({ message: "유저 없음" });
            }

            if (foundUser.state_code !== "active") {
                return res
                    .status(403)
                    .json({ message: "비활성화된 계정입니다." });
            }

            req.login(foundUser, (loginErr) => {
                if (loginErr) return next(loginErr);
                return res.json({ success: true, user: foundUser.toJSON() });
            });
        } catch (e) {
            return next(e);
        }
    })(req, res, next);
};

// 로그아웃
exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy(() => {
            res.clearCookie("connect.sid");
            res.json({ success: true, message: "로그아웃 되었습니다." });
        });
    });
};
// 인증 메일 전송 유틸 함수
const sendEmail = async ({ to, subject, text }) => {
    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        text,
    });
};

// 이메일 목록 반환 (이름 + 나이로)
exports.findEmailsByNameAndAge = async (req, res) => {
    const { name, age } = req.body;
    console.log("👉 요청값:", name, age);
    try {
        const users = await User.findAll({
            where: {
                name,
                age,
            } /*이름 공백이랑, 나이 string으로 못받아올까봐 이런 조건 추가해둠*/,
            attributes: ["email", "provider"],
        });
        console.log("🔍 DB 조회 결과:", users);
        if (!users || users.length === 0) {
            console.log("❌ 일치하는 사용자 없음");
            return res
                .status(404)
                .json({ message: "해당 정보로 가입된 이메일 없음" });
        }

        const emails = users.map((user) => ({
            email: user.email,
            provider: user.provider,
        }));

        return res.json({ emails });
    } catch (err) {
        console.error("🔴 이메일 찾기 오류:", err);
        return res.status(500).json({ message: "서버 오류 발생" });
    }
};

// 인증 코드 전송
exports.sendFindIdCodeToEmail = async (req, res) => {
    const { email } = req.body;

    try {
        console.log("✅ 입력된 이메일:", email);
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res
                .status(404)
                .json({ message: "해당 이메일의 유저가 없습니다." });
        } else {
            console.log("✅ 찾은 유저:", user.toJSON());
            console.log("✅ 유저의 provider:", user.provider);
        }

        if (user.provider && user.provider !== "local") {
            return res.status(400).json({ message: "로컬 계정이 아닙니다." });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();

        await EmailCode.upsert({
            email,
            code,
            purpose: "find-id",
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 맍료 시간 설정은 :: 현재 시각 + 5분
        });

        await sendEmail({
            to: email,
            subject: "[E-ON] 아이디 찾기 인증 코드",
            text: `인증 코드는 ${code}입니다.`,
        });

        return res.status(200).json({ message: "인증 코드 전송 완료" });
    } catch (err) {
        console.error("🔴 인증 코드 전송 오류:", err);
        return res.status(500).json({ message: "코드 전송 중 오류 발생" });
    }
};

// 인증 코드 검증
exports.verifyFindIdCode = async (req, res) => {
    const { email, code } = req.body;

    try {
        const record = await EmailCode.findOne({
            where: {
                email,
                code,
                purpose: "find-id",
                createdAt: {
                    [Op.gt]: new Date(Date.now() - 3 * 60 * 1000),
                },
            },
        });

        if (!record) {
            return res
                .status(400)
                .json({ message: "인증 실패: 코드가 일치하지 않거나 만료됨" });
        }

        await EmailCode.destroy({ where: { email, purpose: "find-id" } });

        return res.status(200).json({ userId: email });
    } catch (err) {
        console.error("🔴 인증 코드 검증 오류:", err);
        return res.status(500).json({ message: "서버 오류" });
    }
};
// 소셜 회원가입 추가정보 저장
exports.socialSignup = async (req, res, next) => {
    console.log("✅ [POST] /auth/social-signup 호출됨");
    console.log("📦 req.body:", req.body);
    console.log("🧠 req.session.socialUser:", req.session.socialUser);
    const socialData = req.session.socialUser;

    if (!socialData) {
        return res.status(400).json({ message: "소셜 세션이 없습니다." });
    }

    const { name, type, age, agreements } = req.body;

    if (!name || !type || !agreements || !age) {
        return res.status(400).json({ message: "필수 항목이 누락되었습니다." });
    }

    if (type === "admin") {
        return res
            .status(403)
            .json({ message: "관리자 유형은 생성할 수 없습니다." });
    }

    if (age < 8 || age > 16) {
        return res
            .status(400)
            .json({ message: "나이는 8세 이상 16세 이하로 입력해주세요." });
    }

    try {
        const existing = await User.findOne({
            where: { sns_id: socialData.sns_id, provider: socialData.provider },
        });
        if (existing) {
            return res.status(409).json({ message: "이미 가입된 계정입니다." });
        }

        // 이메일 중복 검사
        const emailExists = await User.findOne({
            where: { email: socialData.email },
        });
        if (emailExists) {
            return res
                .status(409)
                .json({
                    message: "이미 해당 이메일로 가입된 계정이 있습니다.",
                });
        }

        const user = await User.create({
            name,
            email: socialData.email,
            sns_id: socialData.sns_id,
            provider: socialData.provider,
            age,
            type,
            state_code: "active",
            agreements,
        });

        delete req.session.socialUser;

        req.login(user, (err) => {
            if (err) return next(err);
            res.status(201).json({
                success: true,
                user: {
                    user_id: user.user_id,
                    email: user.email,
                    name: user.name,
                    age: user.age,
                    type: user.type,
                    state_code: user.state_code,
                    agreements: user.agreements,
                    email_notification: user.email_notification,
                },
            });
        });
    } catch (err) {
        next(err);
    }
};

// 이메일 마스킹 처리 함수
function maskEmail(email) {
    const [local, domain] = email.split("@");
    const visible = local.slice(0, 3);
    const masked = visible + "*".repeat(Math.max(local.length - 3, 0));
    return `${masked}@${domain}`;
}

// 🔹 비밀번호 찾기 - 인증 코드 전송
exports.sendFindPwCodeToEmail = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ where: { email } });

        if (!user || user.provider !== "local") {
            return res
                .status(404)
                .json({
                    message: "로컬 계정이 아니거나 존재하지 않는 이메일입니다.",
                });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();

        await EmailCode.upsert({
            email,
            code,
            purpose: "find-password",
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });

        await transporter.sendMail({
            to: email,
            subject: "[E-ON] 비밀번호 재설정 인증 코드",
            text: `인증 코드는 ${code}입니다.`,
        });

        return res.status(200).json({ message: "인증 코드 전송 완료" });
    } catch (err) {
        console.error("🔴 비밀번호 찾기 코드 전송 오류:", err);
        return res.status(500).json({ message: "서버 오류 발생" });
    }
};

// 🔹 인증 코드 확인
exports.verifyFindPwCode = async (req, res) => {
    const { email, code } = req.body;

    try {
        const record = await EmailCode.findOne({
            where: {
                email,
                code,
                purpose: "find-password",
                createdAt: {
                    [Op.gt]: new Date(Date.now() - 5 * 60 * 1000),
                },
            },
        });

        if (!record) {
            return res
                .status(400)
                .json({ message: "인증 실패: 코드가 일치하지 않거나 만료됨" });
        }

        req.session.resetPassword = {
            verified: true,
            email,
        };

        await EmailCode.destroy({ where: { email, purpose: "find-password" } });

        return res.status(200).json({ message: "인증 성공" });
    } catch (err) {
        console.error("🔴 인증 실패:", err);
        return res.status(500).json({ message: "서버 오류" });
    }
};

// 🔹 비밀번호 실제 변경
exports.resetPassword = async (req, res) => {
    const { newPassword, confirmPassword } = req.body;
    const resetSession = req.session.resetPassword;

    if (!resetSession || !resetSession.verified || !resetSession.email) {
        return res.status(400).json({ message: "인증되지 않은 요청입니다." });
    }

    if (newPassword !== confirmPassword) {
        return res
            .status(400)
            .json({ message: "비밀번호와 확인이 일치하지 않습니다." });
    }

    try {
        const user = await User.scope("withPassword").findOne({
            where: { email: resetSession.email },
        });

        if (!user) {
            return res
                .status(404)
                .json({ message: "해당 이메일의 유저가 존재하지 않습니다." });
        }

    const hashed = await bcrypt.hash(newPassword, 12);
    user.password = hashed;
    await user.save();
    
    delete req.session.resetPassword;

  } catch (err) {
    console.error("🔴 비밀번호 변경 오류:", err);
    return res.status(500).json({ message: "서버 오류" });
  }
};
