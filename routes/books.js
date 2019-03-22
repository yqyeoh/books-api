const uuid = require('uuid/v4');
const express = require('express');

const router = express.Router();
const { books: oldBooks } = require('../data/db.json');
const { Book, Author } = require('../models');

const verifyToken = (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    res.sendStatus(403);
  } else if (authorization === 'Bearer my-awesome-token') {
    next();
  } else {
    res.sendStatus(403);
  }
};

router
  .route('/')
  .get(async (req, res) => {
    const { author, title } = req.query;

    if (title) {
      const books = await Book.findAll({
        where: { title },
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
    const { title, author } = req.body;
    let newBook;

    // const resultAuthor = await Author.findOne({where: { name: author }})

    const [foundAuthor] = await Author.findOrCreate({
      where: { name: author }
    });
    if (!foundAuthor) {
      newBook = await Book.create(
        {
          title,
          author
        },
        {
          include: [Author]
        }
      );
    } else {
      newBook = await Book.create({ title });
      await newBook.setAuthor(foundAuthor);
    }
    // const newBook = await Book.create({ title });
    // await newBook.setAuthor(foundAuthor);
    const newBookWithAuthor = await Book.findOne({
      where: { id: newBook.id },
      include: [Author]
    });
    res.status(201).json(newBookWithAuthor);
  });

router
  .route('/:id')
  .put(async (req, res) => {
    try {
      const book = await Book.findOne({
        where: { id: req.params.id },
        include: [Author]
      });
      // const foundAuthor = await Author.findOne({where:{name:req.body.author}})
      const [foundAuthor] = await Author.findOrCreate({
        where: { name: req.body.author }
      });
      await book.update({ title: req.body.title });
      await book.setAuthor(foundAuthor);
      const result = await Book.findOne({
        where: { id: book.id },
        include: [Author]
      });
      res.status(202).json(result);
    } catch (ex) {
      res.sendStatus(400);
    }
  })
  .delete(async (req, res) => {
    try {
      const book = await Book.destroy({ where: { id: req.params.id } });
      if (book) {
        return res.sendStatus(202);
      }
      res.sendStatus(400);
    } catch (err) {
      res.sendStatus(400);
    }
  });

module.exports = router;
