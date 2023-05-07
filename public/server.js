const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const path = require('path');
const hcaptcha = require('hcaptcha');
require('dotenv').config({ path: '../.env' });
const HCAPTCHA_SECRET_KEY = process.env.SECRET_KEY;
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
//app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname));
//app.use(express.urlencoded({ extended: true }));
//app.use(express.json({ limit: '25mb' }));
//app.use(express.bodyParser({limit: '50mb'}));
app.use(bodyParser.json({limit: '25mb'}))
app.use(bodyParser.urlencoded({limit: '25mb', extended: true}))

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

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Add a new checkpoint to the database
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

// Add a new checkpoint to the database
app.post('/api/requestCheckpoint/create', (req, res) => {
  const { title, lat, lng, description, img, audio } = req.body;

  // Insert new checkpoint into the 'requestCheckpoints' table
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

// Schließe die Verbindung zur Datenbank, wenn die Anwendung beendet wird
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
