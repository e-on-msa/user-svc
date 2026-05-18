// backend/controllers/mypageController.js
const mypageService = require('../services/mypageService');

exports.getActivityHistory = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const {
      type,
      from,
      to,
      keyword,
      page = 1,
      limit = 10,
    } = req.query;

    const {
      items,
      totalCount,
      totalPages,
    } = await mypageService.getActivityByType(userId, type, from, to, keyword, page, limit);

    res.json({
      success: true,
      data: items,
      page: Number(page),
      limit: Number(limit),
      totalCount,
      totalPages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '서버 오류 발생' });
  }
};
