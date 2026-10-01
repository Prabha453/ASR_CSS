const express = require('express');
const authRoute = require('./authRoute');
const userRoute = require('./userRoute');
const commonRoute = require('./commonRoute');

const memberIdTypeRoute = require('./masterSettings/memberIdTypeRoute');
const salutationRoute = require('./masterSettings/salutationRoute');
const raceMasterRoute = require('./masterSettings/raceMasterRoute');
const tagRoute = require('./masterSettings/tagRoute');
const languageRoute = require('./masterSettings/languageRoute');
const regionMasterRoute = require('./masterSettings/regionMasterRoute');
const jurisdictionRoute = require('./masterSettings/jurisdictionRoute');
const authorityRoute = require('./masterSettings/authorityRoute');
const companyTypeRoute = require('./masterSettings/companyTypeRoute');
const shareClassMasterRoute = require('./masterSettings/shareClassMasterRoute');
const templateCategoryRoute = require('./masterSettings/templateCategoryRoute');
const transactionTypeRoute = require('./masterSettings/transactionTypeRoute');
const officialMasterRoute = require('./masterSettings/officialMasterRoute');
const companySegregationRoute = require('./masterSettings/companySegregationRoute');
const businessEntityRoute = require('./masterSettings/businessEntityRoute');
const cssStatusRoute = require('./masterSettings/cssStatusRoute');
const groupMasterRoute = require('./masterSettings/groupMasterRoute');
const relatedIndustryRoute = require('./masterSettings/relatedIndustryRoute');
const softwareRoute = require('./masterSettings/softwareRoute');
const companySSICCodeRoute = require('./masterSettings/companySSICCodeRoute');
const corpSecTypeRoute = require('./masterSettings/corpSecTypeRoute');
const entityServiceCategoryRoute = require('./masterSettings/entityServiceCategoryRoute');
const typeOfFeeRoute = require('./masterSettings/typeOfFeeRoute');
const companyEventNameRoute = require('./masterSettings/companyEventNameRoute');
const registerFooterRoute = require('./masterSettings/registerFooterRoute');
const entityStatusRoute = require('./masterSettings/entityStatusRoute');
const officialSubRoleRoute = require('./masterSettings/officialSubRoleRoute');
const productAndServiceRoute = require('./masterSettings/productAndServiceRoute');
const entityIndividualRoute  = require('./individual');
const entityCompanyRoute     = require('./company');
const companyEventRoute      = require('./event');
const officialRoute          = require('./official/officialRoute');
const themeSettingRoute      = require('./themeSettingRoute');
const companyProfileRoute = require('./companyProfile/companyProfileRoute');
const userGroupRoute      = require('./userGroupRoute');
const userPermissionRoute = require('./userPermissionRoute');
const documentStoreRoute = require('./documentStoreRoute');
const entityShareRoute                 = require('./company/entityShareRoute');
const entityShareDecimalSettingsRoute  = require('./company/entityShareDecimalSettingsRoute');
const shareTransactionRoute            = require('./company/shareRoute');
const sharePaymentRoute                = require('./company/sharePaymentRoute');

//Form Builder
const formPopUpFieldRoute = require('./formBuilder/formPopUpFieldRoute');
const formRoute = require('./formBuilder/formRoute');
const shortcodeLibraryRoute = require('./formBuilder/shortcodeLibraryRoute');
const formGenerationRoute = require('./formBuilder/formGenerationRoute');
const dashboardRoute = require('./dashboardRoute');
const ChargesRoute = require('./charges');
const todoTaskRoute = require('./todoTaskRoute');

const router = express.Router();

const defaultRoutes = [
    {
        path: '/auth',
        route: authRoute,
    },{
        path: '/common',
        route: commonRoute,
    },{
        path: '/user',
        route: userRoute,
    },{
        path: '/member-id-type',
        route: memberIdTypeRoute,
    },{
        path: '/salutation',
        route: salutationRoute,
    },{
        path: '/race-master',
        route: raceMasterRoute,
    },{
        path: '/tag',
        route: tagRoute,
    },{
        path: '/language',
        route: languageRoute,
    },{
        path: '/region-master',
        route: regionMasterRoute,
    },{
        path: '/jurisdiction',
        route: jurisdictionRoute,
    },{
        path: '/authority',
        route: authorityRoute,
    },{
        path: '/company-type',
        route: companyTypeRoute,
    },{
        path: '/share-class-master',
        route: shareClassMasterRoute,
    },{
        path: '/template-category',
        route: templateCategoryRoute,
    },{
        path: '/transaction-type',
        route: transactionTypeRoute,
    },{
        path: '/official-master',
        route: officialMasterRoute,
    },{
        path: '/company-segregation',
        route: companySegregationRoute,
    },{
        path: '/business-entity',
        route: businessEntityRoute,
    },{
        path: '/css-status',
        route: cssStatusRoute,
    },{
        path: '/group-master',
        route: groupMasterRoute,
    },{
        path: '/related-industry',
        route: relatedIndustryRoute,
    },{
        path: '/softwares',
        route: softwareRoute,
    },{
        path: '/company-ssic-code',
        route: companySSICCodeRoute,
    },{
        path: '/corp-sec-type',
        route: corpSecTypeRoute,
    },{
        path: '/entity-service-category',
        route: entityServiceCategoryRoute,
    },{
        path: '/type-of-fee',
        route: typeOfFeeRoute,
    },{
        path: '/company-event-name',
        route: companyEventNameRoute,
    },{
        path: '/register-footer',
        route: registerFooterRoute,
    },{
        path: '/individual',
        route: entityIndividualRoute,
    },{
        path: '/company',
        route: entityCompanyRoute,
    },{
        path: '/theme-settings',
        route: themeSettingRoute,
    },{
        path: '/company-profile',
        route: companyProfileRoute,
    },{
        path: '/user-group',
        route: userGroupRoute,
    },{
        path: '/user-permission',
        route: userPermissionRoute,
    },{
        path: '/document-store',
        route: documentStoreRoute,
    },{
        path: '/entity-status',
        route: entityStatusRoute,
    },{
        path: '/official-sub-role',
        route: officialSubRoleRoute,
    },{
        path: '/official',
        route: officialRoute,
    },{
        path: '/product-and-service',
        route: productAndServiceRoute,
    },
    {
        path: '/form-pop-up-field',
        route: formPopUpFieldRoute
    },{
        path: '/form-template',
        route: formRoute
    },{
        path: '/form-shortcode',
        route: shortcodeLibraryRoute
    },{
        path: '/form-generations',
        route: formGenerationRoute
    },{
        path: '/dashboard',
        route: dashboardRoute,
    },
    {
        path: '/entity-change',
        route: ChargesRoute,
    },
    {
        path: '/entity-shares',
        route: entityShareRoute,
    },
    {
        path: '/event',
        route: companyEventRoute,
    },
    {
        path: '/entity-share-decimal-settings',
        route: entityShareDecimalSettingsRoute,
    },
    {
        path: '/todo-task',
        route: todoTaskRoute,
    },
    {
        path: '/share-transactions',
        route: shareTransactionRoute,
    },
    {
        path: '/share-payments',
        route: sharePaymentRoute,
    }
];

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

module.exports = router;
