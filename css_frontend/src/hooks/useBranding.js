import { useEffect } from 'react';
import { getLoggedinUser } from '../helpers/api_helper';

const DEFAULT_FAVICON = '/favicon.ico';
const DEFAULT_TITLE   = 'ASR::Corporate Secretary System';

// ─────────────────────────────────────────────────────────────────────────────
// _setFavicon
//
// Removes all existing favicon link elements and inserts a fresh one.
// - If url is empty/null  → uses DEFAULT_FAVICON (no cache bust)
// - If url is the default → uses DEFAULT_FAVICON (no cache bust)
// - If url is an uploaded path → appends cache-bust so browser always
//   fetches the latest uploaded favicon instead of showing the old one
// ─────────────────────────────────────────────────────────────────────────────
const _setFavicon = (url) => {

    // Treat missing, empty, or the literal default path the same way
    const isDefault = !url || url.includes('favicon.ico');

    const faviconHref = isDefault
        ? DEFAULT_FAVICON
        : `${url}${url.includes('?') ? '&' : '?'}_cb=${Date.now()}`;

    // Remove ALL existing favicon-related link tags
    document.querySelectorAll(
        "link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon'], #dynamic-favicon"
    ).forEach((el) => el.parentNode?.removeChild(el));

    // Insert a brand-new <link> — new element forces browser to re-fetch
    const link  = document.createElement('link');
    link.id     = 'dynamic-favicon';
    link.rel    = 'icon';
    link.type   = 'image/x-icon';
    link.href   = faviconHref;

    document.head.appendChild(link);
};

// ─────────────────────────────────────────────────────────────────────────────
// _applyBranding
//
// Pure function — callable anywhere (Redux thunk, outside React, etc.)
// Sets favicon + document title from company profile data.
// Falls back to defaults when values are missing.
// ─────────────────────────────────────────────────────────────────────────────
export const _applyBranding = (companyProfile = {}) => {

    // ── Favicon ───────────────────────────────────────────────────────────
    const faviconUrl = companyProfile?.cp_port_fav_icon_url || null;
    _setFavicon(faviconUrl);

    // ── Title ─────────────────────────────────────────────────────────────
    const portTitle   = companyProfile?.cp_port_title   || '';
    const companyName = companyProfile?.cp_company_name || '';

    document.title = (portTitle || companyName)
        ? `${portTitle || companyName} | CSS`
        : DEFAULT_TITLE;
};

// ─────────────────────────────────────────────────────────────────────────────
// useBranding — React hook
//
// Call inside App.jsx component body.
// Applies branding on:
//   1. Mount               — handles page refresh
//   2. storage event       — handles login in another tab
//   3. branding-updated    — dispatched by Redux loginUser action
// ─────────────────────────────────────────────────────────────────────────────
const useBranding = () => {

    useEffect(() => {

        const apply = () => {
            const loggedUser = getLoggedinUser();

            if (!loggedUser) {
                // Not logged in — reset to defaults
                _applyBranding({});
                return;
            }

            // Support both flat and nested company_profile structures
            const profile = loggedUser.company_profile ?? loggedUser;
            _applyBranding(profile);
        };

        apply();

        window.addEventListener('storage', apply);
        window.addEventListener('branding-updated', apply);

        return () => {
            window.removeEventListener('storage', apply);
            window.removeEventListener('branding-updated', apply);
        };

    }, []);

};

export default useBranding;