'use strict';

const fs = require('fs');
const path = require('path');
const httpStatus = require('http-status');
const { getCurrentModels } = require('../../models');
const { Op } = require('sequelize');
const { getPresignedUrl } = require('../../utils/documentStorage');
const { LOCAL_UPLOAD_DIR } = require('../../config/documentStorage');

const localFilePath = filePath => {
    let relativePath = String(filePath || '');
    if (/^https?:\/\//i.test(relativePath)) relativePath = new URL(relativePath).pathname;
    relativePath = decodeURIComponent(relativePath).replace(/^[/\\]+/, '');

    const uploadRoot = path.resolve(process.cwd(), LOCAL_UPLOAD_DIR);
    const absolutePath = path.resolve(process.cwd(), relativePath);
    if (absolutePath !== uploadRoot && !absolutePath.startsWith(`${uploadRoot}${path.sep}`)) {
        const error = new Error('Stored document path is outside the upload directory');
        error.statusCode = httpStatus.FORBIDDEN;
        throw error;
    }
    return absolutePath;
};

class FormArtifactDownloadService {
    constructor(models = null) { this.models = models; }
    _models = () => this.models || getCurrentModels();

    resolve = async artifactId => {
        const models = this._models();
        const artifact = await models.form_generation_artifact.findOne({
            where: { generation_artifact_id: artifactId, artifact_type: { [Op.in]: ['PDF', 'DOCX'] } },
            include: [
                { model: models.form_generation_run, as: 'generation_run', attributes: ['generation_run_id', 'form_id', 'entity_id'] },
                {
                    model: models.document_store,
                    as: 'document',
                    where: { is_deleted: false, upload_status: 'completed' },
                    required: true,
                },
            ],
        });
        if (!artifact?.document || !artifact.generation_run) {
            const error = new Error('Generated document artifact not found');
            error.statusCode = httpStatus.NOT_FOUND;
            throw error;
        }

        const document = artifact.document;
        const fileName = path.basename(document.doc_name || document.original_file_name || 'generated-form.pdf');
        if (Number(document.storage_type) === 1) {
            return { artifact, document, fileName, redirectUrl: await getPresignedUrl(document.file_path) };
        }

        const absolutePath = localFilePath(document.file_path);
        try {
            await fs.promises.access(absolutePath, fs.constants.R_OK);
        } catch (cause) {
            const error = new Error('Generated document file is unavailable');
            error.statusCode = httpStatus.NOT_FOUND;
            error.cause = cause;
            throw error;
        }
        return { artifact, document, fileName, absolutePath };
    };
}

FormArtifactDownloadService.localFilePath = localFilePath;

module.exports = FormArtifactDownloadService;
