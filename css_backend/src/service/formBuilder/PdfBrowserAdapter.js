'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { RICH_TEXT_CSS, normalizeInlineCssColors } = require('../../domain/formBuilder/richTextStyles');

const WINDOWS_CANDIDATES = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
const UNIX_CANDIDATES = ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];

const resolveBrowserPath = () => {
    const candidates = [process.env.PDF_BROWSER_PATH, ...WINDOWS_CANDIDATES, ...UNIX_CANDIDATES].filter(Boolean);
    const found = candidates.find(candidate => fs.existsSync(candidate));
    if (!found) throw new Error('PDF browser not found; configure PDF_BROWSER_PATH');
    return found;
};

const cssLength = (value, fallback) => {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value === 'number' || /^\d+(\.\d+)?$/.test(String(value))) return `${value}cm`;
    if (/^\d+(\.\d+)?(mm|cm|in|px|pt)$/.test(String(value))) return String(value);
    return fallback;
};

const buildPrintableHtml = (content, layout = {}) => {
    const landscape = String(layout.orientation || '').toLowerCase() === 'landscape';
    const pageSize = landscape ? 'A4 landscape' : 'A4 portrait';
    const margins = [
        cssLength(layout.margin_top, '12mm'),
        cssLength(layout.margin_right, '12mm'),
        cssLength(layout.margin_bottom, '12mm'),
        cssLength(layout.margin_left, '12mm'),
    ].join(' ');
    return `<!doctype html><html><head><meta charset="utf-8"><style>
@page { size: ${pageSize}; margin: ${margins}; }
html, body { padding: 0; margin: 0; }
body { font-family: Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
@media screen { body { box-sizing: border-box; min-height: 100vh; padding: ${margins}; } }
img { max-width: 100%; }
${RICH_TEXT_CSS}
</style></head><body>${normalizeInlineCssColors(content)}</body></html>`;
};

const runBrowser = (browserPath, args) => new Promise((resolve, reject) => {
    execFile(browserPath, args, { windowsHide: true, timeout: 60000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) return reject(new Error(`PDF browser failed: ${stderr || error.message}`));
        return resolve();
    });
});

const renderPdfBuffer = async (html, layout = {}) => {
    const browserPath = resolveBrowserPath();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'css-form-pdf-'));
    const htmlPath = path.join(tempDir, 'input.html');
    const pdfPath = path.join(tempDir, 'output.pdf');
    try {
        fs.writeFileSync(htmlPath, buildPrintableHtml(html, layout), 'utf8');
        await runBrowser(browserPath, [
            '--headless=new', '--disable-gpu', '--disable-extensions', '--disable-background-networking',
            '--no-first-run', '--no-default-browser-check', '--print-to-pdf-no-header',
            `--print-to-pdf=${pdfPath}`, `file:///${htmlPath.replace(/\\/g, '/')}`,
        ]);
        if (!fs.existsSync(pdfPath)) throw new Error('PDF browser did not create an output file');
        return fs.readFileSync(pdfPath);
    } finally {
        for (const target of [htmlPath, pdfPath]) {
            try { if (fs.existsSync(target)) fs.unlinkSync(target); } catch (error) { /* best effort */ }
        }
        try { fs.rmdirSync(tempDir); } catch (error) { /* best effort */ }
    }
};

module.exports = { resolveBrowserPath, cssLength, buildPrintableHtml, renderPdfBuffer };
