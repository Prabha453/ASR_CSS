import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { Spinner } from 'reactstrap';
import { getCountriesList } from '../../../helpers/backend_helper';

const AuthorizedCapital = ({ formik }) => {
  const [options,  setOptions]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getCountriesList({ page: 1, limit: 300 })
      .then(r => {
        const list = r?.data?.data ?? r?.data ?? [];
        setOptions(
          Array.isArray(list)
            ? list
                .map(c => ({ value: c.id, label: c.name }))
                .sort((a, b) => a.label.localeCompare(b.label))
            : []
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selected = (formik.values.cp_authorized_captial_countries || [])
    .map(name => options.find(o => o.label === name))
    .filter(Boolean);

  const handleChange = (chosen) => {
    formik.setFieldValue(
      'cp_authorized_captial_countries',
      (chosen || []).map(o => o.label)
    );
  };

  return (
    <div style={{ maxWidth: '50%' }}>
      <div style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--vz-body-color)' }}>
          Authorized Capital Countries
        </span>
        <div style={{ fontSize: 11, color: 'var(--vz-sidebar-sub-item-color, #878a99)', marginTop: 2 }}>
          Select the countries applicable for authorized capital
        </div>
      </div>

      {loading ? (
        <div className="d-flex align-items-center gap-2" style={{ height: 38 }}>
          <Spinner size="sm" color="success" />
          <span style={{ fontSize: 12, color: '#878a99' }}>Loading countries…</span>
        </div>
      ) : (
        <Select
          isMulti
          options={options}
          value={selected}
          onChange={handleChange}
          placeholder="Select countries…"
          classNamePrefix="rs"
          styles={{
            control: (base, state) => ({
              ...base,
              borderColor: state.isFocused ? '#405189' : 'var(--vz-border-color, #e9ebec)',
              boxShadow: state.isFocused ? '0 0 0 2px rgba(64,81,137,0.15)' : 'none',
              '&:hover': { borderColor: '#405189' },
              fontSize: 13,
            }),
            multiValue: base => ({
              ...base,
              background: 'rgba(64,81,137,0.1)',
              borderRadius: 4,
            }),
            multiValueLabel: base => ({
              ...base,
              color: '#405189',
              fontWeight: 500,
              fontSize: 12,
            }),
            multiValueRemove: base => ({
              ...base,
              color: '#405189',
              ':hover': { background: 'rgba(64,81,137,0.2)', color: '#405189' },
            }),
            option: (base, state) => ({
              ...base,
              fontSize: 13,
              background: state.isSelected
                ? '#405189'
                : state.isFocused
                ? 'rgba(64,81,137,0.08)'
                : 'transparent',
              color: state.isSelected ? '#fff' : 'var(--vz-body-color)',
            }),
            menu: base => ({ ...base, zIndex: 9999 }),
          }}
        />
      )}

      {selected.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 11, color: '#878a99' }}>
          {selected.length} countr{selected.length === 1 ? 'y' : 'ies'} selected
        </div>
      )}
    </div>
  );
};

export default AuthorizedCapital;
