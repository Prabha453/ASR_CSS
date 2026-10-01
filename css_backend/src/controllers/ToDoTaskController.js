const httpStatus = require('http-status');

const logger = require('../config/logger');

const ToDoTaskService = require('../service/ToDoTaskService');

class ToDoTaskController {

    constructor() {
        this.toDoTaskService = new ToDoTaskService();
    }

    create = async (req, res) => {
        try {

            const responseData =
                await this.toDoTaskService.create(req.body, req.user.user_id);

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    list = async (req, res) => {
        try {

            const responseData =
                await this.toDoTaskService.list(req.user.user_id);

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    updateStatus = async (req, res) => {
        try {

            const responseData =
                await this.toDoTaskService.updateStatus(
                    req.params.todo_id,
                    req.user.user_id,
                    req.body.status
                );

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    delete = async (req, res) => {
        try {

            const responseData =
                await this.toDoTaskService.delete(
                    req.body.todo_id,
                    req.user.user_id
                );

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

}

module.exports = ToDoTaskController;
