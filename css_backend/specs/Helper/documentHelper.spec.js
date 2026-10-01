'use strict';

const chai       = require('chai');
const { expect } = chai;
const sinon      = require('sinon');
const fs         = require('fs');
const path       = require('path');

const documentHelper   = require('../../src/helper/documentHelper');
const DocumentStoreDao = require('../../src/dao/DocumentStoreDao');

// These tests hit the REAL filesystem (documentHelper.uploadDocument writes
// actual bytes to disk) — only the document_store DB layer is stubbed. This is
// the one piece the service-level logo tests stub away entirely, so it's the
// most direct way to prove (or disprove) that an uploaded file actually lands
// on disk where the app expects to find it.
describe('documentHelper.uploadDocument — real disk writes', () => {
    const testPortFolder = `unit_test_port_${Date.now()}`;
    const testSubFolder  = 'corporate_log_test';
    const uploadsRoot     = path.join(process.cwd(), 'uploads');
    const writtenDir      = path.join(uploadsRoot, testPortFolder, testSubFolder);

    afterEach(() => {
        sinon.restore();
    });

    after(() => {
        const portDir = path.join(uploadsRoot, testPortFolder);
        if (fs.existsSync(portDir)) {
            fs.rmSync(portDir, { recursive: true, force: true });
        }
    });

    const makeFile = (name, content) => ({
        originalname: name,
        mimetype:     'image/png',
        size:         Buffer.byteLength(content),
        buffer:       Buffer.from(content),
    });

    it('creates the target folder and writes the uploaded bytes to disk', async () => {
        sinon.stub(DocumentStoreDao.prototype, 'create').callsFake(async (data) => ({ doc_id: 1, ...data }));

        expect(fs.existsSync(writtenDir)).to.equal(false);

        const doc = await documentHelper.uploadDocument({
            file:             makeFile('logo.png', 'first-logo-bytes'),
            userId:           1,
            port_number:      10,
            port_name:        testPortFolder,
            entity_id:        42,
            entity_type:      'company',
            module_name:      'corporate_registration',
            sub_module_name:  'corporate_log',
            module_record_id: 42,
            doc_category:     'corporate_log',
            sub_folder:       testSubFolder,
            replace_existing: false,
        });

        expect(doc.doc_id).to.equal(1);
        expect(fs.existsSync(writtenDir)).to.equal(true);

        const filesOnDisk = fs.readdirSync(writtenDir);
        expect(filesOnDisk.length).to.equal(1);

        const written = fs.readFileSync(path.join(writtenDir, filesOnDisk[0]), 'utf8');
        expect(written).to.equal('first-logo-bytes');
    });

    it('only retires the old document_store row AFTER the new one is confirmed saved', async () => {
        const createStub = sinon.stub(DocumentStoreDao.prototype, 'create')
            .callsFake(async (data) => ({ doc_id: 2, ...data }));
        const findStub = sinon.stub(DocumentStoreDao.prototype, 'findOneByWhere')
            .resolves({ doc_id: 1, file_path: `${testPortFolder}/${testSubFolder}/old.png` });
        const updateStub = sinon.stub(DocumentStoreDao.prototype, 'updateWhere').resolves([1]);

        const doc = await documentHelper.uploadDocument({
            file:             makeFile('logo2.png', 'second-logo-bytes'),
            userId:           1,
            port_number:      10,
            port_name:        testPortFolder,
            entity_id:        42,
            entity_type:      'company',
            module_name:      'corporate_registration',
            sub_module_name:  'corporate_log',
            module_record_id: 42,
            doc_category:     'corporate_log',
            sub_folder:       testSubFolder,
            replace_existing: true,
            delete_old_file:  false,
            existing_where:   { entity_id: 42, module_name: 'corporate_registration', sub_module_name: 'corporate_log' },
        });

        expect(doc.doc_id).to.equal(2);
        expect(createStub.calledBefore(findStub)).to.equal(true);
        expect(findStub.calledBefore(updateStub)).to.equal(true);
        expect(updateStub.firstCall.args[0]).to.deep.include({ is_deleted: true });
        expect(updateStub.firstCall.args[1]).to.deep.equal({ doc_id: 1 });
    });

    it('does NOT touch the old record when the new document_store insert fails', async () => {
        sinon.stub(DocumentStoreDao.prototype, 'create').rejects(new Error('DB write failed'));
        const findStub = sinon.stub(DocumentStoreDao.prototype, 'findOneByWhere');

        let thrown = null;
        try {
            await documentHelper.uploadDocument({
                file:             makeFile('logo3.png', 'third-logo-bytes'),
                userId:           1,
                port_number:      10,
                port_name:        testPortFolder,
                entity_id:        42,
                entity_type:      'company',
                module_name:      'corporate_registration',
                sub_module_name:  'corporate_log',
                module_record_id: 42,
                doc_category:     'corporate_log',
                sub_folder:       testSubFolder,
                replace_existing: true,
                delete_old_file:  true,
                existing_where:   { entity_id: 42 },
            });
        } catch (err) {
            thrown = err;
        }

        expect(thrown).to.not.equal(null);
        expect(thrown.message).to.equal('DB write failed');
        expect(findStub.called).to.equal(false);
    });

    it('builds a servable /uploads/<port>/<sub_folder>/<file> URL', async () => {
        sinon.stub(DocumentStoreDao.prototype, 'create').callsFake(async (data) => ({ doc_id: 4, ...data }));

        const doc = await documentHelper.uploadDocument({
            file:             makeFile('logo4.png', 'fourth-logo-bytes'),
            userId:           1,
            port_number:      10,
            port_name:        testPortFolder,
            entity_id:        42,
            entity_type:      'company',
            module_name:      'corporate_registration',
            sub_module_name:  'corporate_log',
            module_record_id: 42,
            doc_category:     'corporate_log',
            sub_folder:       testSubFolder,
            replace_existing: false,
        });

        expect(doc.file_path).to.match(
            new RegExp(`/uploads/${testPortFolder}/${testSubFolder}/logo4_\\d+\\.png$`)
        );
    });
});
