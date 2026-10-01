'use strict';

const table = require('../../helper/dbTable');

const TABLE_NAME = table('company_event_rule');

module.exports = {

    async up(queryInterface) {
        await queryInterface.sequelize.query(
            `UPDATE \`${TABLE_NAME}\`
             SET \`rule_code\` = \`rule_id\`,
                 \`version_no\` = 1,
                 \`version_status\` = 'PUBLISHED',
                 \`effective_from\` = COALESCE(DATE(\`created_date\`), '1970-01-01'),
                 \`published_by\` = \`created_by\`,
                 \`published_date\` = COALESCE(\`created_date\`, NOW())
             WHERE \`is_active\` = 1 AND \`is_deleted\` = 0`
        );

        await queryInterface.sequelize.query(
            `UPDATE \`${TABLE_NAME}\`
             SET \`rule_code\` = \`rule_id\`,
                 \`version_no\` = 1,
                 \`version_status\` = 'RETIRED',
                 \`retired_date\` = COALESCE(\`updated_date\`, NOW())
             WHERE \`is_active\` = 0 OR \`is_deleted\` = 1`
        );
    },

    async down() {
        // Data-only cutover migration — intentionally not reversed.
    },

};
