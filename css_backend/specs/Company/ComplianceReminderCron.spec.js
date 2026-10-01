'use strict';

const { expect } = require('chai');
const dbContext = require('../../src/storage/dbContext');
const CommonCronService = require('../../src/service/company/CommonCronService');

const targetDate = '2026-08-21';

const fakeModels = () => ({
    company_event: {
        findAll: async () => [{
            company_event_id: 101,
            entity_id: 10,
            event_id: 4,
            event_slug: 'agm',
            status: 'PENDING',
            due_date: targetDate,
            extended_due_date: null,
            receiving_parties: [{ email: 'client@example.com', channel: 'TO', name: 'Sample Client' }],
            entity: { entity_id: 10, name: 'Sample Company', company_type_id: 1, addresses: [] },
            event: { e_id: 4, event_name: 'AGM', event_slug: 'agm' },
        }],
    },
    reminder: {
        findAll: async () => [{
            reminder_id: 201,
            event_id: 4,
            category: 'EVENT',
            status: 'ACTIVE',
            is_deleted: false,
            offset_days: 0,
            timing_type: 'BEFORE',
            is_recurring: false,
            subject: 'AGM reminder',
            message: 'AGM is due.',
        }],
    },
    company_event_reminder_log: {},
});

const configuredService = (sendResult) => {
    const service = new CommonCronService();
    const transitions = [];
    const logRow = {
        async update(payload) {
            transitions.push(payload.status);
            Object.assign(this, payload);
            return this;
        },
    };

    service._findReminderLog = async () => null;
    service._getReminderMailAttachments = async () => ({ attachments: [], missing: [] });
    service._resolveEventEmailConfig = async () => ({
        email_config_id: 1,
        sender_email: 'sender@example.com',
        from: 'ASR <sender@example.com>',
    });
    service.reminderLogDao.create = async (payload) => {
        transitions.push(payload.status);
        Object.assign(logRow, payload);
        return logRow;
    };
    service.emailHelper.sendEmailResult = async () => sendResult;

    return { service, transitions, logRow };
};

describe('Automatic compliance reminder delivery logging', () => {
    it('updates one log row from PENDING to SENT with recipient delivery details', async () => {
        await dbContext.run({ models: fakeModels() }, async () => {
            const { service, transitions, logRow } = configuredService({
                success: true,
                accepted: ['client@example.com'],
                rejected: [],
                messageId: 'message-123',
                response: '250 accepted',
            });

            const result = await service.sendDueReminders({ date: targetDate, dry_run: false });

            expect(result.response.status).to.equal(true);
            expect(result.response.data.sent).to.equal(1);
            expect(transitions).to.deep.equal(['PENDING', 'SENT']);
            expect(logRow.status).to.equal('SENT');
            expect(logRow.delivery_summary.accepted_recipients).to.deep.equal(['client@example.com']);
            expect(logRow.delivery_summary.message_id).to.equal('message-123');
        });
    });

    it('updates the same PENDING log row to FAILED and keeps the SMTP reason', async () => {
        await dbContext.run({ models: fakeModels() }, async () => {
            const { service, transitions, logRow } = configuredService({
                success: false,
                accepted: [],
                rejected: ['client@example.com'],
                response: '550 rejected',
                error: 'Mailbox unavailable',
            });

            const result = await service.sendDueReminders({ date: targetDate, dry_run: false });

            expect(result.response.data.failed).to.equal(1);
            expect(transitions).to.deep.equal(['PENDING', 'FAILED']);
            expect(logRow.status).to.equal('FAILED');
            expect(logRow.error_message).to.equal('Mailbox unavailable');
            expect(logRow.delivery_summary.rejected_recipients).to.deep.equal(['client@example.com']);
        });
    });
});
