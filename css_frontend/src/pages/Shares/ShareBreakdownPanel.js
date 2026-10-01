import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import './ShareBreakdownPanel.css';

export const PIE_COLORS = [
  '#405189','#0ab39c','#f7b84b','#f06548',
  '#299cdb','#45cb85','#e83e8c','#6f42c1','#20c997','#fd7e14',
];

const buildPieData = (shares) => {
  if (!shares.length) return null;
  const classCount = {};
  shares.forEach(s => {
    const key = s.share_class?.sc_name || `Class ${s.share_class_id}`;
    classCount[key] = (classCount[key] || 0) + 1;
  });
  const allGuar  = shares.every(s => s.share_type === 'GUARANTEE');
  const getValue = (s) => allGuar
    ? (parseFloat(s.guarantee_amount) || 0)
    : (parseFloat(s.number_of_shares) || 0);
  const total = shares.reduce((a, s) => a + getValue(s), 0);
  const rows = shares.map(s => {
    const name     = s.share_class?.sc_name || `Class ${s.share_class_id}`;
    const type     = s.share_class?.sc_type || '';
    const currency = s.currency || '';
    const ps       = parseFloat(s.per_share) || 0;
    const psStr    = ps % 1 === 0 ? ps.toFixed(0) : ps.toFixed(2);
    const count    = getValue(s);
    const pct      = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
    let label      = name;
    if (type) label += ` [${type}]`;
    if (classCount[name] > 1 && ps > 0) label += ` (per share ${psStr})`;
    return { label, name, type, currency, ps, psStr, count, pct };
  });
  return { rows, series: rows.map(r => r.count), labels: rows.map(r => r.label), total, allGuar };
};

const BreakdownTable = ({ rows, allGuar }) => (
  <div className="sbp-table-wrap">
    <table className="sbp-table">
      <colgroup>
        <col style={{ width: 180 }} />
        <col style={{ width: 90 }} />
        <col style={{ width: 90 }} />
        <col style={{ width: 110 }} />
        <col style={{ width: 170 }} />
      </colgroup>
      <thead>
        <tr>
          <th>Share Class</th>
          <th>Currency</th>
          <th>Per Share</th>
          <th>{allGuar ? 'Guarantee Amt' : 'No. of Shares'}</th>
          <th>Allocation</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => {
          const color = PIE_COLORS[i % PIE_COLORS.length];
          return (
            <tr key={i}>
              <td className="sbp-class-cell" style={{ boxShadow: `inset 4px 0 0 ${color}` }}>
                <div className="sbp-class-inner">
                  <span className="sbp-class-name">{row.name}</span>
                  {row.type && <span className="sbp-type">{row.type}</span>}
                </div>
              </td>
              <td><span className="sbp-currency">{row.currency || '—'}</span></td>
              <td className="sbp-ps">{row.ps > 0 ? row.psStr : '—'}</td>
              <td className="sbp-num">{Number(row.count).toLocaleString()}</td>
              <td>
                <div className="sbp-alloc">
                  <div className="sbp-bar-wrap">
                    <div className="sbp-bar" style={{ width: `${row.pct}%`, background: color }} />
                  </div>
                  <span>{row.pct}%</span>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const ShareBreakdownPanel = ({ shares = [], chartKey, layout = 'side' }) => {
  const pieData = useMemo(() => buildPieData(shares), [shares]);

  if (!pieData) return (
    <div className="sbp-empty">
      <i className="ri-donut-chart-line" /> No share data available
    </div>
  );

  const chartOptions = {
    labels: pieData.labels,
    chart: {
      type: 'donut',
      toolbar: { show: false },
      animations: {
        enabled: true,
        speed: 900,
        animateGradually: { enabled: true, delay: 180 },
        dynamicAnimation: { enabled: true, speed: 500 },
      },
    },
    legend: { show: false },
    dataLabels: {
      enabled: true,
      formatter: val => `${Number(val).toFixed(1)}%`,
      style: { fontSize: '11px', fontWeight: 600 },
      dropShadow: { enabled: false },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name:  { show: true, fontSize: '11px', color: '#878a99', offsetY: -4 },
            value: { show: true, fontSize: '20px', fontWeight: 700, offsetY: 4, formatter: v => Number(v).toLocaleString() },
            total: {
              show: true, label: pieData.allGuar ? 'Total Guarantee' : 'Total Shares', fontSize: '11px', color: '#878a99',
              formatter: () => pieData.total.toLocaleString(),
            },
          },
        },
      },
    },
    stroke: { show: false },
    tooltip: { y: { formatter: v => Number(v).toLocaleString() + (pieData.allGuar ? ' guarantee' : ' shares') } },
    colors: PIE_COLORS,
  };

  const chart = (
    <div className={`sbp-donut sbp-donut--${layout}`}>
      <ReactApexChart
        key={chartKey}
        dir="ltr"
        type="donut"
        series={pieData.series}
        options={chartOptions}
        height={layout === 'side' ? 290 : 260}
        className="apex-charts"
      />
    </div>
  );

  return (
    <div className={`sbp-wrap sbp-wrap--${layout}`}>
      {chart}
      <BreakdownTable rows={pieData.rows} allGuar={pieData.allGuar} />
    </div>
  );
};

export default ShareBreakdownPanel;
