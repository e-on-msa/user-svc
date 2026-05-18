// controllers/interest.js
const db = require("../models");
const { InterestCategory, Interests, SelectInterests } = db;

/**
 * [GET] /api/interests/categories
 * 카테고리 목록 조회
 */
exports.getCategories = async (req, res, next) => {
    try {
        const categories = await InterestCategory.findAll({
            attributes: ["category_code", "category_name"],
        });
        res.json({ success: true, categories });
    } catch (err) {
        next(err);
    }
};

/**
 * [GET] /api/interests/list/:categoryCode
 * 특정 카테고리 세부 관심사 조회
 */
exports.getList = async (req, res, next) => {
    try {
        const interests = await Interests.findAll({
            where: { category_code: req.params.categoryCode },
            attributes: ["interest_id", "interest_detail"],
        });
        res.json({ success: true, interests });
    } catch (err) {
        next(err);
    }
};

/**
 * [GET] /api/interests/my
 * 내가 선택한 관심사 조회
 */
exports.getMy = async (req, res, next) => {
    try {
        const rows = await SelectInterests.findAll({
            where: { user_id: req.user.user_id },
            include: [
                {
                    model: Interests,
                    attributes: [
                        "interest_id",
                        "interest_detail",
                        "category_code",
                    ],
                },
            ],
        });
        const my = rows.map((r) => r.Interests.interest_id);
        res.json({ success: true, my });
    } catch (err) {
        next(err);
    }
};

/**
 * [GET] /api/interests/myInterests
 * 내가 선택한 관심사 조회
 */
exports.getMyInterests = async (req, res, next) => {
    try {
        const rows = await SelectInterests.findAll({
            where: { user_id: req.user.user_id },
            include: [
                {
                    model: Interests,
                    attributes: [
                        "interest_id",
                        "interest_detail",
                        "category_code",
                    ],
                },
            ],
        });
        const my = rows.map((r) => ({
            interest_id: r.Interest.interest_id,
            interest_detail: r.Interest.interest_detail,
        }));
        res.json({ success: true, my });
    } catch (err) {
        next(err);
    }
};

/**
 * [POST] /api/interests/my
 * Body: { interests: [interestId, ...] }
 */
exports.saveMy = async (req, res, next) => {
    const { interests } = req.body;
    if (!Array.isArray(interests) || interests.length === 0) {
        return res.status(400).json({ message: "최소 1개 이상 선택하세요." });
    }
    try {
        await SelectInterests.destroy({ where: { user_id: req.user.user_id } });
        const bulk = interests.map((id) => ({
            user_id: req.user.user_id,
            interest_id: id,
        }));
        await SelectInterests.bulkCreate(bulk);
        res.json({ success: true, message: "관심사가 저장되었습니다." });
    } catch (err) {
        next(err);
    }
};
