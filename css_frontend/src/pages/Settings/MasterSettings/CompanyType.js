import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import MasterDataView from '../../../Components/Common/MasterDataView';
import { getLoggedinUser } from '../../../helpers/api_helper';

import {
  getCompanyTypeList,
  createCompanyType,
  updateCompanyType,
  deleteCompanyType,
} from '../../../helpers/backend_helper';

const COLUMNS = [
  { key: 'company_type_name', label: 'Company Type', sortable: true, gridPrimary: true },
];

const FIELDS = [
  {
    name: 'company_type_name',
    label: 'Company Type',
    placeholder: 'e.g. Private Limited Company',
    validation: Yup.string()
      .min(2)
      .max(150)
      .required('Company type is required'),
  },
];

const CompanyType = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loggedUser = getLoggedinUser();
  const updatedBy = loggedUser?.user_id ?? loggedUser?.id ?? 1;

  const fetchList = async () => {
    setLoading(true);

    try {
      const res = await getCompanyTypeList({ page: 1, limit: 100 ,order: 'company_type_id:ASC' });

      const list =
        res?.data?.data ??
        res?.data ??
        res;

      setData(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Failed to load company types', { autoClose: 3000 });
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
      await createCompanyType({
        ...values,
        updated_by: updatedBy,
      });

      toast.success('Company type added successfully', { autoClose: 3000 });

      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to add company type', { autoClose: 3000 });

      setLoading(false);
    }
  };

  const handleEdit = async (item, values) => {
    const id =
      item.company_type_id ??
      item.id;

    setLoading(true);

    try {
      await updateCompanyType(id, {
        ...values,
        updated_by: updatedBy,
      });

      toast.success('Company type updated successfully', { autoClose: 3000 });

      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to update company type', { autoClose: 3000 });

      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const id =
      item.company_type_id ??
      item.id;

    setLoading(true);

    try {
      await deleteCompanyType(id);

      toast.success('Company type deleted successfully', { autoClose: 3000 });

      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to delete company type', { autoClose: 3000 });

      setLoading(false);
    }
  };

  return (
    <MasterDataView
      title="List Of Company Types"
      modalTitle="Company Type"
      listId="companyTypeList"
      columns={COLUMNS}
      fields={FIELDS}
      data={data}
      loading={loading}
      emptyMessage="No company types found."
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default CompanyType;