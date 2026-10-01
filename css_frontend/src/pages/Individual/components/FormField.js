import React from 'react';
import { Col, Label, Button } from 'reactstrap';

const FormField = ({
  label,
  icon = null,
  required = false,
  md = 4,
  children,

  // Optional
  isEditMode = false,
  onChange,
  onHistory,
}) => (
  <Col md={md}>
    <div className="d-flex justify-content-between align-items-center mb-1">
      <Label className="form-label fs-12 mb-0">
        {icon && <i className={`${icon} me-1`} style={{ color: '#405189' }}></i>}
        {label}
        {required && <span className="text-danger"> *</span>}
      </Label>

      {isEditMode && (onChange || onHistory) && (
        <div className="d-flex gap-1">
          {onChange && (
            <Button
              type="button"
              size="sm"
              color="info"
              style={{
                padding: '0px 6px',
                fontSize: 10,
                lineHeight: 1.6,
              }}
              onClick={onChange}
            >
              <i className="ri-edit-2-line me-1"></i>
              Change
            </Button>
          )}

          {onHistory && (
            <Button
              type="button"
              size="sm"
              color="info"
              style={{
                padding: '0px 6px',
                fontSize: 10,
                lineHeight: 1.6,
              }}
              onClick={onHistory}
            >
              <i className="ri-history-line me-1"></i>
              History
            </Button>
          )}
        </div>
      )}
    </div>

    {children}
  </Col>
);

export default FormField;
