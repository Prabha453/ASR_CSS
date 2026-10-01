'use strict';

const httpStatus = require('http-status');
const logger = require('../../config/logger');
const ShortcodeLibraryService = require('../../service/formBuilder/ShortcodeLibraryService');

class ShortcodeLibraryController {
    constructor() {
        this.service = new ShortcodeLibraryService();
    }

    _userId = req => req.user?.user_id || req.user?.id || null;

    _send = async (res, callback) => {
        try {
            const responseData = await callback();
            res.status(responseData.statusCode).send(responseData.response);
        } catch (error) {
            logger.error(error);
            res.status(httpStatus.BAD_GATEWAY).send(error);
        }
    };

    meta = async (req, res) => this._send(res, () => this.service.meta());

    list = async (req, res) => this._send(res, () => this.service.list(req.query));

    get = async (req, res) => this._send(res, () => this.service.get(req.params.shortcode_id));

    create = async (req, res) => this._send(
        res,
        () => this.service.save(null, req.body, this._userId(req))
    );

    update = async (req, res) => this._send(
        res,
        () => this.service.save(req.params.shortcode_id, req.body, this._userId(req))
    );

    retire = async (req, res) => this._send(
        res,
        () => this.service.retire(req.params.shortcode_id, this._userId(req))
    );
}

module.exports = ShortcodeLibraryController;
