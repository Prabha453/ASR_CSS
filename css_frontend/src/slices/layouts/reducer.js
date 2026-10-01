import { createSlice } from "@reduxjs/toolkit";
//constants
import {
  layoutTypes,
  leftSidebarTypes,
  layoutModeTypes,
  layoutWidthTypes,
  layoutPositionTypes,
  topbarThemeTypes,
  leftsidbarSizeTypes,
  leftSidebarViewTypes,
  leftSidebarImageTypes,
  preloaderTypes,
  sidebarVisibilitytypes
} from "../../Components/constants/layout";

export const initialState = {
  layoutType: layoutTypes.VERTICAL,
  leftSidebarType: leftSidebarTypes.DARK,
  layoutModeType: layoutModeTypes.LIGHTMODE,
  layoutWidthType: layoutWidthTypes.FLUID,
  layoutPositionType: layoutPositionTypes.FIXED,
  topbarThemeType: topbarThemeTypes.LIGHT,
  leftsidbarSizeType: leftsidbarSizeTypes.DEFAULT,
  leftSidebarViewType: leftSidebarViewTypes.DEFAULT,
  leftSidebarImageType: leftSidebarImageTypes.NONE,
  preloader: preloaderTypes.DISABLE,
  sidebarVisibilitytype: sidebarVisibilitytypes.SHOW,
  breadcrumbsVisibility: 'show',
  footerVisibility: 'show',
  defaultPageSize: 10,
};

const LayoutSlice = createSlice({
  name: 'LayoutSlice',
  initialState,
  reducers: {
    changeLayoutAction(state, action) {
      state.layoutType = action.payload;
    },
    changeLayoutModeAction(state, action) {
      state.layoutModeType = action.payload;
    },
    changeSidebarThemeAction(state, action) {
      state.leftSidebarType = action.payload;
    },
    changeLayoutWidthAction(state, action) {
      state.layoutWidthType = action.payload;
    },
    changeLayoutPositionAction(state, action) {
      state.layoutPositionType = action.payload;
    },
    changeTopbarThemeAction(state, action) {
      state.topbarThemeType = action.payload;
    },
    changeLeftsidebarSizeTypeAction(state, action) {
      state.leftsidbarSizeType = action.payload;
    },
    changeLeftsidebarViewTypeAction(state, action) {
      state.leftSidebarViewType = action.payload;
    },
    changeSidebarImageTypeAction(state, action) {
      state.leftSidebarImageType = action.payload;
    },
    changePreLoaderAction(state, action) {
      state.preloader = action.payload;
    },
    changeSidebarVisibilityAction(state, action) {
      state.sidebarVisibilitytype = action.payload;
    },
    changeBreadcrumbsVisibilityAction(state, action) {
      state.breadcrumbsVisibility = action.payload;
    },
    changeFooterVisibilityAction(state, action) {
      state.footerVisibility = action.payload;
    },
    changeDefaultPageSizeAction(state, action) {
      state.defaultPageSize = action.payload;
    },
    loadThemeSettingsAction(state, action) {
      const s = action.payload;
      if (s.layoutType)             state.layoutType             = s.layoutType;
      if (s.layoutModeType)         state.layoutModeType         = s.layoutModeType;
      if (s.leftSidebarType)        state.leftSidebarType        = s.leftSidebarType;
      if (s.layoutWidthType)        state.layoutWidthType        = s.layoutWidthType;
      if (s.layoutPositionType)     state.layoutPositionType     = s.layoutPositionType;
      if (s.topbarThemeType)        state.topbarThemeType        = s.topbarThemeType;
      if (s.leftsidbarSizeType)     state.leftsidbarSizeType     = s.leftsidbarSizeType;
      if (s.leftSidebarViewType)    state.leftSidebarViewType    = s.leftSidebarViewType;
      if (s.leftSidebarImageType)   state.leftSidebarImageType   = s.leftSidebarImageType;
      if (s.preloader)              state.preloader              = s.preloader;
      if (s.sidebarVisibilitytype)  state.sidebarVisibilitytype  = s.sidebarVisibilitytype;
      if (s.breadcrumbsVisibility)  state.breadcrumbsVisibility  = s.breadcrumbsVisibility;
      if (s.footerVisibility)       state.footerVisibility       = s.footerVisibility;
      if (s.defaultPageSize)        state.defaultPageSize        = s.defaultPageSize;
    },
  }
});

export const {
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
} = LayoutSlice.actions;

export default LayoutSlice.reducer;