const Sequelize = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const config = require(`${__dirname  }/../config/config.js`)[env];

let sequelize;
// Connect to different database depending on env
if (env === 'production') {
  sequelize = new Sequelize(config.url, config.options);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config.options
  );
}

const models = {
  Book: sequelize.import('./book'),
  Author: sequelize.import('./author')
};

Object.keys(models).forEach(key => {
  if ('associate' in models[key]) {
    models[key].associate(models);
  }
});

module.exports = {
  sequelize,
  ...models
};
