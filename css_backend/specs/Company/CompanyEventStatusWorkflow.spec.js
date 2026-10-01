'use strict';

const { expect } = require('chai');
const {
    EVENT_STATUS,
    OPEN_EVENT_STATUSES,
    ALLOWED_STATUS_TRANSITIONS,
} = require('../../src/config/companyEventStatus');

describe('Company event status workflow', () => {
    it('supports the filing lifecycle through final completion', () => {
        expect(ALLOWED_STATUS_TRANSITIONS[EVENT_STATUS.READY_TO_FILE])
            .to.include(EVENT_STATUS.FILED);
        expect(ALLOWED_STATUS_TRANSITIONS[EVENT_STATUS.FILED])
            .to.deep.equal([EVENT_STATUS.COMPLETED]);
    });

    it('removes filed and completed events from reminder processing', () => {
        expect(OPEN_EVENT_STATUSES).not.to.include(EVENT_STATUS.FILED);
        expect(OPEN_EVENT_STATUSES).not.to.include(EVENT_STATUS.COMPLETED);
    });
});
