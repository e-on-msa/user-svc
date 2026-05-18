// models/emailCode.js
module.exports = (sequelize, DataTypes) => {
  const EmailCode = sequelize.define("EmailCode", {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    purpose: {
      type: DataTypes.STRING,
      allowNull: false, // e.g., 'find-id', 'signup'
    },
  });

  return EmailCode;
};
