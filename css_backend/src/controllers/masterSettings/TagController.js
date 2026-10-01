const httpStatus = require('http-status');

const logger = require('../../config/logger');

const TagService = require('../../service/masterSettings/TagService');

class TagController {

    constructor() {
        this.tagService = new TagService();
    }

    create = async (req, res) => {
        try {

            const responseData =
                await this.tagService.create(req.body);

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    update = async (req, res) => {
        try {

            const responseData =
                await this.tagService.update(
                    req.params.tag_id,
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
                await this.tagService.get(
                    req.params.tag_id
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
                await this.tagService.list(req.query);

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    delete = async (req, res) => {
        try {

            const responseData =
                await this.tagService.delete(
                    req.body.tag_id
                );

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

}

module.exports = TagController;