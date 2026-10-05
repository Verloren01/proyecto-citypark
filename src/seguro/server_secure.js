const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const helmet = require('helmet');

const app = express();
const db = new sqlite3.Database(path.join(__dirname, 'secure_citypark.db'));

app.use(express.json());
app.use(helmet()); // A05: Mitigado (oculta cabeceras)

// A03 y A08: Inyección mitigada (Consultas parametrizadas) y XSS mitigado
app.post('/api/fines', (req, res) => {
    const { plate, amount, comment } = req.body;
    
    // A04: Validación Zero Trust Input
    if (amount < 0) {
        return res.status(400).json({ error: "El monto no puede ser negativo" });
    }

    // Sanitización básica XSS
    const safeComment = comment ? comment.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';

    db.run(`INSERT INTO fines (plate, amount, comment) VALUES (?, ?, ?)`, 
        [plate, amount, safeComment], 
        function(err) {
            if (err) {
                // A05: Manejo seguro de errores (no exponemos err.message)
                return res.status(500).json({ error: 'Error interno del servidor' });
            }
            res.status(201).json({ id: this.lastID, plate, amount, comment: safeComment });
    });
});

app.listen(3001, () => console.log('✅ API SEGURA corriendo en puerto 3001'));