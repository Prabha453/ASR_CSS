import React, { useState } from 'react';
import { Card, CardBody, CardHeader, Col, Row, Nav, NavItem, NavLink } from 'reactstrap';
import ReactApexChart from 'react-apexcharts';

/* ── Shared colours (match stat cards) ──────────────────────────── */
const C = {
  agm: '#4361ee',
  ar:  '#f59e0b',
  cei: '#0da06e',
  egm: '#8b5cf6',
};

const MONTHS = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026'];

/* ── Filings bar chart ───────────────────────────────────────────── */
const FILINGS_SERIES = [
  { name: 'AGM Filed', data: [18, 24, 31, 22, 28, 35] },
  { name: 'AR Filed',  data: [22, 18, 27, 33, 24, 30] },
  { name: 'CEI Filed', data: [8,  12,  9, 15, 11, 14] },
  { name: 'EGM Filed', data: [3,   5,  4,  6,  5,  7]  },
];

const FILINGS_OPTIONS = {
  chart: {
    type: 'bar',
    toolbar: { show: false },
    fontFamily: 'inherit',
    animations: { enabled: true, easing: 'easeinout', speed: 600 },
  },
  plotOptions: {
    bar: {
      borderRadius: 5,
      borderRadiusApplication: 'end',
      columnWidth: '58%',
      dataLabels: { position: 'top' },
    },
  },
  colors: [C.agm, C.ar, C.cei, C.egm],
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'light',
      type: 'vertical',
      shadeIntensity: 0.25,
      opacityFrom: 1,
      opacityTo: 0.78,
      stops: [0, 100],
    },
  },
  dataLabels: { enabled: false },
  legend: {
    show: true,
    position: 'top',
    horizontalAlign: 'right',
    fontSize: '11px',
    labels: { colors: '#64748b' },
    markers: { width: 9, height: 9, radius: 3 },
    itemMargin: { horizontal: 8 },
  },
  xaxis: {
    categories: MONTHS,
    labels: { style: { fontSize: '11px', colors: '#94a3b8' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      style: { fontSize: '11px', colors: '#94a3b8' },
      formatter: (v) => v,
    },
    title: { text: 'No. of Filings', style: { fontSize: '11px', color: '#94a3b8', fontWeight: 500 } },
  },
  grid: {
    strokeDashArray: 5,
    borderColor: '#f1f5f9',
    xaxis: { lines: { show: false } },
  },
  tooltip: {
    shared: true,
    intersect: false,
    y: { formatter: (val) => `${val} filings` },
    style: { fontSize: '12px' },
  },
  states: {
    hover: { filter: { type: 'lighten', value: 0.08 } },
    active: { filter: { type: 'darken', value: 0.1 } },
  },
};

/* ── Compliance % area chart ─────────────────────────────────────── */
const COMPLIANCE_SERIES = [
  { name: 'Compliant', data: [72, 68, 74, 80, 76, 83] },
  { name: 'Overdue',   data: [28, 32, 26, 20, 24, 17] },
];

