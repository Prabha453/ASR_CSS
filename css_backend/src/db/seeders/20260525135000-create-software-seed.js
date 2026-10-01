'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        const softwares = [
            'Microsoft Office',
            'Google Workspace',
            'Tally Prime',
            'QuickBooks',
            'Xero',
            'SAP',
            'Oracle NetSuite',
            'Salesforce',
            'Jira',
            'Slack',
        ];

        return queryInterface.bulkInsert(
            table('softwares'),
            softwares.map((softwareName, index) => ({
                software_id: index + 1,
                software_name: softwareName,
                is_deleted: 0,
                updated_date: '2026-05-25 13:50:00',
                updated_by: 1,
            })),
            {
                ignoreDuplicates: true,
            }
        );

    },

    down: async (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete(
            table('softwares'),
            {
                software_name: [
                    'Microsoft Office',
                    'Google Workspace',
                    'Tally Prime',
                    'QuickBooks',
                    'Xero',
                    'SAP',
                    'Oracle NetSuite',
                    'Salesforce',
                    'Jira',
                    'Slack',
                ],
            },
            {}
        );

    },

};
