import React, { useEffect, useState } from 'react';
import {
    Offcanvas,
    OffcanvasHeader,
    OffcanvasBody,
    Collapse,
} from "reactstrap";
import withRouter from './withRouter';

//redux
import {
    changeLayout,
    changeSidebarTheme,
    changeLayoutMode,
    changeLayoutWidth,
    changeLayoutPosition,
    changeTopbarTheme,
    changeLeftsidebarSizeType,
    changeLeftsidebarViewType,
    changeSidebarImageType,
    changePreLoader,
    changeSidebarVisibility,
    changeBreadcrumbsVisibility,
    changeFooterVisibility,
    changeDefaultPageSize,
    persistTheme,
} from "../../slices/thunks";

import { useSelector, useDispatch } from "react-redux";

//import Constant
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
} from "../constants/layout";

//SimpleBar
import SimpleBar from "simplebar-react";
import classnames from "classnames";

//import Images
import img01 from "../../assets/images/sidebar/img-1.jpg";
import img02 from "../../assets/images/sidebar/img-2.jpg";
import img03 from "../../assets/images/sidebar/img-3.jpg";
import img04 from "../../assets/images/sidebar/img-4.jpg";
import { createSelector } from 'reselect';

const SectionHeader = ({ icon, title, subtitle }) => (
    <div className="d-flex align-items-center gap-1 mb-3 px-1 py-2 rounded-3"
        style={{ background: 'linear-gradient(90deg, rgba(64,81,137,0.1) 0%, rgba(10,179,156,0.04) 100%)', borderLeft: '3px solid #405189' }}>
        <div className="flex-shrink-0 d-flex align-items-center justify-content-center rounded-2 text-white fs-17 shadow-sm"
            style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #405189 0%, #0ab39c 100%)' }}>
            <i className={icon}></i>
        </div>
        <div>
            <h6 className="mb-0 fw-bold fs-13 text-dark lh-1">{title}</h6>
            <p className="mb-0 fs-11 text-muted mt-1">{subtitle}</p>
        </div>
    </div>
);

const SectionDivider = () => (
    <div className="d-flex align-items-center gap-2 my-4">
        <div className="flex-grow-1" style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, #405189 100%)' }}></div>
        <span className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
            style={{ width: 22, height: 22, background: 'linear-gradient(135deg, #405189 0%, #0ab39c 100%)' }}>
            <i className="ri-sparkling-2-fill text-white" style={{ fontSize: 9 }}></i>
        </span>
        <div className="flex-grow-1" style={{ height: 1, background: 'linear-gradient(90deg, #0ab39c 0%, transparent 100%)' }}></div>
    </div>
);

