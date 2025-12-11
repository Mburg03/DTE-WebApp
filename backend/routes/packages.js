const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const packagesController = require('../controllers/packagesController');

router.post('/generate', auth, packagesController.generate);
router.get('/download/:id', auth, packagesController.download);

module.exports = router;
