import React, { useState } from 'react';
import {
  Container, Row, Col, Card, CardBody,
  TabContent, TabPane,
} from 'reactstrap';
import classnames from 'classnames';
import BreadCrumb        from '../../Components/Common/BreadCrumb';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import SettingsTabBar    from './Components/SettingsTabBar';

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
        navLabel: 'Common',   // sidebar label (block title already says Master Settings)
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
        navLabel: 'Company & Entity',   // sidebar label (block title already says Master Settings)
        icon: 'ri-building-2-line',
        color: '#405189',
        tabs: [
          { id: 'company-types',       label: 'Company Types',             component: CompanyType },
          { id: 'company-segregation', label: 'Company Segregations',      component: CompanySegregation },
          { id: 'business-entity',     label: 'Business Entities',         component: BusinessEntity },
          { id: 'related-industry',    label: 'Related Industries',        component: RelatedIndustry },
          { id: 'company-ssic-code',   label: 'Company SSIC Codes',        component: CompanySSICCode },
          { id: 'corp-sec-type',       label: 'Corporate Secretary Types', component: CorpSecType },
          { id: 'entity-service-category',      label: 'Entity Service Categories',           component: EntityServiceCategory },
          { id: 'entity-status',      label: 'Entity Status',              component: EntityStatus },
         { id: 'product-and-service',  label: 'Product And Services',      component: ProductAndService },
         { id: 'group-master',        label: 'Group Master',               component: GroupMaster },
        ],
      },
      {
        id: 'share_and_financial',
        label: 'Share & Financial Masters',
        navLabel: 'Share & Financial',   // sidebar label (block title already says Master Settings)
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
        navLabel: 'Templates & Documents',   // sidebar label (block title already says Master Settings)
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
        navLabel: 'Officials & Members',   // sidebar label (block title already says Master Settings)
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
        navLabel: 'Compliance',   // sidebar label (block title already says Master Settings)
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
  .settings-nav { padding: 2px 0 6px; }
  /* Block title: small uppercase label followed by a thin line (same pattern as "NEW APPOINTMENT") */
  .settings-nav .snav-block-title {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 10px 4px;
    font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
    color: var(--vz-secondary-color, #6c757d); white-space: nowrap;
  }
  .settings-nav .snav-block-title::after {
    content: ''; flex: 1; height: 1px; background: var(--vz-border-color);
  }
  .settings-nav .snav-block-title:not(:first-child) { margin-top: 8px; }
  .settings-nav .snav-item {
    position: relative;
    display: flex; align-items: center; gap: 8px;
    margin: 1px 4px; padding: 4px 6px;
    border-radius: 6px; cursor: pointer; user-select: none;
    font-size: 12.5px; font-weight: 500; color: var(--vz-body-color);
    transition: background .15s, color .15s;
  }
  .settings-nav .snav-item:hover { background: var(--vz-light, #f3f6f9); }
  .settings-nav .snav-item.active {
    background: var(--snav-bg); color: var(--snav-color); font-weight: 600;
  }
  .settings-nav .snav-item.active::before {
    content: ''; position: absolute; left: -4px; top: 6px; bottom: 6px;
    width: 3px; border-radius: 0 3px 3px 0; background: var(--snav-color);
  }
  .settings-nav .snav-icon {
    width: 26px; height: 26px; flex-shrink: 0; border-radius: 6px;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 14px; color: var(--snav-color); background: var(--snav-bg);
    transition: background .15s, color .15s;
  }
  .settings-nav .snav-item.active .snav-icon { background: var(--snav-color); color: #fff; }
  .settings-nav .snav-label { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .settings-nav .snav-count {
    flex-shrink: 0; min-width: 20px; height: 18px; padding: 0 6px; border-radius: 9px;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 10.5px; font-weight: 700;
    color: var(--vz-sidebar-sub-item-color, #878a99); background: var(--vz-light, #f3f6f9);
  }
  .settings-nav .snav-item.active .snav-count { color: var(--snav-color); background: #fff; }

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
              <nav className="settings-nav">
                {/* General: single / tabbed sections */}
                <div className="snav-block-title">General</div>
                {SECTIONS.filter(sec => sec.type !== 'grouped').map(sec => (
                  <div
                    key={sec.id}
                    className={classnames('snav-item', { active: activeSection === sec.id })}
                    style={{ '--snav-color': sec.color, '--snav-bg': `${sec.color}14` }}
                    title={sec.subLabel}
                    onClick={() => handleSectionChange(sec.id)}
                  >
                    <span className="snav-icon"><i className={sec.icon} /></span>
                    <span className="snav-label">{sec.label}</span>
                    {sec.type === 'tabs' && <span className="snav-count">{sec.tabs.length}</span>}
                  </div>
                ))}

                {/* Master settings: groups listed directly */}
                {SECTIONS.filter(sec => sec.type === 'grouped').map(sec => (
                  <React.Fragment key={sec.id}>
                    <div className="snav-block-title">{sec.label}</div>
                    {sec.groups.map(group => {
                      const isActive = activeSection === sec.id && activeGroup === group.id;
                      return (
                        <div
                          key={group.id}
                          className={classnames('snav-item', { active: isActive })}
                          style={{ '--snav-color': group.color, '--snav-bg': `${group.color}14` }}
                          title={group.label}
                          onClick={() => {
                            if (activeSection !== sec.id) setActiveSection(sec.id);
                            handleGroupChange(group);
                          }}
                        >
                          <span className="snav-icon"><i className={group.icon} /></span>
                          <span className="snav-label">{group.navLabel || group.label}</span>
                          <span className="snav-count">{group.tabs.length}</span>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </nav>
            </Card>
          </Col>

          {/* ── Right content area ───────────────────────────────────────── */}
          <Col lg={10} md={9}>
            <Card>
              <CardBody>

                {/* ── SINGLE component (Company Profile) ──────────────────── */}
                {currentSection?.type === 'single' && (
                  <currentSection.component section={currentSection} />
                )}

                {/* ── FLAT TABS (User Settings, etc.) ─────────────────────── */}
                {currentSection?.type === 'tabs' && (
                  <>
                    <SettingsTabBar
                      tabs={currentSection.tabs}
                      active={activeTab}
                      onChange={setActiveTab}
                      color={currentSection.color}
                    />
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
                      <SettingsTabBar
                        tabs={currentGroup.tabs}
                        active={activeGroupTab}
                        onChange={setActiveGroupTab}
                        color={currentGroup.color}
                      />
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
