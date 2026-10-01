import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import MasterDataView from '../../../Components/Common/MasterDataView';
import { getLoggedinUser } from '../../../helpers/api_helper';
import {
  getJurisdictionsList,
  createJurisdiction,
  updateJurisdiction,
  deleteJurisdiction,
  getCountriesList,
} from '../../../helpers/backend_helper';
import { JURISDICTION_LEVEL_OPTIONS, JURISDICTION_LEVEL_LABELS } from '../../../helpers/common_helper';

const Jurisdictions = () => {
  const [data, setData] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);

  const loggedUser = getLoggedinUser();
  const updatedBy = loggedUser?.user_id ?? loggedUser?.id ?? 1;

  document.title = 'ASR::CSS | Jurisdictions';

  const countryOptions = countries.map(c => ({ value: c.id, label: c.country_name || c.name }));
  const countryNameById = countries.reduce((acc, c) => { acc[c.id] = c.country_name || c.name; return acc; }, {});
  const jurisdictionOptions = data.map(j => ({ value: j.jurisdiction_id, label: j.name }));
  const jurisdictionNameById = data.reduce((acc, j) => { acc[j.jurisdiction_id] = j.name; return acc; }, {});

  const COLUMNS = [
    { key: 'name', label: 'Name', sortable: true, gridPrimary: true },
    { key: 'level_label', label: 'Level', sortable: true, showInGrid: true },
    { key: 'country_name', label: 'Country', sortable: false, showInGrid: true },
    { key: 'parent_name', label: 'Parent', sortable: false, showInGrid: true },
    { key: 'code', label: 'Code', sortable: false, showInGrid: true },
    { key: 'is_active_label', label: 'Active', sortable: true, showInGrid: true, badge: true, badgeMap: { Yes: 'success', No: 'danger' } },
  ];

  const FIELDS = [
    {
      name: 'country_id',
      label: 'Country',
      type: 'select',
      options: countryOptions,
      validation: Yup.number().typeError('Country is required').required('Country is required'),
    },
    {
      name: 'level',
      label: 'Level',
      type: 'select',
      defaultValue: 'STATE_PROVINCE',
      options: JURISDICTION_LEVEL_OPTIONS,
      validation: Yup.string().oneOf(JURISDICTION_LEVEL_OPTIONS.map(o => o.value)).required('Level is required'),
    },
    {
      name: 'parent_jurisdiction_id',
      label: 'Parent Jurisdiction',
      type: 'select',
      required: false,
      options: jurisdictionOptions,
      validation: Yup.number().nullable(),
    },
    {
      name: 'name',
      label: 'Name',
      placeholder: 'e.g. California, Dubai Airport Free Zone',
      validation: Yup.string().min(2).max(150).required('Name is required'),
    },
    {
      name: 'code',
      label: 'Code',
      required: false,
      placeholder: 'e.g. CA, DAFZA',
      validation: Yup.string().max(50).nullable(),
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

  const fetchCountries = async () => {
    try {
      const res = await getCountriesList({ page: 1, limit: 500 });
      const list = res?.data?.data ?? res?.data ?? res;
      setCountries(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Failed to load countries', { autoClose: 3000 });
    }
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await getJurisdictionsList({ page: 1, limit: 500, order: 'jurisdiction_id:ASC' });
      const list = res?.data?.data ?? res?.data ?? res;
      setData(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Failed to load jurisdictions', { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCountries(); fetchList(); }, []);

  const enrichedData = data.map(row => ({
    ...row,
    level_label: JURISDICTION_LEVEL_LABELS[row.level] || row.level,
    country_name: countryNameById[row.country_id] || '-',
    parent_name: row.parent_jurisdiction_id ? (jurisdictionNameById[row.parent_jurisdiction_id] || '-') : '-',
    is_active_label: row.is_active !== false ? 'Yes' : 'No',
  }));

  const handleAdd = async (values) => {
    setLoading(true);
    try {
      await createJurisdiction({ ...values, updated_by: updatedBy });
      toast.success('Jurisdiction added successfully', { autoClose: 3000 });
      await fetchList();
    } catch (err) {
      toast.error(err?.message || 'Failed to add jurisdiction', { autoClose: 3000 });
      setLoading(false);
    }
  };

  const handleEdit = async (item, values) => {
    const id = item.jurisdiction_id ?? item.id;
    setLoading(true);
    try {
      await updateJurisdiction(id, { ...values, updated_by: updatedBy });
      toast.success('Jurisdiction updated successfully', { autoClose: 3000 });
      await fetchList();
    } catch (err) {
      toast.error(err?.message || 'Failed to update jurisdiction', { autoClose: 3000 });
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const id = item.jurisdiction_id ?? item.id;
    setLoading(true);
    try {
      await deleteJurisdiction(id);
      toast.success('Jurisdiction deleted successfully', { autoClose: 3000 });
      await fetchList();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete jurisdiction', { autoClose: 3000 });
      setLoading(false);
    }
  };

  return (
    <MasterDataView
      title="List Of Jurisdictions"
      modalTitle="Jurisdiction"
      listId="jurisdictionList"
      columns={COLUMNS}
      fields={FIELDS}
      data={enrichedData}
      loading={loading}
      emptyMessage="No jurisdictions found."
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default Jurisdictions;
