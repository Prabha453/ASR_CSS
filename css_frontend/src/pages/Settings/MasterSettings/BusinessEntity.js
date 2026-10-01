import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import MasterDataView from '../../../Components/Common/MasterDataView';
import { getLoggedinUser } from '../../../helpers/api_helper';

import {
  getBusinessEntityList,
  createBusinessEntity,
  updateBusinessEntity,
  deleteBusinessEntity,
} from '../../../helpers/backend_helper';

const COLUMNS = [
  { key: 'bs_name', label: 'Business Entity', sortable: true, gridPrimary: true },
];

const FIELDS = [
  {
    name: 'bs_name',
    label: 'Business Entity',
    placeholder: 'e.g. Sole Proprietorship',
    validation: Yup.string()
      .min(2)
      .max(150)
      .required('Business entity is required'),
  },
];

const BusinessEntity = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loggedUser = getLoggedinUser();
  const updatedBy = loggedUser?.user_id ?? loggedUser?.id ?? 1;

  const fetchList = async () => {
    setLoading(true);

    try {
      const res = await getBusinessEntityList({ page: 1, limit: 100 , order: 'bn_id:ASC'});

      const list =
        res?.data?.data ??
        res?.data ??
        res;

      setData(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Failed to load business entities', { autoClose: 3000 });
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
      await createBusinessEntity({
        ...values,
        updated_by: updatedBy,
      });

      toast.success('Business entity added successfully', { autoClose: 3000 });

      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to add business entity', { autoClose: 3000 });

      setLoading(false);
    }
  };

  const handleEdit = async (item, values) => {
    const id =
      item.bn_id ??
      item.id;

    setLoading(true);

    try {
      await updateBusinessEntity(id, {
        ...values,
        updated_by: updatedBy,
      });

      toast.success('Business entity updated successfully', { autoClose: 3000 });

      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to update business entity', { autoClose: 3000 });

      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const id =
      item.bn_id ??
      item.id;

    setLoading(true);

    try {
      await deleteBusinessEntity(id);

      toast.success('Business entity deleted successfully', { autoClose: 3000 });

      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to delete business entity', { autoClose: 3000 });

      setLoading(false);
    }
  };

  return (
    <MasterDataView
      title="List Of Business Entities"
      modalTitle="Business Entity"
      listId="businessEntityList"
      columns={COLUMNS}
      fields={FIELDS}
      data={data}
      loading={loading}
      emptyMessage="No business entities found."
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default BusinessEntity;