//visionController.js
const db = require('../models');
const Visions = db.Visions;

// 비전 전체 조회
exports.getAll = async (req, res, next) => {
  try {
    // 비전만 리스트 (id, name)
    const visions = await Visions.findAll({
      attributes: [
        ['vision_id', 'id'],
        ['vision_detail', 'name']
      ],
      order: [['vision_id', 'ASC']]
    });
    res.json(visions);
  } catch (err) {
    next(err);
  }
};
