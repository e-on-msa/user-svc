'use strict';

module.exports = (sequelize, DataTypes) => {
  const SelectInterests = sequelize.define('SelectInterests', {
    select_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    select_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    interest_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      // FK 아님 — challenge-svc의 Interests 참조 (DB 분리로 제거)
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  }, {
    tableName: 'SelectInterests',
    timestamps: false,
  });

  SelectInterests.associate = (models) => {
    // belongsTo(models.Interests) 제거
    // → Interests 원본은 challenge-svc 소유 (DB 분리)
    // → interest_id는 숫자값만 저장, 이름 필요 시 HTTP 요청

    SelectInterests.belongsTo(models.User, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
    });
  };

  return SelectInterests;
};
