/**
 * Serversite application
 * @author filipmornshuel, JoksimovicM
 * @since 01.03.2023
 */

const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const session = require('express-session');
const path = require('path');
const hcaptcha = require('hcaptcha');
require('dotenv').config({ path: '../.env' });
const HCAPTCHA_SECRET_KEY = process.env.SECRET_KEY;
const app = express();
const port = 3000;
const nodemailer = require('nodemailer');
var dotenv = require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcrypt');
const saltRounds = 10;
const bodyParser = require('body-parser');

app.use(bodyParser.json({ limit: '25mb' }));
app.use(bodyParser.urlencoded({ limit: '25mb', extended: true }));
app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '25mb' }));
app.use(
  session({
    secret: 'augh',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 600000,
    },
  })
);

/**
 * verifying the captcha DOES NOT WORK WITH LOCALHOST
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @author filipmornshuel
 */
function verifyHCaptcha(req, res, next) {
  const { token } = req.body;
  hcaptcha
    .verify(HCAPTCHA_SECRET_KEY, token)
    .then(() => {
      next();
    })
    .catch((error) => {
      console.error(error);
      res.status(400).send('hCaptcha verification failed.');
    });
}

/**
 * cheking if the user is authenticated with the login
 * @author JoksimovicM
 */
function isAuthenticated(req, res, next) {
  if (req.session.user) next();
  else res.redirect('/login');
}

/**
 * Loading the base index.html with the node server
 * @author filipmornshuel
 */
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + 'index.html'));
});

/**
 * When the authentication is passed, load the admin.html
 * @author JoksimovicM
 */
app.get('/admin', isAuthenticated, function (req, res) {
  res.sendFile(path.join(__dirname + '/admin.html'));
});

/**
 * Loading the login screen
 * @author JoksimovicM
 */
app.get('/login', function (req, res) {
  res.send(
    '<form action="/loginProcess" method="post">' +
      'Username: <input name="user"><br>' +
      'Password: <input name="pass" type="password"><br>' +
      '<input type="submit" text="Login"></form>'
  );
});

/**
 * Get request for the logout
 * @author JoksimovicM
 */
app.get('/logout', function (req, res, next) {
  req.session.user = null;
  req.session.save(function (err) {
    if (err) next(err);

    req.session.regenerate(function (err) {
      if (err) next(err);
      res.redirect('/');
    });
  });
});

/**
 * Get all histroy entries with a get-request
 * @author JoksimovicM
 */
app.get('/api/getHistory', (req, res) => {
  db.all('SELECT id,name,description,img,audio FROM history', (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).send('Server error');
    } else {
      console.log(rows);
      res.send(rows);
    }
  });
});

/**
 * get request to load all checkpoins
 * @author filipmornshuel
 */
app.get('/api/checkpoints', (req, res) => {
  db.all('SELECT * FROM checkpoints', (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).send('Server error');
    } else {
      console.log(rows);
      res.send(rows);
    }
  });
});

/**
 * get request to load one checkpoins
 * @author filipmornshuel
 */
app.get('/api/checkpoint', (req, res) => {
  const title = req.query.title;
  db.get('SELECT * FROM checkpoints WHERE title = ?', [title], (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).send('Server error');
    } else if (!row) {
      res.status(404).send('Checkpoint not found');
    } else {
      res.send(row);
    }
  });
});

/**
 * Load proposed Stations
 * @author JoksimovicM
 */
app.get('/api/loadRequests', (req, res) => {
  db.all('SELECT * FROM requestCheckpoints', (err, rows) => {
    if (err) {
      console.log(err);
      res.status(500).send('Server error');
    } else {
      console.log(rows);
      res.send(rows);
    }
  });
});

/**
 * Post request for checking the user
 * @author JoksimovicM
 */
app.post(
  '/loginProcess',
  express.urlencoded({ extended: false }),
  function (req, res) {
    const data = req.body;
    let user = data.user;

    db.all('SELECT * FROM users WHERE user=?', [user], (err, rows) => {
      if (err) {
        console.log(err);
        res.status(500).send('Server Error');
      } else if (rows.length > 0) {
        console.log('Test');
        bcrypt.compare(data.pass, rows[0].pass, function (err, result) {
          if (err) {
            console.log(err);
          } else if (result) {
            req.session.regenerate(function (err) {
              if (err) next(err);
              req.session.user = req.body.user;

              req.session.save(function (err) {
                if (err) return next(err);
                res.redirect('/admin.html');
              });
            });
          } else {
            res.status(401).send('Invalid username or password');
          }
        });
      } else {
        res.status(401).send('Invalid username or password');
      }
    });
  }
);

