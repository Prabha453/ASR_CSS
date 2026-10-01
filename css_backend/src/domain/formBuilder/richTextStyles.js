'use strict';

const RICH_TEXT_CSS = `
body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.35; }
p { margin: 0 0 8pt; }
h1 { font-size: 2em; margin: .67em 0; } h2 { font-size: 1.5em; margin: .83em 0; }
h3 { font-size: 1.17em; margin: 1em 0; }
.ql-align-center { text-align: center; } .ql-align-right { text-align: right; }
.ql-align-justify { text-align: justify; }
.ql-indent-1 { margin-left: 3em; } .ql-indent-2 { margin-left: 6em; }
.ql-indent-3 { margin-left: 9em; } .ql-indent-4 { margin-left: 12em; }
.ql-size-small { font-size: .75em; } .ql-size-large { font-size: 1.5em; }
.ql-size-huge { font-size: 2.5em; }
blockquote { border-left: 4px solid #ccc; margin: 5px 0; padding-left: 16px; }
pre { background: #f0f0f0; padding: 8px; white-space: pre-wrap; }
ol, ul { margin: 0 0 8pt; padding-left: 2.5em; }
li { margin-bottom: 3pt; }
img { max-width: 100%; height: auto; }
`;

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

const hueChannel = (p, q, input) => {
    let hue = input;
    if (hue < 0) hue += 1;
    if (hue > 1) hue -= 1;
    if (hue < 1 / 6) return p + (q - p) * 6 * hue;
    if (hue < 1 / 2) return q;
    if (hue < 2 / 3) return p + (q - p) * (2 / 3 - hue) * 6;
    return p;
};

const hslToHex = color => {
    const match = String(color || '').match(
        /^hsl\(\s*(-?\d+(?:\.\d+)?)\s*(?:deg)?\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*\)$/i
    );
    if (!match) return null;
    const hue = (((Number(match[1]) % 360) + 360) % 360) / 360;
    const saturation = clamp(Number(match[2]) / 100, 0, 1);
    const lightness = clamp(Number(match[3]) / 100, 0, 1);
    let red = lightness;
    let green = lightness;
    let blue = lightness;
    if (saturation !== 0) {
        const q = lightness < 0.5
            ? lightness * (1 + saturation)
            : lightness + saturation - lightness * saturation;
        const p = 2 * lightness - q;
        red = hueChannel(p, q, hue + 1 / 3);
        green = hueChannel(p, q, hue);
        blue = hueChannel(p, q, hue - 1 / 3);
    }
    return `#${[red, green, blue]
        .map(channel => Math.round(channel * 255 + 1e-8).toString(16).padStart(2, '0'))
        .join('')}`;
};

// CKEditor 5 writes palette colors as hsl(...). Browsers render that syntax,
// but LibreOffice's HTML importer silently drops HSL run backgrounds when it
// creates DOCX. Convert only inline text/background color declarations to hex
// so HTML, PDF, and DOCX receive one portable representation.
const normalizeInlineCssColors = content => String(content || '').replace(
    /((?:^|[;"'])\s*(?:background-color|color)\s*:\s*)(hsl\([^)]*\))/gi,
    (declaration, prefix, color) => `${prefix}${hslToHex(color) || color}`
);

const richTextDocument = content => `<!doctype html><html><head><meta charset="utf-8"><style>${RICH_TEXT_CSS}</style></head><body>${normalizeInlineCssColors(content)}</body></html>`;

module.exports = { RICH_TEXT_CSS, hslToHex, normalizeInlineCssColors, richTextDocument };
