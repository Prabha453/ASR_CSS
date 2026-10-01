const httpStatus    = require('http-status');
const logger        = require('../config/logger');
const AuditLogDao   = require('../dao/AuditLogDao');
const responseHandler = require('../helper/responseHandler');
const DashboardService = require('../service/DashboardService');

class DashboardController {

    constructor() {
        this.auditLogDao = new AuditLogDao();
        this.dashboardService = new DashboardService();
    }

    _send = async (res, callback) => {
        try {
            const responseData = await callback();
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // GET /dashboard/recent-activity?limit=25
    getRecentActivity = async (req, res) => {
        try {
            const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
            const logs  = await this.auditLogDao.getRecent(limit);

            res.status(httpStatus.OK).send(
                responseHandler.returnSuccess(httpStatus.OK, 'Recent activity fetched', logs).response
            );
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // GET /dashboard/portfolio-overview
    getPortfolioOverview = async (req, res) =>
        this._send(res, () => this.dashboardService.getPortfolioOverview(req.query));

}

module.exports = DashboardController;
