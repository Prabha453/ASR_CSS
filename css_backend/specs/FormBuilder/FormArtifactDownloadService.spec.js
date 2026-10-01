'use strict';

const path = require('path');
const { expect } = require('chai');
const { Op } = require('sequelize');
const FormArtifactDownloadService = require('../../src/service/formBuilder/FormArtifactDownloadService');
const { LOCAL_UPLOAD_DIR } = require('../../src/config/documentStorage');

describe('Form artifact tenant-authorized download', () => {
    it('resolves local document URLs only inside the configured upload directory', () => {
        const resolved = FormArtifactDownloadService.localFilePath(
            'http://localhost:5000/uploads/insight/form_generation/pdf/form.pdf'
        );
        expect(resolved).to.equal(path.resolve(
            process.cwd(), LOCAL_UPLOAD_DIR, 'insight', 'form_generation', 'pdf', 'form.pdf'
        ));
    });

    it('rejects traversal outside the upload directory', () => {
        expect(() => FormArtifactDownloadService.localFilePath('/uploads/../package.json'))
            .to.throw('outside the upload directory')
            .with.property('statusCode', 403);
    });

    it('returns not found when the artifact is absent from the current tenant models', async () => {
        let query;
        const models = {
            form_generation_artifact: {
                findOne: async options => { query = options; return null; },
            },
            form_generation_run: {},
            document_store: {},
        };
        let error;
        try { await new FormArtifactDownloadService(models).resolve(72); } catch (reason) { error = reason; }
        expect(error).to.have.property('statusCode', 404);
        expect(query.where.generation_artifact_id).to.equal(72);
        expect(query.where.artifact_type[Op.in]).to.deep.equal(['PDF', 'DOCX']);
        expect(query.include[1].where).to.deep.equal({ is_deleted: false, upload_status: 'completed' });
    });
});
