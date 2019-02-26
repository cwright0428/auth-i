const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const session = require("express-sessions");
const KnexSessionStore = require('connect-session-knex')(session);



const db = require("./database/dbConfig.js");
const Users = require("./users/users-model.js");

const server = express();

const sessionConfig = {
  name: "johnDoe",
  secret: "dont tell nobody",
  cookie: {
    maxAge: 1000 * 60 * 120,
    secure: false
  },
  httpOnly: true,
  resave: false,
  saveUninitialized: false,

  store: new KnexSessionStore({
      knex: db,
      tablename: 'sessions',
      sidfilename: 'sid',
      createtable: true,
      clearInterval: 1000 * 60 * 20,
  })
};

server.use(helmet());
server.use(express.json());
server.use(cors());
server.use(session(sessionConfig));

server.get("/", (req, res) => res.send("WE IN HERE"));

server.post("/api/register", (req, res) => {
  let user = req.body;

  // generate hash from user's password
  const hash = bcrypt.hashSync(user.password, 10); // 2 ^ n

  // override user.password with hash
  user.password = hash;

  Users.add(user)
    .then(saved => {
      res.status(201).json(saved);
    })
    .catch(error => {
      res.status(500).json(error);
    });
});

server.post("/api/login", (req, res) => {
  let { username, password } = req.body;

  users
    .findBy({ username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(password, user.password)) {
        req.session.username = user;
        res
          .status(200)
          .json({ message: `Welcome ${user.username} have a cookie!` });
      } else {
        res.status(401).json({ message: "You shall not pass!" });
      }
    })
    .catch(error => {
      res.status(500).json(error);
    });
});

function restricted(req, res, next) {
  if (req.session && req.session.user) {
    Users.findBy({ username }).next();
  } else {
    res.status(401).json({ message: "Invalid Credentials" });
  }
}

server.get("/api/users", restricted, (req, res) => {
  Users.find()
    .then(users => {
      res.json(users);
    })
    .catch(error => res.send(error));
});

server.get('logout', (req,res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        res.send('Ahh Ah Ahhhh where do you think your going')
      } else {
        res.send('You may go, Leave my presence')
      }
    })
  } else {
    res.end();
  }
})

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`\n** Running on port ${port} **\n`));
