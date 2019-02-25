const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const db = require("./database/dbConfig.js");
const Users = require('./users/users-model.js');


const server = express();

server.use(helmet());
server.use(express.json());
server.use(cors());

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
        res.status(200).json({ message: `Welcome ${user.username}!` });
      } else {
        res.status(401).json({ message: "You shall not pass!" });
      }
    })
    .catch((error) => {res.status(500).json(error)})
});

function restricted(req,res, next) {
    const { username, password, } = req.headers;

    if (username && password) {
        Users.findBy({ username })
        .first()
        .then(user =>{
            if (user && bcrypt.compareSync(password, user.password)) {
                next()
            } else {
                res.status(401).json({message: 'Invalid Credentials'})
            }
        })
        .catch(error => {
            res.status(500).json({'Unexpected Error'})
        })
    }
};

server.get('/api/users', restricted, (req, res) => {
    Users.find()
    .then(users => {
        res.json(users);
    })
    .catch(error => res.send(error));
})

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`\n** Running on port ${port} **\n`));
