import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Input,
  Row,
  Spinner,
} from 'reactstrap';
import classnames from 'classnames';
import { toast } from 'react-toastify';

import BreadCrumb from '../../Components/Common/BreadCrumb';
import DatePickerInput from '../../Components/Common/DatePickerInput';
import Pagination from '../../Components/Common/Pagination';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import { getCompanyList } from '../../helpers/backend_helper';
import { getRegistrationFields } from '../../helpers/common_helper';
import '../Individual/IndividualList.css';

const SORT_COLS = [
  { key: 'company_name', label: 'Company', sortable: true },
  { key: 'reg_no', label: 'UEN / FBRN', sortable: false },
  { key: 'events_count', label: 'Events', sortable: true },
  { key: 'next_due_date', label: 'Next Due', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

const BLANK_SIDE = {
  company_id: '',
  status: '',
  event_status: '',
  due_from: '',
  due_to: '',
  has_events: '',
};

const FILTER_LABELS = {
  search: 'Search',
  company_id: 'Company',
  status: 'Company Status',
  event_status: 'Event Status',
  due_from: 'Due From',
  due_to: 'Due To',
  has_events: 'Events',
};

const drawerStyles = `
  .cf-drawer-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.25); z-index: 1040; }
  .cf-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 340px; background: #fff; box-shadow: -4px 0 24px rgba(0,0,0,0.12); z-index: 1041; display: flex; flex-direction: column; transform: translateX(100%); transition: transform 0.25s ease; }
  .cf-drawer.open { transform: translateX(0); }
  .cf-drawer-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--vz-border-color); flex-shrink: 0; }
  .cf-drawer-head h6 { margin: 0; font-size: 14px; font-weight: 600; }
  .cf-drawer-close { width: 28px; height: 28px; border-radius: 6px; border: none; background: #f3f4f6; color: #374151; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; }
  .cf-drawer-body { flex: 1; overflow-y: auto; padding: 16px 18px; }
  .cf-drawer-foot { padding: 12px 18px; border-top: 1px solid var(--vz-border-color); display: flex; gap: 8px; flex-shrink: 0; }
  .cf-filter-group { margin-bottom: 14px; }
  .cf-filter-group label { font-size: 11px; font-weight: 600; color: #878a99; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 5px; display: block; }
  .cf-section-divider { font-size: 10px; font-weight: 700; color: #405189; text-transform: uppercase; letter-spacing: .06em; margin: 16px 0 10px; padding-bottom: 4px; border-bottom: 1px solid var(--vz-border-color); }
`;

const unwrapList = (res) => {
  const payload = res?.data?.data ?? res?.data ?? res;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const fmtDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' });
};

const statusColor = (status) => {
  const key = String(status || '').toUpperCase();
  if (key === 'ACTIVE' || key === 'COMPLETED' || key === 'FILED' || key === 'HELD') return 'success';
  if (key === 'INACTIVE' || key === 'OVERDUE') return 'danger';
  if (key === 'PENDING') return 'warning';
  if (key === 'DRAFT') return 'secondary';
  return 'info';
};

const hasRegistrationValue = (value) => {
  const text = String(value ?? '').trim();
  return Boolean(text && !['-', '—', 'â€”'].includes(text));
};

const registrationText = (entity) => {
  const country = entity.company_detail?.country || 'Singapore';
  return getRegistrationFields(entity, country)
    .map(item => item.value)
    .filter(hasRegistrationValue)
    .join(' ');
};

const RegFieldsBlock = ({ entity }) => {
  const country = entity.company_detail?.country || 'Singapore';
  const filled = getRegistrationFields(entity, country)
    .filter(item => hasRegistrationValue(item.value));

  if (!filled.length) {
    return (
      <div className="d-flex flex-column gap-1">
        <div>
          <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: 9, letterSpacing: '.05em' }}>UEN / FBRN</div>
          <div className="il-rich-mid-val empty">Not provided</div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-1">
      {filled.map(item => (
        <div key={item.key}>
          <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: 9, letterSpacing: '.05em' }}>{item.label}</div>
          <div className="fw-semibold" style={{ fontSize: 12 }}>{item.value}</div>
        </div>
      ))}
    </div>
  );
};

