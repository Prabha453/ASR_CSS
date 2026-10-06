import React from 'react';
import classnames from 'classnames';
import './SettingsTabBar.css';

/**
 * Settings tab bar — every tab as a wrapping chip (the sidebar already shows the section title).
 *
 * Props
 *   tabs      [{ id, label, alert? }]   alert = show a small red dot (e.g. duplicate values)
 *   active    id of the active tab
 *   onChange  fn(id)
 *   color     accent colour (section / group colour)
 */
const SettingsTabBar = ({ tabs, active, onChange, color = '#405189' }) => (
  <div className="stab-wrap" style={{ '--stab-color': color, '--stab-soft': `${color}14`, '--stab-shadow': `${color}55` }}>
    <div className="stab-chips" role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={classnames('stab', { active: active === tab.id })}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.alert && <span className="stab-alert" title="Needs attention" />}
        </button>
      ))}
    </div>
  </div>
);

export default SettingsTabBar;
