require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const port = 8080;

const { body, validationResult } = require('express-validator');
const { camelizeKeys, decamelizeKeys } = require('humps');
const util = require('util');
const hasher = (passObj) => {
  return new Promise((resolve, reject) => {
    require('pbkdf2-password')()(passObj, (err, pass, salt, hash) => {
      if (err) { reject(err); }
      resolve({ pass, salt, hash });
    })
  });
};

// Middlewares
app.use(express.json());
app.use(cors());
const validate = validations => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ errors: errors.array() });
  }
};
const authorize = async(req, res, next) => {
  if (!req.query.userId || !req.headers.authorization) {
    return res.status(403).json({ message: 'Unauthorized!' });
  }
  if(req.headers.authorization.split(' ')[0] === 'Bearer') {
    const decoded = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);
    if (!decoded.email) {
      return res.status(403).json({ message: 'Unauthorized!' });
    }
    const user = await User.findOne({ where: { email: decoded.email }});
    if (user.id === parseInt(req.query.userId)) {
      // Authorized!
      return next();
    }
  }
  return res.status(403).json({ message: 'Unauthorized!' });
};
const generateJWT = async(req, res, next) => {
  req.body.jwt = jwt.sign({ email: req.body.email }, process.env.JWT_SECRET);
  next();   
};
// db
const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'postgres',
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST
});
const { User, Todo } = require("./models/init-models")(sequelize);

/* Routes required */
// POST /signup (validation)
// POST /login (validation)
// POST /todo/create?userId=<userId> (auth)
// GET /todos?userId=<userId> (auth)
// POST /todo/:id/update?userId=<userId> (auth)

/* Examples */
// curl -X POST localhost:8080/signup -H "Content-Type":"application/json" -d '{"firstName":"foo","lastName":"bar","email":"foo.bar@example.com","password":"password"}'
// curl -X POST -H "Content-Type":"application/json" localhost:8080/login -d '{"email":"foo.bar@example.com","password":"password"}'
// curl -X GET localhost:8080/logout
// curl -X GET localhost:8080/user/1
// curl -X POST -H "Content-Type":"application/json" -H "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFwb29ydm1pc2hyYTEwMTA5MkBnbWFpbC5jb20iLCJpYXQiOjE2MDc4MzY0Nzl9.e0K6kQCMWOt_lzcMEwktR5n_of2h7pvZ-_FZELchJ9A" "localhost:8080/todo/create?userId=32" -d '{"name":"Water"}'
// curl -X GET -H "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFwb29ydm1pc2hyYTEwMTA5MkBnbWFpbC5jb20iLCJpYXQiOjE2MDc4MzY0Nzl9.e0K6kQCMWOt_lzcMEwktR5n_of2h7pvZ-_FZELchJ9A" "localhost:8080/todos?userId=1"
// curl -X PATCH -H "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFwb29ydm1pc2hyYTEwMTA5MkBnbWFpbC5jb20iLCJpYXQiOjE2MDc4MzY0Nzl9.e0K6kQCMWOt_lzcMEwktR5n_of2h7pvZ-_FZELchJ9A" -H "Content-Type":"application/json" -d '{"done":"true"}' "localhost:8080/todo/1/update?userId=32"

app.post('/signup',
  validate([
    body('email').isEmail(),
    body('password').isLength({ min: 5 })
  ]),
  generateJWT,
  async (req, res, next) => {
    let user = {...req.body };
    let newUser;
    try {
      const { hash, salt } = await hasher({ password: req.body.password });
      user.hash = hash;
      user.salt = salt;
      newUser = await User.create(user);
    } catch(err) {
      return next(err);
    }

    res.json({
      message: "SignUp successful!",
      token: newUser.jwt,
      id: newUser.id,
      name: newUser.firstName
    });
  });

app.post('/login', validate([
  body('email').isEmail(),
  body('password').isLength({ min: 5 })
]), async (req, res, next) => {
  try {
    let user = await User.findOne({ where: { email: req.body.email }});
    if (!user) { return res.status(404).json({ message: "Email not found!"}); }
    const { hash } = await hasher({ password: req.body.password, salt: user.salt });
    if (hash === user.hash) {
      res.json({
        message: "Login successful!",
        token: user.jwt,
        id: user.id,
        name: user.firstName + ' ' + user.lastName
      });
    } else {
      res.status(400).json({ message: "Incorrect email or password!" })
    }
  } catch(err) {
    next(err);
  }
});

app.post('/todo/create', authorize, async (req, res, next) => {
  const userId = parseInt(req.query.userId);
  try {
    const todo = await Todo.create({
      userId: userId,
      name: req.body.name,
      done: false,
    });
    res.json({ message: 'Todo created!', todo: todo });
  } catch(err) {
    next(err);
  }
});

app.get('/todos', authorize, async (req, res, next) => {
  const userId = parseInt(req.query.userId);
  try {
    const user = await User.findOne({ where: { id: userId }});
    const todos = await Todo.findAll({ where: { userId: userId }, order: [ [ 'created_at', 'DESC' ] ] });
    res.json({ message: 'Todos!', user: user, todos: todos });
  } catch(err) {
    next(err);
  }
});

app.patch('/todo/:id/update', authorize, async (req, res) => {
  console.log(req.body);
  const todoId = req.params.id;
  const updateParams = {...req.body };
  const updatedTodo = await Todo.update(updateParams, { where: { id: todoId }});
  res.json({ message: 'Todo updated!' });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});
