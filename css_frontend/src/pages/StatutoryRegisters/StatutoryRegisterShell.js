import React, { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { Container, Spinner } from 'reactstrap';
import { toast } from 'react-toastify';
import BreadCrumb from '../../Components/Common/BreadCrumb';
import DatePickerInput from '../../Components/Common/DatePickerInput';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import { getCompanyList } from '../../helpers/backend_helper';
import './OwnerRegister.css';

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 38,
    borderColor: state.isFocused ? '#405189' : 'var(--vz-border-color, #dfe3ea)',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(64,81,137,.1)' : 'none',
    background: 'var(--vz-input-bg, var(--vz-card-bg, #fff))',
    fontSize: 12.5,
    '&:hover': { borderColor: '#405189' },
  }),
  menu: (base) => ({ ...base, zIndex: 20, fontSize: 12.5 }),
  singleValue: (base) => ({ ...base, color: 'var(--vz-body-color)' }),
  placeholder: (base) => ({ ...base, color: '#9aa1ac' }),
};

const unwrapList = (response) => {
  const payload = response?.data ?? response;
  const list = payload?.data ?? payload ?? [];
  return Array.isArray(list) ? list : [];
};

const emptyFilters = (dateBasis) => ({
  companyId: '',
  dateBasis,
  fromDate: '',
  toDate: '',
  status: 'ALL',
  recordStage: 'ALL',
});

const StatutoryRegisterShell = ({ config }) => {
  useCollapseSidebar();

  const defaultDateBasis = config.dateBasisOptions[0].value;
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [pdpaMode, setPdpaMode] = useState('WITH');
  const [filters, setFilters] = useState(() => emptyFilters(defaultDateBasis));
  const [searching, setSearching] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);

  document.title = `${config.title} | ASR CSS`;

  useEffect(() => {
    let active = true;

    getCompanyList({ page: 1, limit: 1000, sort: 'name', order: 'ASC' })
      .then((response) => {
        if (active) setCompanies(unwrapList(response));
      })
      .catch(() => {
        if (active) {
          setCompanies([]);
          toast.error('Unable to load the entity filter');
        }
      })
      .finally(() => {
        if (active) setLoadingCompanies(false);
      });

    return () => { active = false; };
  }, []);

  const companyOptions = useMemo(() => companies.map((company) => ({
    value: String(company.entity_id),
    label: company.name,
    caption: company.client_no,
  })), [companies]);

  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setFiltersApplied(false);
  };

  const resetFilters = () => {
    setPdpaMode('WITH');
    setFilters(emptyFilters(defaultDateBasis));
    setFiltersApplied(false);
  };

  const applySearch = () => {
    if (!filters.companyId) {
      toast.error('Please select an entity name before searching');
      return;
    }
    if (filters.fromDate && filters.toDate && filters.fromDate > filters.toDate) {
      toast.error('From date must be before or equal to To date');
      return;
    }

    setSearching(true);
    setTimeout(() => {
      setSearching(false);
      setFiltersApplied(true);
    }, 250);
  };

  return (
    <div className="page-content owner-register-page">
      <Container fluid>
        <BreadCrumb title={config.title} pageTitle="Statutory Registers" />

        <section className="or-hero">
          <div className="or-hero-icon"><i className={config.icon} /></div>
          <div className="or-hero-copy">
            <h2>{config.title}</h2>
            <p>{config.description}</p>
          </div>
        </section>

        <section className="or-filter-card">
          <div className="or-filter-toolbar">
            <div className="or-visibility-control">
              <span className="or-visibility-label">Data visibility <i className="ri-information-line" /></span>
              <div className="or-segmented" role="group" aria-label="PDPA display mode">
                <button type="button" className={pdpaMode === 'WITH' ? 'active' : ''} onClick={() => setPdpaMode('WITH')}>
                  <i className="ri-shield-check-line" /> With PDPA
                </button>
                <button type="button" className={pdpaMode === 'WITHOUT' ? 'active' : ''} onClick={() => setPdpaMode('WITHOUT')}>
                  <i className="ri-eye-off-line" /> Without PDPA
                </button>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              {filtersApplied && <span className="d-inline-flex align-items-center gap-1 text-success fs-11 fw-semibold"><i className="ri-check-line" /> Filters applied</span>}
              <button type="button" className="or-reset-btn" onClick={resetFilters}>
                <i className="ri-refresh-line" /> Reset filters
              </button>
            </div>
          </div>

          <div className="or-filter-grid">
            <div className="or-field or-span-2">
              <label>Entity <span className="text-danger">*</span></label>
              <Select
                isClearable
                isSearchable
                isLoading={loadingCompanies}
                styles={selectStyles}
                options={companyOptions}
                value={companyOptions.find((item) => item.value === filters.companyId) || null}
                onChange={(option) => setFilter('companyId', option?.value || '')}
                placeholder="Select entity name"
                formatOptionLabel={(option) => (
                  <div className="or-option">
                    <span>{option.label}</span>
                    {option.caption && <small>{option.caption}</small>}
                  </div>
                )}
              />
            </div>
            <div className="or-field">
              <label>Date basis</label>
              <select value={filters.dateBasis} onChange={(event) => setFilter('dateBasis', event.target.value)}>
                {config.dateBasisOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="or-field">
              <label>From date</label>
              <DatePickerInput value={filters.fromDate} onChange={(event) => setFilter('fromDate', event.target.value)} placeholder="DD/MM/YYYY" />
            </div>
            <div className="or-field">
              <label>To date</label>
              <DatePickerInput value={filters.toDate} onChange={(event) => setFilter('toDate', event.target.value)} placeholder="DD/MM/YYYY" />
            </div>
            <div className="or-field">
              <label>Status</label>
              <select value={filters.status} onChange={(event) => setFilter('status', event.target.value)}>
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="CEASED">Ceased</option>
              </select>
            </div>
            <div className="or-field">
              <label>Record stage</label>
              <select value={filters.recordStage} onChange={(event) => setFilter('recordStage', event.target.value)}>
                <option value="ALL">All stages</option>
                <option value="EFFECTIVE">Effective</option>
                <option value="PROPOSED">Proposed</option>
              </select>
            </div>
            <div className="or-filter-action">
              <button type="button" className="or-search-btn" onClick={applySearch} disabled={searching || loadingCompanies}>
                {searching ? <Spinner size="sm" /> : <i className="ri-search-2-line" />}
                Search
              </button>
            </div>
          </div>
        </section>
      </Container>
    </div>
  );
};

export default StatutoryRegisterShell;
