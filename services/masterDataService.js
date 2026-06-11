'use strict';

const db = require('../models');
const { InterestsCache, VisionsCache } = db;

async function handleMasterDataEvent(routingKey, payload) {
    console.log('[masterData] routingKey:', routingKey, 'payload:', JSON.stringify(payload));
    switch (routingKey) {
        case 'interest.created':
        case 'interest.updated':
            await InterestsCache.upsert({
                interest_id: payload.interest_id,
                interest_detail: payload.interest_detail,
                category_name: payload.category_name,
            });
            console.log(`[masterData] ${routingKey} - interest_id: ${payload.interest_id}`);
            break;

        case 'interest.deleted':
            await InterestsCache.destroy({ where: { interest_id: payload.interest_id } });
            console.log(`[masterData] ${routingKey} - interest_id: ${payload.interest_id}`);
            break;

        case 'vision.created':
        case 'vision.updated':
            await VisionsCache.upsert({
                vision_id: payload.vision_id,
                vision_detail: payload.vision_detail,
                category_name: payload.category_name,
            });
            console.log(`[masterData] ${routingKey} - vision_id: ${payload.vision_id}`);
            break;

        case 'vision.deleted':
            await VisionsCache.destroy({ where: { vision_id: payload.vision_id } });
            console.log(`[masterData] ${routingKey} - vision_id: ${payload.vision_id}`);
            break;

        default:
            console.warn(`[masterData] 처리되지 않은 routingKey: ${routingKey}`);
    }
}

module.exports = { handleMasterDataEvent };
