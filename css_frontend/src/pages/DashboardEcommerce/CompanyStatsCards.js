import React from 'react';
import CountUp from 'react-countup';
import { Col, Row } from 'reactstrap';

const Sparkline = ({ data, color, idx }) => {
  const w = 96, h = 38;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pad = 4;
  const pts = data.map((v, i) => [
    pad + (i / (data.length - 1)) * (w - pad * 2),
    pad + (1 - (v - min) / range) * (h - pad * 2),
  ]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h} L${pts[0][0].toFixed(1)},${h} Z`;
  const last = pts[pts.length - 1];
  const gid = `spg${idx}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill={color} stroke="white" strokeWidth="2" />
    </svg>
  );
};

const stats = [
  {
    label: 'Total Companies',
    count: 2481,
    icon: 'ri-building-line',
    color: '#4361ee',
    bg: 'rgba(67,97,238,0.08)',
    trend: [2310, 2340, 2380, 2420, 2460, 2481],
    sub: '+12 this month',
    subColor: '#22c55e',
    subIcon: 'ri-arrow-up-s-line',
  },
  {
    label: 'Total Individuals',
    count: 5840,
    icon: 'ri-group-line',
    color: '#d946a8',
    bg: 'rgba(217,70,168,0.08)',
    trend: [5620, 5680, 5730, 5780, 5820, 5840],
    sub: '+34 this month',
    subColor: '#22c55e',
    subIcon: 'ri-arrow-up-s-line',
  },
  {
    label: 'Post Incorporation',
    count: 426,
    icon: 'ri-building-4-line',
    color: '#0da06e',
    bg: 'rgba(13,160,110,0.08)',
    trend: [385, 395, 405, 412, 418, 426],
    sub: 'Fully registered',
    subColor: '#0da06e',
    subIcon: 'ri-checkbox-circle-line',
  },
  {
    label: 'Pre Incorporation',
    count: 1010,
    icon: 'ri-building-2-line',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    trend: [980, 985, 992, 998, 1004, 1010],
    sub: 'Pending completion',
    subColor: '#f59e0b',
    subIcon: 'ri-time-line',
  },
  {
    label: 'Prospect',
    count: 77,
    icon: 'ri-user-search-line',
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.08)',
    trend: [65, 68, 72, 74, 76, 77],
    sub: 'In pipeline',
    subColor: '#0ea5e9',
    subIcon: 'ri-arrow-right-s-line',
  },
  {
    label: 'Client',
    count: 179,
    icon: 'ri-user-star-line',
    color: '#65a30d',
    bg: 'rgba(101,163,13,0.08)',
    trend: [160, 165, 170, 174, 177, 179],
    sub: 'Active clients',
    subColor: '#65a30d',
    subIcon: 'ri-star-line',
  },
  {
    label: 'Non-Client',
    count: 1044,
    icon: 'ri-building-3-line',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.08)',
    trend: [1010, 1022, 1030, 1036, 1040, 1044],
    sub: 'On record',
    subColor: '#8b5cf6',
    subIcon: 'ri-file-list-line',
  },
];

const CompanyStatsCards = () => (
  <Row className="g-3 mb-4">
    {stats.map((stat, idx) => (
      <Col key={idx} xs={6} sm={4} lg={3} xl>
        <div
          style={{
            background: '#fff',
            borderRadius: 14,
            padding: '15px 16px 11px',
            boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.05)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'box-shadow 0.18s, transform 0.18s',
            cursor: 'default',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.11)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.06)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {/* Decorative tinted blob */}
          <div style={{
            position: 'absolute', right: -18, top: -18,
            width: 80, height: 80, borderRadius: '50%',
            background: stat.bg,
            pointerEvents: 'none',
          }} />

          {/* Label + icon */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.35 }}>
              {stat.label}
            </span>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: stat.color + '18',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, position: 'relative', marginLeft: 6,
            }}>
              <i className={stat.icon} style={{ color: stat.color, fontSize: 15 }} />
            </div>
          </div>

          {/* Big count */}
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: stat.color, lineHeight: 1, marginBottom: 5 }}>
            <CountUp end={stat.count} duration={2} separator="," />
          </div>

          {/* Sub text */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 12 }}>
            <i className={stat.subIcon} style={{ color: stat.subColor, fontSize: 12 }} />
            <span style={{ fontSize: 11, color: stat.subColor, fontWeight: 600 }}>{stat.sub}</span>
          </div>

          {/* Sparkline */}
          <div style={{ marginLeft: -4, marginRight: -4 }}>
            <Sparkline data={stat.trend} color={stat.color} idx={idx} />
          </div>
        </div>
      </Col>
    ))}
  </Row>
);

export default CompanyStatsCards;
