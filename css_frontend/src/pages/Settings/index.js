import React, { useState } from 'react';
import {
  Container, Row, Col, Card, CardBody,
  Nav, NavItem, NavLink, TabContent, TabPane,
} from 'reactstrap';
import classnames from 'classnames';
import BreadCrumb        from '../../Components/Common/BreadCrumb';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';

// ── Company Profile (owns all its own tabs + shared formik + Save button) ──────
import CompanyProfile from './CompanyProfile';

// ── User Settings ──────────────────────────────────────────────────────────────
import ChangePassword     from './UserSettings/ChangePassword';
import DesignationMaster  from './UserSettings/DesignationMaster';

// ── Share Settings ─────────────────────────────────────────────────────────────
import ShareSettings from './ShareSettings';

// ── Master Settings ────────────────────────────────────────────────────────────
import MemberType         from './MasterSettings/MemberType';
import Salutation         from './MasterSettings/Salutation';
import Region             from './MasterSettings/Region';
import Race               from './MasterSettings/Race';
import Tag                from './MasterSettings/Tag';
import Software           from './MasterSettings/Software';
import CssStatus          from './MasterSettings/CssStatus';
import Official           from './MasterSettings/Official';
import CompanyType        from './MasterSettings/CompanyType';
import CompanySegregation from './MasterSettings/CompanySegregation';
import BusinessEntity     from './MasterSettings/BusinessEntity';
import RelatedIndustry    from './MasterSettings/RelatedIndustry';
import CompanySSICCode    from './MasterSettings/CompanySSICCode';
import CorpSecType        from './MasterSettings/CorpSecType';
import EntityServiceCategory      from './MasterSettings/EntityServiceCategory';
import CompanyEventName   from './MasterSettings/CompanyEventName';
import EventRule          from './MasterSettings/EventRule';
import Jurisdictions      from './MasterSettings/Jurisdictions';
import Authorities        from './MasterSettings/Authorities';
import ShareClass         from './MasterSettings/ShareClass';
import TypeOfFee          from './MasterSettings/TypeOfFee';
import TransactionType    from './MasterSettings/TransactionType';
import TemplateCategory   from './MasterSettings/TemplateCategory';
import RegisterFooter     from './MasterSettings/RegisterFooter';
import EntityStatus     from './MasterSettings/EntityStatus';
import GroupMaster      from './MasterSettings/GroupMaster';
import OfficialSubRole from './MasterSettings/OfficialSubRole';
import ProductAndService from './MasterSettings/ProductAndService';
import Reminder          from './MasterSettings/Reminder';

// ─── Section / tab definitions ─────────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'general',
    label: 'Company Profile',
    subLabel: 'Profile & settings',
    icon: 'ri-building-line',
    color: '#405189',
    type: 'single',
    component: CompanyProfile,
  },
  {
    id: 'share-settings',
    label: 'Share Settings',
    subLabel: 'Decimal precision',
    icon: 'ri-stock-line',
    color: '#0ab39c',
    type: 'single',
    component: ShareSettings,
  },
  {
    id: 'user',
    label: 'User Settings',
    subLabel: '2 options',
    icon: 'ri-user-settings-line',
    color: '#f06548',
    type: 'tabs',
    tabs: [
      { id: 'change-password',    label: 'Change Password',    component: ChangePassword },
      { id: 'designation-master', label: 'Designation Master', component: DesignationMaster },
    ],
  },
  {
    id: 'master',
    label: 'Master Settings',
    subLabel: '5 groups',
    icon: 'ri-list-settings-line',
    color: '#6f42c1',
    type: 'grouped',
    groups: [
      {
        id: 'common',
        label: 'Common Masters',
        icon: 'ri-global-line',
        color: '#0ab39c',
        tabs: [
          { id: 'salutations', label: 'Salutations', component: Salutation },
          { id: 'regions',     label: 'Regions',     component: Region },
          { id: 'races',       label: 'Races',       component: Race },
          { id: 'tags',        label: 'Tags',        component: Tag },
          { id: 'software',    label: 'Softwares',   component: Software },
          { id: 'css_status',  label: 'CSS Status',  component: CssStatus },
        ],
      },
      {
        id: 'company_and_entity',
        label: 'Company & Entity Masters',
        icon: 'ri-building-2-line',
        color: '#405189',
        tabs: [
          { id: 'company-types',       label: 'Company Types',             component: CompanyType },
          { id: 'company-segregation', label: 'Company Segregations',      component: CompanySegregation },
          { id: 'business-entity',     label: 'Business Entities',         component: BusinessEntity },
          { id: 'related-industry',    label: 'Related Industries',        component: RelatedIndustry },
          { id: 'company-ssic-code',   label: 'Company SSIC Codes',        component: CompanySSICCode },
          { id: 'corp-sec-type',       label: 'Corporate Secretary Types', component: CorpSecType },
          { id: 'entity-service-category',      label: 'Entity Service Categorys',           component: EntityServiceCategory },
          { id: 'entity-status',      label: 'Entity Status',              component: EntityStatus },
         { id: 'product-and-service',  label: 'Product And Services',      component: ProductAndService },
         { id: 'group-master',        label: 'Group Master',               component: GroupMaster },
        ],
      },
      {
        id: 'share_and_financial',
        label: 'Share & Financial Masters',
        icon: 'ri-money-dollar-circle-line',
        color: '#f7b84b',
        tabs: [
          { id: 'share-class',      label: 'Share Class',       component: ShareClass },
          { id: 'type-of-fee',      label: 'Type Of Fee',       component: TypeOfFee },
          { id: 'transaction-type', label: 'Transaction Types', component: TransactionType },
        ],
      },
      {
        id: 'template_and_document',
        label: 'Template & Document Masters',
        icon: 'ri-file-text-line',
        color: '#3577f1',
        tabs: [
          { id: 'template-category', label: 'Template Categories', component: TemplateCategory },
          { id: 'register-footer',   label: 'Register Footer',     component: RegisterFooter },
        ],
      },
      {
        id: 'official_and_members',
        label: 'Official / Member Masters',
        icon: 'ri-team-line',
        color: '#f06548',
        tabs: [
          { id: 'member-types', label: 'Member Types', component: MemberType },
          { id: 'official',     label: 'Officials',    component: Official },
          { id: 'official-sub-role',     label: 'Official Sub Roles',    component: OfficialSubRole },
        ],
      },
      {
        id: 'compliance',
        label: 'Compliance Masters',
        icon: 'ri-calendar-event-line',
        color: '#38d0dd',
        tabs: [
           { id: 'company-event-name',  label: 'Company Events',            component: CompanyEventName },
           { id: 'event-rules',         label: 'Event Rules',               component: EventRule },
           { id: 'event-reminder',         label: 'Reminder',               component: Reminder },
           { id: 'jurisdictions',       label: 'Jurisdictions',             component: Jurisdictions },
           { id: 'authorities',         label: 'Authorities',               component: Authorities },
        ],
      },
    ],
  },
];

