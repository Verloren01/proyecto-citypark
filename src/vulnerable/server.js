const express = require('express');
const axios = require('axios');
const db = require('./db');
const fs = require('fs');
const app = express();

app.use(express.json());

// A05: Exposición del archivo .env simulado en la raíz
app.get('/.env', (req, res) => {
  res.send("DB_HOST=localhost\nDB_USER=root\nDB_PASS=SuperSecretMunicipalPassword123!\n");
});

// A01 & A07: PUT para anular multas sin verificar permisos de inspector y sin expiración de sesión
app.put('/api/fines/:id/status', (req, res) => {
  const { status } = req.body;
  const fineId = req.params.id;
  // Vulnerable: no verifica si el usuario es inspector ni valida el token
  db.run(`UPDATE fines SET status = '\({status}' WHERE id =\){fineId}`, function(err) {
    if (err) {
      // A05: Exposición de Stack Traces detallados
      return res.status(500).json({ error: err.message, stack: err.stack });
    }
    res.json({ message: "Multa actualizada exitosamente", fineId, status });
  });
});

// A03: Inyección SQL en el reporte de multas por rango
app.get('/api/fines/report', (req, res) => {
  const { dateFrom, dateTo } = req.query;
  // Vulnerable: Concatenación directa de strings en SQL
  const query = `SELECT * FROM fines WHERE comment LIKE '%${dateFrom}%'`;
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message, stack: err.stack });
    }
    res.json(rows);
  });
});

// A04: Arquitectura sin límites de tarifas (permite negativos o absurdos)
app.post('/api/fines', (req, res) => {
  const { plate, amount, comment } = req.body;
  // Vulnerable: No valida si amount es negativo o absurdamente alto
  db.run(`INSERT INTO fines (plate, amount, status, comment) VALUES ('\({plate}',\){amount}, 'PENDING', '${comment}')`, function(err) {
    if (err) return res.status(500).send(err.message);
    res.json({ id: this.lastID, plate, amount, comment });
  });
});

// A08: Almacenamiento de XSS en comentarios ciudadanos
app.get('/api/fines/comments', (req, res) => {
  db.all("SELECT id, comment FROM fines", [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    // Devuelve el HTML/Script sin sanitizar
    let html = "