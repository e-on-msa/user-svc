'use strict';

module.exports = (sequelize, DataTypes) => {
    const InterestsCache = sequelize.define('InterestsCache', {
        interest_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
        },
        interest_detail: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        category_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        tableName: 'interests_cache',
        timestamps: false,
    });

    return InterestsCache;
};
