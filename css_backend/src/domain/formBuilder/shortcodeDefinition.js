'use strict';

const crypto = require('crypto');

const CANONICAL_KEY_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;

const unwrapShortcode = (value) => {
    const text = String(value ?? '').trim();
    if (text.startsWith('{{') && text.endsWith('}}')) {
        return text.slice(2, -2).trim();
    }
    return text;
};

const normalizeCanonicalKey = (value) => unwrapShortcode(value).toLowerCase();

const normalizeAliasKey = (value) => unwrapShortcode(value).toLowerCase();

const assertCanonicalKey = (value) => {
    const key = normalizeCanonicalKey(value);
    if (!CANONICAL_KEY_PATTERN.test(key)) {
        throw new Error(
            'Shortcode key must be a lowercase dotted key such as company.name'
        );
    }
    return key;
};

const normalizedWords = (value) => String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ');

const buildSemanticFingerprint = ({
    label,
    sourceDomain,
    resolverName,
    resolverPath,
    valueType,
    isCollection = false,
}) => crypto.createHash('sha256').update([
    normalizedWords(label),
    String(sourceDomain || '').trim().toUpperCase(),
    String(resolverName || '').trim().toUpperCase(),
    String(resolverPath || '').trim().toLowerCase(),
    String(valueType || '').trim().toUpperCase(),
    isCollection ? 'COLLECTION' : 'SCALAR',
].join('|')).digest('hex');

module.exports = {
    CANONICAL_KEY_PATTERN,
    unwrapShortcode,
    normalizeCanonicalKey,
    normalizeAliasKey,
    assertCanonicalKey,
    buildSemanticFingerprint,
};
