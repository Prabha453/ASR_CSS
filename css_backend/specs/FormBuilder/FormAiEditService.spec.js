'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const FormAiEditService = require('../../src/service/formBuilder/FormAiEditService');

describe('Form AI edit service', () => {
    const originalApiKey = process.env.OPENAI_API_KEY;
    const originalModel = process.env.OPENAI_EDITOR_MODEL;

    afterEach(() => {
        sinon.restore();
        if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
        else process.env.OPENAI_API_KEY = originalApiKey;
        if (originalModel === undefined) delete process.env.OPENAI_EDITOR_MODEL;
        else process.env.OPENAI_EDITOR_MODEL = originalModel;
    });

    it('masks and restores merge fields without changing their exact text', () => {
        const source = '<p>Hello {{company.name}} — {{director##official_record.name | official_type:individual}}</p>';
        const masked = FormAiEditService.maskMergeTokens(source);

        expect(masked.maskedContent).not.to.include('{{company.name}}');
        expect(masked.protections).to.have.length(2);
        expect(FormAiEditService.restoreMergeTokens(
            masked.maskedContent,
            masked.protections,
            masked.nonce
        )).to.equal(source);
    });

    it('rejects AI output that reorders protected merge fields', () => {
        const masked = FormAiEditService.maskMergeTokens('{{company.name}} {{company.uen}}');
        const reordered = `${masked.protections[1].marker} ${masked.protections[0].marker}`;

        expect(() => FormAiEditService.restoreMergeTokens(
            reordered,
            masked.protections,
            masked.nonce
        )).to.throw('changed one or more protected shortcodes');
    });

    it('rejects unsafe HTML returned by the model', () => {
        expect(() => FormAiEditService.assertSafeHtml('<p onclick="steal()">Text</p>'))
            .to.throw('unsafe HTML');
        expect(() => FormAiEditService.assertSafeHtml('<script>alert(1)</script>'))
            .to.throw('unsafe HTML');
    });

    it('returns a configuration error without making a network request when the API key is absent', async () => {
        process.env.OPENAI_API_KEY = '';
        const fetchStub = sinon.stub(global, 'fetch');
        const service = new FormAiEditService();

        const result = await service.edit({
            action: 'grammar', scope: 'document', content: '<p>Hello</p>',
        });

        expect(result.statusCode).to.equal(503);
        expect(result.response.message).to.include('OPENAI_API_KEY');
        expect(fetchStub.called).to.equal(false);
    });

    it('rejects a selection containing only part of a shortcode before calling OpenAI', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        const fetchStub = sinon.stub(global, 'fetch');
        const service = new FormAiEditService();

        const result = await service.edit({
            action: 'grammar', scope: 'selection', content: 'company.name}}',
        });

        expect(result.statusCode).to.equal(422);
        expect(result.response.message).to.include('incomplete shortcode');
        expect(fetchStub.called).to.equal(false);
    });

    it('calls the Responses API with masked content and restores tokens in the result', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        process.env.OPENAI_EDITOR_MODEL = 'test-editor-model';
        const source = '<p>Hello {{company.name}} and {{company.registration_number}}</p>';

        const fetchStub = sinon.stub(global, 'fetch').callsFake(async (url, options) => {
            const request = JSON.parse(options.body);
            const markers = request.input.match(/__ASR_MERGE_TOKEN_[A-F0-9]+_\d{4}__/g);

            expect(url).to.equal('https://api.openai.com/v1/responses');
            expect(options.headers.Authorization).to.equal('Bearer test-key');
            expect(request.model).to.equal('test-editor-model');
            expect(request.store).to.equal(false);
            expect(request.input).not.to.include('{{company.name}}');
            expect(markers).to.have.length(2);

            return {
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'completed',
                    output: [{
                        type: 'message',
                        content: [{
                            type: 'output_text',
                            text: JSON.stringify({
                                edited_html: `<p>Dear ${markers[0]}, number ${markers[1]}</p>`,
                                summary: 'Improved the greeting.',
                            }),
                        }],
                    }],
                }),
            };
        });

        const service = new FormAiEditService();
        const result = await service.edit({
            action: 'professional', scope: 'document', content: source,
        }, { userId: 9, formId: 8 });

        expect(fetchStub.calledOnce).to.equal(true);
        expect(result.statusCode).to.equal(200);
        expect(result.response.data.edited_html)
            .to.equal('<p>Dear {{company.name}}, number {{company.registration_number}}</p>');
        expect(result.response.data.protected_tokens).to.equal(2);
    });
});
