'use strict';

const httpStatus = require('http-status');

const logger = require('../../config/logger');

const FormPopUpFieldService = require('../../service/formBuilder/FormPopUpFieldService');

class FormPopUpFieldController {

    constructor() {
        this.formPopUpFieldService = new FormPopUpFieldService();
    }

    create = async (req, res) => {
        try {

            const responseData =
                await this.formPopUpFieldService.create(req.body);

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    update = async (req, res) => {
        try {

            const responseData =
                await this.formPopUpFieldService.update(
                    req.params.form_pop_up_field_id,
                    req.body
                );

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    get = async (req, res) => {
        try {

            const responseData =
                await this.formPopUpFieldService.get(
                    req.params.form_pop_up_field_id
                );

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    list = async (req, res) => {
        try {

            const responseData =
                await this.formPopUpFieldService.list(req.query);

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    delete = async (req, res) => {
        try {

            const responseData =
                await this.formPopUpFieldService.delete(
                    req.body.form_pop_up_field_id
                );

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

}

module.exports = FormPopUpFieldController;