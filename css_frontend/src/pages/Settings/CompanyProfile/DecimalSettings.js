import React from 'react';

const FIELDS = [
  {
    name:   'cp_no_of_share_decimal_place',
    label:  'Number of Shares',
    icon:   'ri-stock-line',
    hint:   'Decimal places used when displaying share counts',
    color:  '#405189',
    sample: 12345,
  },
  {
    name:   'cp_paid_up_share_decimal_place',
    label:  'Paid-up Capital',
    icon:   'ri-money-dollar-circle-line',
    hint:   'Decimal places used for paid-up capital amounts',
    color:  '#0ab39c',
    sample: 9876.5,
  },
  {
    name:   'cp_issued_share_decimal_place',
    label:  'Issued Share Capital',
    icon:   'ri-file-chart-line',
    hint:   'Decimal places used for issued share capital amounts',
    color:  '#f7b84b',
    sample: 54321.25,
  },
];

const preview = (sample, dec) => {
  const d = Number(dec);
  if (isNaN(d) || d < 0) return '—';
  return Number(sample).toLocaleString('en-SG', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
};

const DecimalSettings = ({ formik }) => {
  const set = (name, val) => {
    const n = Math.min(12, Math.max(0, Number(val)));
    formik.setFieldValue(name, isNaN(n) ? 0 : n);
  };

  return (
    <>
      <style>{`
        .ds-wrap { display: flex; flex-direction: column; gap: 12px; max-width: 70%; }
        .ds-row {
          display: grid;
          grid-template-columns: 42px 1fr 126px 110px;
          align-items: center;
          gap: 14px;
          background: var(--vz-card-bg, #fff);
          border: 1px solid var(--vz-border-color, #e9ebec);
          border-radius: 10px;
          padding: 14px 16px;
        }
        .ds-icon {
          width: 42px; height: 42px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
        }
        .ds-label {
          font-size: 13px; font-weight: 600;
          color: var(--vz-body-color); margin-bottom: 2px;
        }
        .ds-hint { font-size: 11px; color: var(--vz-sidebar-sub-item-color, #878a99); }
        .ds-err  { font-size: 11px; color: #f06548; margin-top: 2px; }
        .ds-stepper { display: flex; align-items: center; gap: 6px; }
        .ds-btn {
          width: 30px; height: 30px; border-radius: 6px;
          border: 1px solid var(--vz-border-color, #e9ebec);
          background: var(--vz-light, #f3f6f9);
          color: var(--vz-body-color);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 16px; line-height: 1;
          transition: background 0.15s;
        }
        .ds-btn:hover:not(:disabled) { background: var(--vz-border-color, #e9ebec); }
        .ds-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .ds-input {
          width: 54px; text-align: center;
          border: 1px solid var(--vz-border-color, #e9ebec);
          border-radius: 6px; padding: 4px 6px;
          font-size: 15px; font-weight: 600;
          background: var(--vz-input-bg, #fff);
          color: var(--vz-body-color);
        }
        .ds-input:focus { outline: none; border-color: #405189; box-shadow: 0 0 0 2px rgba(64,81,137,0.15); }
        .ds-preview {
          font-size: 11px; padding: 3px 10px;
          border-radius: 12px; text-align: center;
          font-family: monospace; font-weight: 500;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
      `}</style>

      <div className="ds-wrap">
        {FIELDS.map(f => {
          const val = Number(formik.values[f.name] ?? 0);
          const err = formik.errors[f.name];
          return (
            <div key={f.name} className="ds-row" style={err ? { borderColor: '#f06548' } : {}}>

              <div className="ds-icon" style={{ background: `${f.color}1a`, color: f.color }}>
                <i className={f.icon} />
              </div>

              <div>
                <div className="ds-label">{f.label}</div>
                <div className="ds-hint">{f.hint}</div>
                {err && <div className="ds-err">{err}</div>}
              </div>

              <div className="ds-stepper">
                <button type="button" className="ds-btn" disabled={val <= 0}
                  onClick={() => set(f.name, val - 1)}>−</button>
                <input
                  className="ds-input"
                  type="number" min={0} max={12}
                  value={val}
                  onChange={e => set(f.name, e.target.value)}
                  onBlur={() => formik.setFieldTouched(f.name, true)}
                />
                <button type="button" className="ds-btn" disabled={val >= 12}
                  onClick={() => set(f.name, val + 1)}>+</button>
              </div>

              <div className="ds-preview"
                style={{ background: `${f.color}15`, color: f.color }}
                title="Live preview">
                {preview(f.sample, val)}
              </div>

            </div>
          );
        })}
      </div>
    </>
  );
};

export default DecimalSettings;
