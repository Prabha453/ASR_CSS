'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        const registerFooters = [
            {
                rf_id: 1,
                re_type: 'REGISTER OF MEMBERS',
                re_text: 'PLEASE NOTE: THE ORIGINAL OR COPY OF THIS REGISTER MUST BE KEPT AT THE OFFICE OF THE COMPANY REGISTERED AGENT. IF A COPY THEN PLEASE NOTIFY THE REGISTERED AGENT IN WRITING OF THE PHYSICAL ADDRESS OF THE ORIGINAL.',
            },
            {
                rf_id: 2,
                re_type: 'REGISTER OF DIRECTORS SHAREHOLDINGS',
                re_text: "PLEASE NOTE: THE ORIGINAL OR COPY OF THIS REGISTER MUST BE KEPT AT THE OFFICE OF THE COMPANY\'S REGISTERED AGENT. IF A COPY THEN PLEASE NOTIFY THE REGISTERED AGENT IN WRITING OF THE PHYSICAL ADDRESS OF THE ORIGINAL.",
            },
            {
                rf_id: 3,
                re_type: 'REGISTER OF SHARES ALLOTMENTS',
                re_text: "PLEASE NOTE: THE ORIGINAL OR COPY OF THIS REGISTER MUST BE KEPT AT THE OFFICE OF THE COMPANY\'S REGISTERED AGENT. IF A COPY THEN PLEASE NOTIFY THE REGISTERED AGENT IN WRITING OF THE PHYSICAL ADDRESS OF THE ORIGINAL.",
            },
            {
                rf_id: 4,
                re_type: 'REGISTER OF SHARES TRANSFERS',
                re_text: "PLEASE NOTE: THE ORIGINALS OR COPY OF THIS REGISTER MUST BE KEPT AT THE OFFICE OF THE COMPANY\'S REGISTERED AGENT. IF A COPY THEN PLEASE NOTIFY THE REGISTERED AGENT IN WRITING OF THE PHYSICAL ADDRESS OF THE ORIGINAL.",
            },
        ];

        return queryInterface.bulkInsert(
            table('register_footer'),
            registerFooters.map((item) => ({
                rf_id: item.rf_id,
                re_type: item.re_type,
                re_text: item.re_text,
            })),
            {
                ignoreDuplicates: true,
            }
        );

    },

    down: async (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete(
            table('register_footer'),
            {
                re_type: [
                    'REGISTER OF MEMBERS',
                    'REGISTER OF DIRECTORS SHAREHOLDINGS',
                    'REGISTER OF SHARES ALLOTMENTS',
                    'REGISTER OF SHARES TRANSFERS',
                ],
            },
            {}
        );

    },

};
