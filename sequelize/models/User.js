const { DataTypes } = require('sequelize');

const User = (sequelize) => sequelize.define('user', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  }
});

module.exports = User;
