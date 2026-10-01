import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container, Row, Col, Card, CardBody,
  Nav, NavItem, NavLink, TabContent, TabPane,
  Spinner, Modal, ModalHeader, ModalBody, ModalFooter, Button,
} from 'reactstrap';
import classnames from 'classnames';
import { toast } from 'react-toastify';
import BreadCrumb from '../../Components/Common/BreadCrumb';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import { getCompany, deleteCompany } from '../../helpers/backend_helper';

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#405189','#0ab39c','#f06548','#f0b232','#299cdb','#6559cc','#e83e8c','#20c997','#fd7e14','#6c757d'];
const avatarColor   = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const initials      = (name = '') => name.trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const fmtDate       = (d) => { if (!d) return null; return new Date(d).toLocaleDateString('en-SG', { day:'2-digit', month:'short', year:'numeric' }); };

const STATUS_STYLE = {
  ACTIVE:   { label:'Active',   bg:'rgba(10,179,156,.15)',  color:'#0ab39c'  },
  INACTIVE: { label:'Inactive', bg:'rgba(240,101,72,.15)',  color:'#f06548'  },
  PENDING:  { label:'Pending',  bg:'rgba(240,178,50,.15)',  color:'#f0b232'  },
};

const RISK_STYLE = {
  LOW:       { label:'Low Risk',   bg:'rgba(10,179,156,.15)', color:'#0ab39c', icon:'ri-shield-check-line' },
  MEDIUM:    { label:'Med Risk',   bg:'rgba(240,178,50,.15)', color:'#f0b232', icon:'ri-shield-line'        },
  HIGH:      { label:'High Risk',  bg:'rgba(240,101,72,.15)', color:'#f06548', icon:'ri-shield-flash-line'  },
  VERY_HIGH: { label:'Very High',  bg:'rgba(192,58,43,.18)',  color:'#e74c3c', icon:'ri-shield-star-line'   },
};

const ADDR_LABEL = {
  REGISTERED: 'Registered Office', MAILING: 'Mailing', BUSINESS: 'Business',
  FOREIGN: 'Foreign', OTHER: 'Other', REGISTER_OF_MEMBERS: 'Register of Members',
};

const CONTACT_ICON  = { MOBILE:'ri-smartphone-line', OFFICE:'ri-phone-line', FAX:'ri-printer-line', EMAIL:'ri-mail-line', OTHER:'ri-global-line' };
const CONTACT_COLOR = { MOBILE:'#405189', OFFICE:'#0ab39c', FAX:'#6c757d', EMAIL:'#f0b232', OTHER:'#299cdb' };

// ── Sub-components ────────────────────────────────────────────────────────────

const InfoRow = ({ label, value }) => value ? (
  <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:7 }}>
    <span style={{ fontSize:11, color:'var(--vz-sidebar-sub-item-color,#878a99)', minWidth:130, flexShrink:0, paddingTop:1 }}>{label}</span>
    <span style={{ fontSize:12, color:'var(--vz-body-color)', fontWeight:500 }}>{value}</span>
  </div>
) : null;

const SectionHead = ({ icon, title, count }) => (
  <div className="d-flex align-items-center gap-2 mb-3">
    <div style={{ width:26, height:26, borderRadius:6, background:'rgba(64,81,137,.1)', color:'#405189', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>
      <i className={icon}></i>
    </div>
    <span className="fw-semibold" style={{ fontSize:13, color:'var(--vz-body-color)' }}>{title}</span>
    {count != null && (
      <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:20, background:'rgba(64,81,137,.08)', color:'#405189' }}>{count}</span>
    )}
  </div>
);

