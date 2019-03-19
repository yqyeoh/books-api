module.exports = (sequelize, type) => {
  const Book = sequelize.define("book", {
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: type.STRING
  });
  return Book;
};
