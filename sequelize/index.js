const {Sequelize} = require('sequelize');
const env = require('dotenv');
const User = require('./models/User');

if (process.env.NODE_ENV === 'development') {
  env.config({path: '.development.env'});
} else if (process.env.NODE_ENV === 'production') {
  env.config({path: '.production.env'});
}


const sequelize = new Sequelize(process.env.POSTGRES_DB, process.env.POSTGRES_USER, process.env.POSTGRES_PASSWORD, {
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  dialect: 'postgres',
});

User(sequelize);

// sequelize.sync({alter: true});

module.exports = sequelize;
