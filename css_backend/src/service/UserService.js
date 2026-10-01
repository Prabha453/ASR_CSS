const UserDao = require("../dao/UserDao");
const responseHandler = require("../helper/responseHandler");
const httpStatus = require("http-status");
const logger = require("../config/logger");
const bcrypt = require("bcryptjs");
const { userConstant } = require("../config/constant");
const { Op } = require("sequelize");
const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require("../helper/searchHelper");

/*
|==========================================================================
| CONFIG
|==========================================================================
*/
const OMIT_FIELDS = [
    "user_password",
    "password_salt",
    "twofa_secret",
    "zoom_client_secret",
    "zoom_account_password"
];

const SEARCH_FIELDS = [
    "email",
    "first_name",
    "last_name",
    "user_name",
];

const FILTER_FIELDS = [
    "user_id",
    "user_status",
    "user_role",
    "department",
    "designation"
];

class UserService {
    constructor() {
        this.userDao = new UserDao();
    }

    /*
    |==========================================================================
    | HELPER METHODS
    |==========================================================================
    */

    /**
     * Remove sensitive fields from user data
     */
    _cleanUserData(user) {
        const data = user.toJSON ? user.toJSON() : { ...user };
        OMIT_FIELDS.forEach(field => delete data[field]);
        return data;
    }

    /*
    |==========================================================================
    | CREATE USER
    |==========================================================================
    */
    create = async (userBody) => {
        try {
            /*
            |----------------------------------------------------------------------
            | Duplicate Email Check
            |----------------------------------------------------------------------
            */
            const existingEmail = await this.userDao.findOneByWhere({
                email: userBody.email,
                is_deleted: 0,
            });

            if (existingEmail) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Email already exists'
                );
            }

            /*
            |----------------------------------------------------------------------
            | Duplicate Username Check
            |----------------------------------------------------------------------
            */
            const existingUsername = await this.userDao.findOneByWhere({
                user_name: userBody.user_name,
                is_deleted: 0,
            });

