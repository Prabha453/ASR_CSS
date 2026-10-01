'use strict';

const table = require('../../helper/dbTable');

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn(table('form_generation_artifacts'), 'artifact_type', {
            type: Sequelize.ENUM('HTML', 'PDF', 'DOCX'), allowNull: false,
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn(table('form_generation_artifacts'), 'artifact_type', {
            type: Sequelize.ENUM('HTML', 'PDF'), allowNull: false,
        });
    },
};
