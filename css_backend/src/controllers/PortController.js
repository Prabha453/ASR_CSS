const httpStatus = require('http-status');
const { getSequelizeForDb } = require('../models');
const logger = require('../config/logger');
const config = require('../config/config');

class PortController {
    resolve = async (req, res) => {
        try {
            const { port_number } = req.query;

            if (!port_number) {
                return res.status(httpStatus.BAD_REQUEST).json({
                    status: false,
                    message: 'port_number is required',
                });
            }

            const db = await getSequelizeForDb(config.portDbName);
            if (!db) {
                return res.status(httpStatus.SERVICE_UNAVAILABLE).json({
                    status: false,
                    message: 'Port registry database unavailable',
                });
            }

            const [results] = await db.sequelize.query(
                'SELECT port_name,port_db,port_number FROM ports WHERE port_number = ? LIMIT 1',
                { replacements: [port_number] }
            );

            if (!results || results.length === 0) {
                return res.status(httpStatus.NOT_FOUND).json({
                    status: false,
                    message: 'Invalid port number',
                });
            }

            return res.status(httpStatus.OK).json({
                status: true,
                message: 'Port resolved successfully',
                data: {
                    port_name: results[0].port_name,
                    port_db: results[0].port_db,
                    port_number: results[0].port_number,
                },
            });
        } catch (err) {
            logger.error('Port resolve error:', err);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                status: false,
                message: 'Port resolution failed',
            });
        }
    };
}

module.exports = PortController;
