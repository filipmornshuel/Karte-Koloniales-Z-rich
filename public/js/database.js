const sqlite3 = require('sqlite3').verbose();

// Öffne die Datenbankverbindung
let db = new sqlite3.Database('../db/checkpoints', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the checkpoints database.');
});

// Erstelle die Checkpoints-Tabelle, falls sie noch nicht vorhanden ist
db.run('CREATE TABLE IF NOT EXISTS checkpoints (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, longitude REAL, latitude REAL)');
