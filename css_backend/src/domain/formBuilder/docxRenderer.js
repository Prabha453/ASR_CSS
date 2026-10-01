'use strict';

const JSZip = require('jszip');
const { richTextDocument } = require('./richTextStyles');
const { convertHtmlToDocx } = require('../../service/formBuilder/LibreOfficeDocxAdapter');

// OOXML page sizes are in twips (1/1440 inch). US Letter, matching this
// system's prior default.
const PAGE_WIDTH_TWIP = 12240;
const PAGE_HEIGHT_TWIP = 15840;
const cmToTwip = (value, fallback) => Math.round((Number(value) || fallback) * 566.929);

/**
 * LibreOffice's HTML import doesn't honor page size/orientation/margins from
 * the source HTML, so the converted docx always comes back with LibreOffice's
 * own defaults. Overwrite its <w:sectPr> page setup with the form's configured
 * layout after conversion.
 */
const applyLayoutToSectPr = (documentXml, layout = {}) => {
    const landscape = String(layout.orientation || '').toLowerCase() === 'landscape';
    const width = landscape ? PAGE_HEIGHT_TWIP : PAGE_WIDTH_TWIP;
    const height = landscape ? PAGE_WIDTH_TWIP : PAGE_HEIGHT_TWIP;
    const pgSz = `<w:pgSz w:w="${width}" w:h="${height}"${landscape ? ' w:orient="landscape"' : ''}/>`;
    const pgMar = `<w:pgMar w:top="${cmToTwip(layout.margin_top, 2.54)}" w:right="${cmToTwip(layout.margin_right, 2.54)}"` +
        ` w:bottom="${cmToTwip(layout.margin_bottom, 2.54)}" w:left="${cmToTwip(layout.margin_left, 2.54)}"` +
        ` w:header="${cmToTwip(layout.header_margin, 1.27)}" w:footer="${cmToTwip(layout.footer_margin, 1.27)}" w:gutter="0"/>`;
    return documentXml
        .replace(/<w:pgSz\b[^/]*\/>/g, pgSz)
        .replace(/<w:pgMar\b[^/]*\/>/g, pgMar);
};

const renderDocxBuffer = async (html, layout = {}) => {
    const rawDocx = await convertHtmlToDocx(richTextDocument(html));
    const zip = await JSZip.loadAsync(rawDocx);
    const documentXml = await zip.file('word/document.xml').async('string');
    zip.file('word/document.xml', applyLayoutToSectPr(documentXml, layout));
    return zip.generateAsync({ type: 'nodebuffer' });
};

module.exports = { renderDocxBuffer };
