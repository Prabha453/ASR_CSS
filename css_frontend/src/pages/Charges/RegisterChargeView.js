import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container, Row, Col, Card, CardBody,
  Nav, NavItem, NavLink, TabContent, TabPane,
  Spinner, Modal, ModalHeader, ModalBody, ModalFooter, Button,
} from 'reactstrap';
import classnames from 'classnames';
import { toast } from 'react-toastify';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import { getRegisterCharge, deleteRegisterCharge, getEntityList } from '../../helpers/backend_helper';

import {
  CHARGES_STATEMENT_LODGED_OPTS,
  CHARGES_PARTICULARS_OPTS,
  CHARGES_LODGEMENT_OPTS,
  CHARGES_INSTRUMENT_DESC_OPTS,
  CHARGES_INSTRUMENT_OPTS,
  getFilledRegistrationFields,   // ← import
} from '../../helpers/common_helper';

// ─────────────────────────────────────────────────────────────────────────────
// Entity join helpers  (same logic as the form's helper functions)
// ─────────────────────────────────────────────────────────────────────────────

const getEntityById = (list = [], id) =>
  list.find(e => String(e.entity_id) === String(id)) || null;

const getEntityPrimaryAddress = (entity) => {
  if (!entity?.addresses?.length) return null;
  return entity.addresses.find(a => a.is_primary) ?? entity.addresses[0];
};

const formatAddress = (addr) => {
  if (!addr) return '';
  return [
    addr.block_no, addr.street_name, addr.building_name,
    addr.level_no, addr.unit_no, addr.city,
    addr.state, addr.postal_code, addr.country,
  ].filter(Boolean).join(', ');
};

const getEntityPrimaryIdentification = (entity) => {
  if (!entity?.identifications?.length) return null;
  return entity.identifications.find(i => i.is_primary) ?? entity.identifications[0];
};

const getEntityCountry = (entity) =>
  entity?.company_detail?.country ||
  entity?.identifications?.[0]?.id_issued_country ||
  '';

/**
 * Given a raw chargee row and the full entity list, return enriched display fields.
 * This mirrors exactly what getCorporateChargeeDisplay / getIndividualChargeeDisplay
 * do in the form — client-side join so nothing needs to be stored in the DB.
 */
const enrichChargee = (chargee, entityList) => {
  const enriched = { ...chargee };

  if (chargee.chargee_type === '1' && chargee.chargee_company_entity_id) {
    const entity  = getEntityById(entityList, chargee.chargee_company_entity_id);
    if (entity) {
      const country = getEntityCountry(entity);
      const addr    = getEntityPrimaryAddress(entity);
      const regFields = getFilledRegistrationFields(entity, country);

      enriched.display_name              = entity.name || '';
      enriched.display_country_of_incorp = country;
      enriched.display_address           = formatAddress(addr);
      enriched.display_reg_fields        = regFields;   // [{key, label, value}]
    }
  }

  if (chargee.chargee_type === '2' && chargee.chargee_individual_entity_id) {
    const entity = getEntityById(entityList, chargee.chargee_individual_entity_id);
    if (entity) {
      const ident = getEntityPrimaryIdentification(entity);
      const addr  = getEntityPrimaryAddress(entity);

      enriched.display_name        = entity.name || '';
      enriched.display_id_number   = ident?.id_number || '';
      enriched.display_nationality = ident?.id_issued_country || addr?.country || '';
      enriched.display_address     = formatAddress(addr);
    }
  }

  return enriched;
};

// ─────────────────────────────────────────────────────────────────────────────
// Generic helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-SG', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return d; }
};

const getTypeLabel = (value, options) => {
  if (!value) return '—';
  const found = options.find(o => o.value === String(value));
  return found ? found.label : value;
};

const getChargeNameLabel = (value) => {
  const map = {
    '1': 'Charge on debentures',        '2': 'Charge on uncalled share capital',
    '3': 'Charge on subsidiary shares', '4': 'Charge created by instrument',
    '5': 'Charge on land',              '6': 'Charge on book debts',
    '7': 'Floating charge',             '8': 'Charge on calls not paid',
    '9': 'Charge on ship / aircraft',   '10': 'Charge on goodwill / IP',
  };
  return map[value] || value || '—';
};

