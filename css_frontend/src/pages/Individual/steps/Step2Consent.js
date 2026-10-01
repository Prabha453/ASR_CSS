import React, { useState } from 'react';
import SectionBlock from '../../Company/components/SectionBlock';

const CONSENT_OPTIONS = [
  {
    key:     'noticeEmail',
    label:   'Opt-out from Email Notices',
    desc:    'Individual will not receive notices or updates via email.',
    icon:    'ri-mail-line',
  },
  {
    key:     'noticeApp',
    label:   'Opt-out from Mobile App Notifications',
    desc:    'Individual will not receive in-app push notifications.',
    icon:    'ri-smartphone-line',
  },
  {
    key:     'noticeWhatsapp',
    label:   'Opt-out from WhatsApp Notifications',
    desc:    'Individual will not receive WhatsApp messages.',
    icon:    'ri-whatsapp-line',
  },
];

const Step2Consent = ({ formData, updateFormData }) => {
  const [consent, setConsent] = useState({
    noticeEmail:    formData.noticeEmail    ?? false,
    noticeApp:      formData.noticeApp      ?? false,
    noticeWhatsapp: formData.noticeWhatsapp ?? false,
  });

  const toggle = (key) => {
    const updated = { ...consent, [key]: !consent[key] };
    setConsent(updated);
    updateFormData(updated);
  };

  return (
    <SectionBlock title="Individual Consent Notice">
      <p className="text-muted fs-12 mb-3">
        By default, the individual will receive all notices. Toggle below to opt them out of specific channels.
      </p>
      <div className="d-flex flex-column gap-3">
        {CONSENT_OPTIONS.map(opt => (
          <div
            key={opt.key}
            className="d-flex align-items-center justify-content-between p-3 rounded"
            style={{
              border: `1px solid ${consent[opt.key] ? 'rgba(240,101,72,.3)' : 'var(--vz-border-color)'}`,
              background: consent[opt.key] ? 'rgba(240,101,72,.04)' : 'var(--vz-card-bg)',
              transition: 'all 0.2s',
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded"
                style={{
                  width: 38, height: 38, flexShrink: 0,
                  background: consent[opt.key] ? 'rgba(240,101,72,.1)' : 'rgba(64,81,137,.08)',
                  color: consent[opt.key] ? '#f06548' : '#405189',
                  fontSize: 18,
                }}
              >
                <i className={opt.icon} />
              </div>
              <div>
                <div className="fw-500" style={{ fontSize: 13, color: 'var(--vz-body-color)' }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: 'var(--vz-sidebar-sub-item-color, #878a99)', marginTop: 2 }}>{opt.desc}</div>
              </div>
            </div>
            <div className="form-check form-switch ms-3" style={{ marginBottom: 0 }}>
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                checked={consent[opt.key]}
                onChange={() => toggle(opt.key)}
                style={{ width: 40, height: 22, cursor: 'pointer' }}
              />
            </div>
          </div>
        ))}
      </div>
    </SectionBlock>
  );
};

export default Step2Consent;
