'use strict';

module.exports = (sequelize, DataTypes) => {
    const VisionsCache = sequelize.define('VisionsCache', {
        vision_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
        },
        vision_detail: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        category_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        tableName: 'visions_cache',
        timestamps: false,
    });

    return VisionsCache;
};
