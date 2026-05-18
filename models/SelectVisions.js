'use strict';

module.exports = (sequelize, DataTypes) => {
  const SelectVisions = sequelize.define('SelectVisions', {
    vision_select_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    vision_select_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    vision_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      // FK 아님 — challenge-svc의 Visions 참조 (DB 분리로 제거)
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  }, {
    tableName: 'SelectVisions',
    timestamps: false,
  });

  SelectVisions.associate = (models) => {
    // belongsTo(models.Visions) 제거
    // → Visions 원본은 challenge-svc 소유 (DB 분리)
    // → vision_id는 숫자값만 저장, 이름 필요 시 HTTP 요청

    SelectVisions.belongsTo(models.User, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
    });
  };

  return SelectVisions;
};
