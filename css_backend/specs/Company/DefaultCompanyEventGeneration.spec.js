'use strict';

const { expect } = require('chai');
const sinon = require('sinon');

const dbContext = require('../../src/storage/dbContext');
const EntityCompanyService = require('../../src/service/company/EntityCompanyService');

describe('EntityCompanyService default event generation', () => {
    let service;
    let transaction;

    beforeEach(() => {
        service = new EntityCompanyService();
        transaction = { id: 'company-add-transaction' };
    });

    afterEach(() => sinon.restore());

    const runWithBusinessEntities = (names, callback) => dbContext.run({
        models: {
            business_entity: {
                findAll: sinon.stub().resolves(names.map((bsName, index) => ({
                    bn_id: index + 1,
                    bs_name: bsName,
                }))),
            },
            entity_company_details: {
                update: sinon.stub().resolves([1]),
            },
        },
    }, callback);

    it('generates initial events for a Corporate Shareholder Client and derives the legacy first FYE', async () => {
        const syncStub = sinon.stub(service, '_syncCompanyEvents').resolves([{ event_slug: 'agm' }]);

        const result = await runWithBusinessEntities(['Corporate Shareholder Client'], () =>
            service._generateInitialCompanyEvents(
                42,
                { company_type_id: 15, created_by: 7 },
                { bn_ids: '1', company_incorporation_date: '2026-01-15' },
                transaction
            ));

        expect(result).to.deep.equal([{ event_slug: 'agm' }]);
        expect(syncStub.calledOnce).to.equal(true);
        const [entityId, entityData, detail, forwardedTransaction] = syncStub.firstCall.args;
        expect(entityId).to.equal(42);
        expect(entityData.company_type_id).to.equal(15);
        expect(detail.company_fin_date).to.equal('2027-01-14');
        expect(forwardedTransaction).to.equal(transaction);
    });

    it('persists the derived first FYE in the company detail row', async () => {
        const models = {
            entity_company_details: { update: sinon.stub().resolves([1]) },
        };

        const detail = await service._ensureFirstFinancialYearEnd(
            models,
            42,
            { company_incorporation_date: '2026-01-15', company_fin_date: null },
            7,
            transaction
        );

        expect(detail.company_fin_date).to.equal('2027-01-14');
        expect(models.entity_company_details.update.calledOnce).to.equal(true);
        const [values, options] = models.entity_company_details.update.firstCall.args;
        expect(values.company_fin_date).to.equal('2027-01-14');
        expect(values.updated_by).to.equal(7);
        expect(options.where).to.deep.equal({ entity_id: 42, is_deleted: false });
        expect(options.transaction).to.equal(transaction);
    });

    it('preserves an explicitly supplied FYE', async () => {
        const syncStub = sinon.stub(service, '_syncCompanyEvents').resolves([]);

        await runWithBusinessEntities(['corporate shareholder client'], () =>
            service._generateInitialCompanyEvents(
                42,
                { company_type_id: 15 },
                {
                    bn_ids: '1',
                    company_incorporation_date: '2026-01-15',
                    company_fin_date: '2026-12-31',
                },
                transaction
            ));

        expect(syncStub.firstCall.args[2].company_fin_date).to.equal('2026-12-31');
    });

    it('starts event synchronization for a taxation-only client', async () => {
        const syncStub = sinon.stub(service, '_syncCompanyEvents').resolves([]);

        const result = await runWithBusinessEntities(['Taxation Client'], () =>
            service._generateInitialCompanyEvents(
                42,
                { company_type_id: 15 },
                { bn_ids: '1', company_incorporation_date: '2026-01-15' },
                transaction
            ));

        expect(result).to.deep.equal([]);
        expect(syncStub.calledOnce).to.equal(true);
    });

    it('does not generate events when neither managed service is selected', async () => {
        const syncStub = sinon.stub(service, '_syncCompanyEvents').resolves([]);

        const result = await runWithBusinessEntities(['Accounting Client'], () =>
            service._generateInitialCompanyEvents(
                42,
                { company_type_id: 15 },
                { bn_ids: '1', company_incorporation_date: '2026-01-15' },
                transaction
            ));

        expect(result).to.deep.equal([]);
        expect(syncStub.called).to.equal(false);
    });

    it('recalculates open system events after an FYE change', () => {
        ['PENDING', 'IN_PREPARATION', 'AWAITING_APPROVAL'].forEach(status =>
            expect(service._canRecalculateSystemEvent({
                source_from: 'AUTO_RULE', status,
            }), status).to.equal(true));
    });

    it('preserves closed, manual, and imported events when company dates change', () => {
        ['FILED', 'COMPLETED', 'WAIVED', 'DISPENSE', 'EXEMPT', 'CANCELLED', 'NOT_APPLICABLE']
            .forEach(status => expect(service._canRecalculateSystemEvent({
                source_from: 'AUTO_RULE', status,
            }), status).to.equal(false));

        expect(service._canRecalculateSystemEvent({
            source_from: 'MANUAL', status: 'PENDING',
        })).to.equal(false);
        expect(service._canRecalculateSystemEvent({
            source_from: 'IMPORT', status: 'PENDING',
        })).to.equal(false);
    });

    it('exposes valid workflow actions on company-list event rows', () => {
        expect(service._allowedEventStatusTransitions({ status: 'PENDING' }))
            .to.include('IN_PREPARATION');
        expect(service._allowedEventStatusTransitions({ status: 'FILED' }))
            .to.deep.equal(['COMPLETED']);
        expect(service._allowedEventStatusTransitions({ status: 'COMPLETED' }))
            .to.deep.equal([]);
    });

    it('uses a locked default even when no editable rule model is available', async () => {
        const result = await service._getMatchingEventRule({}, 'agm', 2, {
            countryId: 192,
            country: 'Singapore',
            companyTypeId: 15,
            businessEntityNames: ['corporate shareholder client'],
        });

        expect(result.selected.system_default_key).to.equal('SG_DEFAULT_AGM');
        expect(result.selected_reason).to.equal('Locked system default: SG_DEFAULT_AGM');
    });
});
