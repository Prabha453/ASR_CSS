const express = require('express');
const PortController = require('../controllers/PortController');

const router = express.Router();
const portController = new PortController();

// GET /port/resolve?port_number=XXX
router.get('/resolve', portController.resolve);

module.exports = router;
