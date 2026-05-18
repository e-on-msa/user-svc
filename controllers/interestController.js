//interestController.js
const db = require('../models');
const Interests = db.Interests;

// 관심사 전체 조회
exports.getAll = async (req, res, next) => {
  try {
    // 관심사만 리스트 (id, name)
    const interests = await Interests.findAll({
      attributes: [
        ['interest_id', 'id'],      // id로 보냄
        ['interest_detail', 'name'] // name으로 보냄
      ],
      order: [['interest_id', 'ASC']]
    });
    res.json(interests);
  } catch (err) {
    next(err);
  }
};
