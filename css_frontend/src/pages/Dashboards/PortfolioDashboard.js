import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Col, Container, Row, Spinner, Table } from 'reactstrap';
import ReactApexChart from 'react-apexcharts';
import { toast } from 'react-toastify';

import BreadCrumb from '../../Components/Common/BreadCrumb';
import { getDashboardPortfolioOverview } from '../../helpers/backend_helper';
import '../Individual/IndividualList.css';

const fmtDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' });
};

const KpiCard = ({ icon, color, value, label }) => (
  <Col xl={3} md={6}>
    <div className="il-kpi" style={{ background: `${color}14`, borderColor: `${color}14` }}>
      <div className="il-kpi-icon" style={{ background: color }}><i className={icon} /></div>
      <div>
        <div className="il-kpi-val">{value}</div>
        <div className="il-kpi-lbl">{label}</div>
      </div>
    </div>
  </Col>
);

const EmptyRow = ({ colSpan, children }) => (
  <tr><td colSpan={colSpan} className="text-center text-muted py-3">{children}</td></tr>
);

const PortfolioDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  document.title = 'Portfolio Dashboard | ASR CSS';

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDashboardPortfolioOverview({});
      const payload = res?.data?.data ?? res?.data ?? res;
      setData(payload);
    } catch (err) {
      toast.error(err?.message || 'Failed to load portfolio dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  const upcoming = data?.upcoming?.periods || [];
  const overdue = data?.overdue || { total: 0, top: [] };
  const onTimeRate = data?.on_time_filing_rate || {};
  const pendingDocs = data?.pending_documents || { total: 0, by_status: {}, top: [] };
  const extensionUsage = data?.extension_usage || { total_extensions: 0, by_compliance: [], by_jurisdiction: { buckets: [] }, by_company: [] };
  const notifications = data?.notification_delivery || { counts: {} };

  const upcomingChartOptions = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
    colors: ['#405189'],
    plotOptions: { bar: { borderRadius: 4, columnWidth: '45%' } },
    dataLabels: { enabled: true, style: { fontSize: '11px' } },
    xaxis: { categories: upcoming.map(p => `${p.days}d`) },
    grid: { strokeDashArray: 4 },
    tooltip: { y: { formatter: (val) => `${val} events due` } },
  };
  const upcomingChartSeries = [{ name: 'Upcoming events', data: upcoming.map(p => p.count) }];

  const notificationOptions = {
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: ['Sent', 'Failed', 'Skipped', 'Pending'],
    colors: ['#0ab39c', '#f06548', '#f0b232', '#878a99'],
    legend: { position: 'bottom', fontSize: '11px', markers: { width: 8, height: 8, radius: 4 } },
    dataLabels: { enabled: true, style: { fontSize: '10px', fontWeight: 600 } },
    stroke: { width: 2 },
  };
  const notificationSeries = [
    notifications.counts?.SENT || 0,
    notifications.counts?.FAILED || 0,
    notifications.counts?.SKIPPED || 0,
    notifications.counts?.PENDING || 0,
  ];

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Portfolio Dashboard" pageTitle="Dashboards" infoLink="/compliance/system-guide" />

        {loading ? (
          <div className="text-center py-5"><Spinner /></div>
        ) : (
          <>
            <Row className="g-3 mb-3">
              <KpiCard icon="ri-alert-line" color="#f06548" value={overdue.total} label="Overdue Compliance" />
              <KpiCard
                icon="ri-checkbox-circle-line"
                color="#0ab39c"
                value={onTimeRate.rate_pct === null || onTimeRate.rate_pct === undefined ? '—' : `${onTimeRate.rate_pct}%`}
                label="On-Time Filing Rate"
              />
              <KpiCard icon="ri-file-warning-line" color="#f0b232" value={pendingDocs.total} label="Pending Documents" />
              <KpiCard icon="ri-time-line" color="#405189" value={extensionUsage.total_extensions} label="Extension Usage" />
            </Row>

            <Row className="g-3 mb-3">
              <Col xl={7}>
                <Card className="h-100">
                  <CardHeader><h6 className="mb-0">Upcoming by Period</h6></CardHeader>
                  <CardBody>
                    <ReactApexChart type="bar" options={upcomingChartOptions} series={upcomingChartSeries} height={280} />
                  </CardBody>
                </Card>
              </Col>
              <Col xl={5}>
                <Card className="h-100">
                  <CardHeader>
                    <h6 className="mb-0">Notification Delivery</h6>
                    <div className="text-muted" style={{ fontSize: 11 }}>Last {notifications.window_days || 90} days</div>
                  </CardHeader>
                  <CardBody>
                    <ReactApexChart type="donut" options={notificationOptions} series={notificationSeries} height={240} />
                    {Array.isArray(notifications.not_tracked) && notifications.not_tracked.length > 0 && (
                      <div className="text-muted text-center mt-2" style={{ fontSize: 11 }}>
                        {notifications.not_tracked.join(', ')} not yet tracked
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col xl={6}>
                <Card className="h-100">
                  <CardHeader><h6 className="mb-0">Overdue Compliance</h6></CardHeader>
                  <CardBody className="p-0">
                    <div style={{ overflowX: 'auto' }}>
                      <Table className="table-nowrap mb-0" size="sm">
                        <thead>
                          <tr><th>Entity</th><th>Event</th><th>Due Date</th><th>Days Overdue</th></tr>
                        </thead>
                        <tbody>
                          {overdue.top.length === 0 ? (
                            <EmptyRow colSpan={4}>No overdue events.</EmptyRow>
                          ) : overdue.top.map(row => (
                            <tr key={row.company_event_id}>
                              <td>{row.entity_name || '-'}</td>
                              <td>{row.event_name || '-'}</td>
                              <td>{fmtDate(row.extended_due_date || row.due_date)}</td>
                              <td><span className="badge bg-danger-subtle text-danger">{row.days_overdue}d</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </CardBody>
                </Card>
              </Col>
              <Col xl={6}>
                <Card className="h-100">
                  <CardHeader><h6 className="mb-0">Pending Documents</h6></CardHeader>
                  <CardBody className="p-0">
                    <div style={{ overflowX: 'auto' }}>
                      <Table className="table-nowrap mb-0" size="sm">
                        <thead>
                          <tr><th>Entity</th><th>Document</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          {pendingDocs.top.length === 0 ? (
                            <EmptyRow colSpan={3}>No pending mandatory documents.</EmptyRow>
                          ) : pendingDocs.top.map(row => (
                            <tr key={row.event_document_id}>
                              <td>{row.entity_name || '-'}</td>
                              <td>{row.document_name}</td>
                              <td><span className="badge bg-warning-subtle text-warning">{row.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col xl={6}>
                <Card className="h-100">
                  <CardHeader><h6 className="mb-0">Extension Usage by Compliance</h6></CardHeader>
                  <CardBody className="p-0">
                    <div style={{ overflowX: 'auto' }}>
                      <Table className="table-nowrap mb-0" size="sm">
                        <thead>
                          <tr><th>Compliance Type</th><th># Extensions</th><th>Total Days</th></tr>
                        </thead>
                        <tbody>
                          {extensionUsage.by_compliance.length === 0 ? (
                            <EmptyRow colSpan={3}>No extensions recorded.</EmptyRow>
                          ) : extensionUsage.by_compliance.slice(0, 5).map(row => (
                            <tr key={row.event_slug}>
                              <td>{row.event_slug}</td>
                              <td>{row.count}</td>
                              <td>{row.total_days}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </CardBody>
                </Card>
              </Col>
              <Col xl={6}>
                <Card className="h-100">
                  <CardHeader><h6 className="mb-0">Extension Usage by Jurisdiction</h6></CardHeader>
                  <CardBody className="p-0">
                    {extensionUsage.by_jurisdiction?.note && (
                      <div className="text-muted px-3 pt-2" style={{ fontSize: 11 }}>
                        {extensionUsage.by_jurisdiction.note} Data coverage: {extensionUsage.by_jurisdiction.data_coverage_pct}%.
                      </div>
                    )}
                    <div style={{ overflowX: 'auto' }}>
                      <Table className="table-nowrap mb-0" size="sm">
                        <thead>
                          <tr><th>Country</th><th>Count</th></tr>
                        </thead>
                        <tbody>
                          {(extensionUsage.by_jurisdiction?.buckets || []).length === 0 ? (
                            <EmptyRow colSpan={2}>No extensions recorded.</EmptyRow>
                          ) : extensionUsage.by_jurisdiction.buckets.map(row => (
                            <tr key={row.country}>
                              <td>{row.country}</td>
                              <td>{row.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col xl={6}>
                <Card className="h-100">
                  <CardHeader>
                    <h6 className="mb-0">Filing Performance</h6>
                    <div className="text-muted" style={{ fontSize: 11 }}>Last {onTimeRate.window_days || 365} days</div>
                  </CardHeader>
                  <CardBody>
                    <Row className="g-3 text-center">
                      <Col sm={4}>
                        <div className="border rounded p-3 h-100">
                          <div className="fs-4 fw-semibold">{onTimeRate.total_filed || 0}</div>
                          <div className="text-muted fs-12">Total Filed</div>
                        </div>
                      </Col>
                      <Col sm={4}>
                        <div className="border border-success-subtle bg-success-subtle rounded p-3 h-100">
                          <div className="fs-4 fw-semibold text-success">{onTimeRate.on_time || 0}</div>
                          <div className="text-success fs-12">On Time</div>
                        </div>
                      </Col>
                      <Col sm={4}>
                        <div className="border border-danger-subtle bg-danger-subtle rounded p-3 h-100">
                          <div className="fs-4 fw-semibold text-danger">{onTimeRate.late || 0}</div>
                          <div className="text-danger fs-12">Filed Late</div>
                        </div>
                      </Col>
                    </Row>
                    {Number(onTimeRate.excluded_no_due_date) > 0 && (
                      <div className="text-muted fs-12 mt-3">
                        {onTimeRate.excluded_no_due_date} filing(s) excluded because no due date was available.
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Col>
              <Col xl={6}>
                <Card className="h-100">
                  <CardHeader><h6 className="mb-0">Top Entities Using Extensions</h6></CardHeader>
                  <CardBody className="p-0">
                    <div style={{ overflowX: 'auto' }}>
                      <Table className="table-nowrap mb-0" size="sm">
                        <thead>
                          <tr><th>Entity</th><th className="text-end">Extensions</th></tr>
                        </thead>
                        <tbody>
                          {extensionUsage.by_company.length === 0 ? (
                            <EmptyRow colSpan={2}>No extension usage recorded by entity.</EmptyRow>
                          ) : extensionUsage.by_company.slice(0, 5).map(row => (
                            <tr key={row.entity_id}>
                              <td>{row.entity_name || '-'}</td>
                              <td className="text-end"><span className="badge bg-primary-subtle text-primary">{row.count}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Container>
    </div>
  );
};

export default PortfolioDashboard;