// ─── Sidebar styles ────────────────────────────────────────────────────────────
const sectionMenuStyles = `
  .settings-side-menu .menu-header {
    padding: 12px 16px 8px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .07em;
    text-transform: uppercase;
    color: var(--vz-sidebar-sub-item-color, #878a99);
    border-bottom: 1px solid var(--vz-border-color);
    margin-bottom: 4px;
  }
  .settings-side-menu .menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: 6px;
    cursor: pointer;
    border-left: 3px solid transparent;
    transition: background 0.15s, border-color 0.15s;
    margin-bottom: 2px;
  }
  .settings-side-menu .menu-item:hover { background: var(--vz-light); }
  .settings-side-menu .menu-item.active {
    background: var(--section-color-bg, rgba(64,81,137,0.1));
    border-left-color: var(--section-color, #405189);
  }
  .settings-side-menu .menu-icon {
    width: 34px; height: 34px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; flex-shrink: 0;
    transition: background 0.15s, color 0.15s;
  }
  .settings-side-menu .menu-text { flex: 1; min-width: 0; }
  .settings-side-menu .menu-text .title {
    display: block; font-size: 13px; font-weight: 500;
    color: var(--vz-body-color); white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
  }
  .settings-side-menu .menu-text .sub {
    display: block; font-size: 11px;
    color: var(--vz-sidebar-sub-item-color, #878a99); margin-top: 1px;
    white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
  }
  .settings-side-menu .menu-chevron {
    font-size: 16px; color: var(--vz-sidebar-sub-item-color, #878a99);
    transition: transform 0.2s;
  }
  .settings-side-menu .menu-item.active .menu-chevron { color: var(--section-color, #405189); }

  /* Group items in accordion */
  .master-accordion { margin-top: 4px; padding: 0 6px; }
  .acc-group-item {
    display: flex; align-items: center; gap: 8px;
    padding: 7px 10px; cursor: pointer;
    border-radius: 4px; margin-bottom: 3px;
    font-size: 12px; color: var(--vz-sidebar-sub-item-color, #878a99);
    transition: background 0.12s, color 0.12s;
    border: 1px solid transparent;
  }
  .acc-group-item:hover { 
    background: var(--vz-light); 
    color: var(--vz-body-color); 
  }
  .acc-group-item.active {
    color: var(--group-color, #405189); font-weight: 500;
    background: var(--group-color-bg, rgba(64,81,137,0.08));
    border-color: var(--group-color-border, rgba(64,81,137,0.2));
  }
  .acc-group-item i.group-icon {
    font-size: 14px;
    flex-shrink: 0;
  }
`;

