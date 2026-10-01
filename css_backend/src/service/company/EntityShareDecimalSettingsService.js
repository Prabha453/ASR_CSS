'use strict';

const httpStatus                     = require('http-status');
const EntityShareDecimalSettingsDao  = require('../../dao/company/EntityShareDecimalSettingsDao');
const responseHandler                = require('../../helper/responseHandler');
const logger                         = require('../../config/logger');

class EntityShareDecimalSettingsService {

    constructor() {
        this.dao = new EntityShareDecimalSettingsDao();
    }

    get = async (entity_id) => {
        try {
            const row = await this.dao.findOneByWhere({ entity_id });
            return responseHandler.returnSuccess(httpStatus.OK, 'Success', row || {});
        } catch (e) {
            logger.error(e);
            return responseHandler.returnError(httpStatus.BAD_GATEWAY, 'Something went wrong');
        }
    };

    upsert = async (entity_id, body) => {
        try {
            const values = {
                entity_id,
                no_of_share_decimal_place:   body.no_of_share_decimal_place   ?? null,
                paid_up_share_decimal_place: body.paid_up_share_decimal_place ?? null,
                issued_share_decimal_place:  body.issued_share_decimal_place  ?? null,
            };
            const row = await this.dao.updateOrCreate(values, { entity_id });
            return responseHandler.returnSuccess(httpStatus.OK, 'Saved', row);
        } catch (e) {
            logger.error(e);
            return responseHandler.returnError(httpStatus.BAD_GATEWAY, 'Something went wrong');
        }
    };

}

module.exports = EntityShareDecimalSettingsService;