const getChargeeTypeLabel = (c) => {
  if (!c) return '—';
  return c.chargee_type === '1' ? 'Corporate' : c.chargee_type === '2' ? 'Individual' : '—';
};

const formatAmount = (chargee) => {
  if (!chargee) return '—';
  if (chargee.chargee_secures_all_monies === '1')
    return <span className="text-muted fst-italic">All monies</span>;
  if (chargee.chargee_amount_secured) {
    const cur = chargee.chargee_currency || '';
    return (
      <span className="text-success fw-bold">
        {cur} {Number(chargee.chargee_amount_secured).toLocaleString()}
      </span>
    );
  }
  return '—';
};

const getFileSize = (bytes) => {
  if (!bytes) return '';
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const InfoRow = ({ label, value, children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
    <span style={{
      fontSize: 11, color: 'var(--vz-sidebar-sub-item-color,#878a99)',
      minWidth: 140, flexShrink: 0, paddingTop: 1,
    }}>{label}</span>
    <span style={{ fontSize: 12, color: 'var(--vz-body-color)', fontWeight: 500 }}>
      {children || value || <span className="text-muted">—</span>}
    </span>
  </div>
);

const SectionHead = ({ icon, title, count }) => (
  <div className="d-flex align-items-center gap-2 mb-3">
    <div style={{
      width: 26, height: 26, borderRadius: 6,
      background: 'rgba(64,81,137,.1)', color: '#405189',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
    }}>
      <i className={icon} />
    </div>
    <span className="fw-semibold" style={{ fontSize: 13, color: 'var(--vz-body-color)' }}>{title}</span>
    {count != null && (
      <span style={{
        marginLeft: 'auto', fontSize: 10, fontWeight: 700,
        padding: '1px 7px', borderRadius: 20,
        background: 'rgba(64,81,137,.08)', color: '#405189',
      }}>{count}</span>
    )}
  </div>
);

const Empty = ({ icon, text }) => (
  <div className="text-center py-5 text-muted">
    <i className={icon} style={{ fontSize: 38, opacity: .2, display: 'block', marginBottom: 8 }} />
    <p className="fs-13 mb-0">{text}</p>
  </div>
);

/**
 * RegFieldsBox — renders the registration fields returned by getFilledRegistrationFields.
 * Singapore: UEN No. + ACRA ID | Others: FBRN / UF No. / Domestic Bus. No. / ACRA ID
 */
const RegFieldsBox = ({ regFields = [], country = '' }) => {
  if (!regFields.length) return (
    <InfoRow label="Registration">
      <span className="text-muted fst-italic" style={{ fontSize: 11 }}>No registration numbers on record</span>
    </InfoRow>
  );
  return (
    <>
      {regFields.map(f => (
        <InfoRow key={f.key} label={f.label} value={f.value} />
      ))}
    </>
  );
};

/**
 * ChargeeCard — uses enriched display fields joined from entity list.
 * Falls back gracefully when entity data isn't available.
 */
const ChargeeCard = ({ chargee, index }) => {
  const isCorp = chargee.chargee_type === '1';
  const isInd  = chargee.chargee_type === '2';

  return (
    <div style={{
      border: '1px solid var(--vz-border-color)',
      borderLeft: `3px solid ${isCorp ? '#405189' : '#0ab39c'}`,
      borderRadius: 6, marginBottom: 10, overflow: 'hidden',
      background: 'var(--vz-card-bg, #fff)',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px', background: 'rgba(64,81,137,.04)',
        borderBottom: '1px solid var(--vz-border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: 12, fontWeight: 700, color: '#405189',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className="ri-user-line" />
          Chargee #{index + 1}
          <span style={{
            fontSize: 10, padding: '2px 10px', borderRadius: 20, fontWeight: 600,
            background: isCorp ? 'rgba(64,81,137,.1)' : 'rgba(10,179,156,.1)',
            color: isCorp ? '#405189' : '#0ab39c',
          }}>
            {getChargeeTypeLabel(chargee)}
          </span>
        </span>
        {chargee.chargee_secures_all_monies === '1' && (
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
            background: 'rgba(251,191,36,.15)', color: '#92400e',
          }}>
            All Monies
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '10px 14px' }}>

        {/* Name — from entity join */}
        <InfoRow label="Name" value={chargee.display_name || '—'} />

        {/* ── Corporate fields ── */}
        {isCorp && (
          <>
            {/* Registration fields — country-aware via getFilledRegistrationFields */}
            <RegFieldsBox
              regFields={chargee.display_reg_fields || []}
              country={chargee.display_country_of_incorp}
            />
            <InfoRow label="Country of Incorp" value={chargee.display_country_of_incorp || '—'} />
            <InfoRow label="Address"            value={chargee.display_address || '—'} />
          </>
        )}

        {/* ── Individual fields ── */}
        {isInd && (
          <>
            <InfoRow label="ID Number"    value={chargee.display_id_number   || '—'} />
            <InfoRow label="Nationality"  value={chargee.display_nationality || '—'} />
            <InfoRow label="Address"      value={chargee.display_address     || '—'} />
          </>
        )}

        <InfoRow label="Amount Secured">{formatAmount(chargee)}</InfoRow>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const RegisterChargeView = () => {
  useCollapseSidebar();
  const { id }   = useParams();
  const navigate = useNavigate();

  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [delModal,  setDelModal]  = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  document.title = 'View Register Charge | ASR CSS';

  useEffect(() => {
    (async () => {
      try {
        // Fetch charge and entity list in parallel
        const [chargeRes, entRes] = await Promise.all([
          getRegisterCharge(id),
          getEntityList(),
        ]);

        const charge     = chargeRes?.data?.data ?? chargeRes?.data ?? chargeRes;
        const extract    = r => r?.data?.data ?? r?.data ?? r ?? [];
        const entityList = extract(entRes);

        // Enrich each chargee with display fields from the entity list
        const enrichedChargees = (charge.chargees || []).map(c =>
          enrichChargee(c, entityList)
        );

        setData({ ...charge, chargees: enrichedChargees });
      } catch {
        toast.error('Failed to load charge details');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteRegisterCharge(id);
      toast.success('Charge deleted successfully');
      navigate('/entity/register-charges-list');
    } catch {
      toast.error('Failed to delete charge');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
        <Spinner color="primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="text-center py-5">
            <i className="ri-file-unknow-line" style={{ fontSize: 48, color: '#405189', opacity: .3 }} />
            <p className="mt-2 text-muted">Charge not found.</p>
            <Link to="/entity/register-charges-list" className="btn btn-primary btn-sm">Back to List</Link>
          </div>
        </Container>
      </div>
    );
  }

  const chargees  = data.chargees  || [];
  const documents = data.documents || [];
  const typeLabel = getChargeNameLabel(data.type_of_charge);

  const TABS = [
    { id: 'overview',   label: 'Overview',   icon: 'ri-layout-grid-line' },
    { id: 'chargees',   label: 'Chargees',   icon: 'ri-group-line',   count: chargees.length },
    { id: 'documents',  label: 'Documents',  icon: 'ri-attachment-2', count: documents.length },
  ];

  const STATS = [
    { label: 'Chargees',  value: chargees.length },
    { label: 'Documents', value: documents.length },
  ];

  return (
    <div className="page-content">
      <Container fluid>

        {/* Breadcrumb */}
        <div className="page-title-box d-sm-flex align-items-center justify-content-between mb-3">
          <h4 className="mb-sm-0" style={{ fontSize: 16 }}>Charge Details</h4>
          <ol className="breadcrumb m-0">
            <li className="breadcrumb-item"><Link to="#">Entity</Link></li>
            <li className="breadcrumb-item"><Link to="/entity/register-charges-list">Register Charges</Link></li>
            <li className="breadcrumb-item active">View</li>
          </ol>
        </div>

        {/* Hero + Tabs card */}
        <Card className="p-0 mb-3" style={{ borderRadius: 12, overflow: 'visible' }}>

          {/* Gradient header */}
          <div style={{
            background: 'linear-gradient(135deg, #405189 0%, #6559cc 55%, #299cdb 100%)',
            borderRadius: '12px 12px 0 0',
            padding: '16px 22px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', right: -40, top: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.07)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: 140, bottom: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.04)', pointerEvents: 'none' }} />

            <div className="d-flex flex-wrap align-items-center gap-3" style={{ position: 'relative' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(255,255,255,.2)', color: '#fff', fontSize: 24,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2.5px solid rgba(255,255,255,.45)',
                boxShadow: '0 4px 16px rgba(0,0,0,.22)', flexShrink: 0,
              }}>
                <i className="ri-file-list-3-line" />
              </div>

              <div style={{ flex: 1, minWidth: 160 }}>
                <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                    Charge #{data.charge_number || '—'}
                  </span>
                  <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,.18)', color: '#fff' }}>
                    {typeLabel}
                  </span>
                </div>
                <div className="d-flex flex-wrap gap-3" style={{ fontSize: 11, color: 'rgba(255,255,255,.72)' }}>
                  <span><i className="ri-building-line me-1" />{data.company_name || data.company_id || '—'}</span>
                  <span><i className="ri-calendar-line me-1" />Registered {fmtDate(data.registration_date)}</span>
                </div>
              </div>

              <div className="d-flex align-items-center gap-4"
                style={{ borderRight: '1px solid rgba(255,255,255,.2)', paddingRight: 20 }}>
                {STATS.map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1, color: '#fff' }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.65)', marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="d-flex gap-2">
                <Link to="/entity/register-charges-list"
                  className="d-flex align-items-center gap-1"
                  style={{ fontSize: 11, padding: '5px 12px', borderRadius: 6, background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.25)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  <i className="ri-arrow-left-line" /> Back
                </Link>
                <Link to={`/entity/register-charges-update/${id}`}
                  className="d-flex align-items-center gap-1"
                  style={{ fontSize: 11, padding: '5px 12px', borderRadius: 6, background: 'rgba(240,178,50,.75)', color: '#fff', border: '1px solid rgba(240,178,50,.4)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  <i className="ri-pencil-line" /> Edit
                </Link>
                <button
                  className="d-flex align-items-center gap-1"
                  style={{ fontSize: 11, padding: '5px 12px', borderRadius: 6, background: 'rgba(240,101,72,.7)', color: '#fff', border: '1px solid rgba(240,101,72,.4)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onClick={() => setDelModal(true)}>
                  <i className="ri-delete-bin-line" /> Delete
                </button>
              </div>
            </div>
          </div>

          {/* Tab nav */}
          <Nav tabs style={{ borderBottom: '1px solid var(--vz-border-color)', margin: 0, padding: '0 10px', background: 'var(--vz-card-bg)' }}>
            {TABS.map(t => (
              <NavItem key={t.id}>
                <NavLink
                  className={classnames({ active: activeTab === t.id })}
                  onClick={() => setActiveTab(t.id)}
                  style={{ cursor: 'pointer', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, whiteSpace: 'nowrap' }}>
                  <i className={t.icon} style={{ fontSize: 13 }} />
                  <span className="d-none d-sm-inline">{t.label}</span>
                  {t.count > 0 && (
                    <span className={classnames('badge rounded-pill', activeTab === t.id ? 'bg-primary' : 'bg-light text-muted')}
                      style={{ fontSize: 9, padding: '2px 6px' }}>
                      {t.count}
                    </span>
                  )}
                </NavLink>
              </NavItem>
            ))}
          </Nav>
        </Card>

        {/* Tab Content */}
        <TabContent activeTab={activeTab}>

          {/* ═══ OVERVIEW ═══ */}
          <TabPane tabId="overview">
            <Row className="g-3">
              <Col xxl={3} lg={4}>
                <Card className="mb-3">
                  <CardBody style={{ padding: '16px 18px' }}>
                    <SectionHead icon="ri-building-line" title="Company" />
                    <InfoRow label="Company Name"     value={data.company_name} />
                    <InfoRow label="Charge Number"    value={data.charge_number} />
                    <InfoRow label="Registration Date" value={fmtDate(data.registration_date)} />
                    <InfoRow label="Lodgement Type">
                      {getTypeLabel(data.lodgement_type, CHARGES_LODGEMENT_OPTS)}
                    </InfoRow>
                  </CardBody>
                </Card>

                <Card className="mb-3">
                  <CardBody style={{ padding: '16px 18px' }}>
                    <SectionHead icon="ri-file-list-3-line" title="Instrument" />
                    <InfoRow label="Creation Date"    value={fmtDate(data.charge_creation_date)} />
                    <InfoRow label="Instrument Option">
                      {getTypeLabel(data.instrument_option, CHARGES_INSTRUMENT_OPTS)}
                    </InfoRow>
                    <InfoRow label="Description">
                      {getTypeLabel(data.instrument_description, CHARGES_INSTRUMENT_DESC_OPTS)}
                    </InfoRow>
                    <InfoRow label="Instrument Date"   value={fmtDate(data.instrument_date)} />
                    <InfoRow label="Executed Location">
                      {data.instrument_executed_location === '1' ? 'In Singapore' :
                       data.instrument_executed_location === '2' ? 'Outside Singapore' : '—'}
                    </InfoRow>
                    <InfoRow label="Executed in Presence" value={data.instrument_executed_presence} />
                  </CardBody>
                </Card>

                <Card className="mb-3">
                  <CardBody style={{ padding: '16px 18px' }}>
                    <SectionHead icon="ri-inbox-archive-line" title="Lodgement" />
                    <InfoRow label="Lodged On Behalf Of">
                      {getTypeLabel(data.statement_lodged_behalf_of, CHARGES_STATEMENT_LODGED_OPTS)}
                    </InfoRow>
                    <InfoRow label="Type of Charge" value={typeLabel} />
                    <InfoRow label="Satisfaction Date" value={fmtDate(data.satisfaction_date)} />
                    <InfoRow label="Nature of Satisfaction">
                      {getTypeLabel(data.nature_of_satisfaction, CHARGES_PARTICULARS_OPTS)}
                    </InfoRow>
                  </CardBody>
                </Card>
              </Col>

              <Col xxl={9} lg={8}>
                <Card className="mb-3">
                  <CardBody style={{ padding: '16px 18px' }}>
                    <SectionHead icon="ri-file-text-line" title="Charge Information" />
                    <Row>
                      <Col md={6}>
                        <InfoRow label="Company"           value={data.company_name} />
                        <InfoRow label="Charge Number"     value={data.charge_number} />
                        <InfoRow label="Registration Date" value={fmtDate(data.registration_date)} />
                        <InfoRow label="Lodgement Type">
                          {getTypeLabel(data.lodgement_type, CHARGES_LODGEMENT_OPTS)}
                        </InfoRow>
                        <InfoRow label="Type of Charge" value={typeLabel} />
                      </Col>
                      <Col md={6}>
                        <InfoRow label="Creation Date"    value={fmtDate(data.charge_creation_date)} />
                        <InfoRow label="Instrument Date"  value={fmtDate(data.instrument_date)} />
                        <InfoRow label="Satisfaction Date" value={fmtDate(data.satisfaction_date)} />
                        <InfoRow label="No. of Chargees"  value={chargees.length} />
                      </Col>
                    </Row>
                  </CardBody>
                </Card>

                {(data.property_description || data.restrictions_prohibitions || data.salient_covenants) && (
                  <Card className="mb-3">
                    <CardBody style={{ padding: '16px 18px' }}>
                      <SectionHead icon="ri-file-info-line" title="Additional Details" />
                      {data.property_description    && <InfoRow label="Property Description"    value={data.property_description} />}
                      {data.restrictions_prohibitions && <InfoRow label="Restrictions/Prohibitions" value={data.restrictions_prohibitions} />}
                      {data.salient_covenants       && <InfoRow label="Salient Covenants"       value={data.salient_covenants} />}
                    </CardBody>
                  </Card>
                )}

                {data.remarks && (
                  <Card className="mb-0">
                    <CardBody style={{ padding: '16px 18px' }}>
                      <SectionHead icon="ri-sticky-note-line" title="Remarks" />
                      <p className="text-muted mb-0" style={{ fontSize: 12, lineHeight: 1.8 }}>{data.remarks}</p>
                    </CardBody>
                  </Card>
                )}
              </Col>
            </Row>
          </TabPane>

          {/* ═══ CHARGEES ═══ */}
          <TabPane tabId="chargees">
            {chargees.length === 0 ? (
              <Card><CardBody><Empty icon="ri-group-line" text="No chargees recorded for this charge." /></CardBody></Card>
            ) : (
              <Row>
                <Col lg={10} xl={8}>
                  {chargees.map((chargee, idx) => (
                    <ChargeeCard key={chargee.chargee_id || idx} chargee={chargee} index={idx} />
                  ))}
                </Col>
              </Row>
            )}
          </TabPane>

          {/* ═══ DOCUMENTS ═══ */}
          <TabPane tabId="documents">
            {documents.length === 0 ? (
              <Card><CardBody><Empty icon="ri-attachment-2" text="No documents attached to this charge." /></CardBody></Card>
            ) : (
              <Row className="g-3">
                {documents.map((doc, idx) => (
                  <Col key={doc.doc_id || idx} md={6} xl={4}>
                    <Card className="mb-0 h-100">
                      <div style={{
                        padding: '10px 14px', background: 'rgba(64,81,137,.05)',
                        borderBottom: '1px solid var(--vz-border-color)',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: '#405189', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                          <i className="ri-file-pdf-fill" />
                        </div>
                        <span className="fw-semibold" style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.doc_name || doc.document_name || 'Unnamed'}
                        </span>
                      </div>
                      <CardBody style={{ padding: '12px 14px' }}>
                        {doc.document_size && <InfoRow label="Size" value={getFileSize(doc.document_size)} />}
                        <div className="mt-2 d-flex gap-2">
                          {(doc.document_url || doc.file_path) && (
                            <>
                              <a href={doc.document_url || doc.file_path} target="_blank" rel="noopener noreferrer"
                                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" style={{ fontSize: 11 }}>
                                <i className="ri-eye-line" /> View
                              </a>
                              <a href={doc.document_url || doc.file_path} download
                                className="btn btn-sm btn-outline-success d-flex align-items-center gap-1" style={{ fontSize: 11 }}>
                                <i className="ri-download-line" /> Download
                              </a>
                            </>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </TabPane>

        </TabContent>
      </Container>

      {/* Delete Modal */}
      <Modal isOpen={delModal} toggle={() => setDelModal(false)} centered size="sm">
        <ModalHeader toggle={() => setDelModal(false)} style={{ border: 'none', paddingBottom: 0 }} />
        <ModalBody>
          <div className="text-center p-2">
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(240,101,72,.1)', color: '#f06548', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 14px' }}>
              <i className="ri-delete-bin-5-line" />
            </div>
            <h5 className="fs-15 fw-semibold mb-2">Delete Charge?</h5>
            <p className="text-muted mb-0" style={{ fontSize: 12 }}>
              Charge <strong>#{data.charge_number}</strong> for{' '}
              <strong>{data.company_name}</strong><br />
              will be permanently removed. This cannot be undone.
            </p>
          </div>
        </ModalBody>
        <ModalFooter style={{ border: 'none', justifyContent: 'center', gap: 10 }}>
          <Button color="light" size="sm" onClick={() => setDelModal(false)} disabled={deleting}>Cancel</Button>
          <Button color="danger" size="sm" onClick={handleDelete} disabled={deleting}
            className="d-flex align-items-center gap-1">
            {deleting ? <><Spinner size="sm" /> Deleting…</> : <><i className="ri-delete-bin-line" /> Delete</>}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default RegisterChargeView;