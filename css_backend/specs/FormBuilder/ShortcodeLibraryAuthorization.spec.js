'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const requireUserRole = require('../../src/middlewares/requireUserRole');

describe('Shortcode Library authorization', () => {
    const guard = requireUserRole('SUPER_ADMIN', 'ADMIN');

    it('allows existing administrator roles', () => {
        for (const user_role of ['SUPER_ADMIN', 'ADMIN']) {
            const next = sinon.spy();
            guard({ user: { user_role } }, {}, next);
            expect(next.calledOnceWithExactly()).to.equal(true);
        }
    });

    it('rejects non-administrator roles', () => {
        const next = sinon.spy();
        guard({ user: { user_role: 'STAFF' } }, {}, next);
        expect(next.firstCall.args[0]).to.include({ statusCode: 403 });
    });

    it('rejects missing authenticated context', () => {
        const next = sinon.spy();
        guard({}, {}, next);
        expect(next.firstCall.args[0]).to.include({ statusCode: 401 });
    });
});
