const express = require('express');
const UserController = require('../controllers/UserController');
const UserValidator = require('../validator/UserValidator');

const router = express.Router();
const auth = require('../middlewares/auth');

const userController = new UserController();
const userValidator = new UserValidator();

router.post('/create', userValidator.userCreateValidator, userController.create);
router.put('/update/:user_id', auth(), userValidator.userCreateValidator, userController.update);
router.get('/get/:user_id', auth(), userController.getUser);
router.post('/delete', auth(), userController.delete);
router.get('/list', auth(), userController.list);

module.exports = router;
