const httpStatus = require('http-status');
const AuthService = require('../service/AuthService');
const TokenService = require('../service/TokenService');
const UserService = require('../service/UserService');
const logger = require('../config/logger');
const { tokenTypes } = require('../config/tokens');
const logHelper = require('../helper/LogHelper');
const { MODULES, ACTIONS, STATUS } = require('../helper/LogHelper');

class AuthController {
    constructor() {
        this.userService = new UserService();
        this.tokenService = new TokenService();
        this.authService = new AuthService();
    }

    login = async (req, res) => {
        try {
            const { email, password } = req.body;
            const portNumber = req.body?.port_number
                        ?? req.portNumber
                        ?? null;

            const user = await this.authService.loginWithEmailPassword(
                email.toLowerCase(),
                password,
                portNumber,
                req,
            );

            const { message } = user.response;
            const { data }    = user.response;
            const { status }  = user.response;
            const code        = user.statusCode;
            let tokens = {};

            if (user.response.status) {
                tokens = await this.tokenService.generateAuthTokens(data);

                // ── login_history: SUCCESS with session_id ────────────────
                logHelper.writeLoginHistory(req, {
                    user_id:      data.user_id,
                    login_status: 'SUCCESS',
                    session_id:   tokens?.access?.token ?? null,
                }).catch(() => {});

                // ── audit_log: successful login ───────────────────────────
                logHelper.auditLog(req, {
                    module:     MODULES.AUTH,
                    action:     ACTIONS.LOGIN,
                    user_id:    data.user_id,
                    new_values: { email: data.email, user_name: data.user_name },
                });
            } else {
                // ── audit_log: failed login (login_history written in AuthService) ──
                logHelper.auditLog(req, {
                    module:        MODULES.AUTH,
                    action:        ACTIONS.LOGIN,
                    status:        STATUS.FAILED,
                    error_message: message,
                    new_values:    { attempted_email: email },
                });
            }

            res.status(user.statusCode).send({ status, code, message, data, tokens });
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    logout = async (req, res) => {
        try {
            const responseData = await this.authService.logout(req, res);

            if (responseData.response.status) {
                const accessToken = req.body.access_token ?? null;
                const userId      = req.user?.user_id ?? null;

                // ── login_history: stamp logout_at on the open SUCCESS row ─
                // Match by user_id (always available); session_id is extra precision
                if (userId) {
                    logHelper.markLogout(userId, accessToken).catch(() => {});
                }

                // ── audit_log: logout event ───────────────────────────────
                logHelper.auditLog(req, {
                    module: MODULES.AUTH,
                    action: ACTIONS.LOGOUT,
                });
            }

            res.status(httpStatus.OK).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    refreshTokens = async (req, res) => {
        try {
            const refreshTokenDoc = await this.tokenService.verifyToken(
                req.body.refresh_token,
                tokenTypes.REFRESH,
            );
            const user = await this.userService.getUser(refreshTokenDoc.user_id);
            if (user == null) {
                res.status(httpStatus.BAD_GATEWAY).send('User Not Found!');
                return;
            }
            await this.tokenService.removeTokenById(refreshTokenDoc.id);
            const tokens = await this.tokenService.generateAuthTokens(user);

            // ── Audit: token refreshed ────────────────────────────────────
            logHelper.auditLog(req, {
                module:  MODULES.AUTH,
                action:  ACTIONS.REFRESH_TOKEN,
                user_id: refreshTokenDoc.user_id,
            });

            res.status(httpStatus.OK).send(tokens);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    changePassword = async (req, res) => {
        try {
            const targetUserId = Number(req.params.user_id);
            const responseData = await this.authService.changePassword(
                targetUserId,
                req.body.old_password,
                req.body.password,
            );

            if (responseData.response.status) {
                // ── Audit: password changed successfully ──────────────────
                logHelper.auditLog(req, {
                    module:  MODULES.AUTH,
                    action:  ACTIONS.CHANGE_PASSWORD,
                    user_id: targetUserId,
                });
            } else {
                // ── Audit: password change failed ─────────────────────────
                logHelper.auditLog(req, {
                    module:        MODULES.AUTH,
                    action:        ACTIONS.CHANGE_PASSWORD,
                    user_id:       targetUserId,
                    status:        STATUS.FAILED,
                    error_message: responseData.response.message,
                });
            }

            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };
    
}

module.exports = AuthController;
