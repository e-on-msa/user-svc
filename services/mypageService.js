const axios = require('axios');

const COMMUNITY_URL = process.env.COMMUNITY_SERVICE_URL || 'http://localhost:4004';
const CHALLENGE_URL = process.env.CHALLENGE_SERVICE_URL || 'http://localhost:4002';

exports.getActivityByType = async (userId, type, from, to, keyword, page = 1, limit = 10) => {
    const params = { user_id: userId, from, to, keyword, page, limit };

    try {
        switch (type) {
            case 'challenge':
            case 'challengeCreated': {
                const response = await axios.get(
                    `${CHALLENGE_URL}/internal/activity/${type}`,
                    { params }
                );
                return response.data;
            }

            case 'post':
            case 'comment':
            case 'boardRequest': {
                const response = await axios.get(
                    `${COMMUNITY_URL}/internal/activity/${type}`,
                    { params }
                );
                return response.data;
            }

            default:
                throw new Error('invalid activity type');
        }
    } catch (err) {
        // 상대 서비스가 아직 없거나 연결 실패 시 빈 결과 반환
        if (err.code === 'ECONNREFUSED') {
            console.warn(`[mypageService] ${type} service not available`);
            return { items: [], totalCount: 0, totalPages: 0 };
        }
        throw err;
    }
};
