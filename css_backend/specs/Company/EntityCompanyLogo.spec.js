'use strict';

const chai       = require('chai');
const { expect }  = chai;
const sinon       = require('sinon');
const httpStatus  = require('http-status');

const dbContext = require('../../src/storage/dbContext');

// ─────────────────────────────────────────────────────────────────────────────
// Stub helper methods afresh for every test so suite load order cannot leak state.
// ─────────────────────────────────────────────────────────────────────────────
const documentHelper     = require('../../src/helper/documentHelper');
let uploadDocumentStub;
let removeDocumentStub;

const EntityCompanyService = require('../../src/service/company/EntityCompanyService');
const DocumentStoreDao     = require('../../src/dao/DocumentStoreDao');

describe('EntityCompanyService — corporate logo upload', () => {
    let service;
    let fakeModels;

    const buildLogoFile = (overrides = {}) => ({
        fieldname:    'company_logo',
        originalname: 'logo.png',
        mimetype:     'image/png',
        size:         1024,
        buffer:       Buffer.from('fake-image-bytes'),
        ...overrides,
    });

    beforeEach(() => {
        service = new EntityCompanyService();

        uploadDocumentStub = sinon.stub(documentHelper, 'uploadDocument');
        removeDocumentStub = sinon.stub(documentHelper, 'removeDocument');

        fakeModels = {
            entity_company_details: { update: sinon.stub().resolves([1]) },
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    // ── _uploadAndPatchDocuments: the code path that actually writes the file ──

    describe('_uploadAndPatchDocuments', () => {

        it('uploads a valid PNG logo, tagging it with the corporate-registration fields and linking it to the entity', async () => {
            uploadDocumentStub.resolves({
                doc_id:    501,
                file_path: 'http://localhost:5000/uploads/demo_port/company_logo/logo_123.png',
            });

            await dbContext.run({ models: fakeModels }, async () => {
                const result = await service._uploadAndPatchDocuments({
                    files:    [buildLogoFile()],
                    entityId: 42,
                    userId:   7,
                    portId:   1,
                    portName: 'demo_port',
                    req:      null,
                });

                expect(result.logo_error).to.equal(null);
                expect(result.logo.url).to.equal('http://localhost:5000/uploads/demo_port/company_logo/logo_123.png');

                expect(uploadDocumentStub.calledOnce).to.equal(true);
                const callArgs = uploadDocumentStub.firstCall.args[0];
                expect(callArgs.entity_id).to.equal(42);
                expect(callArgs.module_record_id).to.equal(42);
                expect(callArgs.entity_type).to.equal('company');
                expect(callArgs.module_name).to.equal('corporate_registration');
                expect(callArgs.sub_module_name).to.equal('corporate_log');
                expect(callArgs.doc_category).to.equal('corporate_log');
                expect(callArgs.sub_folder).to.equal('company_logo');
                expect(callArgs.replace_existing).to.equal(true);
                expect(callArgs.delete_old_file).to.equal(true);
                expect(callArgs.existing_where).to.deep.include({
                    entity_id:        42,
                    module_record_id: 42,
                    entity_type:      'company',
                    module_name:      'corporate_registration',
                    sub_module_name:  'corporate_log',
                });

                expect(fakeModels.entity_company_details.update.calledOnce).to.equal(true);
                const [updateFields, updateOptions] = fakeModels.entity_company_details.update.firstCall.args;
                expect(updateFields.logo_url).to.equal('http://localhost:5000/uploads/demo_port/company_logo/logo_123.png');
                expect(updateFields.logo_name).to.equal('logo.png');
                expect(updateOptions.where.entity_id).to.equal(42);
            });
        });

        it('rejects a non-image file (e.g. a PDF) without touching disk or the database', async () => {
            await dbContext.run({ models: fakeModels }, async () => {
                const result = await service._uploadAndPatchDocuments({
                    files:    [buildLogoFile({ mimetype: 'application/pdf', originalname: 'doc.pdf' })],
                    entityId: 42, userId: 7, portId: 1, portName: 'demo_port', req: null,
                });

                expect(result.logo_error).to.match(/Invalid company logo type/);
                expect(uploadDocumentStub.called).to.equal(false);
                expect(fakeModels.entity_company_details.update.called).to.equal(false);
            });
        });

        it('accepts JPG and WEBP logos', async () => {
            uploadDocumentStub.resolves({ doc_id: 1, file_path: 'http://x/y.jpg' });

            await dbContext.run({ models: fakeModels }, async () => {
                for (const mimetype of ['image/jpeg', 'image/webp']) {
                    uploadDocumentStub.resetHistory();
                    fakeModels.entity_company_details.update.resetHistory();

                    const result = await service._uploadAndPatchDocuments({
                        files:    [buildLogoFile({ mimetype })],
                        entityId: 42, userId: 7, portId: 1, portName: 'demo_port', req: null,
                    });

                    expect(result.logo_error, `expected ${mimetype} to be accepted`).to.equal(null);
                    expect(uploadDocumentStub.calledOnce).to.equal(true);
                }
            });
        });

        it('rejects a logo larger than the 5MB limit', async () => {
            await dbContext.run({ models: fakeModels }, async () => {
                const result = await service._uploadAndPatchDocuments({
                    files:    [buildLogoFile({ size: 6 * 1024 * 1024 })],
                    entityId: 42, userId: 7, portId: 1, portName: 'demo_port', req: null,
                });

                expect(result.logo_error).to.match(/exceeds the 5MB size limit/);
                expect(uploadDocumentStub.called).to.equal(false);
            });
        });

        it('removes the existing logo when remove_company_logo is set and no new file is sent', async () => {
            sinon.stub(DocumentStoreDao.prototype, 'findOneByWhere').resolves({ doc_id: 999 });
            removeDocumentStub.resolves(true);

            await dbContext.run({ models: fakeModels }, async () => {
                const result = await service._uploadAndPatchDocuments({
                    files:    [],
                    entityId: 42, userId: 7, portId: 1, portName: 'demo_port', req: null,
                    body:     { remove_company_logo: '1' },
                });

                expect(result.logo_error).to.equal(null);
                expect(removeDocumentStub.calledOnce).to.equal(true);
                expect(removeDocumentStub.firstCall.args[0].doc_id).to.equal(999);

                expect(fakeModels.entity_company_details.update.calledOnce).to.equal(true);
                const [updateFields] = fakeModels.entity_company_details.update.firstCall.args;
                expect(updateFields.logo_url).to.equal(null);
                expect(updateFields.logo_name).to.equal(null);
            });
        });

        it('captures an upload failure (e.g. a disk error) as logo_error instead of throwing', async () => {
            uploadDocumentStub.rejects(new Error('ENOSPC: no space left on device'));

            await dbContext.run({ models: fakeModels }, async () => {
                const result = await service._uploadAndPatchDocuments({
                    files:    [buildLogoFile()],
                    entityId: 42, userId: 7, portId: 1, portName: 'demo_port', req: null,
                });

                expect(result.logo_error).to.equal('ENOSPC: no space left on device');
                expect(fakeModels.entity_company_details.update.called).to.equal(false);
            });
        });

        it('does nothing when no logo file and no remove flag are present', async () => {
            await dbContext.run({ models: fakeModels }, async () => {
                const result = await service._uploadAndPatchDocuments({
                    files: [], entityId: 42, userId: 7, portId: 1, portName: 'demo_port', req: null,
                });

                expect(result.logo).to.equal(null);
                expect(result.logo_error).to.equal(null);
                expect(uploadDocumentStub.called).to.equal(false);
                expect(removeDocumentStub.called).to.equal(false);
                expect(fakeModels.entity_company_details.update.called).to.equal(false);
            });
        });
    });

    // ── create()/update(): the logo must be validated before any DB write ──

    describe('create() / update() — fail fast on an invalid logo', () => {

        it('create() returns 400 for an invalid logo type without opening a transaction', async () => {
            await dbContext.run({ models: fakeModels }, async () => {
                const res = await service.create(
                    { name: 'Test Co' },
                    [buildLogoFile({ mimetype: 'application/pdf', originalname: 'bad.pdf' })],
                    1,
                    null
                );

                expect(res.statusCode).to.equal(httpStatus.BAD_REQUEST);
                expect(res.response.message).to.match(/Invalid company logo type/);
            });
        });

        it('update() returns 400 for an oversized logo without opening a transaction', async () => {
            await dbContext.run({ models: fakeModels }, async () => {
                const res = await service.update(
                    42,
                    {},
                    [buildLogoFile({ size: 6 * 1024 * 1024 })],
                    1,
                    null
                );

                expect(res.statusCode).to.equal(httpStatus.BAD_REQUEST);
                expect(res.response.message).to.match(/exceeds the 5MB size limit/);
            });
        });
    });
});
