'use strict';

const table = require('../src/helper/dbTable');
const catalog = require('../src/config/formBuilder/commonShortcodeCatalog');
const { getSequelizeForDb } = require('../src/models');

const REQUIRED_MIGRATIONS = Array.from({ length: 11 }, (_, index) =>
    `202608240000${String(index + 1).padStart(2, '0')}`
);
const REQUIRED_TABLES = [
    'forms',
    'form_shortcode_definitions', 'form_shortcode_aliases', 'form_template_versions',
    'form_template_version_fields', 'form_generation_runs', 'form_generation_artifacts',
].map(table);

const databaseArg = () => {
    const index = process.argv.indexOf('--db');
    return index >= 0 ? process.argv[index + 1] : null;
};

const scalar = async (sequelize, sql, replacements = {}) => {
    const [rows] = await sequelize.query(sql, { replacements });
    return Number(Object.values(rows[0] || {})[0] || 0);
};

const main = async () => {
    const database = databaseArg();
    if (!database || !/^[a-zA-Z0-9_-]+$/.test(database)) {
        throw new Error('Usage: npm run readiness:forms -- --db <exact-tenant-database-name>');
    }

    const models = await getSequelizeForDb(database);
    if (!models) throw new Error(`Unable to connect to tenant database: ${database}`);
    const { sequelize } = models;
    const checks = [];
    const add = (name, passed, detail) => checks.push({ name, passed, detail });

    try {
        const presentTables = new Set(await sequelize.getQueryInterface().showAllTables());
        const missingTables = REQUIRED_TABLES.filter(name => !presentTables.has(name));
        add('required_tables', missingTables.length === 0,
            missingTables.length ? `Missing: ${missingTables.join(', ')}` : `${REQUIRED_TABLES.length} tables present`);

        let applied = [];
        if ([...presentTables].some(name => String(name).toLowerCase() === 'sequelizemeta')) {
            const [rows] = await sequelize.query('SELECT name FROM SequelizeMeta WHERE name LIKE :prefix', {
                replacements: { prefix: '202608240000%' },
            });
            applied = rows.map(row => String(row.name).replace(/\.js$/, ''));
        }
        const missingMigrations = REQUIRED_MIGRATIONS.filter(prefix => !applied.some(name => name.startsWith(prefix)));
        add('required_migrations', missingMigrations.length === 0,
            missingMigrations.length ? `Not recorded: ${missingMigrations.join(', ')}` : 'Migrations 01-11 recorded');

        if (missingTables.length === 0) {
            const [definitionRows] = await sequelize.query(
                `SELECT shortcode_key, status FROM ${table('form_shortcode_definitions')} WHERE is_deleted = 0`
            );
            const activeKeys = new Set(definitionRows.filter(row => row.status === 'ACTIVE').map(row => row.shortcode_key));
            const missingKeys = catalog.map(item => item.key).filter(key => !activeKeys.has(key));
            add('common_shortcode_catalog', missingKeys.length === 0,
                missingKeys.length ? `Missing/inactive: ${missingKeys.join(', ')}` : `${catalog.length} common keys active`);

            const formCount = await scalar(sequelize, `SELECT COUNT(*) AS count FROM ${table('forms')} WHERE is_deleted = 0`);
            const publishedCount = await scalar(sequelize,
                `SELECT COUNT(*) AS count FROM ${table('form_template_versions')} WHERE lifecycle_status = 'PUBLISHED'`);
            const invalidDraftFields = await scalar(sequelize,
                `SELECT COUNT(*) AS count FROM ${table('form_template_version_fields')} f JOIN ${table('form_template_versions')} v ON v.template_version_id = f.template_version_id WHERE v.lifecycle_status = 'DRAFT' AND f.validation_status IN ('UNKNOWN', 'INVALID_FORMAT')`);
            const orphanArtifacts = await scalar(sequelize,
                `SELECT COUNT(*) AS count FROM ${table('form_generation_artifacts')} a LEFT JOIN ${table('form_generation_runs')} r ON r.generation_run_id = a.generation_run_id WHERE r.generation_run_id IS NULL`);
            add('tenant_form_inventory', true, `${formCount} tenant-local forms; ${publishedCount} published versions`);
            add('draft_shortcode_validation', invalidDraftFields === 0, `${invalidDraftFields} blocking draft field(s)`);
            add('artifact_references', orphanArtifacts === 0, `${orphanArtifacts} orphan artifact row(s)`);
        }

        const result = { database, checked_at: new Date().toISOString(), read_only: true, checks };
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
        if (checks.some(check => !check.passed)) process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
};

main().catch(error => {
    process.stderr.write(`Readiness check failed: ${error.message}\n`);
    process.exitCode = 1;
});
