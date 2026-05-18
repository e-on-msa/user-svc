// backend/services/mypageService.js
const { Op } = require('sequelize');
const {
  ParticipatingChallenge,
  Challenge,
  Post,
  Comment,
  BoardRequest,
  Board,
  User
} = require('../models');

exports.getActivityByType = async (userId, type, from, to, keyword, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const dateFilter = from && to
    ? { [Op.between]: [new Date(from), new Date(to)] }
    : undefined;

  let result;

  switch (type) {
    case 'challenge':
      result = await ParticipatingChallenge.findAndCountAll({
        where: { user_id: userId },
        include: [{
          model: Challenge,
          where: dateFilter ? { start_date: dateFilter } : undefined,
          attributes: ['title', 'start_date', 'end_date', 'challenge_state'],
        }],
        offset,
        limit: Number(limit),
      });
      break;

    case 'post':
      result = await Post.findAndCountAll({
        where: {
          user_id: userId,
          ...(dateFilter && { created_at: dateFilter }),
          ...(keyword && { title: { [Op.like]: `%${keyword}%` } }),
        },
        include:[{
          model:Board,
          attributes:['board_name'],
        }],
        attributes: ['title', 'content', 'created_at'],
        offset,
        limit: Number(limit),
      });
      break;

    case 'comment':
      result = await Comment.findAndCountAll({
        where: {
          user_id: userId,
          ...(dateFilter && { created_at: dateFilter }),
          ...(keyword && { content: { [Op.like]: `%${keyword}%` } }),
        },
        attributes: ['content', 'created_at'],
        offset,
        limit: Number(limit),
      });
      break;

    case 'boardRequest':
      result = await BoardRequest.findAndCountAll({
        where: {
          user_id: userId,
          ...(dateFilter && { request_date: dateFilter }),
          ...(keyword && { requested_board_name: { [Op.like]: `%${keyword}%` } }),
        },
        attributes: ['requested_board_name', 'requested_board_type', 'request_status', 'request_date'],
        offset,
        limit: Number(limit),
      });
      break;

      case 'challengeCreated':
        result = await Challenge.findAndCountAll({
          where: {
            user_id: userId,
            ...(dateFilter && {
              created_at: dateFilter,
            }),
            ...(keyword && {
              challenge_title: {
                [Op.like]: `%${keyword}%`,
              },
            }),
          },
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['name'], // 필요에 따라 user_id, email 등도 포함 가능
            },
          ],
          attributes: ['challenge_title', 'start_date', 'end_date', 'challenge_state', 'created_at'],
          offset,
          limit: Number(limit),
          order: [['start_date', 'DESC']],
        });
        break;


    default:
      throw new Error('잘못된 활동 유형입니다');
  }

  return {
    items: result.rows,
    totalCount: result.count,
    totalPages: Math.ceil(result.count / limit),
  };
};
