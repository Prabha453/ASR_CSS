const express = require('express');

const ToDoTaskController = require('../controllers/ToDoTaskController');

const ToDoTaskValidator = require('../validator/ToDoTaskValidator');

const auth = require('../middlewares/auth');

const router = express.Router();

const controller = new ToDoTaskController();
const validator = new ToDoTaskValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.get(
    '/list',
    auth(),
    controller.list
);

router.put(
    '/update-status/:todo_id',
    auth(),
    validator.updateStatusValidator,
    controller.updateStatus
);

router.post(
    '/delete',
    auth(),
    controller.delete
);

module.exports = router;
