'use strict';

const express = require('express');
const UserPermissionController = require('../controllers/UserPermissionController');
const auth = require('../middlewares/auth');

const router = express.Router();
const ctrl = new UserPermissionController();

// GET   /user-permission/:user_id          — fetch group perms + overrides + effective
router.get('/:user_id',   auth(), ctrl.getByUser);
// PUT   /user-permission/:user_id          — upsert user overrides
router.put('/:user_id',   auth(), ctrl.upsert);
// DELETE /user-permission/:user_id/clear   — wipe all user overrides (revert to group)
router.delete('/:user_id/clear', auth(), ctrl.clear);

module.exports = router;
