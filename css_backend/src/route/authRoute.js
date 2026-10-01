const express = require('express');
const AuthController = require('../controllers/AuthController');
const UserValidator = require('../validator/UserValidator');

const router = express.Router();
const auth = require('../middlewares/auth');

const authController = new AuthController();
const userValidator = new UserValidator();

router.post('/login', userValidator.userLoginValidator, authController.login);
router.post('/refresh-token', authController.refreshTokens);
router.post('/logout', auth(), authController.logout);
router.put(
    '/change-password/:user_id',
    auth(),
    userValidator.changePasswordValidator,
    authController.changePassword,
);

module.exports = router;
