const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const keywordsController = require('../controllers/keywordsController');

router.get('/', auth, keywordsController.getKeywords);
router.post('/', auth, keywordsController.addKeyword);
router.delete('/:keyword', auth, keywordsController.deleteKeyword);

module.exports = router;
