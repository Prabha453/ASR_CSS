import React from 'react';

const CheckboxCard = ({ label, checked, onChange }) => (
  <div className={`cw-cb ${checked ? 'checked' : ''}`} onClick={onChange}>
    <div className="cw-cb-box">
      {checked && <i className="ri-check-line" style={{ fontSize: '10px', color: '#fff' }}></i>}
    </div>
    {label}
  </div>
);

export default CheckboxCard;