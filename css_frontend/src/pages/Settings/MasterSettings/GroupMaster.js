import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import MasterDataView from '../../../Components/Common/MasterDataView';

import { getLoggedinUser } from '../../../helpers/api_helper';

import {
  getGroupMasterList,
  createGroupMaster,
  updateGroupMaster,
  deleteGroupMaster,
} from '../../../helpers/backend_helper';

const COLUMNS = [
  {
    key: 'group_name',
    label: 'Group Name',
    sortable: true,
    gridPrimary: true,
  },
];

const FIELDS = [
  {
    name: 'group_name',
    label: 'Group Name',
    placeholder: 'Enter group name',
    validation: Yup.string()
      .min(2)
      .max(100)
      .required('Group name is required'),
  },
];

const GroupMaster = () => {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loggedUser = getLoggedinUser();

  const updatedBy =
    loggedUser?.user_id ??
    loggedUser?.id ??
    1;

  document.title = 'ASR::CSS | Group Master';

  const fetchList = async () => {

    setLoading(true);

    try {

      const res =
        await getGroupMasterList({
          page: 1,
          limit: 100,
          order: 'group_id:ASC',
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
        'Failed to load groups',
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

      await createGroupMaster({
        ...values,
        updated_by: updatedBy,
      });

      toast.success(
        'Group added successfully',
        { autoClose: 3000 }
      );

      await fetchList();

    } catch (err) {

      toast.error(
        err?.message ||
        'Failed to add group',
        { autoClose: 3000 }
      );

      setLoading(false);

    }
  };

  const handleEdit = async (item, values) => {

    const id =
      item.group_id ??
      item.id;

    setLoading(true);

    try {

      await updateGroupMaster(
        id,
        {
          ...values,
          updated_by: updatedBy,
        }
      );

      toast.success(
        'Group updated successfully',
        { autoClose: 3000 }
      );

      await fetchList();

    } catch (err) {

      toast.error(
        err?.message ||
        'Failed to update group',
        { autoClose: 3000 }
      );

      setLoading(false);

    }
  };

  const handleDelete = async (item) => {

    const id =
      item.group_id ??
      item.id;

    setLoading(true);

    try {

      await deleteGroupMaster(id);

      toast.success(
        'Group deleted successfully',
        { autoClose: 3000 }
      );

      await fetchList();

    } catch (err) {

      toast.error(
        err?.message ||
        'Failed to delete group',
        { autoClose: 3000 }
      );

      setLoading(false);

    }
  };

  return (
    <MasterDataView
      title="List Of Groups"
      modalTitle="Group"
      listId="groupMasterList"
      columns={COLUMNS}
      fields={FIELDS}
      data={data}
      loading={loading}
      emptyMessage="No groups found."
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default GroupMaster;
