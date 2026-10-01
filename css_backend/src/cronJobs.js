const cron = require('node-cron');

const config = require('./config/config');
const logger = require('./config/logger');
const { getSequelizeForDb } = require('./models');
const dbContext = require('./storage/dbContext');
const CommonCronService = require('./service/company/CommonCronService');

const schedule = process.env.COMPLIANCE_CRON_SCHEDULE || '5 0 * * *';
const timezone = process.env.COMPLIANCE_CRON_TIMEZONE || 'Asia/Singapore';
const enabled = String(process.env.COMPLIANCE_CRON_ENABLED || 'true').toLowerCase() !== 'false';

let running = false;

const dateInTimezone = (timeZone) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
};

const activeClientDatabases = async () => {
    const registry = await getSequelizeForDb(config.portDbName);
    if (!registry) throw new Error('Port registry database is unavailable');

    const [rows] = await registry.sequelize.query(
        'SELECT port_db FROM ports WHERE is_active = 1 AND port_db IS NOT NULL AND port_db <> \'\''
    );

    const names = [...new Set((rows || []).map(row => String(row.port_db || '').trim()).filter(Boolean))];
    return names.length ? names : [config.dbName];
};

const runForDatabase = async (dbName) => {
    const models = await getSequelizeForDb(dbName);
    if (!models) throw new Error(`Client database "${dbName}" is unavailable`);

    return dbContext.run({ models }, async () => {
        const service = new CommonCronService();
        const response = await service.sendDueReminders({ date: dateInTimezone(timezone), dry_run: false }, null, null);
        if (!response?.response?.status) {
            throw new Error(response?.response?.message || 'Reminder cron failed');
        }
        return response.response.data || {};
    });
};

const runComplianceReminderCron = async () => {
    if (running) {
        logger.warn('Compliance reminder cron skipped because the previous run is still active');
        return { skipped: true, reason: 'Previous run is still active' };
    }

    running = true;
    const startedAt = new Date();
    const totals = { databases: 0, checked: 0, sent: 0, skipped: 0, failed: 0, invalid: 0 };
    const failures = [];

    try {
        const databases = await activeClientDatabases();
        totals.databases = databases.length;
        logger.info('Automatic compliance reminder cron started', { databases: databases.length, timezone });

        for (const dbName of databases) {
            try {
                const result = await runForDatabase(dbName);
                ['checked', 'sent', 'skipped', 'failed', 'invalid'].forEach((key) => {
                    totals[key] += Number(result[key] || 0);
                });
                logger.info('Automatic compliance reminder cron database completed', {
                    database: dbName,
                    checked: result.checked || 0,
                    sent: result.sent || 0,
                    skipped: result.skipped || 0,
                    failed: result.failed || 0,
                    invalid: result.invalid || 0,
                });
            } catch (error) {
                failures.push({ database: dbName, error: error.message });
                logger.error('Automatic compliance reminder cron database failed', {
                    database: dbName,
                    error: error.message,
                    stack: error.stack,
                });
            }
        }

        logger.info('Automatic compliance reminder cron finished', {
            ...totals,
            database_failures: failures,
            duration_ms: Date.now() - startedAt.getTime(),
        });
        return { ...totals, failures };
    } catch (error) {
        logger.error('Automatic compliance reminder cron failed', { error: error.message, stack: error.stack });
        return { ...totals, failures: [...failures, { database: null, error: error.message }] };
    } finally {
        running = false;
    }
};

let scheduledTask = null;
if (enabled) {
    if (!cron.validate(schedule)) {
        logger.error('Compliance reminder cron not scheduled because COMPLIANCE_CRON_SCHEDULE is invalid', { schedule });
    } else {
        scheduledTask = cron.schedule(schedule, runComplianceReminderCron, { timezone });
        logger.info('Compliance reminder cron scheduled', { schedule, timezone });
    }
} else {
    logger.info('Compliance reminder cron is disabled');
}

module.exports = { runComplianceReminderCron, runForDatabase, activeClientDatabases, dateInTimezone, scheduledTask };
