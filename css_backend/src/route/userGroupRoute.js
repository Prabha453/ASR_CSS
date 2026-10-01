'use strict';

const express = require('express');
const UserGroupController = require('../controllers/UserGroupController');
const auth = require('../middlewares/auth');

const router = express.Router();
const userGroupController = new UserGroupController();

router.post('/create',                    auth(), userGroupController.create);
router.put('/update/:user_group_id',      auth(), userGroupController.update);
router.get('/get/:user_group_id',         auth(), userGroupController.get);
router.post('/delete',                    auth(), userGroupController.delete);
router.get('/list',                       auth(), userGroupController.list);
router.get('/all',                        auth(), userGroupController.getAll);

module.exports = router;
