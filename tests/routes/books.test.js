const request = require("supertest");
const app = require("../../app");
const { sequelize } = require("../../models");
const createBooksAndAuthors = require("../../seed");

const route = (params = "") => {
  const path = "/api/v1/books";
  return `${path}/${params}`;
};

beforeAll(async () => {
  const port = 3333;
  jest.setTimeout(120000);
  await sequelize.sync({ force: true });
  createBooksAndAuthors();
  await app.listen(port);
  console.log(`Test server is running on http://localhost:${port}`);
});

afterAll(async () => {
  sequelize.close();
});

describe("Books", () => {
  describe("[GET] Search for books", () => {
    const verifyBooks = (req, expected) => {
      const books = req.body;
      books.forEach((book, index) => {
        expect(book.title).toBe(expected[index].title);
        expect(book.author.name).toBe(expected[index].author.name);
      });
    };

    test("returns all books", () => {
      const expectedBooks = [
        { id: 1, title: "Animal Farm", author: { name: "George Orwell" } },
        { id: 2, title: "1984", author: { name: "George Orwell" } },
        {
          id: 3,
          title: "Homage to Catalonia",
          author: { name: "George Orwell" }
        },
        {
          id: 4,
          title: "The Road to Wigan Pier",
          author: { name: "George Orwell" }
        },
        {
          id: 5,
          title: "Brave New World",
          author: { name: "Aldous Huxley" }
        },
        { id: 6, title: "Fahrenheit 451", author: { name: "Ray Bradbury" } }
      ];

      return request(app)
        .get(route())
        .expect("content-type", /json/)
        .expect(200)
        .then(req => verifyBooks(req, expectedBooks));
    });

    test("returns books matching the title query", () => {
      return request(app)
        .get(route())
        .query({ title: "1984" })
        .expect("content-type", /json/)
        .expect(200)
        .then(req => {
          const book = req.body[0];
          expect(book.title).toBe("1984");
          expect(book.author.name).toBe("George Orwell");
        });
    });

    test("returns books matching the author query", () => {
      return request(app)
        .get(route())
        .query({ author: "George Orwell" })
        .expect("content-type", /json/)
        .expect(200)
        .then(req => {
          const books = req.body;
          books.forEach((book) => {
            expect(book.author.name).toBe("George Orwell");
          });
          expect(books.length).toBe(4)
        });
    });
  });

  describe("[POST] Creates a new book", () => {
    test("deny access when no token is given", () => {
      return request(app)
        .post(route())
        .send({ title: "The Handmaid's Tale", author: "Margaret Atwood" })
        .catch(err => {
          expect(err.status).toBe(403);
        });
    });

    test("deny access when incorrect token is given", () => {
      return request(app)
        .post(route())
        .set("Authorization", "Bearer some-invalid-token")
        .send({ title: "The Handmaid's Tale", author: "Margaret Atwood" })
        .catch(res => {
          expect(res.status).toBe(403);
        });
    });

    test("grant access when correct token is given", () => {
      return request(app)
        .post(route())
        .set("Authorization", "Bearer my-awesome-token")
        .send({ title: "The Handmaid's Tale", author: "Margaret Atwood" })
        .expect(201)
        .then(req => {
          const book = req.body
          expect(book.title).toBe("The Handmaid's Tale")
          expect(book.author).toEqual({id:4 , name: "Margaret Atwood"})
        });
    });
  });

  describe("[PUT] Edits an existing book", () => {
    test("successfully edits a book", () => {
      const id = "5";
      return request(app)
        .put(route(id))
        .send({
          id: 5,
          title: "The Perennial Philosophy",
          author: "Aldous Huxley"
        })
        .expect(202)
        .expect({
          id: 5,
          title: "The Perennial Philosophy",
          authorId: 2,
          author: {id: 2, name: "Aldous Huxley"}
        });
    });

    test("fails as there is no such book", () => {
      const id = "100";
      return request(app)
        .put(route(id))
        .send({
          id: 100,
          title: "The Perennial Philosophy",
          author: "Aldous Huxley"
        })
        .catch(res => {
          expect(res.status).toBe(400);
        });
    });
  });

  describe("[DELETE] Removes an existing book", () => {
    test("successfully removes a book", () => {
      const id = "1";
      return request(app)
        .delete(route(id))
        .expect(202);
    });

    test("fails as there is no such book", done => {
      const id = "100";
      request(app)
        .delete(route(id))
        .expect(400, done);
    });

    test("fails as there is no such book", () => {
      const id = "100";
      return request(app)
        .delete(route(id))
        .ok(res => res.status === 400)
        .then(res => {
          expect(res.status).toBe(400);
        });
    });

    test("fails as there is no such book", async () => {
      const id = "100";
      await request(app)
        .delete(route(id))
        .ok(res => res.status === 400)
        .then(res => {
          expect(res.status).toBe(400);
        });
    });

    test("fails as there is no such book", () => {
      const id = "100";
      return request(app)
        .delete(route(id))
        .ok(res => res.status === 400)
        .then(res => {
          expect(res.status).toBe(400);
        });
    });
  });
});
