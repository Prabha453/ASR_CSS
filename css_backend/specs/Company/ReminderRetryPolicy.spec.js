'use strict';

const { expect } = require('chai');
const CommonCronService = require('../../src/service/company/CommonCronService');

describe('Compliance reminder retry policy', () => {
    const service = new CommonCronService();

    it('does not resend successful or explicitly skipped reminders', () => {
        expect(service._shouldSkipExistingReminderLog({ status: 'SENT' })).to.equal(true);
        expect(service._shouldSkipExistingReminderLog({ status: 'SKIPPED' })).to.equal(true);
    });

    it('allows pending and failed reminder attempts to retry', () => {
        expect(service._shouldSkipExistingReminderLog({ status: 'PENDING' })).to.equal(false);
        expect(service._shouldSkipExistingReminderLog({ status: 'FAILED' })).to.equal(false);
    });

    it('allows an authorized force run to process an existing successful log', () => {
        expect(service._shouldSkipExistingReminderLog({ status: 'SENT' }, true)).to.equal(false);
    });
});
