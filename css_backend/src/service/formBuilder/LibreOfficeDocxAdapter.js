'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

const WINDOWS_CANDIDATES = [
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
];
const UNIX_CANDIDATES = ['/usr/bin/soffice', '/usr/bin/libreoffice', '/opt/libreoffice/program/soffice'];

const resolveSofficePath = () => {
    const candidates = [process.env.LIBREOFFICE_PATH, ...WINDOWS_CANDIDATES, ...UNIX_CANDIDATES].filter(Boolean);
    const found = candidates.find(candidate => fs.existsSync(candidate));
    if (!found) throw new Error('LibreOffice (soffice) not found; configure LIBREOFFICE_PATH');
    return found;
};

const runSoffice = (sofficePath, args, userInstallDir) => new Promise((resolve, reject) => {
    execFile(sofficePath, args, { windowsHide: true, timeout: 60000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) return reject(new Error(`LibreOffice conversion failed: ${stderr || error.message}`));
        return resolve();
    });
});

/**
 * Converts HTML to DOCX bytes via headless LibreOffice, which has far more
 * complete CSS/HTML support than any lightweight JS HTML-to-DOCX library
 * (nested inline formatting, paragraph borders, tables, lists, etc. all work
 * the way they render in a browser or in Word itself).
 */
const convertHtmlToDocx = async html => {
    const sofficePath = resolveSofficePath();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'css-form-docx-'));
    // Give this conversion its own LibreOffice user profile directory so concurrent
    // conversions never collide on the same profile lock.
    const userInstallDir = path.join(tempDir, 'profile');
    const htmlPath = path.join(tempDir, 'input.html');
    const outputPath = path.join(tempDir, 'input.docx');
    try {
        fs.writeFileSync(htmlPath, html, 'utf8');
        await runSoffice(sofficePath, [
            '--headless', '--norestore', '--nolockcheck', '--nodefault', '--nofirststartwizard',
            `-env:UserInstallation=file:///${userInstallDir.replace(/\\/g, '/')}`,
            '--convert-to', 'docx:MS Word 2007 XML',
            '--outdir', tempDir,
            htmlPath,
        ]);
        if (!fs.existsSync(outputPath)) throw new Error('LibreOffice did not produce an output file');
        return fs.readFileSync(outputPath);
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
};

module.exports = { resolveSofficePath, convertHtmlToDocx };