/**
 * Add a new checkpoint to the database with a post-request
 * @author filipmornshuel
 */
app.post('/api/checkpoint/create', (req, res) => {
  const { title, lat, lng, description, img, audio } = req.body;

  // Insert new checkpoint into the 'checkpoints' table
  db.run(
    `INSERT INTO checkpoints (title, lat, lng, description, img, audio)
          VALUES (?, ?, ?, ?, ?, ?)`,
    [title, lat, lng, description, img, audio],
    function (err) {
      if (err) {
        console.error(err.message);
        res.status(500).send('Internal server error.');
      } else {
        // Return the new checkpoint with its ID
        const newCheckpoint = {
          id: this.lastID,
          title,
          lat,
          lng,
          description,
          img,
          audio,
        };
        res.json(newCheckpoint);
      }
    }
  );
});

/**
 * Add a proposal to the database with a post-request
 * @author JoksimovicM
 */
app.post('/api/sendProposal', (req, res) => {
  const { title, lat, lng, description, img, audio } = req.body;

  // Insert new checkpoint into the 'readCheckpoints' table
  db.run(
    `INSERT INTO requestCheckpoints (title, lat, lng, description, img, audio)
          VALUES (?, ?, ?, ?, ?, ?)`,
    [title, lat, lng, description, img, audio],
    function (err) {
      if (err) {
        console.error(err.message);
        res.status(500).send('Internal server error.');
      } else {
        // Return the new checkpoint with its ID
        const newCheckpoint = {
          id: this.lastID,
          title,
          lat,
          lng,
          description,
          img,
          audio,
        };
        res.json(newCheckpoint);
      }
    }
  );
});

/**
 * Add a new history-entry to the database with a post-request
 * @author JoksimovicM
 */
app.post('/api/addHistory', (req, res) => {
  const { name, lat, lng, description, img, audio } = req.body;
  console.log(name);

  // Insert new checkpoint into the 'history' table
  db.run(
    `INSERT INTO history (name, lat, lng, description, img, audio)
          VALUES (?, ?, ?, ?, ?, ?)`,
    [name, lat, lng, description, img, audio],
    function (err) {
      if (err) {
        console.error(err.message);
        res.status(500).send('Internal server error.');
      } else {
        // Return the new checkpoint with its ID
        const newCheckpoint = {
          id: this.lastID,
          name,
          lat,
          lng,
          description,
          img,
          audio,
        };
        res.json(newCheckpoint);
      }
    }
  );
});

/**
 * Update requested Station
 * @author JoksimovicM
 */
app.put('/api/updatecheckpoints', (req, res) => {
  const { id, name, lat, lng, description, img, audio } = req.body;

  db.run(
    `UPDATE requestCheckpoints SET title=?, description=?, img=?, audio=?  WHERE id=? `,
    [name, description, img, audio, id],
    function (err) {
      if (err) {
        console.error(err.message);
        res.status(500).send('Internal server error.');
      } else {
        const update = {
          name,
          lat,
          lng,
          description,
          img,
          audio,
        };
        res.json(update);
      }
    }
  );
});

/**
 * Delete requested Station after approval/decline
 * @author JoksimovicM
 */
app.delete('/api/removeRequest', (req, res) => {
  const id = req.body.id;

  db.run('DELETE FROM requestCheckpoints WHERE id=?', [id], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error.');
    } else {
      res.status(200).send('Request deleted');
    }
  });
});

/**
 * Sending an email with a post-request
 * @author JoksimovicM
 */
app.post('/sendEmail', (req, res) => {
  const { name, email, phone, message } = req.body;
  console.log(process.env.EMAIL + ' ' + process.env.PWD);
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PWD,
    },
  });
  const mailOptions = {
    from: 'ironboy013@gmail.com',
    to: process.env.EMAIL,
    subject: 'Test',
    text: message,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).send('Internal server error.');
    } else {
      console.log('Email sent: ' + info.response);
      res.sendStatus(200);
    }
  });
});

/**
 * Delete requested Station after approval/decline
 * @author JoksimovicM
 */
app.delete('/api/removeRequest', (req, res) => {
  const id = req.body.id;

  db.run('DELETE FROM requestCheckpoints WHERE id=?', [id], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error.');
    } else {
      res.status(200).send('Request deleted');
    }
  });
});

const db = new sqlite3.Database('db/checkpoints.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the checkpoints database.');
    // Create the 'checkpoints' table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS checkpoints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      description TEXT
    )`);
  }
});

/**
 * closing the connection to the database, when the application is closed
 * @author filipmornshuel
 */
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Close the checkpoint database connection.');
    process.exit(0);
  });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
