'use strict';

module.exports = (sequelize, DataTypes) => {
  const UserState = sequelize.define('UserState', {
    state_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      primaryKey: true,
    },
    state_description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  }, {
    tableName: 'UserState',
    timestamps: false,
  });

  // 관계 설정이 필요하면 여기서 설정
  UserState.associate = (models) => {
    // 예: UserState.hasMany(models.User, { foreignKey: 'state_code' });
  };

  return UserState;
};