            if (existingUsername) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Username already exists'
                );
            }

            /*
            |----------------------------------------------------------------------
            | Prepare Payload
            |----------------------------------------------------------------------
            */
            const payload = {
                user_role: userBody.user_role || 'STAFF',
                user_group_id: userBody.user_group_id || null,
                first_name: userBody.first_name,
                last_name: userBody.last_name,
                department: userBody.department || null,
                designation: userBody.designation || null,
                whatsapp_no: userBody.whatsapp_no || null,
                email: userBody.email,
                phone_number: userBody.phone_number || null,
                user_name: userBody.user_name,
                user_password: bcrypt.hashSync(userBody.user_password, 10),

                zoom_account_email: userBody.zoom_account_email || null,
                zoom_account_password: userBody.zoom_account_password || null,
                zoom_client_id: userBody.zoom_client_id || null,
                zoom_client_secret: userBody.zoom_client_secret || null,

                user_status: userBody.user_status || 'ACTIVE',
                password_session_timeout: userBody.password_session_timeout || 30,
                password_renewal_days: userBody.password_renewal_days || 90,
                twofa_enabled: userBody.twofa_enabled || false,

                join_date: userBody.join_date || null,
                profile_photo_url: userBody.profile_photo_url || null,

                is_deleted: 0,
                created_by: userBody.created_by || null,
                created_date: new Date(),
                updated_date: new Date(),
            };

            /*
            |----------------------------------------------------------------------
            | Create User
            |----------------------------------------------------------------------
            */
            const row = await this.userDao.create(payload);

            /*
            |----------------------------------------------------------------------
            | Clean Response
            |----------------------------------------------------------------------
            */
            const data = this._cleanUserData(row);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'User created successfully',
                data
            );

        } catch (err) {
            logger.error('Create user error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                'Error creating user'
            );
        }
    };

    /*
    |==========================================================================
    | USER LIST
    |==========================================================================
    */
    list = async (query) => {
        try {
            /*
            |----------------------------------------------------------------------
            | Build complete WHERE clause using helper
            |----------------------------------------------------------------------
            */
            const where = buildCompleteWhere({
                query,
                searchFields: SEARCH_FIELDS,
                filterFields: FILTER_FIELDS,
                baseWhere: { is_deleted: 0 },
                dateField: 'created_date',
            });

            /*
            |----------------------------------------------------------------------
            | Get pagination params
            |----------------------------------------------------------------------
            */
            const { page, limit, offset } = getPaginationParams(query, 10);

            /*
            |----------------------------------------------------------------------
            | Build order clause
            |----------------------------------------------------------------------
            */
            const order = buildOrderClause(query.order, [["created_date", "DESC"]]);

            /*
            |----------------------------------------------------------------------
            | Fetch data with pagination
            |----------------------------------------------------------------------
            */
            const result = await this.userDao.findAndCountAll({
                where,
                limit,
                offset,
                order,
                attributes: { exclude: OMIT_FIELDS },
            });

            /*
            |----------------------------------------------------------------------
            | No data found
            |----------------------------------------------------------------------
            */
            if (result.count === 0) {
                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    "No users found",
                    {
                        totalItems: 0,
                        data: [],
                        totalPages: 0,
                        currentPage: page,
                    }
                );
            }

            /*
            |----------------------------------------------------------------------
            | Format pagination data using helper
            |----------------------------------------------------------------------
            */
            const paginationData = responseHandler.getPaginationData(
                result,
                page,
                limit
            );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                "Users fetched successfully",
                paginationData
            );

        } catch (err) {
            logger.error('User list error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                "Failed to fetch users"
            );
        }
    };

    /*
    |==========================================================================
    | GET SINGLE USER
    |==========================================================================
    */
    get = async (user_id) => {
        try {
            const row = await this.userDao.findOneByWhere({
                user_id,
                is_deleted: 0
            });

            if (!row) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    "User not found"
                );
            }

            const data = this._cleanUserData(row);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                "User fetched successfully",
                data
            );

        } catch (err) {
            logger.error('Get user error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                "Error fetching user"
            );
        }
    };

    /*
    |==========================================================================
    | UPDATE USER
    |==========================================================================
    */
    update = async (user_id, userBody) => {
        try {
            /*
            |----------------------------------------------------------------------
            | Check if user exists
            |----------------------------------------------------------------------
            */
            const row = await this.userDao.findOneByWhere({
                user_id,
                is_deleted: 0
            });

            if (!row) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    "User not found"
                );
            }

            /*
            |----------------------------------------------------------------------
            | Email duplicate check
            |----------------------------------------------------------------------
            */
            if (userBody.email && userBody.email !== row.email) {
                const emailExists = await this.userDao.findOneByWhere({
                    email: userBody.email,
                    is_deleted: 0,
                    user_id: { [Op.ne]: user_id }
                });

                if (emailExists) {
                    return responseHandler.returnError(
                        httpStatus.BAD_REQUEST,
                        "Email already taken"
                    );
                }
            }

            /*
            |----------------------------------------------------------------------
            | Username duplicate check
            |----------------------------------------------------------------------
            */
            if (userBody.user_name && userBody.user_name !== row.user_name) {
                const usernameExists = await this.userDao.findOneByWhere({
                    user_name: userBody.user_name,
                    is_deleted: 0,
                    user_id: { [Op.ne]: user_id }
                });

                if (usernameExists) {
                    return responseHandler.returnError(
                        httpStatus.BAD_REQUEST,
                        "Username already taken"
                    );
                }
            }

            /*
            |----------------------------------------------------------------------
            | Prepare update payload
            |----------------------------------------------------------------------
            */
            const payload = { updated_date: new Date() };

            // Map all updatable fields
            const updatableFields = [
                'user_role', 'user_group_id', 'first_name', 'last_name',
                'department', 'designation', 'whatsapp_no', 'email',
                'phone_number', 'user_name', 'zoom_account_email',
                'zoom_account_password', 'zoom_client_id', 'zoom_client_secret',
                'user_status', 'password_session_timeout', 'password_renewal_days',
                'twofa_enabled', 'join_date', 'profile_photo_url', 'updated_by'
            ];

            updatableFields.forEach(field => {
                if (userBody[field] !== undefined) {
                    payload[field] = userBody[field];
                }
            });

            // Hash password if provided
            if (userBody.user_password) {
                payload.user_password = bcrypt.hashSync(userBody.user_password, 10);
            }

            /*
            |----------------------------------------------------------------------
            | Update user
            |----------------------------------------------------------------------
            */
            await this.userDao.updateWhere(payload, { user_id });

            /*
            |----------------------------------------------------------------------
            | Fetch and return updated user
            |----------------------------------------------------------------------
            */
            const updatedRow = await this.userDao.findOneByWhere({ user_id });
            const data = this._cleanUserData(updatedRow);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                "User updated successfully",
                data
            );

        } catch (err) {
            logger.error('Update user error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                "Error updating user"
            );
        }
    };

    /*
    |==========================================================================
    | DELETE USER (Soft Delete)
    |==========================================================================
    */
    delete = async (user_id) => {
        try {
            const row = await this.userDao.findOneByWhere({
                user_id,
                is_deleted: 0
            });

            if (!row) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    "User not found"
                );
            }

            await this.userDao.updateWhere(
                {
                    is_deleted: 1,
                    updated_date: new Date()
                },
                { user_id }
            );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                "User deleted successfully"
            );

        } catch (err) {
            logger.error('Delete user error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                "Error deleting user"
            );
        }
    };

    /*
    |==========================================================================
    | PERMANENT DELETE
    |==========================================================================
    */
    permanentDelete = async (user_id) => {
        try {
            const row = await this.userDao.findOneByWhere({ user_id });

            if (!row) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    "User not found"
                );
            }

            await this.userDao.destroyWhere({ user_id });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                "User permanently deleted"
            );

        } catch (err) {
            logger.error('Permanent delete error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                "Error deleting user"
            );
        }
    };

}

module.exports = UserService;