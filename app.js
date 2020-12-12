require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('express-jwt');
const jsonwebtoken = require('jsonwebtoken');
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
const generateJWT = async(req, res, next) => {
  req.body.jwt = jsonwebtoken.sign({ email: req.body.email }, process.env.JWT_SECRET);
  next();   
}
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
// POST /logout
// GET /user/:id (auth)
// POST /todo/create?userId=<userId> (auth)
// GET /todos?userId=<userId> (auth)
// POST /todo/:id/update?userId=<userId> (auth)

/* Examples */
// curl -X POST localhost:8080/signup -H "Content-Type":"application/json" -d '{"firstName":"foo","lastName":"bar","email":"foo.bar@example.com","password":"password"}'
// curl -X POST -H "Content-Type":"application/json" localhost:8080/login -d '{"email":"foo.bar@example.com","password":"password"}'
// curl -X GET localhost:8080/logout
// curl -X GET localhost:8080/user/1
// curl -X POST -H "Content-Type":"application/json" localhost:8080/todo/create -d '{"name":"Water"}'
// curl -X GET "localhost:8080/todos?userId=1"
// curl -X POST -H "Content-Type":"application/json" localhost:8080/todo/1/update

app.post('/signup',
  validate([
    body('email').isEmail(),
    body('password').isLength({ min: 5 })
  ]),
  generateJWT,
  async (req, res, next) => {
    let user = {...req.body };

    console.log(user);

    try {
      const { hash, salt } = await hasher({ password: req.body.password });
      user.hash = hash;
      user.salt = salt;
      await User.create(user);
    } catch(err) {
      return next(err);
    }

    res.json({
      message: "SignUp successful!",
      token: user.jwt,
      id: user.id,
      name: user.firstName + ' ' + user.lastName
    });
  });

app.post('/login', validate([
  body('email').isEmail(),
  body('password').isLength({ min: 5 })
]), async (req, res, next) => {
  try {
    let user = await User.findOne({ email: req.body.email }); 
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
});
