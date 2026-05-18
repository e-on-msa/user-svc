const mySchoolService = require("../services/mySchoolService");

exports.saveMySchool = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const type = req.body.type;
        const code = req.body.code;

        // 필수 파라미터 확인
        if (!userId || !type || !code) {
            return res
                .status(400)
                .json({ error: "모든 파라미터를 입력해주세요." });
        }

        // mySchool 저장 서비스 호출
        await mySchoolService.saveMySchool(userId, type, code);
        res.status(200).json({ message: "나의 학교가 저장되었습니다." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "나의 학교 저장 실패" });
    }
};

exports.deleteMySchool = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const type = req.body.type;

        // 필수 파라미터 확인
        if (!userId || !type) {
            return res
                .status(400)
                .json({ error: "모든 파라미터를 입력해주세요." });
        }

        // mySchool 삭제 서비스 호출
        await mySchoolService.deleteMySchool(userId, type);
        res.status(200).json({ message: "나의 학교가 삭제되었습니다." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "나의 학교 삭제 실패" });
    }
};

exports.getMySchool = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const type = req.query.type;    // GET 요청이므로 쿼리에서 받아옴

        // 필수 파라미터 확인
        if (!userId || !type) {
            return res
                .status(400)
                .json({ error: "모든 파라미터를 입력해주세요." });
        }

        // mySchool 조회 서비스 호출
        const code = await mySchoolService.getMySchool(userId, type);
        res.status(200).json({ code });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "나의 학교 조회 실패" });
    }
};
