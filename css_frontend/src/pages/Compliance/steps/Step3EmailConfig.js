// steps/Step4EmailConfig.jsx
import React from 'react';
import { Row, Col, Input, Label, Badge, Card, CardBody } from 'reactstrap';

const RECIPIENT_MODES = [
  {
    value: 'SEPARATE',
    icon: 'ri-mail-line',
    title: 'Separate',
    desc: 'Each entity gets an individual email',
  },
  {
    value: 'TOGETHER',
    icon: 'ri-mail-star-line',
    title: 'Together',
    desc: 'All entities grouped in one email',
  },
];

const Step4EmailConfig = ({ formData, updateFormData, emailConfigs, errors }) => {
  const selectedConfig = emailConfigs.find(c => String(c.email_config_id) === String(formData.email_config_id));

  return (
    <div>
          <Row className="g-3">
            <Col md={6}>
              <Label className="form-label fs-12 mb-1">
                Default Sending Email <span className="text-danger">*</span>
              </Label>
              <Input bsSize="sm" type="select" value={formData.email_config_id || ''}
                onChange={(e) => {
                  const config = emailConfigs.find(c => String(c.email_config_id) === String(e.target.value));
                  if (config) {
                    updateFormData({
                      email_config_id: config.email_config_id,
                      sender_email: config.sender_email || '',
                      reply_to_email: config.reply_to_email || '',
                      group_to_recipient: config.group_to_recipient || 'SEPARATE',
                    });
                  } else {
                    updateFormData({ email_config_id: '' });
                  }
                }}
                invalid={errors.some(e => e.toLowerCase().includes('sending email'))}>
                <option value="">Select email configuration</option>
                {emailConfigs.map(config => (
                  <option key={config.email_config_id} value={config.email_config_id}>
                    {config.label}{config.is_default ? ' (Default)' : ''}
                  </option>
                ))}
              </Input>
              {!emailConfigs.length ? (
                <div className="hint-text text-danger mt-1">
                  <i className="ri-error-warning-line me-1"></i>
                  No email configuration found. Please set up in Company Profile.
                </div>
              ) : selectedConfig?.sender_email ? (
                <div className="text-muted mt-1 fs-10 d-flex align-items-center gap-1">
                  <i className="ri-send-plane-line"></i>
                  Sends from <span className="fw-medium text-body">{selectedConfig.sender_email}</span>
                </div>
              ) : null}
            </Col>

            <Col md={6}>
              <Label className="form-label fs-12 mb-1">
                Reply Email <span className="text-danger">*</span>
              </Label>
              <Input bsSize="sm" type="email" placeholder="reply@example.com"
                value={formData.reply_to_email || ''} onChange={(e) => updateFormData({ reply_to_email: e.target.value })}
                invalid={errors.some(e => e.toLowerCase().includes('reply email'))} />
              <div className="text-muted mt-1 fs-10">Replies from recipients will land here.</div>
            </Col>
          </Row>
      {/* Section: Recipient Grouping */}

        <div className="py-3 mb-1">
          <Label className="form-label fs-12 mb-2">To Recipient Mode</Label>
          <Row className="g-2">
            {RECIPIENT_MODES.map(mode => {
              const active = formData.group_to_recipient === mode.value;
              return (
                <Col md={6} key={mode.value}>
                  <div
                    role="button"
                    tabIndex={0}
                    className={`recipient-mode-card ${active ? 'active' : ''}`}
                    onClick={() => updateFormData({ group_to_recipient: mode.value })}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && updateFormData({ group_to_recipient: mode.value })}
                  >
                    <div className="recipient-mode-icon">
                      <i className={mode.icon}></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2">
                        <span className="recipient-mode-title">{mode.title}</span>
                        {active && (
                          <Badge color="primary-subtle" className="text-primary-emphasis fw-medium">Selected</Badge>
                        )}
                      </div>
                      <div className="recipient-mode-desc">{mode.desc}</div>
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
          <div className="text-muted mt-2 fs-10">
            {formData.group_to_recipient === 'SEPARATE'
              ? 'Each company will receive a separate email notification.'
              : 'All selected companies will receive a single combined email.'}
          </div>
       </div>

      {errors.length > 0 && (
        <div className="mt-3 alert alert-danger py-2">
          {errors.map((err, i) => (
            <div key={i} className="fs-12"><i className="ri-error-warning-line me-1"></i>{err}</div>
          ))}
        </div>
      )}

      <style>{`
        .recipient-mode-card {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 12px;
          border: 1px solid var(--vz-border-color);
          border-radius: 8px;
          background: var(--vz-white);
          cursor: pointer;
          transition: all .15s ease;
          height: 100%;
        }
        .recipient-mode-card:hover {
          border-color: rgba(var(--vz-primary-rgb),.5);
          background: var(--vz-primary-bg-subtle);
        }
        .recipient-mode-card.active {
          border-color: var(--vz-primary);
          background: var(--vz-primary-bg-subtle);
        }
        .recipient-mode-icon {
          width: 30px;
          height: 30px;
          min-width: 30px;
          border-radius: 6px;
          background: var(--vz-primary-bg-subtle);
          color: var(--vz-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }
        .recipient-mode-card.active .recipient-mode-icon {
          background: var(--vz-primary);
          color: var(--vz-white);
        }
        .recipient-mode-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--vz-primary-text-emphasis);
        }
        .recipient-mode-desc {
          font-size: 11.5px;
          color: var(--vz-gray-600);
          margin-top: 1px;
        }
      `}</style>
    </div>
  );
};

export default Step4EmailConfig;