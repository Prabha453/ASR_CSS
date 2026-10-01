'use strict';

import React from 'react';
import './SharePageStrip.css';

/**
 * Common top strip for all share transaction pages.
 *
 * Props:
 *   companyName   string
 *   currency      string
 *   shareType     string
 *   scType        string | null
 *   actionLabel   string        e.g. "Cancel", "Dissolve", "Transfer"
 *   actionIcon    string        Remix icon class e.g. "ri-scissors-cut-line"
 *   actionVariant string        "cancel" | "dissolve" | "transfer" | "allotment"
 *   extraChip     node | null   optional chip rendered after the action chip
 *   onBack        function
 */
const SharePageStrip = ({
  companyName,
  currency,
  shareType,
  scType,
  actionLabel,
  actionIcon,
  actionVariant = 'default',
  extraChip,
  onBack,
}) => (
  <div className="sps-strip">
    <div className="sps-chips">
      <span className="sps-chip">
        <i className="ri-building-2-line" />
        {companyName}
      </span>

      <i className="ri-arrow-right-s-line sps-sep" />

      <span className="sps-chip">
        <i className="ri-layout-grid-line" />
        {currency} · {shareType}
        {scType && <span className="sps-sc-type">{scType}</span>}
      </span>

      <i className="ri-arrow-right-s-line sps-sep" />

      <span className={`sps-chip sps-chip--${actionVariant}`}>
        <i className={actionIcon} />
        {actionLabel}
      </span>

      {extraChip}
    </div>

    <button className="sps-back" onClick={onBack}>
      <i className="ri-arrow-left-s-line" /> Back
    </button>
  </div>
);

export default SharePageStrip;
