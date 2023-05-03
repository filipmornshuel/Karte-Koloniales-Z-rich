/*
* Vorlage von http://expressjs.com/en/resources/middleware/session.html
* Bcrypt Code von https://github.com/kelektiv/node.bcrypt.js
*/

const bcrypt = require('bcrypt');
const saltRounds = 10;

const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const express = require('express');
const path = require('path');
var app = express();

const db = new sqlite3.Database('db/checkpoints.db', (err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log('Connected to the checkpoints database.');
      // Create the 'checkpoints' table if it doesn't exist
      db.run(`CREATE TABLE IF NOT EXISTS checkpoints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        description TEXT
      )`);
    }
  });

app.use(session({
    secret: "augh",
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 600000,
    }
}));

function isAuthenticated(req, res, next) {
    if (req.session.user) next()
    else next('route')
}

app.get('/', isAuthenticated, function(req, res) {
   res.sendFile(path.join(__dirname + "/admin.html"));
});

app.get('/', function (req, res) {
    res.send('<form action="/login" method="post">' +
      'Username: <input name="user"><br>' +
      'Password: <input name="pass" type="password"><br>' +
      '<input type="submit" text="Login"></form>')
});

app.post('/login', express.urlencoded({ extended: false }), function (req, res) {

  const data = req.body;
  var user = data.user;
  bcrypt.hash(data.pass, saltRounds, function(err, hash) {
    if (err) {
      console.log(err);
    } else {
      console.log(data);
      db.all("SELECT * FROM users WHERE user='" + user + "' AND pass='" + hash + "'", (err, rows) => {
        if (err) {
          console.log(err);
          res.status(500).send("Server Error");
        } else {
          console.log(rows);
        }
      });
    }
  });
    
  req.session.regenerate(function (err) {
    if (err) next(err)
    // store user information in session, typically a user id
    req.session.user = req.body.user
  
    // save the session before redirection to ensure page
    // load does not happen before session is saved
    req.session.save(function (err) {
      if (err) return next(err)
      res.redirect('/')
    });
  });
});

app.get('/logout', function (req, res, next) {
    // logout logic
  
    // clear the user from the session object and save.
    // this will ensure that re-using the old session id
    // does not have a logged in user
    req.session.user = null
    req.session.save(function (err) {
      if (err) next(err)
  
      // regenerate the session, which is good practice to help
      // guard against forms of session fixation
      req.session.regenerate(function (err) {
        if (err) next(err)
        res.redirect('/');
      });
    });
});

app.listen(3000, () => console.log("Connected to port 3000"));

process.on('SIGINT', () => {
    db.close((err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log('Close the checkpoint database connection.');
      process.exit(0);
    });
});