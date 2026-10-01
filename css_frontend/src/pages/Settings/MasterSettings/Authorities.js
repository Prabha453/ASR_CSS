import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import MasterDataView from '../../../Components/Common/MasterDataView';
import { getLoggedinUser } from '../../../helpers/api_helper';
import {
  getAuthoritiesList,
  createAuthority,
  updateAuthority,
  deleteAuthority,
  getCountriesList,
  getJurisdictionsList,
} from '../../../helpers/backend_helper';

const Authorities = () => {
  const [data, setData] = useState([]);
  const [countries, setCountries] = useState([]);
  const [jurisdictions, setJurisdictions] = useState([]);
  const [loading, setLoading] = useState(false);

  const loggedUser = getLoggedinUser();
  const updatedBy = loggedUser?.user_id ?? loggedUser?.id ?? 1;

  document.title = 'ASR::CSS | Authorities';

  const countryOptions = countries.map(c => ({ value: c.id, label: c.country_name || c.name }));
  const countryNameById = countries.reduce((acc, c) => { acc[c.id] = c.country_name || c.name; return acc; }, {});
  const jurisdictionOptions = jurisdictions.map(j => ({ value: j.jurisdiction_id, label: j.name }));
  const jurisdictionNameById = jurisdictions.reduce((acc, j) => { acc[j.jurisdiction_id] = j.name; return acc; }, {});

  const COLUMNS = [
    { key: 'name', label: 'Name', sortable: true, gridPrimary: true },
    { key: 'authority_type', label: 'Type', sortable: true, showInGrid: true },
    { key: 'country_name', label: 'Country', sortable: false, showInGrid: true },
    { key: 'jurisdiction_name', label: 'Jurisdiction', sortable: false, showInGrid: true },
    { key: 'is_active_label', label: 'Active', sortable: true, showInGrid: true, badge: true, badgeMap: { Yes: 'success', No: 'danger' } },
  ];

  const FIELDS = [
    {
      name: 'name',
      label: 'Authority Name',
      placeholder: 'e.g. Accounting and Corporate Regulatory Authority',
      validation: Yup.string().min(2).max(150).required('Name is required'),
    },
    {
      name: 'authority_type',
      label: 'Authority Type',
      required: false,
      placeholder: 'e.g. Registrar, Tax Authority',
      validation: Yup.string().max(80).nullable(),
    },
    {
      name: 'country_id',
      label: 'Country',
      type: 'select',
      required: false,
      options: countryOptions,
      validation: Yup.number().nullable(),
    },
    {
      name: 'jurisdiction_id',
      label: 'Jurisdiction (optional — for a subdivision-specific authority)',
      type: 'select',
      required: false,
      options: jurisdictionOptions,
      validation: Yup.number().nullable(),
    },
    {
      name: 'is_active',
      label: 'Active',
      type: 'checkbox',
      defaultValue: true,
      required: false,
      validation: Yup.boolean(),
    },
  ];

  const fetchMasters = async () => {
    try {
      const [countryRes, jurisdictionRes] = await Promise.all([
        getCountriesList({ page: 1, limit: 500 }),
        getJurisdictionsList({ page: 1, limit: 500 }),
      ]);
      const countryList = countryRes?.data?.data ?? countryRes?.data ?? countryRes;
      const jurisdictionList = jurisdictionRes?.data?.data ?? jurisdictionRes?.data ?? jurisdictionRes;
      setCountries(Array.isArray(countryList) ? countryList : []);
      setJurisdictions(Array.isArray(jurisdictionList) ? jurisdictionList : []);
    } catch (err) {
      toast.error('Failed to load countries/jurisdictions', { autoClose: 3000 });
    }
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await getAuthoritiesList({ page: 1, limit: 500, order: 'authority_id:ASC' });
      const list = res?.data?.data ?? res?.data ?? res;
      setData(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Failed to load authorities', { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMasters(); fetchList(); }, []);

  const enrichedData = data.map(row => ({
    ...row,
    country_name: row.country_id ? (countryNameById[row.country_id] || '-') : '-',
    jurisdiction_name: row.jurisdiction_id ? (jurisdictionNameById[row.jurisdiction_id] || '-') : '-',
    is_active_label: row.is_active !== false ? 'Yes' : 'No',
  }));

  const handleAdd = async (values) => {
    setLoading(true);
    try {
      await createAuthority({ ...values, updated_by: updatedBy });
      toast.success('Authority added successfully', { autoClose: 3000 });
      await fetchList();
    } catch (err) {
      toast.error(err?.message || 'Failed to add authority', { autoClose: 3000 });
      setLoading(false);
    }
  };

  const handleEdit = async (item, values) => {
    const id = item.authority_id ?? item.id;
    setLoading(true);
    try {
      await updateAuthority(id, { ...values, updated_by: updatedBy });
      toast.success('Authority updated successfully', { autoClose: 3000 });
      await fetchList();
    } catch (err) {
      toast.error(err?.message || 'Failed to update authority', { autoClose: 3000 });
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const id = item.authority_id ?? item.id;
    setLoading(true);
    try {
      await deleteAuthority(id);
      toast.success('Authority deleted successfully', { autoClose: 3000 });
      await fetchList();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete authority', { autoClose: 3000 });
      setLoading(false);
    }
  };

  return (
    <MasterDataView
      title="List Of Authorities"
      modalTitle="Authority"
      listId="authorityList"
      columns={COLUMNS}
      fields={FIELDS}
      data={enrichedData}
      loading={loading}
      emptyMessage="No authorities found."
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default Authorities;
