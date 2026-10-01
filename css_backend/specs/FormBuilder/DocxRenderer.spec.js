'use strict';

const { expect } = require('chai');
const { renderDocxBuffer } = require('../../src/domain/formBuilder/docxRenderer');
const JSZip = require('jszip');

describe('Deterministic DOCX renderer', function () {
    // Headless LibreOffice startup time varies considerably on Windows,
    // especially when antivirus scans a newly created temporary profile.
    this.timeout(120000);
    it('converts safe HTML content to readable document text', async () => {
        const buffer = await renderDocxBuffer('<h1>Share &amp; Allotment</h1><p>ACME &lt;Pte&gt;</p>');
        const archive = await JSZip.loadAsync(buffer);
        const documentXml = await archive.file('word/document.xml').async('string');
        expect(documentXml).to.include('Share &amp; Allotment');
        expect(documentXml).to.include('ACME &lt;Pte&gt;');
    });

    it('creates valid OOXML packages from rich HTML', async () => {
        const first = await renderDocxBuffer('<p style="text-align:center"><strong>Company:</strong> <span style="color:#ff0000">ACME &amp; Co</span></p>', { page_size: 'A4' });
        expect(first.subarray(0, 2).toString()).to.equal('PK');
        const archive = await JSZip.loadAsync(first);
        const documentXml = await archive.file('word/document.xml').async('string');
        // LibreOffice imports <strong> through Word's Strong character style.
        expect(documentXml).to.match(/<w:rStyle\s+w:val="Strong"\s*\/>/);
        expect(documentXml).to.include('w:val="center"');
        expect(documentXml).to.match(/w:val="ff0000"/i);
        expect(documentXml).to.include('w:gutter="0"');
        expect(documentXml).not.to.include('undefined');
    });

    it('preserves shortcode loop line breaks in Word output', async () => {
        const buffer = await renderDocxBuffer('<p>Pavithra - SC-1<br>Nivas - SC-2<br></p>');
        const archive = await JSZip.loadAsync(buffer);
        const documentXml = await archive.file('word/document.xml').async('string');
        expect(documentXml).to.include('Pavithra - SC-1');
        expect(documentXml).to.include('Nivas - SC-2');
        expect(documentXml).to.match(/<w:br\s*\/>/);
    });

    it('preserves inline background colors in Word output', async () => {
        const buffer = await renderDocxBuffer(
            '<p>Name: <span style="background-color:hsl(30, 75%, 60%);font-weight:bold;text-decoration:underline">Tan Wei Ming</span></p>'
        );
        const archive = await JSZip.loadAsync(buffer);
        const documentXml = await archive.file('word/document.xml').async('string');
        const nameIndex = documentXml.indexOf('Tan Wei Ming');
        const nameRun = documentXml.slice(Math.max(0, nameIndex - 1000), nameIndex + 100);

        expect(nameIndex).to.be.greaterThan(-1);
        expect(nameRun).to.match(/<w:(?:highlight|shd)\b[^>]*(?:w:val|w:fill)="(?:e6994d)"/i);
    });

    it('changes the artifact bytes when content changes', async () => {
        const first = await renderDocxBuffer('<p>One</p>');
        const second = await renderDocxBuffer('<p>Two</p>');
        expect(first.equals(second)).to.equal(false);
    });
});
