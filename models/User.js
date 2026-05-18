"use strict";

const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define(
        "User",
        {
            user_id: {
                type: DataTypes.BIGINT,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            provider: {
                type: DataTypes.ENUM("local", "kakao", "naver", "google"),
                allowNull: false,
                defaultValue: "local",
            },
            sns_id: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            name: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            age: {
                type: DataTypes.INTEGER,
                allowNull: false,
                validate: {
                    min: 8,
                    max: 16,
                },
            },
            email: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
            },
            password: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: "pw",
            },
            type: {
                type: DataTypes.ENUM("student", "parent", "admin", "municipality"),
                allowNull: false,
                validate: {
                    isIn: [["student", "parent", "admin", "municipality"]],
                },
            },
            state_code: {
                type: DataTypes.STRING(100),
            },
            banned_until: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            deactivated_at: {
                type: DataTypes.DATE,
                allowNull: true,
                // 버그 수정: 기존 코드에 컬럼 없어서 저장 안 됐던 문제 수정
            },
            email_notification: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            agreements: {
                type: DataTypes.JSON,
                allowNull: false,
                defaultValue: {},
            },
        },
        {
            tableName: "User",
            timestamps: false,
            defaultScope: {
                attributes: { exclude: ["password"] },
            },
            scopes: {
                withPassword: {
                    attributes: { include: ["password"] },
                },
            },
            hooks: {
                beforeSave: async (user) => {
                    if (user.changed("password") && user.password) {
                        user.password = await bcrypt.hash(user.password, 12);
                    }
                },
            },
        }
    );

    User.associate = (models) => {
        // UserState는 user-svc 내부 관계 → 유지
        User.belongsTo(models.UserState, {
            foreignKey: "state_code",
            targetKey: "state_code",
        });

        // BoardRequest 제거 → community-svc 소유 (DB 분리)
    };

    return User;
};
