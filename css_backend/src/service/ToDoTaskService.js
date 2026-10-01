const httpStatus = require('http-status');

const ToDoTaskDao = require('../dao/ToDoTaskDao');

const responseHandler = require('../helper/responseHandler');

const logger = require('../config/logger');

class ToDoTaskService {

    constructor() {
        this.toDoTaskDao = new ToDoTaskDao();
    }

    async _checkExists(id, userId) {

        return await this.toDoTaskDao.findOneByWhere({
            todo_id: id,
            user_id: userId,
            is_deleted: false,
        });

    }

    create = async (body, userId) => {
        try {

            const data = await this.toDoTaskDao.create({
                user_id: userId,
                task_text: body.task_text,
                status: 'PENDING',
                is_deleted: false,
                created_date: new Date(),
            });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Task saved successfully',
                data
            );

        } catch (err) {

            logger.error('Create todo task error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error saving task'
            );

        }
    };

    // User-wise task list — each user only ever sees their own tasks.
    list = async (userId) => {
        try {

            const data = await this.toDoTaskDao.findByWhere(
                { user_id: userId, is_deleted: false },
                null,
                ['todo_id', 'DESC']
            );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Task list fetched successfully',
                data
            );

        } catch (err) {

            logger.error('List todo task error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching task list'
            );

        }
    };

    updateStatus = async (id, userId, status) => {
        try {

            const oldData = await this._checkExists(id, userId);

            if (!oldData) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Task not found'
                );

            }

            await this.toDoTaskDao.updateWhere(
                {
                    status,
                    updated_date: new Date(),
                },
                {
                    todo_id: id,
                    user_id: userId,
                }
            );

            const updatedData = await this.toDoTaskDao.findOneByWhere({
                todo_id: id,
                user_id: userId,
            });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Task updated successfully',
                updatedData
            );

        } catch (err) {

            logger.error('Update todo task error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error updating task'
            );

        }
    };

    delete = async (id, userId) => {
        try {

            const oldData = await this._checkExists(id, userId);

            if (!oldData) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Task not found'
                );

            }

            await this.toDoTaskDao.updateWhere(
                {
                    is_deleted: true,
                    updated_date: new Date(),
                },
                {
                    todo_id: id,
                    user_id: userId,
                }
            );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Task deleted successfully'
            );

        } catch (err) {

            logger.error('Delete todo task error:', err);

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error deleting task'
            );

        }
    };

}

module.exports = ToDoTaskService;
