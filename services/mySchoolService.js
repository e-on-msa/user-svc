const axios = require("axios");
const db = require("../models");
const MySchool = db.MySchool;
const redisClient = require("../config/redis"); // Redis 클라이언트 추가

// Redis Key 규칙: user:{userId}:my_school
const getRedisKey = (userId) => `user:${userId}:my_school`;

// 1. mySchool에 선택한 schoolCode를 저장
async function saveMySchool(userId, type, code) {
    if (!userId || !type || !code) {
        throw new Error("모든 파라미터를 입력해주세요.");
    }

    if (type === "school") {
        const scheduleUrl = process.env.SCHEDULE_SERVICE_URL;
        const response = await axios.get(`${scheduleUrl}/internal/schools/validate`, {
            params: { schoolCode: code },
            headers: { "x-internal-secret": process.env.INTERNAL_API_SECRET },
        });
        if (!response.data?.data?.valid) {
            throw Object.assign(new Error("유효하지 않은 학교 코드입니다."), { status: 400 });
        }
    }

    if (type === "region") {
        const scheduleUrl = process.env.SCHEDULE_SERVICE_URL;
        const response = await axios.get(`${scheduleUrl}/internal/regions/validate`, {
            params: { regionId: code },
            headers: { "x-internal-secret": process.env.INTERNAL_API_SECRET },
        });
        if (!response.data?.success) {
            throw Object.assign(new Error("유효하지 않은 지역 코드입니다."), { status: 400 });
        }
    }

    try {
        const mySchool = await MySchool.findOne({
            where: { user_id: userId },
        });

        const updateData = {};
        if (type === "school") updateData.school_code = code;
        else if (type === "region") updateData.region_id = code;
        else throw new Error("유효하지 않은 타입입니다.");

        if (!mySchool) {
            await MySchool.create({ user_id: userId, ...updateData });
        } else {
            await MySchool.update(updateData, { where: { user_id: userId } });
        }

        // DB 저장 후 최신 데이터 조회해서 Redis 캐시 업데이트
        const updated = await MySchool.findOne({ where: { user_id: userId } });
        await redisClient.set(
            getRedisKey(userId),
            JSON.stringify({
                school_code: updated.school_code,
                region_id: updated.region_id,
            })
        );

    } catch (error) {
        console.error("나의 학교 저장 실패:", error.message);
        if (error.status) throw error;
        throw new Error("나의 학교 저장 실패");
    }
}

// 2. mySchool에서 schoolCode를 삭제
async function deleteMySchool(userId, type) {
    if (!userId) {
        throw new Error("userId를 입력해주세요.");
    }

    try {
        const mySchool = await MySchool.findOne({ where: { user_id: userId } });

        if (!mySchool) {
            throw new Error("삭제할 mySchool이 존재하지 않습니다.");
        }

        const updateData = {};
        if (type === "school") updateData.school_code = null;
        else if (type === "region") updateData.region_id = null;
        else throw new Error("유효하지 않은 타입입니다.");

        await MySchool.update(updateData, { where: { user_id: userId } });

        // DB 삭제 후 Redis 캐시도 삭제
        await redisClient.del(getRedisKey(userId));

    } catch (error) {
        console.error("나의 학교 삭제 실패:", error);
        throw new Error("나의 학교 삭제 실패");
    }
}

// 3. mySchool에 저장된 schoolCode를 조회
async function getMySchool(userId, type) {
    if (!userId) {
        throw new Error("userId를 입력해주세요.");
    }

    try {
        const mySchool = await MySchool.findOne({ where: { user_id: userId } });

        if (!mySchool) {
            throw new Error("조회할 mySchool이 존재하지 않습니다.");
        }

        if (type !== "school" && type !== "region") {
            throw new Error("유효하지 않은 타입입니다.");
        }

        return type === "school" ? mySchool.school_code : mySchool.region_id;
    } catch (error) {
        console.error("나의 학교 조회 실패:", error);
        throw new Error("나의 학교 조회 실패");
    }
}

module.exports = { saveMySchool, deleteMySchool, getMySchool };
