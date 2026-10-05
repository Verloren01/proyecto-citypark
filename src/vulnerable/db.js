const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run("CREATE TABLE users (id INT, username TEXT, role TEXT, password TEXT)");
  db.run("CREATE TABLE fines (id INT, plate TEXT, amount REAL, status TEXT, comment TEXT)");
  
  // Datos iniciales vulnerables
  db.run("INSERT INTO users VALUES (1, 'conductor1', 'driver', '1234')");
  db.run("INSERT INTO users VALUES (2, 'inspector_juan', 'inspector', 'adminpass')");
  db.run("INSERT INTO fines VALUES (1, 'ABCD12', 50.0, 'PENDING', 'Mal estacionado')");
});

module.exports = db;