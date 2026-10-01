import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import MasterDataView from '../../../Components/Common/MasterDataView';
import { getLoggedinUser } from '../../../helpers/api_helper';

import {
  getCompanySegregationList,
  createCompanySegregation,
  updateCompanySegregation,
  deleteCompanySegregation,
} from '../../../helpers/backend_helper';

const COLUMNS = [
  { key: 'segregation_name', label: 'Segregation Name', sortable: true, gridPrimary: true },
];

const FIELDS = [
  {
    name: 'segregation_name',
    label: 'Segregation Name',
    placeholder: 'e.g. Local Company, Foreign Company',
    validation: Yup.string()
      .min(2)
      .max(150)
      .required('Segregation name is required'),
  },
];

const CompanySegregation = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loggedUser = getLoggedinUser();
  const updatedBy = loggedUser?.user_id ?? loggedUser?.id ?? 1;

  const fetchList = async () => {
    setLoading(true);

    try {
      const res = await getCompanySegregationList({ page: 1, limit: 100 ,order: 'segregation_id:ASC'});

      const list =
        res?.data?.data ??
        res?.data ??
        res;

      setData(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Failed to load company segregations', { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleAdd = async (values) => {
    setLoading(true);

    try {
      await createCompanySegregation({
        ...values,
        updated_by: updatedBy,
      });

      toast.success('Company segregation added successfully', { autoClose: 3000 });

      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to add company segregation', { autoClose: 3000 });

      setLoading(false);
    }
  };

  const handleEdit = async (item, values) => {
    const id =
      item.segregation_id ??
      item.id;

    setLoading(true);

    try {
      await updateCompanySegregation(id, {
        ...values,
        updated_by: updatedBy,
      });

      toast.success('Company segregation updated successfully', { autoClose: 3000 });

      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to update company segregation', { autoClose: 3000 });

      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const id =
      item.segregation_id ??
      item.id;

    setLoading(true);

    try {
      await deleteCompanySegregation(id);

      toast.success('Company segregation deleted successfully', { autoClose: 3000 });

      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to delete company segregation', { autoClose: 3000 });

      setLoading(false);
    }
  };

  return (
    <MasterDataView
      title="List Of Company Segregations"
      modalTitle="Company Segregation"
      listId="companySegregationList"
      columns={COLUMNS}
      fields={FIELDS}
      data={data}
      loading={loading}
      emptyMessage="No company segregations found."
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default CompanySegregation;