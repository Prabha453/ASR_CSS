import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import MasterDataView from '../../../Components/Common/MasterDataView';

import { getLoggedinUser } from '../../../helpers/api_helper';

import {
  getEntityStatusList,
  createEntityStatus,
  updateEntityStatus,
  deleteEntityStatus,
} from '../../../helpers/backend_helper';

const COLUMNS = [
  {
    key: 'e_status_name',
    label: 'Status Name',
    sortable: true,
    gridPrimary: true,
  },
];

const FIELDS = [
  {
    name: 'e_status_name',
    label: 'Status Name',
    placeholder: 'Enter status name',
    validation: Yup.string()
      .min(2)
      .max(200)
      .required('Status name is required'),
  },
];

const EntityStatus = () => {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loggedUser = getLoggedinUser();

  const updatedBy =
    loggedUser?.user_id ??
    loggedUser?.id ??
    1;

  document.title = 'ASR::CSS | Entity Status';

  const fetchList = async () => {

    setLoading(true);

    try {

      const res =
        await getEntityStatusList({
          page: 1,
          limit: 100,
          order: 'e_status_id:ASC',
        });

      const list =
        res?.data?.data ??
        res?.data ??
        res;

      setData(
        Array.isArray(list)
          ? list
          : []
      );

    } catch (err) {

      toast.error(
        'Failed to load entity statuses',
        { autoClose: 3000 }
      );

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

      await createEntityStatus({
        ...values,
        updated_by: updatedBy,
      });

      toast.success(
        'Entity status added successfully',
        { autoClose: 3000 }
      );

      await fetchList();

    } catch (err) {

      toast.error(
        err?.message ||
        'Failed to add entity status',
        { autoClose: 3000 }
      );

      setLoading(false);

    }
  };

  const handleEdit = async (item, values) => {

    const id =
      item.e_status_id ??
      item.id;

    setLoading(true);

    try {

      await updateEntityStatus(
        id,
        {
          ...values,
          updated_by: updatedBy,
        }
      );

      toast.success(
        'Entity status updated successfully',
        { autoClose: 3000 }
      );

      await fetchList();

    } catch (err) {

      toast.error(
        err?.message ||
        'Failed to update entity status',
        { autoClose: 3000 }
      );

      setLoading(false);

    }
  };

  const handleDelete = async (item) => {

    const id =
      item.e_status_id ??
      item.id;

    setLoading(true);

    try {

      await deleteEntityStatus(id);

      toast.success(
        'Entity status deleted successfully',
        { autoClose: 3000 }
      );

      await fetchList();

    } catch (err) {

      toast.error(
        err?.message ||
        'Failed to delete entity status',
        { autoClose: 3000 }
      );

      setLoading(false);

    }
  };

  return (
    <MasterDataView
      title="List Of Entity Statuses"
      modalTitle="Entity Status"
      listId="entityStatusList"
      columns={COLUMNS}
      fields={FIELDS}
      data={data}
      loading={loading}
      emptyMessage="No entity statuses found."
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default EntityStatus;