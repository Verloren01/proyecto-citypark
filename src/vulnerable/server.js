const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database(path.join(__dirname, 'vulnerable_citypark.db'));

app.use(express.json());

// A05: .env expuesto (forzamos 'allow' para que Express no bloquee el archivo oculto)
app.use(express.static(__dirname, { dotfiles: 'allow' }));

// A03: SQL Injection y A08: XSS Inseguro
app.post('/api/fines', (req, res) => {
    const { plate, amount, comment } = req.body;
    
    // A04: Diseño inseguro (permite montos negativos)
    // A03: Inyección SQL por concatenación
    const query = `INSERT INTO fines (plate, amount, comment) VALUES ('${plate}', ${amount}, '${comment}')`;
    
    db.run(query, function(err) {
        if (err) {
            // A05: Expone el Stack Trace de la DB al atacante
            return res.status(500).send(`Error SQL: ${err.message}`); 
        }
        res.status(201).json({ mensaje: "Multa creada", id: this.lastID });
    });
});

app.listen(3000, () => console.log('❌ API VULNERABLE corriendo en puerto 3000'));