const SortIcon = ({ col, sortKey, sortDir }) => (
  <span className="sort-icons">
    <i className={classnames('ri-arrow-up-s-fill asc', { active: sortKey === col && sortDir === 'asc' })} />
    <i className={classnames('ri-arrow-down-s-fill desc', { active: sortKey === col && sortDir === 'desc' })} />
  </span>
);

const SkeletonRows = ({ cols }) => (
  <>
    {Array.from({ length: 8 }, (_, i) => (
      <tr key={i} className="il-skeleton-row">
        {Array.from({ length: cols }, (__, j) => <td key={j}><div style={{ width: j === 1 ? 180 : 90 }} /></td>)}
      </tr>
    ))}
  </>
);

const SideFilterDrawer = ({ open, onClose, filters, companyOptions, setFilter, onApply, onReset }) => (
  <>
    <style>{drawerStyles}</style>
    {open && <div className="cf-drawer-backdrop" onClick={onClose} />}
    <div className={classnames('cf-drawer', { open })}>
      <div className="cf-drawer-head">
        <h6><i className="ri-filter-3-line me-2 text-primary" />Advanced Filters</h6>
        <Button color="light" size="sm" className="cf-drawer-close" onClick={onClose}>
          <i className="ri-close-line" />
        </Button>
      </div>

      <div className="cf-drawer-body">
        <div className="cf-section-divider">Company</div>
        <div className="cf-filter-group">
          <label>Company</label>
          <Input type="select" bsSize="sm" value={filters.company_id} onChange={e => setFilter('company_id', e.target.value)}>
            <option value="">All companies</option>
            {companyOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Input>
        </div>
        <div className="cf-filter-group">
          <label>Company Status</label>
          <Input type="select" bsSize="sm" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PENDING">Pending</option>
          </Input>
        </div>

        <div className="cf-section-divider">Events</div>
        <div className="cf-filter-group">
          <label>Event Status</label>
          <Input type="select" bsSize="sm" value={filters.event_status} onChange={e => setFilter('event_status', e.target.value)}>
            <option value="">All</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="PENDING">Pending</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PREPARATION">In Preparation</option>
            <option value="AWAITING_DOCUMENTS">Awaiting Documents</option>
            <option value="AWAITING_CLIENT">Awaiting Client</option>
            <option value="AWAITING_APPROVAL">Awaiting Approval</option>
            <option value="READY_TO_FILE">Ready to File</option>
            <option value="FILED">Filed</option>
            <option value="COMPLETED">Completed</option>
            <option value="HELD">Held</option>
            <option value="OVERDUE">Overdue</option>
            <option value="NOT_APPLICABLE">Not Applicable</option>
            <option value="DRAFT">Draft</option>
          </Input>
        </div>
        <div className="cf-filter-group">
          <label>Event Availability</label>
          <Input type="select" bsSize="sm" value={filters.has_events} onChange={e => setFilter('has_events', e.target.value)}>
            <option value="">All companies</option>
            <option value="YES">With events</option>
            <option value="NO">Without events</option>
          </Input>
        </div>
        <div className="cf-filter-group">
          <label>Next Due Date</label>
          <div className="d-flex gap-2">
            <DatePickerInput value={filters.due_from} onChange={e => setFilter('due_from', e.target.value)} />
            <DatePickerInput value={filters.due_to} onChange={e => setFilter('due_to', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="cf-drawer-foot">
        <Button size="sm" color="light" onClick={onReset} className="d-flex align-items-center gap-1">
          <i className="ri-refresh-line" /> Reset
        </Button>
        <Button size="sm" color="primary" onClick={() => { onApply(); onClose(); }} className="d-flex align-items-center justify-content-center gap-1 flex-grow-1">
          <i className="ri-search-line" /> Apply Filters
        </Button>
      </div>
    </div>
  </>
);

const ComplianceList = () => {
  useCollapseSidebar();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState('company_name');
  const [sortDir, setSortDir] = useState('asc');
  const [search, setSearch] = useState('');
  const [sideFilters, setSideFilters] = useState({ ...BLANK_SIDE });
  const [applied, setApplied] = useState({ search: '', ...BLANK_SIDE });
  const [drawerOpen, setDrawerOpen] = useState(false);

  document.title = 'Compliance | ASR CSS';

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCompanyList({ page: 1, limit: 1000, order: 'entity_id:DESC' });
      setCompanies(unwrapList(res));
    } catch {
      toast.error('Failed to load compliance list');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const setSideFilter = (key, value) => setSideFilters(filters => ({ ...filters, [key]: value }));
  const applyFilters = () => { setApplied({ search, ...sideFilters }); setPage(1); };
  const resetFilters = () => {
    setSearch('');
    setSideFilters({ ...BLANK_SIDE });
    setApplied({ search: '', ...BLANK_SIDE });
    setPage(1);
  };
  const removeChip = (key) => {
    if (key === 'search') {
      setSearch('');
      setApplied(filters => ({ ...filters, search: '' }));
    } else {
      setSideFilters(filters => ({ ...filters, [key]: '' }));
      setApplied(filters => ({ ...filters, [key]: '' }));
    }
    setPage(1);
  };

  const rows = useMemo(() => companies.map((company) => {
    const events = Array.isArray(company.events) ? company.events.filter(event => !event.is_deleted) : [];
    const nextEvent = events
      .filter(event => event.due_date)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

    return {
      ...company,
      company_name: company.name || `Company #${company.entity_id}`,
      reg_no: registrationText(company),
      events_count: events.length,
      next_due_date: nextEvent?.due_date || '',
      next_event_status: nextEvent?.display_status || nextEvent?.status || '',
      incorporation_date: company.company_detail?.company_incorporation_date || '',
      active_events: events,
    };
  }), [companies]);

  const companyOptions = useMemo(() => rows
    .map(row => ({ value: String(row.entity_id), label: row.company_name }))
    .sort((a, b) => a.label.localeCompare(b.label)), [rows]);

  const filteredRows = useMemo(() => {
    const keyword = applied.search.trim().toLowerCase();
    const from = applied.due_from ? new Date(applied.due_from).getTime() : null;
    const to = applied.due_to ? new Date(applied.due_to).getTime() : null;

    return rows.filter((row) => {
      const matchesSearch = !keyword || [
        row.company_name,
        row.client_no,
        row.reg_no,
        row.status,
      ].some(value => String(value || '').toLowerCase().includes(keyword));

      const matchesCompany = !applied.company_id || String(row.entity_id) === String(applied.company_id);
      const matchesStatus = !applied.status || String(row.status || '').toUpperCase() === applied.status;
      const matchesEventStatus = !applied.event_status || row.active_events.some(event => String(event.display_status || event.status || '').toUpperCase() === applied.event_status);
      const matchesHasEvents = !applied.has_events ||
        (applied.has_events === 'YES' ? row.events_count > 0 : row.events_count === 0);

      const dueTime = row.next_due_date ? new Date(row.next_due_date).getTime() : null;
      const matchesDueFrom = !from || (dueTime && dueTime >= from);
      const matchesDueTo = !to || (dueTime && dueTime <= to);

      return matchesSearch && matchesCompany && matchesStatus && matchesEventStatus && matchesHasEvents && matchesDueFrom && matchesDueTo;
    });
  }, [applied, rows]);

  const sortedRows = useMemo(() => {
    const sorted = [...filteredRows];
    sorted.sort((a, b) => {
      const left = a[sortKey] ?? '';
      const right = b[sortKey] ?? '';
      if (sortKey.includes('date')) {
        return sortDir === 'asc'
          ? new Date(left || 0).getTime() - new Date(right || 0).getTime()
          : new Date(right || 0).getTime() - new Date(left || 0).getTime();
      }
      if (typeof left === 'number' || typeof right === 'number') {
        return sortDir === 'asc' ? Number(left) - Number(right) : Number(right) - Number(left);
      }
      return sortDir === 'asc'
        ? String(left).localeCompare(String(right))
        : String(right).localeCompare(String(left));
    });
    return sorted;
  }, [filteredRows, sortDir, sortKey]);

  const total = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeChips = Object.entries(applied).filter(([, value]) => value);
  const sideActiveCount = Object.entries(applied).filter(([key, value]) => key !== 'search' && value).length;

  const kpi = useMemo(() => ({
    total: rows.length,
    withEvents: rows.filter(row => row.events_count > 0).length,
    pending: rows.reduce((count, row) => count + row.active_events.filter(event => String(event.display_status || event.status || '').toUpperCase() === 'PENDING').length, 0),
    overdue: rows.reduce((count, row) => count + row.active_events.filter(event => String(event.display_status || event.status || '').toUpperCase() === 'OVERDUE').length, 0),
  }), [rows]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const formatChipValue = (key, value) => {
    if (key === 'company_id') {
      return companyOptions.find(option => option.value === String(value))?.label || value;
    }
    if (key === 'has_events') {
      return value === 'YES' ? 'With events' : value === 'NO' ? 'Without events' : value;
    }
    return value;
  };

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(dir => (dir === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Compliance" pageTitle="Compliance" infoLink="/compliance/system-guide" />

        <Row className="g-3 mb-3">
          {[
            { key: 'total', label: 'Companies', icon: 'ri-building-4-line', color: '#405189' },
            { key: 'withEvents', label: 'With Events', icon: 'ri-calendar-check-line', color: '#0ab39c' },
            { key: 'pending', label: 'Pending Events', icon: 'ri-time-line', color: '#f0b232' },
            { key: 'overdue', label: 'Overdue Events', icon: 'ri-alert-line', color: '#f06548' },
          ].map(item => (
            <Col key={item.key} xl={3} md={6}>
              <div className="il-kpi" style={{ background: `${item.color}14`, borderColor: `${item.color}14` }}>
                <div className="il-kpi-icon" style={{ background: item.color }}><i className={item.icon} /></div>
                <div>
                  <div className="il-kpi-val">{kpi[item.key]}</div>
                  <div className="il-kpi-lbl">{item.label}</div>
                </div>
              </div>
            </Col>
          ))}
        </Row>

        <Card>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--vz-border-color)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 340 }}>
              <i className="ri-search-line" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#878a99', fontSize: 13, pointerEvents: 'none' }} />
              <Input
                bsSize="sm"
                style={{ paddingLeft: 28 }}
                placeholder="Search company, UEN/FBRN, client no..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyFilters()}
              />
            </div>

            <Button size="sm" color="primary" onClick={applyFilters} className="d-flex align-items-center gap-1">
              <i className="ri-search-line" /> Search
            </Button>

            <Button size="sm" color="light" onClick={() => setDrawerOpen(true)} className="d-flex align-items-center gap-1 ms-1" style={{ position: 'relative' }}>
              <i className="ri-equalizer-line" /> Filters
              {sideActiveCount > 0 && (
                <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 16, height: 16, borderRadius: 8, background: '#405189', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                  {sideActiveCount}
                </span>
              )}
            </Button>

            {activeChips.length > 0 && (
              <Button size="sm" color="link" className="text-danger d-flex align-items-center gap-1" onClick={resetFilters}>
                <i className="ri-refresh-line" /> Reset all
              </Button>
            )}

            <div className="ms-auto d-flex align-items-center gap-2">
              <span style={{ fontSize: 11, fontWeight: 600, background: 'rgba(64,81,137,.1)', color: '#405189', borderRadius: 10, padding: '2px 8px' }}>
                {total} {total === 1 ? 'company' : 'companies'}
              </span>
              <Button size="sm" color="warning" className="d-flex align-items-center gap-1" onClick={() => navigate('/compliance/events/list')}>
                <i className="ri-calendar-event-line" /> All Events
              </Button>
              <Button size="sm" color="warning" className="d-flex align-items-center gap-1" onClick={() => navigate('/compliance/multi-event/create')}>
                <i className="ri-add-circle-line" /> Add Compliance
              </Button>
            </div>
          </div>

          {activeChips.length > 0 && (
            <div style={{ padding: '6px 18px', borderBottom: '1px solid var(--vz-border-color)', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#878a99' }}>Active:</span>
              {activeChips.map(([key, value]) => (
                <span key={key} className="il-chip">
                  <span style={{ color: '#878a99', marginRight: 2 }}>{FILTER_LABELS[key] || key}:</span> {formatChipValue(key, value)}
                  <Button color="link" size="sm" className="p-0 border-0" onClick={() => removeChip(key)}>
                    <i className="ri-close-line" />
                  </Button>
                </span>
              ))}
            </div>
          )}

          <div className="il-table-wrap">
            <table className="il-table">
              <thead>
                <tr>
                  <th style={{ width: 44, textAlign: 'center' }}>#</th>
                  {SORT_COLS.map(col => (
                    <th
                      key={col.key}
                      className={classnames({ sortable: col.sortable, 'sort-asc': sortKey === col.key && sortDir === 'asc', 'sort-desc': sortKey === col.key && sortDir === 'desc' })}
                      onClick={() => col.sortable && handleSort(col.key)}
                    >
                      {col.label}
                      {col.sortable && <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />}
                    </th>
                  ))}
                  <th style={{ width: 128 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows cols={SORT_COLS.length + 2} />
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={SORT_COLS.length + 2}>
                      <div className="il-empty">
                        <div className="il-empty-icon"><i className="ri-calendar-event-line" /></div>
                        <h6>No companies found</h6>
                        <p>Try adjusting filters or <Link to="/settings">review event rules</Link>.</p>
                      </div>
                    </td>
                  </tr>
                ) : pageRows.map((row, index) => (
                  <tr key={row.entity_id}>
                    <td style={{ textAlign: 'center', color: '#878a99', fontSize: 12 }}>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td>
                      <div className="fw-semibold">{row.company_name}</div>
                      {(row.client_no || row.incorporation_date) && (
                        <div className="text-muted" style={{ fontSize: 11 }}>
                          {row.client_no ? `Client: ${row.client_no}` : ''}
                          {row.client_no && row.incorporation_date ? ' | ' : ''}
                          {row.incorporation_date ? `Inc: ${fmtDate(row.incorporation_date)}` : ''}
                        </div>
                      )}
                    </td>
                    <td><RegFieldsBlock entity={row} /></td>
                    <td><span className="badge bg-primary-subtle text-primary">{row.events_count}</span></td>
                    <td>{fmtDate(row.next_due_date)}</td>
                    <td>
                      <Badge color={statusColor(row.status)} pill>{row.status || 'Pending'}</Badge>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Button size="sm" color="primary" outline className="d-flex align-items-center gap-1" onClick={() => navigate(`/compliance/events/company/${row.entity_id}`)}>
                          <i className="ri-calendar-event-line" /> View Events
                        </Button>
    
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && total > 0 && (
            <div style={{ padding: '8px 18px', borderTop: '1px solid var(--vz-border-color)' }}>
              <Pagination
                total={total}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              />
            </div>
          )}
        </Card>
      </Container>

      {loading && (
        <div className="position-fixed top-0 start-0 end-0 bottom-0 d-none align-items-center justify-content-center">
          <Spinner color="primary" />
        </div>
      )}

      <SideFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={sideFilters}
        companyOptions={companyOptions}
        setFilter={setSideFilter}
        onApply={applyFilters}
        onReset={() => { resetFilters(); setDrawerOpen(false); }}
      />
    </div>
  );
};

export default ComplianceList;
