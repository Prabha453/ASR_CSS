import React, { useEffect, useState } from "react";
import { useNavigate,useLocation } from "react-router-dom";
import { getLoggedinUser } from "../helpers/api_helper";
import { REPORT_SECTIONS } from "../common/data/reportCatalog";

const Navdata = () => {
  const history = useNavigate();
  const { pathname } = useLocation();

  const authUser = getLoggedinUser();
  const userRole = String(authUser?.user_role || authUser?.user?.user_role || "").toUpperCase();
  const isShortcodeDeveloper = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  //state data
  const [isDashboard, setIsDashboard] = useState(false);
  const [isSettings, setIsSettings] = useState(false);
  const [isMasters, setIsMasters] = useState(false);
  const [isCompany, setIsCompany] = useState(false);
  const [isUserMgmt, setIsUserMgmt] = useState(false);
  const [isFormBuild, setIsFormBuild] = useState(false);
  const [isCompliance, setIsCompliance] = useState(false);
  const [isStatutoryRegisters, setIsStatutoryRegisters] = useState(false);
  const [openStatutorySection, setOpenStatutorySection] = useState(null);
  const [isReports, setIsReports] = useState(false);
  const [openReportSection, setOpenReportSection] = useState(null);

  const [iscurrentState, setIscurrentState] = useState("Dashboard");

  function updateIconSidebar(e) {
    if (e && e.target && e.target.getAttribute("subitems")) {
      const ul = document.getElementById("two-column-menu");
      const iconItems = ul.querySelectorAll(".nav-icon.active");
      let activeIconItems = [...iconItems];
      activeIconItems.forEach((item) => {
        item.classList.remove("active");
        var id = item.getAttribute("subitems");
        if (document.getElementById(id))
          document.getElementById(id).classList.remove("show");
      });
    }
  }

  useEffect(() => {
    document.body.classList.remove("twocolumn-panel");
    if (iscurrentState !== "Dashboard") {
      setIsDashboard(false);
    }
    if (iscurrentState !== "Settings") {
      setIsSettings(false);
    }
    if (iscurrentState !== "Masters") {
      setIsMasters(false);
    }
    if (iscurrentState !== "Company") {
      setIsCompany(false);
    }
    if (iscurrentState !== "UserMgmt") {
      setIsUserMgmt(false);
    }
    if (iscurrentState !== "Compliance") {
      setIsCompliance(false);
    }
    if (iscurrentState !== "StatutoryRegisters") {
      setIsStatutoryRegisters(false);
      setOpenStatutorySection(null);
    }
    if (iscurrentState !== "Reports") {
      setIsReports(false);
      setOpenReportSection(null);
    }
  }, [pathname,
    history,
    iscurrentState,
    isDashboard,
    isSettings,
    isMasters,
    isCompany,
    isUserMgmt,
    isCompliance,
    isStatutoryRegisters,
    isReports,
  ]);

  const toggleStatutorySection = (section) => (e) => {
    e.preventDefault();
    setOpenStatutorySection((current) => current === section ? null : section);
  };

  const toggleReportSection = (section) => (e) => {
    e.preventDefault();
    setOpenReportSection((current) => current === section ? null : section);
  };

  const menuItems = [
    {
      label: "Menu",
      isHeader: true,
    },
    {
      id: "dashboard",
      label: "Dashboards",
      icon: "ri-dashboard-2-line",
      link: "/#",
      stateVariables: isDashboard,
      click: function (e) {
        e.preventDefault();
        setIsDashboard(!isDashboard);
        setIscurrentState("Dashboard");
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: 'dashboard-overview',
          label: 'Overview',
          link: '/dashboard',
          parentId: 'dashboard'
        },
        {
          id: 'dashboard-portfolio',
          label: 'Portfolio Dashboard',
          link: '/dashboard/portfolio',
          parentId: 'dashboard'
        }
      ]
    },
    {
      id:'entities',
      label:'Entity Management',
      icon:'ri-building-line',
      link:'/#',
      stateVariables:isCompany,
      click:function(e){
        e.preventDefault();
        setIsCompany(!isCompany);
        setIscurrentState('Company');
        updateIconSidebar(e);
      },
      subItems:[
        {
          id:'company',
          label:'Entity',
          link:'/company/list',
          parentId:'entities'
        },
        {
          id:'individual-list',
          label:'Individual',
          link:'/individuals',
          parentId:'entities'
        },
        {
          id:'entity-officials',
          label:'Officials',
          link:'/officials/entity',
          parentId:'entities'
        },{
          id:'entity-charges',
          label:'Charges',
          link:'/entity/register-charges-list',
          parentId:'entities'
        }
      ]
    },
    {
      id: 'user-management',
      label: 'User Management',
      icon: 'ri-team-line',
      link: '/#',
      stateVariables: isUserMgmt,
      click: function (e) {
        e.preventDefault();
        setIsUserMgmt(!isUserMgmt);
        setIscurrentState('UserMgmt');
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: 'users',
          label: 'Users',
          link: '/user-management/users',
          parentId: 'user-management',
        },
        {
          id: 'user-groups',
          label: 'User Groups',
          link: '/user-management/user-groups',
          parentId: 'user-management',
        },
      ],
    },{
      id: 'form-builder',
      label: 'Form Builder',
      icon: 'ri-file-list-line',
      link: '/#',
      stateVariables: isFormBuild,
      click: function (e) {
        e.preventDefault();
        setIsFormBuild(!isFormBuild);
        setIscurrentState('isFormBuild');
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: 'form-builder-instructions',
          label: 'Instructions',
          link: '/form-builder/instructions',
          parentId: 'form-builder',
        },
        {
          id: 'form-template',
          label: 'Form Template',
          link: '/form-builder/form-template',
          parentId: 'form-builder',
        },
        ...(isShortcodeDeveloper ? [{
          id: 'shortcode-library',
          label: 'Shortcode Library',
          link: '/form-builder/shortcode-library',
          parentId: 'form-builder',
        }] : []),
      ],
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: 'ri-shield-check-line',
      link: '/#',
      stateVariables: isCompliance,
      click: function (e) {
        e.preventDefault();
        setIsCompliance(!isCompliance);
        setIscurrentState('Compliance');
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: 'compliance-event',
          label: 'Event',
          link: '/compliance/events',
          parentId: 'compliance',
        },
        {
          id: 'compliance-event-reminder',
          label: 'Event Reminder',
          link: '/compliance/events-reminder',
          parentId: 'compliance',
        },
        {
          id: 'compliance-due-date-tracker',
          label: 'Due Date Tracker',
          link: '/compliance/due-date-tracker',
          parentId: 'compliance',
        },
      ],
    },
    {
      id: 'statutory-registers',
      label: 'Statutory Registers',
      icon: 'ri-book-2-line',
      link: '/#',
      stateVariables: isStatutoryRegisters,
      click: function (e) {
        e.preventDefault();
        setIsStatutoryRegisters(!isStatutoryRegisters);
        setIscurrentState('StatutoryRegisters');
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: 'statutory-ownership-members',
          label: 'Ownership & Members',
          link: '/#',
          isChildItem: true,
          stateVariables: openStatutorySection === 'ownership-members',
          click: toggleStatutorySection('ownership-members'),
          childItems: [
            { id: 'register-owners', label: 'Owners', link: '/statutory_register/owners', parentId: 'statutory-ownership-members' },
            { id: 'register-members', label: 'Members', link: '/statutory_register/shareholders', parentId: 'statutory-ownership-members' },
            { id: 'register-controllers', label: 'Controllers', link: '/statutory_register/controllers', parentId: 'statutory-ownership-members' },
            { id: 'register-nominee-shareholders', label: 'Nominee Shareholders', link: '/statutory_register/nominee-shareholders', parentId: 'statutory-ownership-members' },
            { id: 'register-nominees-trustees', label: 'Nominees & Trustees', link: '/statutory_register/nominee-and-trustees', parentId: 'statutory-ownership-members' },
          ],
        },
        {
          id: 'statutory-directors-officers',
          label: 'Directors & Officers',
          link: '/#',
          isChildItem: true,
          stateVariables: openStatutorySection === 'directors-officers',
          click: toggleStatutorySection('directors-officers'),
          childItems: [
            { id: 'register-directors', label: 'Directors', link: '/statutory_register/directors', parentId: 'statutory-directors-officers' },
            { id: 'register-nominee-directors', label: 'Nominee Directors', link: '/statutory_register/nominee-directors', parentId: 'statutory-directors-officers' },
            { id: 'register-secretaries', label: 'Secretaries', link: '/statutory_register/secretaries', parentId: 'statutory-directors-officers' },
            { id: 'register-ceos', label: 'CEOs', link: '/statutory_register/ceos', parentId: 'statutory-directors-officers' },
            { id: 'register-managers', label: 'Managers', link: '/statutory_register/managers', parentId: 'statutory-directors-officers' },
            { id: 'register-representatives', label: 'Representatives', link: '/statutory_register/representatives', parentId: 'statutory-directors-officers' },
            { id: 'register-agents', label: 'Agents', link: '/statutory_register/agents', parentId: 'statutory-directors-officers' },
            { id: 'register-fund-managers', label: 'Fund Managers', link: '/statutory_register/fund-managers', parentId: 'statutory-directors-officers' },
            { id: 'register-data-protection-officers', label: 'Data Protection Officers', link: '/statutory_register/data-protection-officers', parentId: 'statutory-directors-officers' },
          ],
        },
        {
          id: 'statutory-shares-interests',
          label: 'Shares & Interests',
          link: '/#',
          isChildItem: true,
          stateVariables: openStatutorySection === 'shares-interests',
          click: toggleStatutorySection('shares-interests'),
          childItems: [
            { id: 'register-share-allotments', label: 'Share Allotments', link: '/statutory_register/share-allotments', parentId: 'statutory-shares-interests' },
            { id: 'register-share-transfers', label: 'Share Transfers', link: '/statutory_register/share-transfers', parentId: 'statutory-shares-interests' },
            { id: 'register-directors-interests', label: 'Directors\u2019 Interests', link: '/statutory_register/directors-interests', parentId: 'statutory-shares-interests' },
            { id: 'register-ceos-interests', label: 'CEOs\u2019 Interests', link: '/statutory_register/ceos-interests', parentId: 'statutory-shares-interests' },
            { id: 'register-allotments-transaction-date', label: 'Allotments by Transaction Date', link: '/statutory_register/allotments-by-transaction-date', parentId: 'statutory-shares-interests' },
          ],
        },
        {
          id: 'statutory-corporate-records',
          label: 'Corporate Records',
          link: '/#',
          isChildItem: true,
          stateVariables: openStatutorySection === 'corporate-records',
          click: toggleStatutorySection('corporate-records'),
          childItems: [
            { id: 'register-charges', label: 'Charges', link: '/statutory_register/charges', parentId: 'statutory-corporate-records' },
            { id: 'register-sealings', label: 'Sealings', link: '/statutory_register/sealings', parentId: 'statutory-corporate-records' },
            { id: 'register-addresses', label: 'Addresses', link: '/statutory_register/addresses', parentId: 'statutory-corporate-records' },
            { id: 'register-auditors', label: 'Auditors', link: '/statutory_register/auditors', parentId: 'statutory-corporate-records' },
          ],
        },
      ],
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: 'ri-file-chart-line',
      link: '/#',
      stateVariables: isReports,
      click: function (e) {
        e.preventDefault();
        setIsReports(!isReports);
        setIscurrentState('Reports');
        updateIconSidebar(e);
      },
      subItems: REPORT_SECTIONS.map((section) => ({
        id: `reports-${section.key}`,
        label: section.label,
        link: '/#',
        isChildItem: true,
        stateVariables: openReportSection === section.key,
        click: toggleReportSection(section.key),
        childItems: section.reports.map((report) => ({
          id: `report-${section.key}-${report.key}`,
          label: report.label,
          link: `/reports/${section.key}/${report.key}`,
          parentId: `reports-${section.key}`,
        })),
      })),
    },
    {
      id: "settings",
      label: "Settings",
      icon: "ri-settings-line",
      link: "/settings",
      stateVariables: isSettings,
      click: function (e) {
        e.preventDefault();
        setIsSettings(!isSettings);
        setIscurrentState("Settings");
        updateIconSidebar(e);
      },
    },
  ];
  return <React.Fragment>{menuItems}</React.Fragment>;
};
export default Navdata;
