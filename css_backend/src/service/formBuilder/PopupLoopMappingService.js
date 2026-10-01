'use strict';

const { findScopedLoopBlocks } = require('../../domain/formBuilder/scopedLoopBlock');
const ShortcodeResolverService = require('./ShortcodeResolverService');

const arrayValue = value => (value === undefined || value === null)
    ? []
    : (Array.isArray(value) ? value : [value]);

// Turns the popup-scoped loop blocks in a template into the per-block record
// collections `renderHtmlTemplate` expands. Nothing here is generic: each loop
// type is dispatched to the business-specific retrieval it already owns on
// ShortcodeResolverService.
//
//   officials          -> ShortcodeResolverService.fetchOfficialsByIds
//   events             -> ShortcodeResolverService.fetchEventsByIds
//   shares             -> ShortcodeResolverService.fetchSharesByIds (company-level)
//   shareholder_shares -> ShortcodeResolverService.fetchShareholderSharesByIds
class PopupLoopMappingService {
    constructor(models = null) {
        this.models = models;
        this.resolver = new ShortcodeResolverService(models);
    }

    _dispatch = (loopType) => ({
        officials: this.resolver.fetchOfficialsByIds,
        events: this.resolver.fetchEventsByIds,
        shares: this.resolver.fetchSharesByIds,
        shareholder_shares: this.resolver.fetchShareholderSharesByIds,
    }[loopType]);

    // `popupFields` is the flattened normalized popup schema; `popupValues` the
    // submitted selection map. Returns { "<field>##<type>": mappedRecord[] }.
    buildLoopValues = async (templateContent, { entityId, popupFields = [], popupValues = {} }) => {
        const blocks = findScopedLoopBlocks(templateContent || '');
        const values = {};
        const seen = new Set();
        for (const block of blocks) {
            if (seen.has(block.valueKey)) continue;
            seen.add(block.valueKey);

            const field = popupFields.find(item => item.field_key === block.fieldKey);
            const fetch = this._dispatch(block.loopType);
            // Unknown popup field key, or the field carries no selection →
            // empty collection so the block renders nothing (never throws).
            if (!field || !fetch) { values[block.valueKey] = []; continue; }

            const ids = arrayValue(popupValues[block.fieldKey])
                .map(id => (id && typeof id === 'object') ? id.value : id)
                .filter(id => id !== undefined && id !== null && id !== '');
            values[block.valueKey] = ids.length ? await fetch(entityId, ids) : [];
        }
        return values;
    };
}

module.exports = PopupLoopMappingService;
