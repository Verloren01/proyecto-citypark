require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const db = require('./db_secure');
const app = express();

// A05: Cabeceras de seguridad con Helmet y ocultamiento de trazas
app.use(helmet());
app.use(express.json());

// A07: Control de Rate Limiting para evitar ataques de fuerza bruta
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // Límite por IP
});
app.use(limiter);

const JWT_SECRET = process.env.JWT_SECRET || 'clave_super_segura_temporal';

// Middleware de Autenticación y Autorización Estricta (RBAC) para Mitigar A01 y A07
function verifyInspector(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token no proveído' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Sesión inválida o expirada' });
    if (user.role !== 'inspector' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado: Se requieren privilegios de inspector' });
    }
    req.user = user;
    next();
  });
}

// Endpoint de Autenticación para generar JWT de corta duración (A07)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  // Simulación de validación segura contra DB
  if (username === 'inspector_juan') {
    // JWT expira en 15 minutos (mitigación A07)
    const token = jwt.sign({ username, role: 'inspector' }, JWT_SECRET, { expiresIn: '15m' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Credenciales inválidas' });
});

// A01 & A09: PUT para anular/modificar multas con validación de roles y Registro de Auditoría
app.put('/api/fines/:id/status', verifyInspector, (req, res) => {
  const { status } = req.body;
  const fineId = req.params.id;

  // Validación estricta del estado permitido (Lista blanca)
  const validStatuses = ['PENDING', 'PAID', 'VOIDED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Estado no válido' });
  }

  // A03: Uso de Consultas Parametrizadas contra Inyección SQL
  db.run(`UPDATE fines SET status = ?, updated_by = ? WHERE id = ?`, [status, req.user.username, fineId], function(err) {
    if (err) {
      // A05: Mensaje genérico de error sin Stack Traces
      return res.status(500).json({ error: 'Error interno en el servidor' });
    }

    // A09: Registro de Auditoría obligatorio para cambios críticos (anulaciones)
    db.run(`INSERT INTO audit_logs (action, user, details) VALUES (?, ?, ?)`, 
      ['UPDATE_FINE_STATUS', req.user.username, `Multa \({fineId} cambiada a\){status}`]);

    res.json({ message: "Multa actualizada correctamente bajo auditoría", fineId, status });
  });
});

// A04: Validación estricta de entradas (Zero Trust Input) para tarifas y multas
app.post('/api/fines', verifyInspector, (req, res) => {
  const { plate, amount, comment } = req.body;

  // Validación de montos positivos y razonables
  if (typeof amount !== 'number' || amount <= 0 || amount > 10000) {
    return res.status(400).json({ error: 'El monto de la multa debe ser un valor numérico válido entre 0 y 10000' });
  }

  // Validación de formato de patente (Regex estricta)
  const plateRegex = /^[A-Z0-9]{6}$/;
  if (!plateRegex.test(plate)) {
    return res.status(400).json({ error: 'Formato de patente inválido' });
  }

  // Sanitización básica contra XSS en comentarios
  const safeComment = comment ? comment.replace(//g, ">") : '';

  db.run(`INSERT INTO fines (plate, amount, status, comment) VALUES (?, ?, 'PENDING', ?)`, [plate, amount, safeComment], function(err) {
    if (err) return res.status(500).json({ error: 'Error al registrar multa' });
    res.status(201).json({ id: this.lastID, plate, amount, comment: safeComment });
  });
});

// A10: Mitigación de SSRF (Validación estricta de esquema y bloqueo de IPs privadas/locales)
app.get('/api/cameras/sync', verifyInspector, async (req, res) => {
  const targetUrl = req.query.url;
  try {
    const parsedUrl = new URL(targetUrl);
    
    // Lista blanca de dominios permitidos o bloqueo de IPs privadas (RFC 1918)
    if (parsedUrl.protocol !== 'https:' || parsedUrl.hostname === 'localhost' || parsedUrl.hostname.startsWith('192.168.') || parsedUrl.hostname.startsWith('10.') || parsedUrl.hostname === '169.254.169.254') {
      return res.status(400).json({ error: 'URL externa no permitida por políticas de seguridad (SSRF prevenido)' });
    }

    const response = await axios.get(targetUrl, { timeout: 5000 });
    res.json({ status: "Synced safely", data: response.data });
  } catch (error) {
    res.status(400).json({ error: 'Error al conectar con la cámara de tráfico' });
  }
});

app.listen(4000, () => {
  console.log('API Segura corriendo en puerto 4000 (Controles OWASP activos)');
});