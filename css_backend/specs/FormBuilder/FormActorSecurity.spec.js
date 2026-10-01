'use strict';

const { expect } = require('chai');
const sinon = require('sinon');

const FormController = require('../../src/controllers/formBuilder/FormController');
const FormService = require('../../src/service/formBuilder/FormService');

describe('Form Builder actor security', () => {
    afterEach(() => sinon.restore());

    it('resolves the actor only from the authenticated user', () => {
        const controller = new FormController();

        expect(controller._userId({
            user: { user_id: 42 },
            body: { user_id: 9001, id: 9002 },
        })).to.equal(42);
        expect(controller._userId({
            user: { id: 43 },
            body: { user_id: 9001 },
        })).to.equal(43);
    });

    it('does not accept an actor from an unauthenticated request body', () => {
        const controller = new FormController();

        expect(controller._userId({
            body: { user_id: 9001, id: 9002 },
        })).to.equal(null);
    });

    it('ignores spoofed audit fields when creating a form', async () => {
        const service = new FormService();
        const createdRow = { form_id: 10 };
        let createdData;

        sinon.stub(service.formDao, 'create').callsFake(async (data) => {
            createdData = data;
            return createdRow;
        });
        sinon.stub(service.formDao, 'findOneByWhere').resolves(null);
        sinon.stub(service.formDao, 'updateWhere').resolves([1]);

        await service.save(null, {
            form_name: 'Secure form',
            category_id: [1],
            created_by: 9001,
            updated_by: 9002,
        }, [], 42);

        expect(createdData.created_by).to.equal(42);
        expect(createdData.updated_by).to.equal(42);
    });
});
