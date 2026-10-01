import React from 'react';
import { Col, Row } from 'reactstrap';
import { Link } from 'react-router-dom';

const Section = ({ rightClickBtn }) => {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div
      className="rounded-3 mb-4 px-4 py-3"
      style={{
        background: 'linear-gradient(120deg, #0d1b3e 0%, #0e4d74 52%, #0c7a65 100%)',
        boxShadow: '0 6px 28px rgba(13,27,62,0.28)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle decorative circles */}
      <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 60, bottom: -60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
      <Row className="align-items-center">
        <Col md={6} className="mb-3 mb-md-0">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.2)' }}
            >
              <i className="ri-government-line fs-2 text-white" />
            </div>
            <div>
              <h4 className="mb-0 fw-bold text-white lh-sm">Corporate Secretarial System</h4>
              <p className="mb-0 fs-12" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Compliance &amp; Governance Command Centre
              </p>
              <div className="mt-1 d-flex align-items-center gap-1">
                <span
                  className="rounded-pill px-2 py-0"
                  style={{ background: 'rgba(0,200,130,0.25)', color: '#7fffd4', fontSize: '10px', border: '1px solid rgba(0,200,130,0.3)' }}
                >
                  ● Live
                </span>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>{today}</span>
              </div>
            </div>
          </div>
        </Col>

        <Col md={6}>
          <div className="d-flex flex-wrap gap-2 justify-content-md-end">
            <Link
              to="#"
              className="btn btn-sm fw-medium"
              style={{ background: 'rgba(255,255,255,0.92)', color: '#0f2044', border: 'none', fontSize: '12px' }}
            >
              <i className="ri-add-circle-line me-1" />Company Onboarding
            </Link>
            <Link
              to="#"
              className="btn btn-sm fw-medium"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', fontSize: '12px' }}
            >
              <i className="ri-file-list-3-line me-1" />File Returns
            </Link>
            <Link
              to="#"
              className="btn btn-sm fw-medium"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', fontSize: '12px' }}
            >
              <i className="ri-bar-chart-2-line me-1" />Reports
            </Link>
            <Link
              to="#"
              className="btn btn-sm fw-medium"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', fontSize: '12px' }}
            >
              <i className="ri-calendar-event-line me-1" />Calendar
            </Link>
            <button
              type="button"
              className="btn btn-sm fw-medium"
              title="Recent Activity"
              onClick={rightClickBtn}
              style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', fontSize: '12px', width: 34, padding: 0 }}
            >
              <i className="ri-pulse-line" />
            </button>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Section;
