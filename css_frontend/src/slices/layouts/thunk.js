import { changeHTMLAttribute } from './utils';
import {
    changeLayoutAction,
    changeLayoutModeAction,
    changeSidebarThemeAction,
    changeLayoutWidthAction,
    changeLayoutPositionAction,
    changeTopbarThemeAction,
    changeLeftsidebarSizeTypeAction,
    changeLeftsidebarViewTypeAction,
    changeSidebarImageTypeAction,
    changePreLoaderAction,
    changeSidebarVisibilityAction,
    changeBreadcrumbsVisibilityAction,
    changeFooterVisibilityAction,
    changeDefaultPageSizeAction,
    loadThemeSettingsAction,
} from './reducer';

import { getThemeSettings, saveThemeSettings as saveThemeSettingsApi } from '../../helpers/backend_helper';
import { toast } from 'react-toastify';

// ─── Load from DB (called once on layout mount) ───────────────────────────────

export const loadThemeSettings = () => async (dispatch) => {
    try {
        const response = await getThemeSettings();

        if (response?.status && response?.data) {
            const d = response.data;
            dispatch(loadThemeSettingsAction({
                layoutType:            d.layout_type             || null,
                layoutModeType:        d.layout_mode_type        || null,
                leftSidebarType:       d.left_sidebar_type       || null,
                layoutWidthType:       d.layout_width_type       || null,
                layoutPositionType:    d.layout_position_type    || null,
                topbarThemeType:       d.topbar_theme_type       || null,
                leftsidbarSizeType:    d.leftsidbar_size_type    || null,
                leftSidebarViewType:   d.left_sidebar_view_type  || null,
                leftSidebarImageType:  d.left_sidebar_image_type || null,
                preloader:             d.preloader               || null,
                sidebarVisibilitytype: d.sidebar_visibility_type || null,
                breadcrumbsVisibility: d.breadcrumbs_visibility  || null,
                footerVisibility:      d.footer_visibility       || null,
                defaultPageSize:       d.default_page_size       || null,
            }));
        }
    } catch (_) { }
};

// ─── Explicit save — call this only from the customizer (RightSidebar) ────────

export const persistTheme = () => async (dispatch, getState) => {
    try {
        const res = await saveThemeSettingsApi(getState().Layout);
        if (res?.status) {
            toast.success('Theme settings saved', { autoClose: 1500 });
        }
    } catch (_) { }
};

// ─── Individual setting thunks — apply only, no auto-save ────────────────────

export const changeLayout = (layout) => async (dispatch) => {
    try {
        if (layout === "twocolumn") {
            document.documentElement.removeAttribute("data-layout-width");
        } else if (layout === "horizontal") {
            document.documentElement.removeAttribute("data-sidebar-size");
        } else if (layout === "semibox") {
            changeHTMLAttribute("data-layout-width", "fluid");
            changeHTMLAttribute("data-layout-style", "default");
        }
        changeHTMLAttribute("data-layout", layout);
        dispatch(changeLayoutAction(layout));
    } catch (error) { }
};

export const changeLayoutMode = (layoutMode) => async (dispatch) => {
    try {
        changeHTMLAttribute("data-bs-theme", layoutMode);
        dispatch(changeLayoutModeAction(layoutMode));
    } catch (error) { }
};

export const changeSidebarTheme = (theme) => async (dispatch) => {
    try {
        changeHTMLAttribute("data-sidebar", theme);
        dispatch(changeSidebarThemeAction(theme));
    } catch (error) { }
};

export const changeLayoutWidth = (layoutWidth) => async (dispatch) => {
    try {
        if (layoutWidth === 'lg') {
            changeHTMLAttribute("data-layout-width", "fluid");
        } else {
            changeHTMLAttribute("data-layout-width", "boxed");
        }
        dispatch(changeLayoutWidthAction(layoutWidth));
    } catch (error) {
        return error;
    }
};

export const changeLayoutPosition = (layoutposition) => async (dispatch) => {
    try {
        changeHTMLAttribute("data-layout-position", layoutposition);
        dispatch(changeLayoutPositionAction(layoutposition));
    } catch (error) { }
};

export const changeTopbarTheme = (topbarTheme) => async (dispatch) => {
    try {
        changeHTMLAttribute("data-topbar", topbarTheme);
        dispatch(changeTopbarThemeAction(topbarTheme));
    } catch (error) { }
};

export const changeSidebarImageType = (leftsidebarImagetype) => async (dispatch) => {
    try {
        changeHTMLAttribute("data-sidebar-image", leftsidebarImagetype);
        dispatch(changeSidebarImageTypeAction(leftsidebarImagetype));
    } catch (error) { }
};

export const changePreLoader = (preloaderTypes) => async (dispatch) => {
    try {
        changeHTMLAttribute("data-preloader", preloaderTypes);
        dispatch(changePreLoaderAction(preloaderTypes));
    } catch (error) { }
};

export const changeLeftsidebarSizeType = (leftsidebarSizetype) => async (dispatch) => {
    try {
        switch (leftsidebarSizetype) {
            case 'lg':
                changeHTMLAttribute("data-sidebar-size", "lg");
                break;
            case 'md':
                changeHTMLAttribute("data-sidebar-size", "md");
                break;
            case "sm":
                changeHTMLAttribute("data-sidebar-size", "sm");
                break;
            case "sm-hover":
                changeHTMLAttribute("data-sidebar-size", "sm-hover");
                break;
            default:
                changeHTMLAttribute("data-sidebar-size", "lg");
        }
        dispatch(changeLeftsidebarSizeTypeAction(leftsidebarSizetype));
    } catch (error) { }
};

export const changeLeftsidebarViewType = (leftsidebarViewtype) => async (dispatch) => {
    try {
        changeHTMLAttribute("data-layout-style", leftsidebarViewtype);
        dispatch(changeLeftsidebarViewTypeAction(leftsidebarViewtype));
    } catch (error) { }
};

export const changeSidebarVisibility = (sidebarVisibilitytype) => async (dispatch) => {
    try {
        changeHTMLAttribute("data-sidebar-visibility", sidebarVisibilitytype);
        dispatch(changeSidebarVisibilityAction(sidebarVisibilitytype));
    } catch (error) { }
};

export const changeBreadcrumbsVisibility = (value) => async (dispatch) => {
    try {
        dispatch(changeBreadcrumbsVisibilityAction(value));
    } catch (error) { }
};

export const changeFooterVisibility = (value) => async (dispatch) => {
    try {
        dispatch(changeFooterVisibilityAction(value));
    } catch (error) { }
};

export const changeDefaultPageSize = (value) => async (dispatch) => {
    try {
        dispatch(changeDefaultPageSizeAction(value));
    } catch (error) { }
};
