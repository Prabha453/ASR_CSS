import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, CardBody, Spinner, Modal, ModalBody, ModalFooter, Button } from 'reactstrap';
import classnames from 'classnames';
import { toast } from 'react-toastify';
import BreadCrumb from '../../Components/Common/BreadCrumb';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import { getOfficial, getOfficialList, getOfficialMasterList, deleteOfficial } from '../../helpers/backend_helper';
import './OfficialListPage.css';
import './OfficialFormPage.css';

// ── Helpers (mirrors OfficialListPage) ───────────────────────────────────────
const AVATAR_COLORS = ['#405189','#0ab39c','#6559cc','#f7b84b','#299cdb','#f06548','#e91e63'];
const avatarColor   = (n = '') => AVATAR_COLORS[(n.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const initials      = (n = '') => n.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const fmtDate       = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const typeIcon  = (t) => t === 'COMPANY' ? 'ri-building-line' : 'ri-user-line';
const fmtType   = (t) => t === 'COMPANY' ? 'Company' : 'Individual';
const typeColor = (t) => t === 'COMPANY' ? '#405189' : '#0ab39c';

const SkeletonRows = () => (
  <>
    {[1, 2, 3].map(i => (
      <tr key={i} className="olp-skel">
        {[46, 200, 100, 120, 120, 80, 90].map((w, j) => (
          <td key={j}><div style={{ width: w > 100 ? '80%' : w, height: 14 }} /></td>
        ))}
      </tr>
    ))}
  </>
);

// ── Page ──────────────────────────────────────────────────────────────────────
const SubOfficialListPage = () => {
  useCollapseSidebar();
  const { parentSlug, parentOfficialId, childSlug } = useParams();
  const navigate = useNavigate();

  const [parentOfficial, setParentOfficial] = useState(null);
  const [childMaster,    setChildMaster]    = useState(null);
  const [parentMaster,   setParentMaster]   = useState(null);
  const [contextLoading, setContextLoading] = useState(true);

  const [list,      setList]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [viewMode,  setViewMode]  = useState('table');
  const [delTarget, setDelTarget] = useState(null);
  const [deleting,  setDeleting]  = useState(false);

  // ── Load context (parent official + masters) ────────────────────────────────
  const loadContext = useCallback(async () => {
    setContextLoading(true);
    try {
      const [parentRes, mastersRes] = await Promise.all([
        getOfficial(parentOfficialId),
        getOfficialMasterList({ page: 1, limit: 200 }),
      ]);
      if (parentRes?.status) setParentOfficial(parentRes.data);
      const masters = mastersRes?.data?.data || mastersRes?.data || [];
      setChildMaster(masters.find(m => m.official_master_slug === childSlug)  || null);
      setParentMaster(masters.find(m => m.official_master_slug === parentSlug) || null);
    } catch {
      toast.error('Failed to load context');
    } finally {
      setContextLoading(false);
    }
  }, [parentOfficialId, childSlug, parentSlug]);

  // ── Load sub-official list ──────────────────────────────────────────────────
  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await getOfficialList({ reference_official_id: parentOfficialId, official_master_slug: childSlug, limit: 500 });
      const data = res?.data?.data || res?.data || [];
      setList(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load list');
    } finally {
      setLoading(false);
    }
  }, [parentOfficialId, childSlug]);

  useEffect(() => { loadContext(); }, [loadContext]);
  useEffect(() => { loadList();   }, [loadList]);

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    const name = delTarget.official_entity?.name || 'this record';
    try {
      await deleteOfficial(delTarget.official_id);
      toast.success(`${name} removed`);
      setList(prev => prev.filter(r => r.official_id !== delTarget.official_id));
      setDelTarget(null);
    } catch {
      toast.error('Failed to remove');
    } finally {
      setDeleting(false);
    }
  };

  const filterBySearch = (arr) => {
    if (!search.trim()) return arr;
    const q = search.toLowerCase();
    return arr.filter(r =>
      (r.official_entity?.name || '').toLowerCase().includes(q) ||
      (r.official_entity?.client_no || '').toLowerCase().includes(q)
    );
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const companyName  = parentOfficial?.entity?.name          || '—';
  const parentName   = parentOfficial?.official_entity?.name || '—';
  const childLabel   = childMaster?.official_master_name     || childSlug;
  const parentLabel  = parentMaster?.official_master_name    || parentSlug;
  const filteredList = filterBySearch(list);
  const baseRoute    = `/officials/${parentSlug}/${parentOfficialId}/${childSlug}`;

  document.title = `${childLabel} | ASR CSS`;

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title={childLabel} pageTitle={`${parentLabel} › ${parentName}`} />

        {/* ── Context: gradient bg + glass chips (compact) ── */}
        {!contextLoading && parentOfficial && (
          <div style={{
            borderRadius: 10,
            background: `linear-gradient(135deg, ${avatarColor(companyName)} 0%, #6559cc 50%, #299cdb 100%)`,
            padding: '10px 16px',
            marginBottom: 16,
            boxShadow: '0 4px 18px rgba(64,81,137,0.24)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', right: -30, top: -35, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: -20, bottom: -30, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', position: 'relative' }}>

              {/* Company chip */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '5px 12px',
              }}>
                <i className="ri-building-2-line" style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)' }}></i>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>Company</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', lineHeight: 1.3, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{companyName}</div>
                </div>
              </div>

              <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}></i>

              {/* Parent official chip */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '5px 12px',
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(255,255,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, color: '#fff',
                }}>
                  {initials(parentName)}
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>{parentLabel}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', lineHeight: 1.3, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{parentName}</div>
                </div>
              </div>

              <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}></i>

              {/* Child role chip */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.32)', borderRadius: 8, padding: '5px 12px',
              }}>
                <i className="ri-shield-user-line" style={{ fontSize: 14, color: '#fff' }}></i>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>{childLabel} List</div>
              </div>

              {/* Back button */}
              <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                <button
                  onClick={() => navigate(`/officials/${parentSlug}/list`, {
                    state: {
                      entity: {
                        id:          parentOfficial.entity_id,
                        companyName: parentOfficial.entity?.name      || '—',
                        clientNo:    parentOfficial.entity?.client_no || '—',
                        status:      parentOfficial.entity?.status    || null,
                      },
                      officialTypes: [],
                    },
                  })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 11px', borderRadius: 7,
                    background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.28)',
                    color: '#fff', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                    backdropFilter: 'blur(6px)',
                  }}>
                  <i className="ri-arrow-left-line" style={{ fontSize: 13 }}></i>
                  {parentLabel}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ── Main card ── */}
        <Card>
          {/* Toolbar */}
          <div className="olp-toolbar">
            <div className="olp-search">
              <i className="ri-search-line"></i>
              <input
                placeholder="Search name, client no…"
                value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>

            <span className="olp-count">
              {filteredList.length} {filteredList.length === 1 ? 'record' : 'records'}
            </span>

            <div className="ms-auto d-flex align-items-center gap-2">
              <div className="btn-group" role="group">
                <button type="button"
                  className={classnames('btn btn-sm', viewMode === 'table' ? 'btn-success' : 'btn-outline-success')}
                  title="Table view" onClick={() => setViewMode('table')}>
                  <i className="ri-list-unordered"></i>
                </button>
                <button type="button"
                  className={classnames('btn btn-sm', viewMode === 'card' ? 'btn-success' : 'btn-outline-success')}
                  title="Card view" onClick={() => setViewMode('card')}>
                  <i className="ri-grid-fill"></i>
                </button>
              </div>

              <button
                className="btn btn-warning btn-sm d-flex align-items-center gap-1"
                onClick={() => navigate(`${baseRoute}/add`)}>
                <i className="ri-add-line"></i> Add {childLabel}
              </button>
            </div>
          </div>

          <CardBody className="p-0">
            {/* Table view */}
            {viewMode === 'table' && (
              <div className="olp-table-wrap">
                <table className="olp-table">
                  <thead>
                    <tr>
                      <th style={{ width: 46 }}>#</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Appointment</th>
                      <th>Cessation</th>
                      <th>Status</th>
                      <th style={{ width: 90, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <SkeletonRows />
                    ) : filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="olp-empty">
                            <div className="olp-empty-icon"><i className="ri-user-search-line"></i></div>
                            <h6>No {childLabel} records found</h6>
                            <p>Add the first {childLabel} for {parentName}</p>
                            <button
                              className="btn btn-warning btn-sm d-flex align-items-center gap-1"
                              onClick={() => navigate(`${baseRoute}/add`)}>
                              <i className="ri-add-line"></i> Add First {childLabel}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : filteredList.map((rec, idx) => {
                      const name     = rec.official_entity?.name || '—';
                      const clientNo = rec.official_entity?.client_no || '';
                      const mainDate = (rec.date_records || []).find(d => d.is_main_role === '1') || rec.date_record || {};
                      const ceased   = !!mainDate?.ceased_date;
                      const apptDt   = mainDate?.appointment_date;
                      const ceasedDt = mainDate?.ceased_date;
                      return (
                        <tr key={rec.official_id} className={ceased ? 'row-ceased' : 'row-active'}>
                          <td style={{ color: '#878a99', fontSize: 12 }}>{idx + 1}</td>
                          <td>
                            <div className="olp-name-cell">
                              <div className="olp-avatar" style={{ background: avatarColor(name) }}>{initials(name)}</div>
                              <div className="olp-name-text">
                                <b>{name}</b>
                                {clientNo && <small>{clientNo}</small>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="olp-type-badge"
                              style={{ color: typeColor(rec.official_type), background: typeColor(rec.official_type) + '18', borderColor: typeColor(rec.official_type) + '33' }}>
                              <i className={typeIcon(rec.official_type)}></i>
                              {fmtType(rec.official_type)}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(apptDt)}</td>
                          <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(ceasedDt)}</td>
                          <td>
                            <span className={`olp-badge ${ceased ? 'ceased' : 'active'}`}>
                              {ceased ? 'Ceased' : 'Active'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="olp-act-wrap" style={{ justifyContent: 'center' }}>
                              <button
                                className="olp-act edit"
                                title="Edit"
                                onClick={() => navigate(`${baseRoute}/edit/${rec.official_id}`)}>
                                <i className="ri-pencil-line"></i>
                              </button>
                              <button
                                className="olp-act delete"
                                title="Delete"
                                onClick={() => setDelTarget(rec)}>
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Card view */}
            {viewMode === 'card' && !loading && (
              filteredList.length === 0 ? (
                <div className="olp-empty">
                  <div className="olp-empty-icon"><i className="ri-user-search-line"></i></div>
                  <h6>No {childLabel} records found</h6>
                  <p>Add the first {childLabel} for {parentName}</p>
                  <button
                    className="btn btn-warning btn-sm d-flex align-items-center gap-1"
                    onClick={() => navigate(`${baseRoute}/add`)}>
                    <i className="ri-add-line"></i> Add First {childLabel}
                  </button>
                </div>
              ) : (
                <div className="olp-grid">
                  {filteredList.map(rec => {
                    const name     = rec.official_entity?.name || '—';
                    const clientNo = rec.official_entity?.client_no || '';
                    const mainDate = (rec.date_records || []).find(d => d.is_main_role === '1') || rec.date_record || {};
                    const ceased   = !!mainDate?.ceased_date;
                    const apptDt   = mainDate?.appointment_date;
                    const ceasedDt = mainDate?.ceased_date;
                    const barColor = ceased ? '#f06548' : '#0ab39c';
                    return (
                      <div key={rec.official_id} className="olp-card">
                        <div className="olp-card-bar" style={{ background: barColor }} />
                        <div className="olp-card-top">
                          <div className="olp-card-avatar" style={{ background: avatarColor(name) }}>{initials(name)}</div>
                          <div className="olp-card-name">{name}</div>
                          {clientNo && <div className="olp-card-id">{clientNo}</div>}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <span className="olp-type-badge"
                              style={{ color: typeColor(rec.official_type), background: typeColor(rec.official_type) + '18', borderColor: typeColor(rec.official_type) + '33' }}>
                              <i className={typeIcon(rec.official_type)}></i>
                              {fmtType(rec.official_type)}
                            </span>
                            <span className={`olp-badge ${ceased ? 'ceased' : 'active'}`}>
                              {ceased ? 'Ceased' : 'Active'}
                            </span>
                          </div>
                        </div>
                        <div className="olp-card-body">
                          <div className="olp-card-row">
                            <span className="olp-card-lbl"><i className="ri-calendar-check-line me-1"></i>Appointed</span>
                            <span style={{ fontSize: 11, fontWeight: 500 }}>{fmtDate(apptDt)}</span>
                          </div>
                          <div className="olp-card-row">
                            <span className="olp-card-lbl"><i className="ri-calendar-close-line me-1"></i>Ceased</span>
                            <span style={{ fontSize: 11, fontWeight: 500 }}>{fmtDate(ceasedDt)}</span>
                          </div>
                        </div>
                        <div className="olp-card-footer">
                          <button
                            className="olp-act edit"
                            title="Edit"
                            onClick={() => navigate(`${baseRoute}/edit/${rec.official_id}`)}>
                            <i className="ri-pencil-line"></i>
                          </button>
                          <button
                            className="olp-act delete"
                            title="Delete"
                            onClick={() => setDelTarget(rec)}>
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {viewMode === 'card' && loading && (
              <div style={{ textAlign: 'center', padding: 48 }}><Spinner /></div>
            )}
          </CardBody>
        </Card>
      </Container>

      {/* Delete confirm modal */}
      <Modal isOpen={!!delTarget} toggle={() => !deleting && setDelTarget(null)} centered size="sm">
        <ModalBody>
          <div className="olp-del-modal">
            <div className="olp-del-icon"><i className="ri-delete-bin-line"></i></div>
            <h5>Remove {childLabel}?</h5>
            <p>Remove <b>{delTarget?.official_entity?.name}</b> as {childLabel}?<br />This action cannot be undone.</p>
          </div>
        </ModalBody>
        <ModalFooter style={{ justifyContent: 'center', gap: 8 }}>
          <Button color="light" size="sm" disabled={deleting} onClick={() => setDelTarget(null)}>Cancel</Button>
          <Button color="danger" size="sm" disabled={deleting} onClick={handleDelete}>
            {deleting ? <Spinner size="sm" /> : 'Yes, Remove'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default SubOfficialListPage;
