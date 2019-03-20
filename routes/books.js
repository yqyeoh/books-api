const { Book, Author } = require("../models");
const express = require("express");
const router = express.Router();

const verifyToken = (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    res.sendStatus(403);
  } else {
    if (authorization === "Bearer my-awesome-token") {
      next();
    } else {
      res.sendStatus(403);
    }
  }
};

router
  .route("/")
  .get(async (req, res) => {
    const { author, title } = req.query;
    if (title) {
      const books = await Book.findAll({
        where: { title: title },
        include: [Author]
      });
      res.json(books);
    } else if (author) {
      const books = await Book.findAll({
        include: [{ model: Author, where: { name: author } }]
      });
      res.json(books);
    } else {
      const books = await Book.findAll({ include: [Author] });
      res.json(books);
    }
  })
  .post(verifyToken, async (req, res) => {
    try {
      const [foundAuthor] = await Author.findOrCreate({
        where: { name: req.body.author }
      });
      const newBook = await Book.create({ title: req.body.title });
      await newBook.setAuthor(foundAuthor);
      const newBookWithAuthor = await Book.findOne({
        where: { id: newBook.id },
        include: [Author]
      });
      res.status(201).json(newBookWithAuthor);
    } catch (ex) {
      res.status(400).json({
        err: `Author with name = [${req.body.author}] doesn\'t exist.`
      });
    }
  });

router
  .route("/:id")
  .put(async (req, res) => {
    try {
      const book = await Book.findOne({
        where: { id: req.params.id },
        include: [Author]
      });
      await book.update({ title: req.body.title });
      return res.status(202).json(book);
    } catch (ex) {
      return res.sendStatus(400);
    }
  })
  .delete(async (req, res) => {
    const book = await Book.destroy({ where: { id: req.params.id } });
    if (book) {
      res.sendStatus(202);
    } else {
      res.sendStatus(400);
    }
  });

module.exports = router;
