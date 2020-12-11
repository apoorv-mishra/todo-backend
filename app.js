require('dotenv').config();

const express = require('express');
const app = express();
const port = 3000;

const { body, validationResult } = require('express-validator');
const { camelizeKeys, decamelizeKeys } = require('humps');

// Middlewares
app.use(express.json());

// db
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'postgres',
  dbname: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST
});

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    throw error;
  }

  /* Routes required */
  // POST /signup (validation)
  // POST /login (validation)
  // POST /logout
  // GET /user/:id (auth)
  // POST /todo/create?userId=<userId> (auth)
  // GET /todos?userId=<userId> (auth)
  // POST /todo/:id/update?userId=<userId> (auth)

  /* Examples */
  // curl -X POST localhost:3000/signup -H "Content-Type":"application/json" -d '{"firstName":"foo","lastName":"bar","email":"foo.bar@example.com","password":"password"}'
  // curl -X POST localhost:3000/login -d '{"email":"foo.bar@example.com","password":"password"}'
  // curl -X GET localhost:3000/logout
  // curl -X GET localhost:3000/user/1
  // curl -X POST localhost:3000/todo/create -d '{"name":"Water"}'
  // curl -X GET "localhost:3000/todos?userId=1"
  // curl -X POST localhost:3000/todo/1/update

  app.post('/signup', [
    body('email').isEmail(),
    body('password').isLength({ min: 5 })
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = { ...req.body };

    // User.create(user);

    res.json(user);
  });

  app.post('/login', (req, res) => {
    res.json({ message: '/login success' });
  });

  app.get('/logout', (req, res) => {
    res.json({ message: '/logout success' });
  });

  app.get('/user/:id', (req, res) => {
    res.json({ message: '/user/:id success' });
  });

  app.post('/todo/create', (req, res) => {
    res.json({ message: '/todo/create success'});
  });

  app.get('/todos', (req, res) => {
    res.json({ message: '/todos success' });
  });

  app.post('/todo/:id/update', (req, res) => {
    res.json({ message: '/todo/:id/update success' });
  });

  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
};

const cleanup = async () => {
  await sequelize.close();
}

try {
  run();
} catch(err) {
  console.log(err.message);
  cleanup();
}
