import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Button, Card, CardBody, Col, Container, Row, Table } from 'reactstrap';

import BreadCrumb from '../../Components/Common/BreadCrumb';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';

const steps = [
  ['1', 'Company setup', 'Create the entity and maintain incorporation date, financial year end, registration number, country and services.'],
  ['2', 'Jurisdiction & authority', 'Select the applicable jurisdiction and confirm who is authorized to prepare, approve, file and receive notices.'],
  ['3', 'Rules evaluation', 'The configured rule uses event type, jurisdiction, entity facts and trigger date to calculate applicability and due date.'],
  ['4', 'Event creation', 'Create AGM, AR, ECI, Anniversary or a custom event. System events may be generated from company dates.'],
  ['5', 'Documents & preparation', 'Assign owners, collect mandatory documents, prepare forms and move the event through preparation and approval.'],
  ['6', 'Exception decision', 'Where permitted, record an exemption, waiver, dispense action or extension with reason, dates and approval evidence.'],
  ['7', 'Reminder delivery', 'Configure TO/CC/BCC recipients and reminder dates. Cron sends notices and records accepted, failed, skipped and invalid recipients.'],
  ['8', 'File & close', 'Record filing/meeting completion, filing date and reference, then retain documents and the audit trail.'],
];

const eventExamples = [
  { event: 'AGM', trigger: 'Financial year end', documents: 'Financial statements; directors’ report; AGM notice and agenda; proxy form; attendance/proxy records; signed minutes/resolutions.', outcome: 'Meeting held, or exemption/dispensation recorded where applicable.' },
  { event: 'AR — Annual Return', trigger: 'AGM/FYE or statutory anniversary rule', documents: 'Current entity particulars; officers and shareholders register; registered-office details; financial-statement data; filing approval; submission receipt.', outcome: 'Annual return filed and acknowledgement/reference stored.' },
  { event: 'ECI — Estimated Chargeable Income', trigger: 'Financial year end', documents: 'Management accounts; tax computation/estimate; revenue declaration; supporting schedules; submission acknowledgement.', outcome: 'ECI submitted or exemption reason recorded.' },
  { event: 'Anniversary / Annual Filing', trigger: 'Incorporation or registration anniversary', documents: 'Updated registration particulars; beneficial ownership/officer changes; accounts where required; approval; filing receipt.', outcome: 'Annual filing completed and next cycle scheduled.' },
  { event: 'EGM / Custom Event', trigger: 'Board/client decision or configured date', documents: 'Notice; agenda; explanatory statement; proxy form; attendance; resolutions; signed minutes; any event-specific checklist items.', outcome: 'Meeting/action completed with evidence retained.' },
];

const sampleRows = [
  ['Merlion Sample Pte. Ltd.', 'AGM', '31 Dec 2025', '30 Jun 2026', 'AWAITING_DOCUMENTS', 'Asha Tan'],
  ['Merlion Sample Pte. Ltd.', 'Annual Return', '30 Jun 2026', '31 Jul 2026', 'IN_PREPARATION', 'Daniel Lim'],
  ['Harbour Demo Pte. Ltd.', 'ECI', '31 Mar 2026', '30 Jun 2026', 'READY_TO_FILE', 'Tax Team'],
  ['Orchid Example LLP', 'Anniversary Filing', '15 Aug 2026', '15 Sep 2026', 'PENDING', 'Mei Wong'],
];

const singaporeRules = [
  ['AGM — non-listed company', 'ACRA', 'Company type = non-listed', 'Financial Year End', '+6 months', '10', 'ACTIVE'],
  ['AGM — listed company', 'ACRA', 'Company type = listed', 'Financial Year End', '+4 months', '20', 'ACTIVE'],
  ['Annual Return — non-listed', 'ACRA', 'No overseas branch register', 'Financial Year End', '+7 months', '10', 'ACTIVE'],
  ['Annual Return — listed', 'ACRA', 'No overseas branch register', 'Financial Year End', '+5 months', '20', 'ACTIVE'],
  ['ECI', 'IRAS', 'Required unless waiver applies', 'Financial Year End', '+3 months', '10', 'ACTIVE'],
];

const referenceFields = [
  ['Financial Year End (FYE)', 'AGM, Annual Return, ECI and many tax events'],
  ['Incorporation Date', 'Anniversary events and first-cycle rules only when legislation specifically uses it'],
  ['AGM Date', 'Filings explicitly measured from the actual AGM date'],
  ['Tax / Accounting Period End', 'GST, VAT or corporate-tax events tied to a tax period'],
  ['Previous Event Due/Completion Date', 'Recurring or dependent events where the governing rule requires it'],
];

