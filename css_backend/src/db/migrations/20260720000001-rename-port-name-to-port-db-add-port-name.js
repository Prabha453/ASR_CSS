'use strict';

/**
 * Renames `ports.port_name` to `ports.port_db` (the actual database name used
 * to resolve a connection) and adds a new `port_name` column for a
 * human-readable label, positioned right after `port_db`.
 */
module.exports = {
    async up(queryInterface) {
        const mainDb = queryInterface.sequelize.config.database;

        await queryInterface.sequelize.query(`
            ALTER TABLE \`asr_css_port\`.\`ports\`
                CHANGE \`port_name\` \`port_db\` VARCHAR(100)
                CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
                COMMENT 'Mongo Database name for this port';
        `);

        await queryInterface.sequelize.query(`
            ALTER TABLE \`asr_css_port\`.\`ports\`
                ADD \`port_name\` VARCHAR(150) NULL AFTER \`port_db\`;
        `);

        await queryInterface.sequelize.query(`USE \`${mainDb}\`;`);
    },

    async down(queryInterface) {
        const mainDb = queryInterface.sequelize.config.database;

        await queryInterface.sequelize.query(`
            ALTER TABLE \`asr_css_port\`.\`ports\`
                DROP COLUMN \`port_name\`;
        `);

        await queryInterface.sequelize.query(`
            ALTER TABLE \`asr_css_port\`.\`ports\`
                CHANGE \`port_db\` \`port_name\` VARCHAR(100)
                CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
                COMMENT 'MySQL database name for this port';
        `);

        await queryInterface.sequelize.query(`USE \`${mainDb}\`;`);
    },
};
