const Sequelize = require("sequelize");

const sequelize = new Sequelize("books-api", "postgres", "", {
  dialect: "postgres",

  logging: false
});

const models = {
  Book: sequelize.import("./book"),
  Author: sequelize.import("./author")
};

Object.keys(models).forEach(key => {
  if ("associate" in models[key]) {
    models[key].associate(models);
  }
});

module.exports = {
  sequelize,
  ...models
};
