const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const gmailController = require('../controllers/gmailController');

// Iniciar flujo OAuth (devuelve URL de Google)
router.get('/auth', auth, gmailController.startAuth);

// Callback de Google (usa state para identificar al usuario)
router.get('/callback', gmailController.handleCallback);

// Trigger de búsqueda manual
router.post('/search', auth, gmailController.searchInvoices);

// Estado de conexión
router.get('/status', auth, gmailController.status);

// Desconectar
router.delete('/', auth, gmailController.disconnect);

module.exports = router;
