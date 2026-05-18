"use strict";

module.exports = (sequelize, DataTypes) => {
    const MySchool = sequelize.define(
        "MySchool",
        {
            my_school_id: {
                type: DataTypes.BIGINT,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            school_code: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            region_code: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            user_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                unique: true,
                references: {
                    model: "User",
                    key: "user_id",
                },
            },
        },
        {
            tableName: "MySchool",
            timestamps: false,
        }
    );

    MySchool.associate = (models) => {
        MySchool.belongsTo(models.User, {
            foreignKey: "user_id",
            targetKey: "user_id",
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        });
    };

    return MySchool;
};
