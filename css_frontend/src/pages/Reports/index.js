import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Card, CardBody, Container } from 'reactstrap';
import BreadCrumb from '../../Components/Common/BreadCrumb';
import { findReport } from '../../common/data/reportCatalog';
import './Reports.css';

const ReportWorkspace = () => {
  const { sectionKey, reportKey } = useParams();
  const selection = findReport(sectionKey, reportKey);

  if (!selection) return <Navigate to="/dashboard" replace />;

  const { section, report } = selection;
  document.title = `${report.label} | Reports | ASR CSS`;

  return (
    <div className="page-content reports-page">
      <Container fluid>
        <BreadCrumb title={report.label} pageTitle="Reports" />

        <section className="reports-hero">
          <div className="reports-hero-icon"><i className={section.icon} /></div>
          <div>
            <span>{section.label}</span>
            <h2>{report.label}</h2>
            <p>Generate and review {report.label.toLowerCase()}.</p>
          </div>
        </section>

        <Card className="reports-card">
          <CardBody className="reports-empty">
            <div className="reports-empty-icon"><i className="ri-file-chart-line" /></div>
            <h5>{report.label}</h5>
            <p>This report workspace is ready for its filters, data columns, and export options.</p>
            <Link to="/dashboard" className="btn btn-light btn-sm">
              <i className="ri-arrow-left-line me-1" /> Back to Dashboard
            </Link>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default ReportWorkspace;
