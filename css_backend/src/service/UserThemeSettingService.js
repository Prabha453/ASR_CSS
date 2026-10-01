const httpStatus = require('http-status');

const UserThemeSettingDao = require('../dao/UserThemeSettingDao');
const responseHandler     = require('../helper/responseHandler');
const logger              = require('../config/logger');

class UserThemeSettingService {

    constructor() {
        this.dao = new UserThemeSettingDao();
    }

    get = async (userId) => {
        try {
            const record = await this.dao.findByUserId(userId);

            if (!record) {
                return responseHandler.returnSuccess(httpStatus.OK, 'No theme settings found', null);
            }

            return responseHandler.returnSuccess(httpStatus.OK, 'Theme settings retrieved', record);

        } catch (e) {
            logger.error(e);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to retrieve theme settings');
        }
    };

    save = async (userId, settings) => {
        try {
            const record = await this.dao.upsertByUserId(userId, {
                user_id:                 userId,
                layout_type:             settings.layoutType             || null,
                layout_mode_type:        settings.layoutModeType         || null,
                left_sidebar_type:       settings.leftSidebarType        || null,
                layout_width_type:       settings.layoutWidthType        || null,
                layout_position_type:    settings.layoutPositionType     || null,
                topbar_theme_type:       settings.topbarThemeType        || null,
                leftsidbar_size_type:    settings.leftsidbarSizeType     || null,
                left_sidebar_view_type:  settings.leftSidebarViewType    || null,
                left_sidebar_image_type: settings.leftSidebarImageType   || null,
                preloader:               settings.preloader              || null,
                sidebar_visibility_type: settings.sidebarVisibilitytype  || null,
                breadcrumbs_visibility:  settings.breadcrumbsVisibility  || 'show',
                footer_visibility:       settings.footerVisibility       || 'show',
                default_page_size:       settings.defaultPageSize        || 10,
            });

            return responseHandler.returnSuccess(httpStatus.OK, 'Theme settings saved', record);

        } catch (e) {
            logger.error(e);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to save theme settings');
        }
    };

}

module.exports = UserThemeSettingService;
