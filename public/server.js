const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const path = require('path');
const mime = require('mime-types');
const { pathToFileURL } = require('url');
const app = express();
const port = 3000;

app.use(express.static(__dirname + '/public'));
app.use(express.json());

app.use((req, res, next) => {
  const mimeType = mime.lookup(pathToFileURL);
  res.setHeader('Content-Type', mimeType);
  next();
});


app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

// Add a new checkpoint to the database
app.post('/api/checkpoints', (req, res) => {
  const { name, lat, lng, description, img } = req.body;

  // Insert new checkpoint into the 'checkpoints' table
  db.run(
    `INSERT INTO checkpoints (name, lat, lng, description, img)
          VALUES (?, ?, ?, ?, ?)`,
    [name, lat, lng, description, img],
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
          img
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

app.get('/api/allCheckpoints', (req, res) => {
  db.all('SELECT id,name,description,img,audio FROM checkpoints', (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).send('Server error');
    } else {
      console.log(rows);
      res.send(rows);
    }
  });
});

//Load proposed Stations
app.get('/api/loadRequests', (req, res) => {
  db.all('SELECT * FROM requestCheckpoints', (err, rows) => {
    if (err) {
      console.log(err);
      res.status(500).send('Server error');
    } else {
      console.log(rows);
      res.send(rows);
    }
  })
})

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
