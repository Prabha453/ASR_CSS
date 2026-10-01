'use strict';

/**
 * Creates the `asr_css_port` database and the `ports` table inside it.
 *
 * Run manually via MySQL or with:
 *   npx sequelize-cli db:migrate --env development
 *
 * NOTE: This migration must be run with a user that has CREATE DATABASE privilege.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        const mainDb = queryInterface.sequelize.config.database;

        // Create the port registry database if it doesn't exist
        await queryInterface.sequelize.query(
            'CREATE DATABASE IF NOT EXISTS `asr_css_port` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'
        );

        // Create the ports table using a fully-qualified name (no USE statement)
        await queryInterface.sequelize.query(`
            CREATE TABLE IF NOT EXISTS \`asr_css_port\`.\`ports\` (
                \`port_id\`      INT          NOT NULL AUTO_INCREMENT,
                \`port_number\`  VARCHAR(50)  NOT NULL UNIQUE COMMENT 'Unique identifier given to each client',
                \`port_name\`    VARCHAR(100) NOT NULL COMMENT 'MySQL database name for this port',
                \`description\`  VARCHAR(255) NULL,
                \`is_active\`    TINYINT(1)   NOT NULL DEFAULT 1,
                \`created_at\`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`port_id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Seed the existing asr_css database as port 1001
        await queryInterface.sequelize.query(`
            INSERT IGNORE INTO \`asr_css_port\`.\`ports\`
                (\`port_number\`, \`port_name\`, \`description\`)
            VALUES
                ('1001', 'asr_css', 'Default ASR CSS port');
        `);

        // Switch back so subsequent Sequelize operations (sequelizemeta) work correctly
        await queryInterface.sequelize.query(`USE \`${mainDb}\`;`);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.query('DROP TABLE IF EXISTS `asr_css_port`.`ports`;');
    },
};