const Empty = ({ icon, text }) => (
  <div className="text-center py-5 text-muted">
    <i className={icon} style={{ fontSize:38, opacity:.2, display:'block', marginBottom:8 }}></i>
    <p className="fs-13 mb-0">{text}</p>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────

const CompanyView = () => {
  useCollapseSidebar();
  const { entity_id } = useParams();
  const navigate      = useNavigate();

  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [delModal, setDelModal]   = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  document.title = 'View Company | ASR CSS';

  useEffect(() => {
    (async () => {
      try {
        const res = await getCompany(entity_id);
        setData(res?.data?.data ?? res?.data ?? res);
      } catch {
        toast.error('Failed to load company');
      } finally {
        setLoading(false);
      }
    })();
  }, [entity_id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCompany(entity_id);
      toast.success('Company deleted');
      navigate('/company/list');
    } catch {
      toast.error('Failed to delete company');
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="page-content d-flex justify-content-center align-items-center" style={{ minHeight:300 }}>
      <Spinner color="primary" />
    </div>
  );

  if (!data) return (
    <div className="page-content">
      <Container fluid>
        <div className="text-center py-5">
          <i className="ri-building-2-line" style={{ fontSize:48, color:'#405189', opacity:.3 }}></i>
          <p className="mt-2 text-muted">Company not found.</p>
          <Link to="/company/list" className="btn btn-primary btn-sm">Back to List</Link>
        </div>
      </Container>
    </div>
  );

  const detail = data.company_detail || {};
  const ident  = (data.identifications || [])[0] || {};
  const ss     = STATUS_STYLE[data.status] || STATUS_STYLE.PENDING;
  const rs     = RISK_STYLE[detail.risk_assessment_rating];
  const color  = avatarColor(data.name || '');

  const TABS = [
    { id:'overview', label:'Overview',   icon:'ri-layout-grid-line'                                       },
    { id:'address',  label:'Addresses',  icon:'ri-map-pin-2-line', count:(data.addresses||[]).length      },
    { id:'contact',  label:'Contacts',   icon:'ri-phone-line',     count:(data.contacts||[]).length       },
    { id:'corp',     label:'Corp Sec',   icon:'ri-building-4-line'                                        },
  ];

  const STATS = [
    { label:'Addresses', value:(data.addresses||[]).length, icon:'ri-map-pin-2-line' },
    { label:'Contacts',  value:(data.contacts||[]).length,  icon:'ri-phone-line'     },
    { label:'Tags',      value:(data.tags||[]).length,      icon:'ri-price-tag-3-line' },
  ];

  return (
    <div className="page-content">
      <Container fluid>

        <BreadCrumb title="Company Profile" pageTitle="Entity Management" />

        {/* ── Hero card ── */}
        <Card className="p-0 mb-3" style={{ borderRadius:12, overflow:'visible' }}>

          <div style={{
            background:'linear-gradient(135deg, #405189 0%, #6559cc 55%, #299cdb 100%)',
            borderRadius:'12px 12px 0 0',
            padding:'16px 22px',
            position:'relative', overflow:'hidden',
          }}>
            {/* decorative blobs */}
            <div style={{ position:'absolute', right:-40, top:-50, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,.07)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', right:140, bottom:-40, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,.04)', pointerEvents:'none' }} />

            <div className="d-flex flex-wrap align-items-center gap-3" style={{ position:'relative' }}>

              {/* Avatar / Logo */}
              <div style={{
                width:64, height:64, borderRadius:12,
                background: detail.logo_url ? '#fff' : color, color:'#fff',
                fontSize:20, fontWeight:800,
                display:'flex', alignItems:'center', justifyContent:'center',
                border:'2.5px solid rgba(255,255,255,.45)',
                boxShadow:'0 4px 16px rgba(0,0,0,.22)',
                flexShrink:0, overflow:'hidden',
              }}>
                {detail.logo_url
                  ? <img src={detail.logo_url} alt={data.name} style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                  : initials(data.name || '')}
              </div>

              {/* Name + badges + meta */}
              <div style={{ flex:1, minWidth:160 }}>
                <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                  <span style={{ fontSize:16, fontWeight:700, color:'#fff' }}>{data.name}</span>
                  {data.former_name && (
                    <span style={{ fontSize:11, color:'rgba(255,255,255,.65)' }}>formerly {data.former_name}</span>
                  )}
                  <span style={{ padding:'2px 9px', borderRadius:20, fontSize:10, fontWeight:700, background:'rgba(255,255,255,.22)', color:'#fff' }}>
                    {ss.label}
                  </span>
                  {rs && (
                    <span style={{ padding:'2px 9px', borderRadius:20, fontSize:10, fontWeight:700, background:'rgba(255,255,255,.18)', color:'#fff', display:'flex', alignItems:'center', gap:3 }}>
                      <i className={rs.icon} style={{ fontSize:10 }}></i>{rs.label}
                    </span>
                  )}
                  {detail.public_interest_company === 1 && (
                    <span style={{ padding:'2px 9px', borderRadius:20, fontSize:10, fontWeight:700, background:'rgba(10,179,156,.55)', color:'#fff' }}>
                      Public Interest
                    </span>
                  )}
                </div>
                <div className="d-flex flex-wrap gap-3" style={{ fontSize:11, color:'rgba(255,255,255,.72)' }}>
                  {ident.uen_no   && <span><i className="ri-hashtag me-1"></i>UEN: {ident.uen_no}</span>}
                  {data.client_no && <span><i className="ri-user-line me-1"></i>{data.client_no}</span>}
                  {detail.country && <span><i className="ri-global-line me-1"></i>{detail.country}</span>}
                  {detail.company_incorporation_date && <span><i className="ri-calendar-line me-1"></i>Inc. {fmtDate(detail.company_incorporation_date)}</span>}
                </div>
              </div>

              {/* Mini stats */}
              <div className="d-flex align-items-center gap-4"
                style={{ borderRight:'1px solid rgba(255,255,255,.2)', paddingRight:20 }}>
                {STATS.map(s => (
                  <div key={s.label} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:17, fontWeight:800, lineHeight:1, color:'#fff' }}>{s.value}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,.65)', marginTop:3 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="d-flex gap-2">
                <Link to="/company/list"
                  className="d-flex align-items-center gap-1"
                  style={{ fontSize:11, padding:'5px 12px', borderRadius:6, background:'rgba(255,255,255,.15)', color:'#fff', border:'1px solid rgba(255,255,255,.25)', textDecoration:'none', whiteSpace:'nowrap' }}>
                  <i className="ri-arrow-left-line"></i> Back
                </Link>
                <Link to={`/company/edit/${entity_id}`}
                  className="d-flex align-items-center gap-1"
                  style={{ fontSize:11, padding:'5px 12px', borderRadius:6, background:'rgba(240,178,50,.75)', color:'#fff', border:'1px solid rgba(240,178,50,.4)', textDecoration:'none', whiteSpace:'nowrap' }}>
                  <i className="ri-pencil-line"></i> Edit
                </Link>
                <button
                  className="d-flex align-items-center gap-1"
                  style={{ fontSize:11, padding:'5px 12px', borderRadius:6, background:'rgba(240,101,72,.7)', color:'#fff', border:'1px solid rgba(240,101,72,.4)', cursor:'pointer', whiteSpace:'nowrap' }}
                  onClick={() => setDelModal(true)}>
                  <i className="ri-delete-bin-line"></i> Delete
                </button>
              </div>
            </div>
          </div>

          {/* Tab nav */}
          <Nav tabs style={{ borderBottom:'1px solid var(--vz-border-color)', margin:0, padding:'0 10px', background:'var(--vz-card-bg)' }}>
            {TABS.map(t => (
              <NavItem key={t.id}>
                <NavLink
                  className={classnames({ active: activeTab === t.id })}
                  onClick={() => setActiveTab(t.id)}
                  style={{ cursor:'pointer', padding:'10px 14px', display:'flex', alignItems:'center', gap:5, fontSize:12, whiteSpace:'nowrap' }}>
                  <i className={t.icon} style={{ fontSize:13 }}></i>
                  <span className="d-none d-sm-inline">{t.label}</span>
                  {t.count > 0 && (
                    <span className={classnames('badge rounded-pill', activeTab === t.id ? 'bg-primary' : 'bg-light text-muted')}
                      style={{ fontSize:9, padding:'2px 6px' }}>
                      {t.count}
                    </span>
                  )}
                </NavLink>
              </NavItem>
            ))}
          </Nav>
        </Card>

        {/* ── Tab Content ── */}
        <TabContent activeTab={activeTab}>

          {/* ── Overview ── */}
          <TabPane tabId="overview">
            <Row className="g-3">

              {/* Left sidebar */}
              <Col xxl={3} lg={4}>

                <Card className="mb-3">
                  <CardBody style={{ padding:'16px 18px' }}>
                    <SectionHead icon="ri-contacts-line" title="Contact Info" />
                    <InfoRow label="Email"   value={(data.contacts||[]).find(c=>c.contact_type==='EMAIL')?.contact_value} />
                    <InfoRow label="Mobile"  value={(data.contacts||[]).find(c=>c.contact_type==='MOBILE')?.contact_value} />
                    <InfoRow label="Office"  value={(data.contacts||[]).find(c=>c.contact_type==='OFFICE')?.contact_value} />
                    <InfoRow label="Fax"     value={(data.contacts||[]).find(c=>c.contact_type==='FAX')?.contact_value} />
                    <InfoRow label="Website" value={(data.contacts||[]).find(c=>c.contact_type==='OTHER')?.contact_value} />
                  </CardBody>
                </Card>

                <Card className="mb-3">
                  <CardBody style={{ padding:'16px 18px' }}>
                    <SectionHead icon="ri-map-pin-2-line" title="Registered Address" />
                    {(() => {
                      const addr = (data.addresses||[]).find(a => a.address_type === 'REGISTERED');
                      if (!addr) return <p className="text-muted mb-0" style={{ fontSize:12 }}>Not recorded</p>;
                      return (
                        <p className="text-muted mb-0" style={{ fontSize:12, lineHeight:1.9 }}>
                          {[addr.block_no, addr.street_name, addr.building_name,
                            addr.level_no && `Level ${addr.level_no}`,
                            addr.unit_no  && `#${addr.unit_no}`,
                            addr.city, addr.state, addr.postal_code, addr.country,
                          ].filter(Boolean).join(', ')}
                        </p>
                      );
                    })()}
                  </CardBody>
                </Card>

                {(data.tags||[]).length > 0 && (
                  <Card className="mb-0">
                    <CardBody style={{ padding:'16px 18px' }}>
                      <SectionHead icon="ri-price-tag-3-line" title="Tags" />
                      <div className="d-flex flex-wrap gap-2">
                        {data.tags.map((t,i) => (
                          <span key={i} style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background: t.tag_info?.tag_color ? `${t.tag_info.tag_color}22` : 'rgba(64,81,137,.1)', color: t.tag_info?.tag_color || '#405189' }}>
                            {t.tag_info?.tag_name || `Tag ${t.tag_id}`}
                          </span>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                )}
              </Col>

              {/* Right content */}
              <Col xxl={9} lg={8}>

                <Card className="mb-3">
                  <CardBody style={{ padding:'16px 18px' }}>
                    <SectionHead icon="ri-building-2-line" title="Company Information" />
                    <Row>
                      <Col md={6}>
                        <InfoRow label="Company Name"    value={data.name} />
                        <InfoRow label="Former Name"     value={data.former_name} />
                        <InfoRow label="UEN / Reg. No."    value={ident.uen_no} />
                        <InfoRow label="FBRN Reg. No."     value={ident.fbrn_reg_no} />
                        <InfoRow label="UF No."            value={ident.uf_no} />
                        <InfoRow label="Domestic Bus. No." value={ident.domes_bus_no} />
                        <InfoRow label="ACRA No."          value={ident.acra_no} />
                      </Col>
                      <Col md={6}>
                        <InfoRow label="Client No."    value={data.client_no} />
                        <InfoRow label="Status"        value={ss.label} />
                        <InfoRow label="Risk Rating"   value={rs?.label} />
                        <InfoRow label="Country"       value={detail.country} />
                        <InfoRow label="Region"        value={detail.region_id} />
                        <InfoRow label="Registered"    value={fmtDate(data.created_date)} />
                      </Col>
                    </Row>
                    {data.remarks && (
                      <div className="mt-2 p-2" style={{ background:'rgba(64,81,137,.04)', borderRadius:6, border:'1px solid rgba(64,81,137,.08)' }}>
                        <p className="mb-1 text-muted" style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' }}>Remarks</p>
                        <p className="mb-0" style={{ fontSize:12 }}>{data.remarks}</p>
                      </div>
                    )}
                  </CardBody>
                </Card>

                <Card className="mb-0">
                  <CardBody style={{ padding:'16px 18px' }}>
                    <SectionHead icon="ri-shield-check-line" title="Corp Sec Details" />
                    <Row>
                      <Col md={6}>
                        <InfoRow label="Incorporation Date" value={fmtDate(detail.company_incorporation_date)} />
                        <InfoRow label="FYE Date"           value={fmtDate(detail.company_fin_date)} />
                        <InfoRow label="Takeover Date"      value={fmtDate(detail.company_takeover_date)} />
                        <InfoRow label="Mail Redirection"   value={detail.mail_redirection === 1 ? 'Yes' : detail.mail_redirection === 0 ? 'No' : null} />
                        <InfoRow label="XBRL Required"      value={detail.company_xbrl_required === 1 ? 'Yes' : detail.company_xbrl_required === 0 ? 'No' : null} />
                      </Col>
                      <Col md={6}>
                        <InfoRow label="Public Interest"    value={detail.public_interest_company === 1 ? 'Yes' : null} />
                        <InfoRow label="Source From"        value={detail.source_from} />
                        <InfoRow label="Person In Charge"   value={detail.person_in_charge} />
                        <InfoRow label="Holding Company"    value={detail.holding_company_name} />
                      </Col>
                    </Row>
                  </CardBody>
                </Card>

              </Col>
            </Row>
          </TabPane>

          {/* ── Addresses ── */}
          <TabPane tabId="address">
            {(data.addresses||[]).length === 0
              ? <Card><CardBody><Empty icon="ri-map-pin-2-line" text="No addresses recorded." /></CardBody></Card>
              : <Row className="g-3">
                  {(data.addresses||[]).map((addr, i) => (
                    <Col key={i} md={6} xxl={4}>
                      <Card className="mb-0 h-100">
                        <div style={{ padding:'10px 14px', background:'rgba(64,81,137,.05)', borderBottom:'1px solid var(--vz-border-color)', display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:28, height:28, borderRadius:7, background:'#405189', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>
                            <i className="ri-map-pin-fill"></i>
                          </div>
                          <span className="fw-semibold" style={{ fontSize:12 }}>{ADDR_LABEL[addr.address_type]||addr.address_type} Address</span>
                          {addr.is_primary===1 && <span className="badge bg-primary-subtle text-primary ms-auto" style={{ fontSize:10 }}><i className="ri-home-4-fill me-1"></i>Default</span>}
                        </div>
                        <CardBody style={{ padding:'12px 14px' }}>
                          <p className="text-muted mb-0" style={{ fontSize:12, lineHeight:1.9 }}>
                            {[addr.block_no, addr.street_name, addr.building_name,
                              addr.level_no && `Level ${addr.level_no}`,
                              addr.unit_no  && `#${addr.unit_no}`,
                              addr.city, addr.state, addr.postal_code, addr.country,
                            ].filter(Boolean).join(', ')}
                          </p>
                          {addr.effective_from && (
                            <div className="mt-2 text-muted" style={{ fontSize:11 }}>
                              <i className="ri-calendar-line me-1"></i>
                              From {fmtDate(addr.effective_from)}{addr.effective_to ? ` → ${fmtDate(addr.effective_to)}` : ''}
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    </Col>
                  ))}
                </Row>
            }
          </TabPane>

          {/* ── Contacts ── */}
          <TabPane tabId="contact">
            {(data.contacts||[]).length === 0
              ? <Card><CardBody><Empty icon="ri-phone-line" text="No contact details recorded." /></CardBody></Card>
              : <Row className="g-3">
                  {(data.contacts||[]).map((c, i) => {
                    const ic  = CONTACT_ICON[c.contact_type]  || 'ri-phone-line';
                    const cc  = CONTACT_COLOR[c.contact_type] || '#405189';
                    const val = c.contact_value || '—';
                    return (
                      <Col key={i} sm={6} xl={4}>
                        <Card className="mb-0 h-100">
                          <CardBody style={{ padding:'14px 16px' }}>
                            <div className="d-flex align-items-center justify-content-between mb-3">
                              <div style={{ width:38, height:38, borderRadius:10, background:`${cc}18`, color:cc, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>
                                <i className={ic}></i>
                              </div>
                              {c.is_primary===1 && <span className="badge bg-success-subtle text-success" style={{ fontSize:10 }}>Primary</span>}
                            </div>
                            <p className="text-uppercase mb-1 text-muted" style={{ fontSize:10, fontWeight:700, letterSpacing:'.06em' }}>{c.contact_type}</p>
                            <h6 className="mb-0" style={{ fontSize:13 }}>{val}</h6>
                          </CardBody>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
            }
          </TabPane>

          {/* ── Corp Sec ── */}
          <TabPane tabId="corp">
            <Row className="g-3">
              <Col md={6}>
                <Card className="mb-0">
                  <CardBody style={{ padding:'16px 18px' }}>
                    <SectionHead icon="ri-calendar-check-line" title="Key Dates" />
                    <InfoRow label="Incorporation Date" value={fmtDate(detail.company_incorporation_date)} />
                    <InfoRow label="Takeover Date"      value={fmtDate(detail.company_takeover_date)} />
                    <InfoRow label="FYE Date"           value={fmtDate(detail.company_fin_date)} />
                    <InfoRow label="Status Effective Date" value={fmtDate(detail.status_effective_date)} />
                  </CardBody>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="mb-3">
                  <CardBody style={{ padding:'16px 18px' }}>
                    <SectionHead icon="ri-settings-3-line" title="Settings" />
                    <InfoRow label="Mail Redirection"  value={detail.mail_redirection === 1 ? 'Yes' : detail.mail_redirection === 0 ? 'No' : null} />
                    <InfoRow label="XBRL Required"     value={detail.company_xbrl_required === 1 ? 'Yes' : detail.company_xbrl_required === 0 ? 'No' : null} />
                    <InfoRow label="Public Interest"   value={detail.public_interest_company === 1 ? 'Yes' : null} />
                    <InfoRow label="Admin Access"      value={detail.admin_access} />
                    <InfoRow label="Group Access"      value={detail.group_access} />
                    <InfoRow label="User Access"       value={detail.user_access} />
                  </CardBody>
                </Card>
                <Card className="mb-0">
                  <CardBody style={{ padding:'16px 18px' }}>
                    <SectionHead icon="ri-briefcase-line" title="Principal Activities" />
                    {detail.ssic_id && (
                      <div className="mb-2">
                        <p className="mb-1 text-muted" style={{ fontSize:10, fontWeight:700, textTransform:'uppercase' }}>Primary SSIC</p>
                        <p className="mb-0" style={{ fontSize:12 }}>
                          <strong>{detail.ssic_id}</strong>
                          {detail.ssic_user_description && <> — {detail.ssic_user_description}</>}
                        </p>
                      </div>
                    )}
                    {detail.ssic_id_secondary && (
                      <div>
                        <p className="mb-1 text-muted" style={{ fontSize:10, fontWeight:700, textTransform:'uppercase' }}>Secondary SSIC</p>
                        <p className="mb-0" style={{ fontSize:12 }}>
                          <strong>{detail.ssic_id_secondary}</strong>
                          {detail.ssic_user_description_secondary && <> — {detail.ssic_user_description_secondary}</>}
                        </p>
                      </div>
                    )}
                    {!detail.ssic_id && !detail.ssic_id_secondary && (
                      <p className="text-muted mb-0" style={{ fontSize:12 }}>Not recorded</p>
                    )}
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </TabPane>

        </TabContent>

      </Container>

      {/* Delete modal */}
      <Modal isOpen={delModal} toggle={() => setDelModal(false)} centered size="sm">
        <ModalHeader toggle={() => setDelModal(false)} style={{ border:'none', paddingBottom:0 }} />
        <ModalBody>
          <div className="text-center p-2">
            <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(240,101,72,.1)', color:'#f06548', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, margin:'0 auto 14px' }}>
              <i className="ri-delete-bin-5-line"></i>
            </div>
            <h5 className="fs-15 fw-semibold mb-2">Delete Company?</h5>
            <p className="text-muted mb-0" style={{ fontSize:12 }}>
              <strong>{data.name}</strong> will be permanently removed.<br />This cannot be undone.
            </p>
          </div>
        </ModalBody>
        <ModalFooter style={{ border:'none', justifyContent:'center', gap:10 }}>
          <Button color="light" size="sm" onClick={() => setDelModal(false)} disabled={deleting}>Cancel</Button>
          <Button color="danger" size="sm" onClick={handleDelete} disabled={deleting} className="d-flex align-items-center gap-1">
            {deleting ? <><Spinner size="sm" /> Deleting…</> : <><i className="ri-delete-bin-line"></i> Delete</>}
          </Button>
        </ModalFooter>
      </Modal>

    </div>
  );
};

export default CompanyView;