const Section = ({ color, icon, title, children }) => (
  <Card className="guide-section border-0 shadow-sm">
    <div className="guide-heading" style={{ background: color }}><i className={`${icon} me-2`} />{title}</div>
    <CardBody>{children}</CardBody>
  </Card>
);

const ComplianceSystemGuide = () => {
  useCollapseSidebar();
  const navigate = useNavigate();
  document.title = 'Compliance System Guide | ASR CSS';

  return (
    <div className="page-content compliance-guide">
      <style>{`
        .compliance-guide .guide-hero { background: linear-gradient(120deg,#405189,#299cdb); color:#fff; border-radius:14px; padding:26px; }
        .compliance-guide .guide-heading { color:#fff; padding:12px 18px; border-radius:10px 10px 0 0; font-size:15px; font-weight:700; letter-spacing:.01em; }
        .compliance-guide .flow-step { display:flex; gap:12px; height:100%; padding:14px; border:1px solid var(--vz-border-color); border-radius:10px; background:var(--vz-card-bg); }
        .compliance-guide .step-no { width:30px; height:30px; flex:0 0 30px; display:flex; align-items:center; justify-content:center; border-radius:50%; background:#405189; color:#fff; font-weight:700; }
        .compliance-guide .guide-nav { position:relative; background:var(--vz-card-bg); border:1px solid var(--vz-border-color); border-radius:10px; padding:10px; box-shadow:0 2px 6px rgba(23,31,60,.06); }
        .compliance-guide .guide-nav a { white-space:nowrap; }
        .compliance-guide .guide-section, .compliance-guide [id] { scroll-margin-top:90px; }
      `}</style>
      <Container fluid>
        <BreadCrumb title="Compliance System Guide" pageTitle="Compliance" pageTitleLink="/compliance/events" />
        <div className="guide-hero mb-3">
          <Button size="sm" color="light" className="mb-3" onClick={() => navigate(-1)}><i className="ri-arrow-left-line me-1" />Back</Button>
          <h2 className="text-white">From company setup to completed filing</h2>
          <p className="mb-0 opacity-75">A practical guide to events, rules, due dates, documents, exceptions, reminders and audit evidence.</p>
        </div>

        <div className="guide-nav d-flex gap-2 flex-wrap mb-3">
          <a className="btn btn-sm btn-soft-primary" href="#flow">Full flow</a>
          <a className="btn btn-sm btn-soft-success" href="#events">Events & documents</a>
          <a className="btn btn-sm btn-soft-info" href="#rules">Jurisdiction & rules</a>
          <a className="btn btn-sm btn-soft-primary" href="#singapore-rules">Singapore defaults</a>
          <a className="btn btn-sm btn-soft-info" href="#reference-logic">Reference logic</a>
          <a className="btn btn-sm btn-soft-warning" href="#exceptions">Exceptions</a>
          <a className="btn btn-sm btn-soft-danger" href="#reminders">Reminders</a>
          <a className="btn btn-sm btn-soft-dark" href="#sample">Sample data</a>
        </div>

        <div id="flow"><Section color="#405189" icon="ri-route-line" title="End-to-End Compliance Flow">
          <Row className="g-3">{steps.map(([no, title, text]) => <Col lg={6} key={no}><div className="flow-step"><div className="step-no">{no}</div><div><h6>{title}</h6><p className="text-muted mb-0">{text}</p></div></div></Col>)}</Row>
        </Section></div>

        <div id="events"><Section color="#0ab39c" icon="ri-calendar-check-line" title="AGM, AR and Other Event Examples">
          <div className="alert alert-info">Document checklists are configurable examples. The responsible professional must confirm current jurisdiction-specific requirements.</div>
          <div className="table-responsive"><Table bordered hover className="align-middle mb-0"><thead className="table-light"><tr><th>Event</th><th>Typical trigger</th><th>Example document checklist</th><th>Completion evidence</th></tr></thead><tbody>{eventExamples.map(row => <tr key={row.event}><td className="fw-semibold text-success">{row.event}</td><td>{row.trigger}</td><td style={{ minWidth:300 }}>{row.documents}</td><td>{row.outcome}</td></tr>)}</tbody></Table></div>
        </Section></div>

        <div id="rules"><Section color="#299cdb" icon="ri-scales-3-line" title="Jurisdiction, Authorization and Rules">
          <Row className="g-3"><Col md={4}><h6>Jurisdiction</h6><p className="text-muted">Country and entity type determine which rules can apply. Maintain incorporation/FYE dates and registration facts before calculating events.</p></Col><Col md={4}><h6>Authorization</h6><p className="text-muted">Define preparer, reviewer, approver, filing authority and notification recipients. Keep approval evidence and restrict actions by role.</p></Col><Col md={4}><h6>Rules</h6><p className="text-muted">A rule should record trigger, offset, business/calendar-day handling, recurrence, effective dates, required documents and support for extensions or waivers.</p></Col></Row>
          <div className="mt-3 p-3 bg-light rounded"><strong>Example:</strong> Singapore sample company → FYE 31 Dec 2025 → AGM rule calculates 30 Jun 2026 → AR rule calculates 31 Jul 2026. <Badge color="warning">Illustrative only</Badge></div>
        </Section></div>

        <div id="singapore-rules"><Section color="#405189" icon="ri-government-line" title="Singapore Default Event Rules">
          <div className="alert alert-primary">
            <strong>Recommended initial master:</strong> Country = Singapore, jurisdiction left blank only when the rule is nationwide, priority controls which matching rule wins, and status must be ACTIVE before calculation. More-specific company-type rules should have higher priority.
          </div>
          <div className="table-responsive">
            <Table bordered hover className="align-middle mb-3">
              <thead className="table-primary"><tr><th>Event</th><th>Authority</th><th>Condition</th><th>Reference</th><th>Calculation</th><th>Priority</th><th>Status</th></tr></thead>
              <tbody>{singaporeRules.map(rule => <tr key={rule[0]}>{rule.map((value, index) => <td key={index}>{index === 6 ? <Badge color="success">{value}</Badge> : value}</td>)}</tr>)}</tbody>
            </Table>
          </div>
          <Row className="g-3">
            <Col lg={4}><div className="p-3 h-100 rounded border border-primary-subtle bg-primary-subtle"><h6 className="text-primary">AGM example</h6><div>FYE: <strong>31 Dec 2026</strong></div><div>Rule: <strong>+6 months</strong></div><div>Due: <strong>30 Jun 2027</strong></div></div></Col>
            <Col lg={4}><div className="p-3 h-100 rounded border border-success-subtle bg-success-subtle"><h6 className="text-success">Annual Return example</h6><div>FYE: <strong>31 Dec 2026</strong></div><div>Rule: <strong>+7 months</strong></div><div>Due: <strong>31 Jul 2027</strong></div></div></Col>
            <Col lg={4}><div className="p-3 h-100 rounded border border-info-subtle bg-info-subtle"><h6 className="text-info">ECI example</h6><div>FYE: <strong>31 Dec 2026</strong></div><div>Rule: <strong>+3 months</strong></div><div>Due: <strong>31 Mar 2027</strong></div></div></Col>
          </Row>
          <div className="alert alert-warning mt-3 mb-3">
            <strong>First AGM:</strong> Keep first-year treatment as a separate, disabled rule template—not a universal +9-month default. Activate it only after confirming that the entity type, FYE and applicable law support that treatment. Current ACRA guidance distinguishes listed/non-listed status and calculates from FYE.
          </div>
          <div className="p-3 rounded bg-light mb-3">
            <h6>ECI waiver decision (separate from due-date calculation)</h6>
            <code>IF annual revenue ≤ S$5,000,000 AND ECI = NIL → filing status = WAIVED</code>
            <p className="text-muted fs-12 mt-2 mb-0">The ECI amount for this test is before applicable tax exemptions. Store the revenue, NIL assessment, assessment year, evidence and decision timestamp in the waiver audit record.</p>
          </div>
          <Row className="g-3">
            <Col md={6}><div className="border rounded p-3 h-100"><h6>Authority hierarchy</h6><pre className="mb-0 text-body">{`Singapore
├── ACRA
│   ├── AGM
│   └── Annual Return
└── IRAS
    ├── ECI
    ├── Corporate Income Tax
    └── GST`}</pre></div></Col>
            <Col md={6}><div className="border rounded p-3 h-100"><h6>Official references</h6><ul className="mb-0"><li><a href="https://www.acra.gov.sg/register/business/registering-different-business-structures/local-company/choosing-a-companys-financial-year-end/" target="_blank" rel="noreferrer">ACRA — FYE, AGM and AR deadlines</a></li><li><a href="https://www.acra.gov.sg/manage/companies/legal-requirements-common-offences/holding-annual-general-meetings/due-dates-requirements/" target="_blank" rel="noreferrer">ACRA — AGM requirements and exemptions</a></li><li><a href="https://www.iras.gov.sg/taxes/corporate-income-tax/estimated-chargeable-income-%28eci%29-filing" target="_blank" rel="noreferrer">IRAS — ECI filing and waiver</a></li></ul></div></Col>
          </Row>
        </Section></div>

        <div id="reference-logic"><Section color="#299cdb" icon="ri-calculator-line" title="Reference Logic: How the Due Date Is Calculated">
          <p>The reference is the company date from which the calculation starts. The engine should evaluate:</p>
          <div className="text-center p-3 mb-3 rounded bg-info-subtle text-info fw-semibold">Reference Field → Counter → Duration → End-of-Month Policy → Calendar Adjustment → Due Date</div>
          <div className="table-responsive"><Table bordered className="mb-3"><thead className="table-info"><tr><th>Reference field</th><th>Typical use</th></tr></thead><tbody>{referenceFields.map(row => <tr key={row[0]}><td className="fw-semibold">{row[0]}</td><td>{row[1]}</td></tr>)}</tbody></Table></div>
          <Row className="g-3"><Col md={6}><div className="border rounded p-3 h-100"><h6>Calculation fields to store</h6><ul className="mb-0"><li>Reference field and captured reference value</li><li>Positive/negative counter and duration unit</li><li>End-of-month behavior</li><li>Calendar-day or business-day adjustment</li><li>Rule ID/version and calculation timestamp</li></ul></div></Col><Col md={6}><div className="border rounded p-3 h-100"><h6>Rule selection order</h6><ol className="mb-0"><li>Match country and jurisdiction.</li><li>Match authority and event.</li><li>Evaluate entity-type and first/subsequent-year conditions.</li><li>Select the highest-priority active rule.</li><li>Save both calculated and effective due dates for audit.</li></ol></div></Col></Row>
        </Section></div>

        <div id="exceptions"><Section color="#f0b232" icon="ri-git-branch-line" title="Exemption, Waiver, Dispense and Extension">
          <Row className="g-3"><Col md={3}><h6>Exemption</h6><p className="text-muted mb-0">The obligation does not apply when eligibility conditions are met.</p></Col><Col md={3}><h6>Waiver</h6><p className="text-muted mb-0">An authorized decision releases a requirement; record authority and evidence.</p></Col><Col md={3}><h6>Dispense</h6><p className="text-muted mb-0">Used for supported AGM flows where holding the meeting is dispensed with.</p></Col><Col md={3}><h6>Extension</h6><p className="text-muted mb-0">Moves the effective due date after approval. Preserve original date, new date, reason and history.</p></Col></Row>
        </Section></div>

        <div id="reminders"><Section color="#f06548" icon="ri-notification-3-line" title="Reminder and Escalation Flow">
          <ol className="mb-0"><li>Create reminder dates relative to the effective due date.</li><li>Select internal/external TO, CC and BCC recipients.</li><li>Cron resolves valid addresses and sends the configured template.</li><li>Reminder Logs record accepted, failed, rejected, invalid and skipped delivery results.</li><li>Review failures, correct recipients and resend where business rules permit.</li></ol>
          <div className="mt-3 d-flex gap-2 flex-wrap"><Link className="btn btn-sm btn-soft-primary" to="/compliance/events-reminder">Reminder Dates</Link><Link className="btn btn-sm btn-soft-danger" to="/compliance/reminder-logs">Reminder Logs</Link><Link className="btn btn-sm btn-soft-warning" to="/compliance/due-date-tracker">Due Date Tracker</Link></div>
        </Section></div>

        <div id="sample"><Section color="#6f42c1" icon="ri-flask-line" title="Sample Client Scenario">
          <div className="alert alert-warning"><strong>Sample data only:</strong> The names, dates, owners and statuses below are fictional and must not be treated as legal advice or live client records.</div>
          <div className="table-responsive"><Table bordered className="mb-0"><thead className="table-light"><tr><th>Company</th><th>Event</th><th>Trigger</th><th>Due date</th><th>Status</th><th>Owner</th></tr></thead><tbody>{sampleRows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cellIndex === 4 ? <Badge color={cell === 'READY_TO_FILE' ? 'success' : cell === 'AWAITING_DOCUMENTS' ? 'danger' : 'warning'}>{cell}</Badge> : cell}</td>)}</tr>)}</tbody></Table></div>
        </Section></div>
      </Container>
    </div>
  );
};

export default ComplianceSystemGuide;
