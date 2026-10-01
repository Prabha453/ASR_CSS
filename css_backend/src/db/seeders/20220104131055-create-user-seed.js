'use strict';

const bcrypt = require('bcryptjs');
const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        return queryInterface.bulkInsert(
            table('users'),
            [
                {
                    user_role: 'SUPER_ADMIN',
                    user_group_id: null,

                    first_name: 'Super',
                    last_name: 'Admin',

                    department: 'Administration',
                    designation: 'System Administrator',

                    whatsapp_no: '9876543210',
                    whatsapp_otp: null,
                    whatsapp_otp_created_at: null,

                    email: 'admin@example.com',
                    email_otp: null,
                    email_otp_created_at: null,

                    user_name: 'superadmin',

                    user_password: bcrypt.hashSync('123456', 10),

                    password_salt: null,

                    zoom_account_email: null,
                    zoom_account_password: null,
                    zoom_client_id: null,
                    zoom_client_secret: null,
                    zoom_access_token: null,
                    zoom_token_expiry: null,

                    user_status: 'ACTIVE',

                    password_session_timeout: 30,
                    psd_timeout_count: 0,
                    password_renewal_days: 90,

                    password_last_changed: new Date(),

                    google_calendar_key: null,

                    twofa_enabled: 0,
                    twofa_secret: null,

                    join_date: new Date(),

                    last_login_date: null,
                    last_login_ip: null,

                    profile_photo_url: null,

                    is_deleted: 0,

                    created_date: new Date(),
                    created_by: null,

                    updated_date: new Date(),
                    updated_by: null,
                },
            ],
            {
                ignoreDuplicates: true,
            }
        );

    },

    down: async (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete(
            table('users'),
            {
                email: 'admin@example.com',
            },
            {}
        );

    },

};