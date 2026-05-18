const db = require("../models");
const User = db.User;
const MySchool = db.MySchool;

// 1. mySchool에 선택한 schoolCode를 저장
async function saveMySchool(userId, type, code) {
    if (!userId || !type || !code) {
        throw new Error("모든 파라미터를 입력해주세요.");
    }

    try {
        const mySchool = await MySchool.findOne({
            where: { user_id: userId },
        });

        const updateData = {};
        if (type === "school") updateData.school_code = code;
        else if (type === "region") updateData.region_code = code;
        else throw new Error("유효하지 않은 타입입니다.");

        if (!mySchool) {
            await MySchool.create({
                user_id: userId,
                ...updateData,
            });
            console.log("mySchool 정보가 새로 생성되었습니다.");
        } else {
            await MySchool.update(updateData, { where: { user_id: userId } });
            console.log("mySchool 정보가 업데이트되었습니다.");
        }
    } catch (error) {
        console.error("나의 학교 저장 API 호출 실패:", error.message);
        throw new Error("나의 학교 저장 API 호출 실패");
    }
}

// 2. mySchool에서 schoolCode를 삭제
async function deleteMySchool(userId, type) {
    if (!userId) {
        throw new Error("userId를 입력해주세요.");
    }

    try {
        // userId로 사용자 조회
        const mySchool = await MySchool.findOne({
            where: { user_id: userId },
        });

        // DB에 mySchool이 존재하는지 확인
        if (!mySchool) {
            throw new Error("삭제할 mySchool이 존재하지 않습니다.");
        }

        // my_school 정보 삭제
        const updateData = {};
        if (type === "school") updateData.school_code = null;
        else if (type === "region") updateData.region_code = null;
        else throw new Error("유효하지 않은 타입입니다.");

        await MySchool.update(updateData, { where: { user_id: userId } });
    } catch (error) {
        console.error("나의 학교 삭제 API 호출 실패:", error);
        throw new Error("나의 학교 삭제 API 호출 실패");
    }
}

// 3. mySchool에 저장된 schoolCode를 조회
async function getMySchool(userId, type) {
    if (!userId) {
        throw new Error("userId를 입력해주세요.");
    }

    try {
        const mySchool = await MySchool.findOne({
            where: { user_id: userId },
        });

        // DB에 mySchool이 존재하는지 확인
        if (!mySchool) {
            throw new Error("조회할 mySchool이 존재하지 않습니다.");
        }

        if (type !== "school" && type !== "region") {
                console.error("⚠️ getMySchool: 잘못된 타입입니다:", type);
            throw new Error("유효하지 않은 타입입니다.");
        }

        console.log("type: ", type);

        // 정보 조회
        return type === "school" ? mySchool.school_code : mySchool.region_code;
    } catch (error) {
        console.error("나의 학교 조회 API 호출 실패:", error);
        throw new Error("나의 학교 조회 API 호출 실패");
    }
}

module.exports = {
    saveMySchool,
    deleteMySchool,
    getMySchool,
};
