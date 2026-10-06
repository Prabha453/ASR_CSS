import React, { useState } from 'react';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import { Link } from 'react-router-dom';

// Quick Access launcher (top bar grid icon) — shortcuts to the most-used pages
const QUICK_LINKS = [
  { label: 'Entities',     icon: 'ri-building-line',       color: '#405189', to: '/company/list' },
  { label: 'Individuals',  icon: 'ri-user-3-line',         color: '#0ab39c', to: '/individuals' },
  { label: 'Officials',    icon: 'ri-team-line',           color: '#6559cc', to: '/officials/entity' },
  { label: 'Events',       icon: 'ri-calendar-event-line', color: '#f7b84b', to: '/compliance/events' },
  { label: 'Due Dates',    icon: 'ri-alarm-warning-line',  color: '#f06548', to: '/compliance/due-date-tracker' },
  { label: 'Reports',      icon: 'ri-file-chart-line',     color: '#299cdb', to: '/reports/company/company-hierarchy' },
  { label: 'Form Builder', icon: 'ri-file-list-3-line',    color: '#3577f1', to: '/form-builder/form-template' },
  { label: 'Users',        icon: 'ri-user-settings-line',  color: '#e83e8c', to: '/user-management/users' },
  { label: 'Settings',     icon: 'ri-settings-3-line',     color: '#878a99', to: '/settings' },
];

const quickAccessStyles = `
  .qa-menu { width: 300px; }
  .qa-head {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 16px; border-bottom: 1px dashed var(--vz-border-color);
  }
  .qa-head i { font-size: 16px; color: var(--vz-primary, #405189); }
  .qa-head h6 { margin: 0; font-size: 14px; font-weight: 600; }
  .qa-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 8px; }
  .qa-tile {
    display: flex; flex-direction: column; align-items: center; gap: 7px;
    padding: 12px 4px 10px; border-radius: 8px;
    font-size: 12px; font-weight: 500; color: var(--vz-body-color); text-decoration: none;
    transition: background .15s, color .15s;
  }
  .qa-tile:hover { background: var(--vz-light, #f3f6f9); color: var(--qa-color); }
  .qa-icon {
    width: 40px; height: 40px; border-radius: 10px;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 19px; color: var(--qa-color); background: var(--qa-soft);
    transition: transform .15s, background .15s, color .15s;
  }
  .qa-tile:hover .qa-icon { transform: translateY(-2px); background: var(--qa-color); color: #fff; }
`;

const WebAppsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(o => !o);

  return (
    <React.Fragment>
      <style>{quickAccessStyles}</style>
      <Dropdown isOpen={isOpen} toggle={toggle} className="topbar-head-dropdown ms-1 header-item">
        <DropdownToggle tag="button" type="button" title="Quick Access"
          className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle">
          <i className='bx bx-category-alt fs-22'></i>
        </DropdownToggle>
        <DropdownMenu className="qa-menu p-0 dropdown-menu-end">
          <div className="qa-head">
            <i className="ri-flashlight-line"></i>
            <h6>Quick Access</h6>
          </div>
          <div className="qa-grid">
            {QUICK_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="qa-tile"
                style={{ '--qa-color': link.color, '--qa-soft': `${link.color}1a` }}
                onClick={() => setIsOpen(false)}
              >
                <span className="qa-icon"><i className={link.icon}></i></span>
                {link.label}
              </Link>
            ))}
          </div>
        </DropdownMenu>
      </Dropdown>
    </React.Fragment>
  );
};

export default WebAppsDropdown;
