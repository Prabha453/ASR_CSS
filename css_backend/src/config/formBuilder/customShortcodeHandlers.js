'use strict';

/*
 * Application-owned custom shortcode handlers.
 *
 * A custom shortcode can be created in the Shortcode Library before its code
 * is ready. Add an entry whose key exactly matches that shortcode key:
 *
 *   'company.example_value': {
 *       valueType: 'STRING',
 *       isCollection: false,
 *       resolve: async ({ data, popupValues, popupFields, selectedValue, models }) => {
 *           // Fetch/calculate the special value here. `data` is the normal
 *           // company/event/share resolver context and popupValues contains
 *           // the selections submitted from Generate Form.
 *           return data.entity?.name;
 *       },
 *   },
 *
 * Code is deliberately registered here instead of being stored in the
 * database. This prevents arbitrary JavaScript or SQL from being entered in
 * the admin screen.
 */
const handlers = Object.freeze({
});

const getCustomShortcodeHandler = shortcodeKey => handlers[String(shortcodeKey || '').toLowerCase()] || null;

const listCustomShortcodeHandlers = () => Object.entries(handlers).map(([shortcodeKey, definition]) => ({
    shortcode_key: shortcodeKey,
    value_type: definition.valueType || 'STRING',
    is_collection: Boolean(definition.isCollection),
}));

module.exports = {
    handlers,
    getCustomShortcodeHandler,
    listCustomShortcodeHandlers,
};
