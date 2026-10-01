'use strict';

const { expect } = require('chai');
const { Op } = require('sequelize');
const FormService = require('../../src/service/formBuilder/FormService');

describe('Form list counts', () => {
    it('counts all matching forms with the same filters as the paginated list', async () => {
        const service = new FormService();
        let pageOptions;
        const countOptions = [];
        const countByField = { form_type: { 0: 0, 1: 5 }, pdpa_required: { true: 2 } };
        service.formDao = {
            findAndCountAll: async options => {
                pageOptions = options;
                return {
                    count: 5,
                    rows: [{ form_id: 3, form_type: 1, category_id: '', assigned_user_id: '' }],
                };
            },
            Model: {
                count: async options => {
                    countOptions.push(options);
                    const condition = options.where[Op.and][1];
                    const [field, value] = Object.entries(condition)[0];
                    return countByField[field][String(value)];
                },
            },
        };

        const result = await service.list({ page: '2', limit: '1', search: 'sample', form_type: '1' });

        expect(result.statusCode).to.equal(200);
        expect(result.response.data.totalItems).to.equal(5);
        expect(result.response.data.data).to.have.length(1);
        expect(result.response.data.counts).to.deep.equal({ formBuilder: 0, esign: 5, pdpa: 2 });
        expect(pageOptions).to.include({ limit: 1, offset: 1 });
        expect(pageOptions.where).to.include({ form_type: '1', is_deleted: false });
        expect(pageOptions.where[Op.or]).to.have.length(3);
        expect(countOptions).to.have.length(3);
        for (const options of countOptions) {
            expect(options.where[Op.and][0]).to.equal(pageOptions.where);
            expect(options).not.to.have.property('limit');
            expect(options).not.to.have.property('offset');
        }
    });
});
