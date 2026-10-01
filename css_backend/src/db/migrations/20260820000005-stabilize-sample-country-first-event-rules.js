'use strict';

const table = require('../../helper/dbTable');
const definitions = require('../../config/sampleCountryEventRules');

module.exports = {
    async up(queryInterface) {
        for (const definition of definitions) {
            await queryInterface.bulkUpdate(table('company_event_rule'), {
                rule_config: JSON.stringify(definition.ruleConfig),
                updated_date: new Date(),
            }, {
                event_slug: definition.event.event_slug,
                version_status: 'PUBLISHED',
                is_deleted: false,
            });
        }
    },

    async down() {
        // Intentional no-op: restoring auto-advancing subsequent dates would
        // make normal Company Edit operations mutate existing deadlines.
    },
};