// ─── Component ─────────────────────────────────────────────────────────────────
const Settings = () => {
  useCollapseSidebar();

  const [activeSection,   setActiveSection]   = useState('general');
  const [activeTab,       setActiveTab]       = useState('');
  const [activeGroup,     setActiveGroup]     = useState(null);
  const [activeGroupTab,  setActiveGroupTab]  = useState(null);

  const handleSectionChange = (sectionId) => {
    const section = SECTIONS.find(s => s.id === sectionId);
    setActiveSection(sectionId);

    if (section.type === 'tabs') {
      setActiveTab(section.tabs[0].id);
      setActiveGroup(null);
      setActiveGroupTab(null);
    } else if (section.type === 'grouped') {
      const firstGroup = section.groups[0];
      setActiveGroup(firstGroup.id);
      setActiveGroupTab(firstGroup.tabs[0].id);
    } else {
      // 'single' — no tab state needed
      setActiveTab('');
      setActiveGroup(null);
      setActiveGroupTab(null);
    }
  };

  const handleGroupChange = (group) => {
    setActiveGroup(group.id);
    setActiveGroupTab(group.tabs[0].id);
  };

  const currentSection = SECTIONS.find(s => s.id === activeSection);

  const getActiveGroup = () => {
    if (currentSection?.type !== 'grouped') return null;
    return currentSection.groups.find(g => g.id === activeGroup);
  };

  document.title = 'Settings | ASR CSS';

  return (
    <div className="page-content">
      <style>{sectionMenuStyles}</style>
      <Container fluid>
        <BreadCrumb title="Settings" pageTitle="ASR CSS" />
        <Row>

          {/* ── Left sidebar ─────────────────────────────────────────────── */}
          <Col lg={2} md={3}>
            <Card className="settings-side-menu">
              <div className="menu-header">Settings</div>
              <CardBody className="p-2">
                {SECTIONS.map(section => (
                  <div key={section.id}>
                    <div
                      className={classnames('menu-item', { active: activeSection === section.id })}
                      onClick={() => handleSectionChange(section.id)}
                      style={{ '--section-color': section.color, '--section-color-bg': `${section.color}1a` }}
                    >
                      <div
                        className="menu-icon"
                        style={activeSection === section.id
                          ? { background: section.color, color: '#fff' }
                          : { background: `${section.color}1a`, color: section.color }
                        }
                      >
                        <i className={section.icon} />
                      </div>
                      <div className="menu-text">
                        <span
                          className="title"
                          style={activeSection === section.id ? { color: section.color } : {}}
                        >{section.label}</span>
                        <span className="sub">{section.subLabel}</span>
                      </div>
                      <i className="ri-arrow-right-s-line menu-chevron" />
                    </div>

                    {/* Accordion for Master Settings groups */}
                    {section.type === 'grouped' && activeSection === section.id && (
                      <div className="master-accordion">
                        {section.groups.map(group => (
                          <div
                            key={group.id}
                            className={classnames('acc-group-item', { active: activeGroup === group.id })}
                            onClick={() => handleGroupChange(group)}
                            style={{
                              '--group-color': group.color,
                              '--group-color-bg': `${group.color}14`,
                              '--group-color-border': `${group.color}33`,
                            }}
                          >
                            <i className={`${group.icon} group-icon`} style={{ color: group.color }} />
                            {group.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardBody>
            </Card>
          </Col>

          {/* ── Right content area ───────────────────────────────────────── */}
          <Col lg={10} md={9}>
            <Card>
              <CardBody>

                {/* ── SINGLE component (Company Profile) ──────────────────── */}
                {currentSection?.type === 'single' && (
                  <currentSection.component />
                )}

                {/* ── FLAT TABS (User Settings, etc.) ─────────────────────── */}
                {currentSection?.type === 'tabs' && (
                  <>
                    <Nav pills className="nav-customs nav-danger mb-3">
                      {currentSection.tabs.map(tab => (
                        <NavItem key={tab.id}>
                          <NavLink
                            className={classnames({ active: activeTab === tab.id })}
                            onClick={() => setActiveTab(tab.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            {tab.label}
                          </NavLink>
                        </NavItem>
                      ))}
                    </Nav>
                    <TabContent activeTab={activeTab}>
                      {currentSection.tabs.map(tab => (
                        <TabPane key={tab.id} tabId={tab.id}>
                          {activeTab === tab.id && <tab.component />}
                        </TabPane>
                      ))}
                    </TabContent>
                  </>
                )}

                {/* ── GROUPED (Master Settings) ────────────────────────────── */}
                {currentSection?.type === 'grouped' && (() => {
                  const currentGroup = getActiveGroup();
                  if (!currentGroup) return null;
                  return (
                    <>
                      <Nav pills className="nav-customs nav-primary mb-3">
                        {currentGroup.tabs.map(tab => (
                          <NavItem key={tab.id}>
                            <NavLink
                              className={classnames({ active: activeGroupTab === tab.id })}
                              onClick={() => setActiveGroupTab(tab.id)}
                              style={{ cursor: 'pointer' }}
                            >
                              {tab.label}
                            </NavLink>
                          </NavItem>
                        ))}
                      </Nav>
                      <TabContent activeTab={activeGroupTab}>
                        {currentGroup.tabs.map(tab => (
                          <TabPane key={tab.id} tabId={tab.id}>
                            {activeGroupTab === tab.id && <tab.component />}
                          </TabPane>
                        ))}
                      </TabContent>
                    </>
                  );
                })()}

              </CardBody>
            </Card>
          </Col>

        </Row>
      </Container>
    </div>
  );
};

export default Settings;
