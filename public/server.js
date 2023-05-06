const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const path = require('path');
const mime = require('mime-types');
const { pathToFileURL } = require('url');
const app = express();
const port = 3000;
const nodemailer = require('nodemailer');
var dotenv = require('dotenv').config({path: '../.env'});

app.use(express.static(__dirname));
app.use(express.json());

app.use((req, res, next) => {
  const mimeType = mime.lookup(pathToFileURL);
  res.setHeader('Content-Type', mimeType);
  next();
});


app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + 'index.html'));
});

//Get all histroy entries
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

//Send Station Request
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

//Add Request to History
app.post('/api/addHistory', (req, res) => {
  const { name, lat, lng, description, img } = req.body;
  console.log(name);

  // Insert new checkpoint into the 'history' table
  db.run(
    `INSERT INTO history (name, lat, lng, description, img)
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

//Update requested Station
app.put('/api/updatecheckpoints', (req, res) => {
  const { id, name, lat, lng, description, img } = req.body;

  db.run(
    `UPDATE requestCheckpoints SET name=?, description=? WHERE id=? `,
    [name, description, id],
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
          img
        };
        res.json(update);
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

//Load all Stations
app.get('/api/allCheckpoints', (req, res) => {
  db.all('SELECT id,title,description,img,audio FROM checkpoints', (err, rows) => {
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

//Delete requested Station after approval/decline
app.delete('/api/removeRequest', (req, res) => {
  const id = req.body.id;

  db.run(
    'DELETE FROM requestCheckpoints WHERE id=?',
    [id],
    function (err) {
      if (err) {
        console.error(err.message);
        res.status(500).send('Internal server error.');
      } else {
        res.status(200).send('Request deleted')
      }
    }
  )
})

app.post('/sendEmail', (req, res) => {
  const { name, email, phone, message } = req.body;
  console.log(process.env.EMAIL + " " + process.env.PWD)
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
    subject: "Test",
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
