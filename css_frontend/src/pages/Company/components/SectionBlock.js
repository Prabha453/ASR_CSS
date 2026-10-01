import React from 'react';

const SectionBlock = ({ title, children }) => (
  <div className="cw-section">
    <div className="cw-section-head">
      <span className="cw-section-dot"></span>
      <span>{title}</span>
    </div>
    <div className="cw-section-body">{children}</div>
  </div>
);

export default SectionBlock;