'use strict';

const { expect } = require('chai');
const { cssLength, buildPrintableHtml } = require('../../src/service/formBuilder/PdfBrowserAdapter');
const FormPdfRenderService = require('../../src/service/formBuilder/FormPdfRenderService');

describe('PDF browser adapter', () => {
    it('normalizes numeric page margins and rejects arbitrary CSS values', () => {
        expect(cssLength(12, '1mm')).to.equal('12cm');
        expect(cssLength('1.5cm', '1mm')).to.equal('1.5cm');
        expect(cssLength('calc(1px + 1in)', '9mm')).to.equal('9mm');
    });

    it('builds controlled portrait and landscape print documents', () => {
        const portrait = buildPrintableHtml('<h1>Test</h1>', { orientation: 'Portrait', margin_top: 10 });
        const landscape = buildPrintableHtml('<h1>Test</h1>', { orientation: 'Landscape' });
        expect(portrait).to.include('@page { size: A4 portrait; margin: 10cm');
        expect(landscape).to.include('@page { size: A4 landscape;');
    });

    it('normalizes CKEditor HSL background colors for printable output', () => {
        const printable = buildPrintableHtml(
            '<p><span style="background-color:hsl(30, 75%, 60%);color:hsl(0, 0%, 0%)">Text</span></p>'
        );

        expect(printable).to.include('background-color:#e6994d');
        expect(printable).to.include('color:#000000');
        expect(printable).not.to.include('background-color:hsl(');
    });

    it('derives document storage tenant name from the routed database path', () => {
        expect(FormPdfRenderService.tenantDbName({
            user: {}, originalUrl: '/insight_client/form-generations/render-pdf/4',
        })).to.equal('insight_client');
    });
});