const COMPLIANCE_OPTIONS = {
  chart: {
    type: 'area',
    toolbar: { show: false },
    fontFamily: 'inherit',
    animations: { enabled: true, easing: 'easeinout', speed: 600 },
  },
  colors: ['#0da06e', '#ef4444'],
  fill: {
    type: 'gradient',
    gradient: { opacityFrom: 0.3, opacityTo: 0.02, stops: [0, 100] },
  },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 2.5 },
  xaxis: {
    categories: MONTHS,
    labels: { style: { fontSize: '11px', colors: '#94a3b8' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    max: 100,
    labels: {
      style: { fontSize: '11px', colors: '#94a3b8' },
      formatter: (v) => `${v}%`,
    },
  },
  grid: { strokeDashArray: 5, borderColor: '#f1f5f9' },
  legend: {
    position: 'top',
    horizontalAlign: 'right',
    fontSize: '11px',
    labels: { colors: '#64748b' },
    markers: { width: 9, height: 9, radius: 3 },
  },
  tooltip: {
    y: { formatter: (val) => `${val}%` },
    style: { fontSize: '12px' },
  },
};

/* ── Company Portfolio donut ─────────────────────────────────────── */
const DONUT_SERIES = [1850, 220, 280, 131];

const DONUT_OPTIONS = {
  chart: { type: 'donut', fontFamily: 'inherit' },
  labels: ['Active', 'Dormant', 'Struck Off', 'Dissolved'],
  colors: ['#0da06e', '#f59e0b', '#ef4444', '#94a3b8'],
  legend: {
    position: 'bottom',
    fontSize: '11px',
    labels: { colors: '#64748b' },
    markers: { width: 9, height: 9, radius: 3 },
  },
  dataLabels: {
    enabled: true,
    style: { fontSize: '10px', fontWeight: 600 },
    dropShadow: { enabled: false },
  },
  plotOptions: {
    pie: {
      donut: {
        size: '68%',
        labels: {
          show: true,
          name: { fontSize: '12px', color: '#64748b' },
          value: {
            fontSize: '22px', fontWeight: 700, color: '#0f2044',
            formatter: (val) => Number(val).toLocaleString(),
          },
          total: {
            show: true, label: 'Total', color: '#64748b', fontSize: '12px',
            formatter: () => '2,481',
          },
        },
      },
    },
  },
  stroke: { width: 2, colors: ['#fff'] },
  tooltip: { y: { formatter: (val) => `${val.toLocaleString()} companies` } },
};

/* ── Summary pills shown above the filings chart ─────────────────── */
const FILING_TOTALS = [
  { label: 'AGM',   total: 158, color: C.agm, bg: 'rgba(67,97,238,0.09)'   },
  { label: 'AR',    total: 154, color: C.ar,  bg: 'rgba(245,158,11,0.09)'  },
  { label: 'CEI',   total: 69,  color: C.cei, bg: 'rgba(13,160,110,0.09)'  },
  { label: 'EGM',   total: 30,  color: C.egm, bg: 'rgba(139,92,246,0.09)'  },
];

/* ── Component ───────────────────────────────────────────────────── */
const DashboardCharts = ({ dragHandleProps }) => {
  const [tab, setTab] = useState('filings');

  return (
    <Row className="g-3 mb-3">
      {/* Left: bar / area chart */}
      <Col xl={8}>
        <Card className="h-100 border-0" style={{ boxShadow: '0 2px 14px rgba(0,0,0,0.06)', borderRadius: 12 }}>
          <CardHeader
            className="d-flex align-items-center border-0"
            style={{ background: '#fff', borderRadius: '12px 12px 0 0', padding: '12px 16px 10px' }}
          >
            {/* Drag handle */}
            <div
              {...dragHandleProps}
              style={{ cursor: 'grab', color: '#cbd5e1', lineHeight: 1, marginRight: 8, flexShrink: 0 }}
              title="Drag to reorder"
            >
              <i className="ri-drag-move-2-line fs-5" />
            </div>

            {/* Icon + title */}
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(67,97,238,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0 }}>
              <i className="ri-bar-chart-grouped-line" style={{ color: C.agm, fontSize: 14 }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', flexGrow: 1 }}>
              Compliance Activity Overview
            </span>

            {/* Tab pills */}
            <Nav pills className="nav-sm ms-auto gap-1">
              {[['filings', 'Filings'], ['compliance', 'Compliance %']].map(([key, label]) => (
                <NavItem key={key}>
                  <NavLink
                    className={`py-1 px-2 fs-11 ${tab === key ? 'active' : ''}`}
                    style={{ cursor: 'pointer', borderRadius: 6 }}
                    onClick={() => setTab(key)}
                  >
                    {label}
                  </NavLink>
                </NavItem>
              ))}
            </Nav>
          </CardHeader>

          {/* Summary pills (filings tab only) */}
          {tab === 'filings' && (
            <div style={{ display: 'flex', gap: 8, padding: '4px 16px 8px', flexWrap: 'wrap' }}>
              {FILING_TOTALS.map((f) => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 5, background: f.bg, borderRadius: 20, padding: '3px 10px' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: f.color, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: f.color }}>{f.label}</span>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{f.total} total</span>
                </div>
              ))}
            </div>
          )}

          <CardBody style={{ padding: '0 12px 8px' }}>
            {tab === 'filings' ? (
              <ReactApexChart
                type="bar"
                options={FILINGS_OPTIONS}
                series={FILINGS_SERIES}
                height={268}
              />
            ) : (
              <ReactApexChart
                type="area"
                options={COMPLIANCE_OPTIONS}
                series={COMPLIANCE_SERIES}
                height={268}
              />
            )}
          </CardBody>
        </Card>
      </Col>

      {/* Right: donut chart */}
      <Col xl={4}>
        <Card className="h-100 border-0" style={{ boxShadow: '0 2px 14px rgba(0,0,0,0.06)', borderRadius: 12 }}>
          <CardHeader
            className="d-flex align-items-center border-0"
            style={{ background: '#fff', borderRadius: '12px 12px 0 0', padding: '12px 16px 10px' }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(13,160,110,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0 }}>
              <i className="ri-pie-chart-2-line" style={{ color: '#0da06e', fontSize: 14 }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', flexGrow: 1 }}>
              Company Portfolio
            </span>
            <span style={{ background: 'rgba(13,160,110,0.1)', color: '#0da06e', fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '3px 10px' }}>
              2,481 total
            </span>
          </CardHeader>
          <CardBody style={{ padding: '0 12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <ReactApexChart type="donut" options={DONUT_OPTIONS} series={DONUT_SERIES} height={292} />
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
};

export default DashboardCharts;
