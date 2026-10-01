import React, { useState } from 'react';
import { Card, CardBody, CardHeader, Collapse } from 'reactstrap';
import SimpleBar from 'simplebar-react';

const STATUS = {
  danger:    { dot: '#ef4444', chip: { bg: '#fef2f2', color: '#dc2626' }, label: 'Overdue'  },
  warning:   { dot: '#f59e0b', chip: { bg: '#fffbeb', color: '#b45309' }, label: 'Due soon' },
  primary:   { dot: '#60a5fa', chip: { bg: '#eff6ff', color: '#1d4ed8' }, label: ''         },
  secondary: { dot: '#cbd5e1', chip: null,                                label: ''         },
};

const DueAlertCard = ({ title, count, items, dragHandleProps, accentColor }) => {
  const [open, setOpen] = useState(true);

  const dangerCount  = items.filter((i) => i.status === 'danger').length;
  const warningCount = items.filter((i) => i.status === 'warning').length;

  return (
    <Card
      className="mb-3 border-0"
      style={{ borderRadius: 12, boxShadow: '0 2px 14px rgba(0,0,0,0.06)', overflow: 'hidden' }}
    >
      {/* ── Coloured top accent ─────────────────────────────── */}
      <div style={{ height: 4, background: accentColor || '#e2e8f0' }} />

      {/* ── Header ─────────────────────────────────────────── */}
      <CardHeader
        className="d-flex align-items-center gap-2 border-0"
        style={{ background: '#fff', padding: '10px 14px', cursor: 'pointer' }}
        onClick={() => setOpen(!open)}
      >
        <div
          {...dragHandleProps}
          style={{ cursor: 'grab', color: '#cbd5e1', flexShrink: 0 }}
          title="Drag"
          onClick={(e) => e.stopPropagation()}
        >
          <i className="ri-drag-move-2-line" style={{ fontSize: 15 }} />
        </div>

        {/* Accent dot */}
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: accentColor, flexShrink: 0, display: 'inline-block' }} />

        <span style={{ fontWeight: 700, fontSize: 12.5, color: '#1e293b', flexGrow: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
          {title}
        </span>

        {/* Right controls */}
        <div className="d-flex align-items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {dangerCount > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 20, padding: '1px 8px' }}>
              {dangerCount} overdue
            </span>
          )}
          {warningCount > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 20, padding: '1px 8px' }}>
              {warningCount} due soon
            </span>
          )}
          <span style={{ fontSize: 10, color: '#64748b', background: '#f1f5f9', borderRadius: 20, padding: '1px 8px' }}>
            {count} total
          </span>
          <button className="btn btn-sm p-0 ms-1" style={{ color: '#94a3b8' }} onClick={(e) => e.stopPropagation()}>
            <i className="ri-filter-3-line" style={{ fontSize: 14 }} />
          </button>
          <button className="btn btn-sm p-0" style={{ color: '#94a3b8' }} onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
            <i className={open ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ fontSize: 17 }} />
          </button>
        </div>
      </CardHeader>

      {/* ── List ────────────────────────────────────────────── */}
      <Collapse isOpen={open}>
        <CardBody style={{ padding: '4px 10px 8px' }}>
          <SimpleBar style={{ maxHeight: 222 }}>
            {items.map((item, idx) => {
              const s = STATUS[item.status] || STATUS.secondary;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '7px 8px',
                    marginBottom: 4,
                    borderRadius: 8,
                    border: '1px solid #f1f5f9',
                    background: '#fff',
                    transition: 'box-shadow 0.15s, border-color 0.15s',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#f1f5f9';
                  }}
                >
                  {/* Priority dot */}
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: s.dot, flexShrink: 0,
                    boxShadow: `0 0 0 3px ${s.dot}22`,
                  }} />

                  {/* Name + date */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12.5, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.company}
                    </div>
                    {item.dateLabel && (
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                        {item.dateLabel}:&nbsp;
                        <span style={{ color: '#64748b', fontWeight: 600 }}>{item.date}</span>
                      </div>
                    )}
                  </div>

                  {/* Status chip */}
                  {s.chip && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      background: s.chip.bg, color: s.chip.color,
                      borderRadius: 6, padding: '2px 8px',
                      flexShrink: 0,
                    }}>
                      {s.label}
                    </span>
                  )}
                </div>
              );
            })}

            {items.length === 0 && (
              <div style={{ textAlign: 'center', padding: '28px 16px', color: '#94a3b8', fontSize: 13 }}>
                <i className="ri-checkbox-circle-line d-block mb-1" style={{ fontSize: 26, color: '#22c55e' }} />
                All clear
              </div>
            )}
          </SimpleBar>
        </CardBody>
      </Collapse>
    </Card>
  );
};

export default DueAlertCard;