const RightSidebar = ({ open, toggle, ...props }) => {
    const dispatch = useDispatch();

    const dispatchAndSave = (thunk) => {
        dispatch(thunk);
        dispatch(persistTheme());
    };

    const [show, setShow] = useState(false);

    function tog_show() {
        setShow(!show);
        dispatch(changeSidebarTheme("gradient"));
    }

    useEffect(() => {
        if (show && document.getElementById("sidebar-color-dark") && document.getElementById("sidebar-color-light")) {
            document.getElementById("sidebar-color-dark").checked = false;
            document.getElementById("sidebar-color-light").checked = false;
        }
    });

    const selectLayoutState = (state) => state.Layout;
    const selectLayoutProperties = createSelector(
        selectLayoutState,
        (layout) => ({
            layoutType: layout.layoutType,
            leftSidebarType: layout.leftSidebarType,
            layoutModeType: layout.layoutModeType,
            layoutWidthType: layout.layoutWidthType,
            layoutPositionType: layout.layoutPositionType,
            topbarThemeType: layout.topbarThemeType,
            leftsidbarSizeType: layout.leftsidbarSizeType,
            leftSidebarViewType: layout.leftSidebarViewType,
            leftSidebarImageType: layout.leftSidebarImageType,
            preloader: layout.preloader,
            sidebarVisibilitytype: layout.sidebarVisibilitytype,
            breadcrumbsVisibility: layout.breadcrumbsVisibility,
            footerVisibility: layout.footerVisibility,
            defaultPageSize: layout.defaultPageSize,
        })
    );

    const {
        layoutType,
        leftSidebarType,
        layoutModeType,
        layoutWidthType,
        layoutPositionType,
        topbarThemeType,
        leftsidbarSizeType,
        leftSidebarViewType,
        leftSidebarImageType,
        preloader,
        sidebarVisibilitytype,
        breadcrumbsVisibility,
        footerVisibility,
        defaultPageSize,
    } = useSelector(selectLayoutProperties);

    window.onscroll = function () {
        scrollFunction();
    };

    const scrollFunction = () => {
        const element = document.getElementById("back-to-top");
        if (element) {
            if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
                element.style.display = "block";
            } else {
                element.style.display = "none";
            }
        }
    };

    const toTop = () => {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    };

    const pathName = props.router.location.pathname;

    useEffect(() => {
        const preloader = document.getElementById("preloader");
        if (preloader) {
            document.getElementById("preloader").style.opacity = "1";
            document.getElementById("preloader").style.visibility = "visible";
            setTimeout(function () {
                document.getElementById("preloader").style.opacity = "0";
                document.getElementById("preloader").style.visibility = "hidden";
            }, 1000);
        }
    }, [preloader, pathName]);

    return (
        <React.Fragment>
            <button
                onClick={() => toTop()}
                className="btn btn-danger btn-icon" id="back-to-top">
                <i className="ri-arrow-up-line"></i>
            </button>

            {preloader === "enable" && <div id="preloader">
                <div id="status">
                    <div className="spinner-border text-primary avatar-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>}

            <div>
                <Offcanvas isOpen={open} toggle={toggle} direction='end'>
                    <OffcanvasHeader className="p-0 offcanvas-header-dark" toggle={toggle}
                        style={{ background: 'linear-gradient(135deg, #405189 0%, #0ab39c 100%)' }}>
                        <div className="d-flex align-items-center p-3 w-100">
                            <div className="avatar-sm me-3 flex-shrink-0">
                                <span className="avatar-title bg-white bg-opacity-25 rounded-circle">
                                    <i className="mdi mdi-palette-outline fs-18 text-white"></i>
                                </span>
                            </div>
                            <div>
                                <h5 className="mb-0 text-white fw-semibold">Theme Customizer</h5>
                                <p className="mb-0 text-white text-opacity-75 fs-12">Personalize your experience</p>
                            </div>
                        </div>
                    </OffcanvasHeader>

                    <OffcanvasBody className="p-0">
                        <SimpleBar className="h-100">
                            <div className="p-4">

                                {/* ── Layout ── */}
                                <SectionHeader icon="ri-layout-4-line" title="Layout" subtitle="Choose your preferred layout" />
                                <div className="row gy-3">
                                    {[
                                        { id: "customizer-layout01", value: layoutTypes.VERTICAL, label: "Vertical", preview: (
                                            <span className="d-flex gap-1 h-100">
                                                <span className="flex-shrink-0">
                                                    <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                        <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                    </span>
                                                </span>
                                                <span className="flex-grow-1">
                                                    <span className="d-flex h-100 flex-column">
                                                        <span className="bg-light d-block p-1"></span>
                                                        <span className="bg-light d-block p-1 mt-auto"></span>
                                                    </span>
                                                </span>
                                            </span>
                                        )},
                                        { id: "customizer-layout02", value: layoutTypes.HORIZONTAL, label: "Horizontal", preview: (
                                            <span className="d-flex h-100 flex-column gap-1">
                                                <span className="bg-light d-flex p-1 gap-1 align-items-center">
                                                    <span className="d-block p-1 bg-primary-subtle rounded me-1"></span>
                                                    <span className="d-block p-1 pb-0 px-2 bg-primary-subtle ms-auto"></span>
                                                    <span className="d-block p-1 pb-0 px-2 bg-primary-subtle"></span>
                                                </span>
                                                <span className="bg-light d-block p-1"></span>
                                                <span className="bg-light d-block p-1 mt-auto"></span>
                                            </span>
                                        )},
                                        { id: "customizer-layout03", value: layoutTypes.TWOCOLUMN, label: "Two Column", preview: (
                                            <span className="d-flex gap-1 h-100">
                                                <span className="flex-shrink-0">
                                                    <span className="bg-light d-flex h-100 flex-column gap-1">
                                                        <span className="d-block p-1 bg-primary-subtle mb-2"></span>
                                                        <span className="d-block p-1 pb-0 bg-primary-subtle"></span>
                                                        <span className="d-block p-1 pb-0 bg-primary-subtle"></span>
                                                        <span className="d-block p-1 pb-0 bg-primary-subtle"></span>
                                                    </span>
                                                </span>
                                                <span className="flex-shrink-0">
                                                    <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                    </span>
                                                </span>
                                                <span className="flex-grow-1">
                                                    <span className="d-flex h-100 flex-column">
                                                        <span className="bg-light d-block p-1"></span>
                                                        <span className="bg-light d-block p-1 mt-auto"></span>
                                                    </span>
                                                </span>
                                            </span>
                                        )},
                                        { id: "customizer-layout04", value: layoutTypes.SEMIBOX, label: "Semi Box", preview: (
                                            <span className="d-flex gap-1 h-100">
                                                <span className="flex-shrink-0 p-1">
                                                    <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                        <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                    </span>
                                                </span>
                                                <span className="flex-grow-1">
                                                    <span className="d-flex h-100 flex-column pt-1 pe-2">
                                                        <span className="bg-light d-block p-1"></span>
                                                        <span className="bg-light d-block p-1 mt-auto"></span>
                                                    </span>
                                                </span>
                                            </span>
                                        )},
                                    ].map(({ id, value, label, preview }) => (
                                        <div className="col-6" key={id}>
                                            <div className={classnames("form-check card-radio rounded-3 overflow-hidden", { "border-primary": layoutType === value })}>
                                                <input id={id} name="data-layout" type="radio" value={value}
                                                    checked={layoutType === value}
                                                    onChange={e => { if (e.target.checked) dispatchAndSave(changeLayout(e.target.value)); }}
                                                    className="form-check-input" />
                                                <label className="form-check-label p-0 avatar-md w-100" htmlFor={id}>
                                                    {preview}
                                                </label>
                                            </div>
                                            <h5 className={classnames("fs-12 text-center mt-2 mb-0 fw-medium", { "text-primary": layoutType === value })}>{label}</h5>
                                        </div>
                                    ))}
                                </div>

                                <SectionDivider />

                                {/* ── Color Scheme ── */}
                                <SectionHeader icon="ri-sun-line" title="Color Scheme" subtitle="Switch between light and dark mode" />
                                <div className="row g-2">
                                    <div className="col-6">
                                        <input className="form-check-input d-none" type="radio" name="data-bs-theme"
                                            id="layout-mode-light" value={layoutModeTypes.LIGHTMODE}
                                            checked={layoutModeType === layoutModeTypes.LIGHTMODE}
                                            onChange={e => { if (e.target.checked) dispatchAndSave(changeLayoutMode(e.target.value)); }} />
                                        <label htmlFor="layout-mode-light"
                                            className={classnames("d-flex align-items-center gap-2 p-3 rounded-3 cursor-pointer border-2 w-100 mb-0",
                                                layoutModeType === layoutModeTypes.LIGHTMODE
                                                    ? "border border-primary bg-primary-subtle text-primary"
                                                    : "border bg-light text-muted"
                                            )} style={{ cursor: 'pointer' }}>
                                            <i className="ri-sun-line fs-18"></i>
                                            <div>
                                                <div className="fw-semibold fs-13">Light</div>
                                                <div className="fs-11 opacity-75">Bright interface</div>
                                            </div>
                                            {layoutModeType === layoutModeTypes.LIGHTMODE && (
                                                <i className="ri-check-line ms-auto fs-16 text-primary"></i>
                                            )}
                                        </label>
                                    </div>
                                    <div className="col-6">
                                        <input className="form-check-input d-none" type="radio" name="data-bs-theme"
                                            id="layout-mode-dark" value={layoutModeTypes.DARKMODE}
                                            checked={layoutModeType === layoutModeTypes.DARKMODE}
                                            onChange={e => { if (e.target.checked) dispatchAndSave(changeLayoutMode(e.target.value)); }} />
                                        <label htmlFor="layout-mode-dark"
                                            className={classnames("d-flex align-items-center gap-2 p-3 rounded-3 cursor-pointer border-2 w-100 mb-0",
                                                layoutModeType === layoutModeTypes.DARKMODE
                                                    ? "border border-primary bg-primary-subtle text-primary"
                                                    : "border bg-light text-muted"
                                            )} style={{ cursor: 'pointer' }}>
                                            <i className="ri-moon-line fs-18"></i>
                                            <div>
                                                <div className="fw-semibold fs-13">Dark</div>
                                                <div className="fs-11 opacity-75">Dark interface</div>
                                            </div>
                                            {layoutModeType === layoutModeTypes.DARKMODE && (
                                                <i className="ri-check-line ms-auto fs-16 text-primary"></i>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                {/* ── Sidebar Visibility (SemiBox only) ── */}
                                {layoutType === layoutTypes.SEMIBOX && (
                                    <React.Fragment>
                                        <SectionDivider />
                                        <SectionHeader icon="ri-sidebar-fold-line" title="Sidebar Visibility" subtitle="Show or hide the sidebar" />
                                        <div className="d-flex gap-2">
                                            {[
                                                { id: "sidebar-visibility-show", value: sidebarVisibilitytypes.SHOW, label: "Show", icon: "ri-eye-line" },
                                                { id: "sidebar-visibility-hidden", value: sidebarVisibilitytypes.HIDDEN, label: "Hidden", icon: "ri-eye-off-line" },
                                            ].map(({ id, value, label, icon }) => (
                                                <React.Fragment key={id}>
                                                    <input className="form-check-input d-none" type="radio" name="data-sidebar-visibility"
                                                        id={id} value={value}
                                                        checked={sidebarVisibilitytype === value}
                                                        onChange={e => { if (e.target.checked) dispatchAndSave(changeSidebarVisibility(e.target.value)); }} />
                                                    <label htmlFor={id}
                                                        className={classnames("d-flex align-items-center gap-2 px-3 py-2 rounded-3 border flex-grow-1 mb-0",
                                                            sidebarVisibilitytype === value ? "border-primary bg-primary-subtle text-primary" : "border bg-light text-muted"
                                                        )} style={{ cursor: 'pointer' }}>
                                                        <i className={`${icon} fs-16`}></i>
                                                        <span className="fw-medium fs-13">{label}</span>
                                                        {sidebarVisibilitytype === value && <i className="ri-check-line ms-auto fs-14"></i>}
                                                    </label>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </React.Fragment>
                                )}

                                {(layoutType !== layoutTypes.TWOCOLUMN) && (
                                    <React.Fragment>
                                        {/* ── Layout Width ── */}
                                        {(layoutType === layoutTypes.VERTICAL || layoutType === layoutTypes.HORIZONTAL) && (
                                            <React.Fragment>
                                                <SectionDivider />
                                                <SectionHeader icon="ri-expand-width-line" title="Layout Width" subtitle="Fluid or boxed content area" />
                                                <div className="d-flex gap-2">
                                                    {[
                                                        { id: "layout-width-fluid", value: layoutWidthTypes.FLUID, label: "Fluid", icon: "ri-artboard-2-line", sideSize: "lg" },
                                                        { id: "layout-width-boxed", value: layoutWidthTypes.BOXED, label: "Boxed", icon: "ri-layout-column-fill", sideSize: "sm-hover" },
                                                    ].map(({ id, value, label, icon, sideSize }) => (
                                                        <React.Fragment key={id}>
                                                            <input className="form-check-input d-none" type="radio" name="data-layout-width"
                                                                id={id} value={value}
                                                                checked={layoutWidthType === value}
                                                                onChange={e => {
                                                                    if (e.target.checked) {
                                                                        dispatch(changeLayoutWidth(e.target.value));
                                                                        dispatch(changeLeftsidebarSizeType(sideSize));
                                                                        dispatch(persistTheme());
                                                                    }
                                                                }} />
                                                            <label htmlFor={id}
                                                                className={classnames("d-flex align-items-center gap-2 px-3 py-2 rounded-3 border flex-grow-1 mb-0",
                                                                    layoutWidthType === value ? "border-primary bg-primary-subtle text-primary" : "border bg-light text-muted"
                                                                )} style={{ cursor: 'pointer' }}>
                                                                <i className={`${icon} fs-16`}></i>
                                                                <span className="fw-medium fs-13">{label}</span>
                                                                {layoutWidthType === value && <i className="ri-check-line ms-auto fs-14"></i>}
                                                            </label>
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </React.Fragment>
                                        )}

                                        {/* ── Layout Position ── */}
                                        <SectionDivider />
                                        <SectionHeader icon="ri-pin-distance-line" title="Layout Position" subtitle="Fixed topbar or scrollable" />
                                        <div className="d-flex gap-2">
                                            {[
                                                { id: "layout-position-fixed", value: layoutPositionTypes.FIXED, label: "Fixed", icon: "ri-pushpin-2-line" },
                                                { id: "layout-position-scrollable", value: layoutPositionTypes.SCROLLABLE, label: "Scrollable", icon: "ri-arrow-up-down-line" },
                                            ].map(({ id, value, label, icon }) => (
                                                <React.Fragment key={id}>
                                                    <input type="radio" className="btn-check" name="data-layout-position"
                                                        id={id} value={value}
                                                        checked={layoutPositionType === value}
                                                        onChange={e => { if (e.target.checked) dispatchAndSave(changeLayoutPosition(e.target.value)); }} />
                                                    <label htmlFor={id}
                                                        className={classnames("d-flex align-items-center gap-2 px-3 py-2 rounded-3 border flex-grow-1 mb-0",
                                                            layoutPositionType === value ? "border-primary bg-primary-subtle text-primary" : "border bg-light text-muted"
                                                        )} style={{ cursor: 'pointer' }}>
                                                        <i className={`${icon} fs-16`}></i>
                                                        <span className="fw-medium fs-13">{label}</span>
                                                        {layoutPositionType === value && <i className="ri-check-line ms-auto fs-14"></i>}
                                                    </label>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </React.Fragment>
                                )}

                                {/* ── Topbar Color ── */}
                                <SectionDivider />
                                <SectionHeader icon="ri-menu-3-line" title="Topbar Color" subtitle="Choose topbar appearance" />
                                <div className="d-flex gap-2">
                                    {[
                                        { id: "topbar-color-light", value: topbarThemeTypes.LIGHT, label: "Light", swatchClass: "bg-light border" },
                                        { id: "topbar-color-dark", value: topbarThemeTypes.DARK, label: "Dark", swatchClass: "bg-dark" },
                                    ].map(({ id, value, label, swatchClass }) => (
                                        <React.Fragment key={id}>
                                            <input className="form-check-input d-none" type="radio" name="data-topbar"
                                                id={id} value={value}
                                                checked={topbarThemeType === value}
                                                onChange={e => { if (e.target.checked) dispatchAndSave(changeTopbarTheme(e.target.value)); }} />
                                            <label htmlFor={id}
                                                className={classnames("d-flex align-items-center gap-2 px-3 py-2 rounded-3 border flex-grow-1 mb-0",
                                                    topbarThemeType === value ? "border-primary bg-primary-subtle text-primary" : "border bg-light text-muted"
                                                )} style={{ cursor: 'pointer' }}>
                                                <span className={`rounded-circle ${swatchClass}`} style={{ width: 14, height: 14, display: 'inline-block', flexShrink: 0 }}></span>
                                                <span className="fw-medium fs-13">{label}</span>
                                                {topbarThemeType === value && <i className="ri-check-line ms-auto fs-14"></i>}
                                            </label>
                                        </React.Fragment>
                                    ))}
                                </div>

                                {/* ── Sidebar Size / View / Color (Vertical & SemiBox) ── */}
                                {(layoutType === "vertical" || (layoutType === "semibox" && sidebarVisibilitytype === "show")) && (
                                    <React.Fragment>
                                        {/* Sidebar Size */}
                                        <SectionDivider />
                                        <SectionHeader icon="ri-expand-left-right-line" title="Sidebar Size" subtitle="Choose sidebar width" />
                                        <div className="row g-2">
                                            {[
                                                { id: "sidebar-size-default", value: leftsidbarSizeTypes.DEFAULT, label: "Default" },
                                                { id: "sidebar-size-compact", value: leftsidbarSizeTypes.COMPACT, label: "Compact" },
                                                { id: "sidebar-size-small", value: leftsidbarSizeTypes.SMALLICON, label: "Icon" },
                                                { id: "sidebar-size-small-hover", value: leftsidbarSizeTypes.SMALLHOVER, label: "Icon Hover" },
                                            ].map(({ id, value, label }) => (
                                                <div className="col-6" key={id}>
                                                    <input className="form-check-input d-none" type="radio" name="data-sidebar-size"
                                                        id={id} value={value}
                                                        checked={leftsidbarSizeType === value}
                                                        onChange={e => { if (e.target.checked) dispatchAndSave(changeLeftsidebarSizeType(e.target.value)); }} />
                                                    <label htmlFor={id}
                                                        className={classnames("d-flex align-items-center justify-content-center gap-1 py-2 rounded-3 border w-100 mb-0 text-center",
                                                            leftsidbarSizeType === value ? "border-primary bg-primary-subtle text-primary fw-semibold" : "border bg-light text-muted"
                                                        )} style={{ cursor: 'pointer', minHeight: 38 }}>
                                                        {leftsidbarSizeType === value && <i className="ri-check-line fs-14 me-1"></i>}
                                                        <span className="fs-12">{label}</span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Sidebar View */}
                                        {layoutType !== "semibox" && (
                                            <React.Fragment>
                                                <SectionDivider />
                                                <SectionHeader icon="ri-window-line" title="Sidebar View" subtitle="Default or detached sidebar" />
                                                <div className="d-flex gap-2">
                                                    {[
                                                        { id: "sidebar-view-default", value: leftSidebarViewTypes.DEFAULT, label: "Default", icon: "ri-layout-left-2-line" },
                                                        { id: "sidebar-view-detached", value: leftSidebarViewTypes.DETACHED, label: "Detached", icon: "ri-layout-right-2-line" },
                                                    ].map(({ id, value, label, icon }) => (
                                                        <React.Fragment key={id}>
                                                            <input className="form-check-input d-none" type="radio" name="data-layout-style"
                                                                id={id} value={value}
                                                                checked={leftSidebarViewType === value}
                                                                onChange={e => { if (e.target.checked) dispatchAndSave(changeLeftsidebarViewType(e.target.value)); }} />
                                                            <label htmlFor={id}
                                                                className={classnames("d-flex align-items-center gap-2 px-3 py-2 rounded-3 border flex-grow-1 mb-0",
                                                                    leftSidebarViewType === value ? "border-primary bg-primary-subtle text-primary" : "border bg-light text-muted"
                                                                )} style={{ cursor: 'pointer' }}>
                                                                <i className={`${icon} fs-16`}></i>
                                                                <span className="fw-medium fs-13">{label}</span>
                                                                {leftSidebarViewType === value && <i className="ri-check-line ms-auto fs-14"></i>}
                                                            </label>
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </React.Fragment>
                                        )}
                                    </React.Fragment>
                                )}

                                {/* ── Sidebar Color ── */}
                                {(layoutType === "vertical" || layoutType === "twocolumn" || (layoutType === "semibox" && sidebarVisibilitytype === "show")) && (
                                    <React.Fragment>
                                        <SectionDivider />
                                        <SectionHeader icon="ri-paint-brush-line" title="Sidebar Color" subtitle="Choose sidebar background style" />
                                        <div className="d-flex gap-2 mb-3">
                                            {[
                                                { id: "sidebar-color-light", value: leftSidebarTypes.LIGHT, label: "Light", swatchClass: "bg-white border" },
                                                { id: "sidebar-color-dark", value: leftSidebarTypes.DARK, label: "Dark", swatchClass: "bg-primary" },
                                            ].map(({ id, value, label, swatchClass }) => (
                                                <React.Fragment key={id}>
                                                    <input className="form-check-input d-none" type="radio" name="data-sidebar"
                                                        id={id} value={value}
                                                        checked={leftSidebarType === value}
                                                        onChange={e => {
                                                            setShow(false);
                                                            if (e.target.checked) dispatchAndSave(changeSidebarTheme(e.target.value));
                                                        }} />
                                                    <label htmlFor={id}
                                                        className={classnames("d-flex align-items-center gap-2 px-3 py-2 rounded-3 border flex-grow-1 mb-0",
                                                            leftSidebarType === value ? "border-primary bg-primary-subtle text-primary" : "border bg-light text-muted"
                                                        )} style={{ cursor: 'pointer' }}>
                                                        <span className={`rounded-circle ${swatchClass}`} style={{ width: 14, height: 14, display: 'inline-block', flexShrink: 0 }}></span>
                                                        <span className="fw-medium fs-13">{label}</span>
                                                        {leftSidebarType === value && <i className="ri-check-line ms-auto fs-14"></i>}
                                                    </label>
                                                </React.Fragment>
                                            ))}
                                        </div>

                                        {/* Gradient toggle */}
                                        <button
                                            className={classnames(
                                                "btn w-100 d-flex align-items-center gap-2 rounded-3",
                                                show ? "btn-primary" : "btn-outline-primary"
                                            )}
                                            type="button"
                                            onClick={tog_show}>
                                            <span className="avatar-xs flex-shrink-0">
                                                <span className="avatar-title rounded bg-vertical-gradient"></span>
                                            </span>
                                            <span className="fw-medium fs-13">Gradient Colors</span>
                                            <i className={classnames("ms-auto fs-14", show ? "ri-subtract-line" : "ri-add-line")}></i>
                                        </button>

                                        <Collapse isOpen={show} className="collapse" id="collapseBgGradient">
                                            <div className="mt-2 p-3 bg-light rounded-3 border">
                                                <p className="fs-11 text-muted mb-2 text-uppercase fw-semibold">Pick a gradient</p>
                                                <div className="d-flex gap-3 flex-wrap">
                                                    {[
                                                        { id: "sidebar-color-gradient", value: leftSidebarTypes.GRADIENT, cls: "bg-vertical-gradient" },
                                                        { id: "sidebar-color-gradient-2", value: leftSidebarTypes.GRADIENT_2, cls: "bg-vertical-gradient-2" },
                                                        { id: "sidebar-color-gradient-3", value: leftSidebarTypes.GRADIENT_3, cls: "bg-vertical-gradient-3" },
                                                        { id: "sidebar-color-gradient-4", value: leftSidebarTypes.GRADIENT_4, cls: "bg-vertical-gradient-4" },
                                                    ].map(({ id, value, cls }) => (
                                                        <div className="form-check sidebar-setting card-radio" key={id}>
                                                            <input className="form-check-input" type="radio" name="data-sidebar"
                                                                id={id} value={value}
                                                                checked={leftSidebarType === value}
                                                                onChange={e => { if (e.target.checked) dispatchAndSave(changeSidebarTheme(e.target.value)); }} />
                                                            <label className="form-check-label p-0 avatar-xs rounded-circle" htmlFor={id}>
                                                                <span className={`avatar-title rounded-circle ${cls}`}></span>
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </Collapse>

                                        {/* Sidebar Images */}
                                        <div className="mt-3">
                                            <p className="fs-11 text-muted mb-2 text-uppercase fw-semibold">Background Image</p>
                                            <div className="d-flex gap-2 flex-wrap img-switch">
                                                <div className="form-check sidebar-setting card-radio">
                                                    <input className="form-check-input" type="radio" name="data-sidebar-image"
                                                        id="sidebarimg-none" value={leftSidebarImageTypes.NONE}
                                                        checked={leftSidebarImageType === leftSidebarImageTypes.NONE}
                                                        onChange={e => { if (e.target.checked) dispatchAndSave(changeSidebarImageType(e.target.value)); }} />
                                                    <label className="form-check-label p-0 avatar-sm h-auto" htmlFor="sidebarimg-none">
                                                        <span className="avatar-md w-auto bg-light border rounded d-flex align-items-center justify-content-center">
                                                            <i className="ri-close-fill fs-18 text-muted"></i>
                                                        </span>
                                                    </label>
                                                </div>
                                                {[
                                                    { id: "sidebarimg-01", value: leftSidebarImageTypes.IMG1, src: img01 },
                                                    { id: "sidebarimg-02", value: leftSidebarImageTypes.IMG2, src: img02 },
                                                    { id: "sidebarimg-03", value: leftSidebarImageTypes.IMG3, src: img03 },
                                                    { id: "sidebarimg-04", value: leftSidebarImageTypes.IMG4, src: img04 },
                                                ].map(({ id, value, src }) => (
                                                    <div className="form-check sidebar-setting card-radio" key={id}>
                                                        <input className="form-check-input" type="radio" name="data-sidebar-image"
                                                            id={id} value={value}
                                                            checked={leftSidebarImageType === value}
                                                            onChange={e => { if (e.target.checked) dispatchAndSave(changeSidebarImageType(e.target.value)); }} />
                                                        <label className="form-check-label p-0 avatar-sm h-auto" htmlFor={id}>
                                                            <img src={src} alt="" className="avatar-md w-auto object-fit-cover rounded" />
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </React.Fragment>
                                )}

                                {/* ── Visibility ── */}
                                <SectionDivider />
                                <SectionHeader icon="ri-eye-line" title="Visibility" subtitle="Show or hide UI elements" />
                                <div className="vstack gap-3">
                                    {[
                                        {
                                            label: "Breadcrumbs", name: "data-breadcrumbs-visibility",
                                            idShow: "breadcrumbs-show", idHide: "breadcrumbs-hide",
                                            current: breadcrumbsVisibility,
                                            onChange: (v) => dispatchAndSave(changeBreadcrumbsVisibility(v)),
                                        },
                                        {
                                            label: "Footer", name: "data-footer-visibility",
                                            idShow: "footer-show", idHide: "footer-hide",
                                            current: footerVisibility,
                                            onChange: (v) => dispatchAndSave(changeFooterVisibility(v)),
                                        },
                                    ].map(({ label, name, idShow, idHide, current, onChange }) => (
                                        <div key={name} className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3 border">
                                            <span className="fw-medium fs-13">{label}</span>
                                            <div className="d-flex gap-1">
                                                {['show', 'hide'].map(val => (
                                                    <React.Fragment key={val}>
                                                        <input type="radio" className="btn-check" name={name}
                                                            id={val === 'show' ? idShow : idHide} value={val}
                                                            checked={current === val}
                                                            onChange={e => { if (e.target.checked) onChange(e.target.value); }} />
                                                        <label className={classnames("btn btn-sm px-3", current === val ? "btn-primary" : "btn-outline-secondary")}
                                                            htmlFor={val === 'show' ? idShow : idHide}>
                                                            {val.charAt(0).toUpperCase() + val.slice(1)}
                                                        </label>
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* ── Pagination ── */}
                                <SectionDivider />
                                <SectionHeader icon="ri-pages-line" title="Pagination" subtitle="Default records per page" />
                                <div className="d-flex gap-2 flex-wrap">
                                    {[5, 10, 25, 50, 100].map(size => (
                                        <React.Fragment key={size}>
                                            <input type="radio" className="btn-check" name="data-page-size"
                                                id={`page-size-${size}`} value={size}
                                                checked={Number(defaultPageSize) === size}
                                                onChange={() => { dispatch(changeDefaultPageSize(size)); dispatch(persistTheme()); }} />
                                            <label className={classnames("btn btn-sm fw-medium", Number(defaultPageSize) === size ? "btn-primary" : "btn-outline-secondary")}
                                                htmlFor={`page-size-${size}`} style={{ minWidth: 44 }}>
                                                {size}
                                            </label>
                                        </React.Fragment>
                                    ))}
                                </div>

                                {/* ── Preloader ── */}
                                <SectionDivider />
                                <SectionHeader icon="ri-loader-4-line" title="Preloader" subtitle="Page loading animation" />
                                <div className="d-flex gap-2">
                                    {[
                                        { id: "preloader-view-custom", value: preloaderTypes.ENABLE, label: "Enable", icon: "ri-loader-3-line" },
                                        { id: "preloader-view-none", value: preloaderTypes.DISABLE, label: "Disable", icon: "ri-close-circle-line" },
                                    ].map(({ id, value, label, icon }) => (
                                        <React.Fragment key={id}>
                                            <input className="form-check-input d-none" type="radio" name="data-preloader"
                                                id={id} value={value}
                                                checked={preloader === value}
                                                onChange={e => { if (e.target.checked) dispatchAndSave(changePreLoader(e.target.value)); }} />
                                            <label htmlFor={id}
                                                className={classnames("d-flex align-items-center gap-2 px-3 py-2 rounded-3 border flex-grow-1 mb-0",
                                                    preloader === value ? "border-primary bg-primary-subtle text-primary" : "border bg-light text-muted"
                                                )} style={{ cursor: 'pointer' }}>
                                                <i className={`${icon} fs-16`}></i>
                                                <span className="fw-medium fs-13">{label}</span>
                                                {preloader === value && <i className="ri-check-line ms-auto fs-14"></i>}
                                            </label>
                                        </React.Fragment>
                                    ))}
                                </div>

                                <div className="mt-4 pb-2"></div>

                            </div>
                        </SimpleBar>
                    </OffcanvasBody>
                </Offcanvas>
            </div>
        </React.Fragment>
    );
};

export default withRouter(RightSidebar);
