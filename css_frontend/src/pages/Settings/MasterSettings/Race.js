import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import MasterDataView from '../../../Components/Common/MasterDataView';
import { getLoggedinUser } from '../../../helpers/api_helper';

import {
  getRaceList,
  createRace,
  updateRace,
  deleteRace,
} from '../../../helpers/backend_helper';

const COLUMNS = [
  {
    key: 'race_name',
    label: 'Race Name',
    sortable: true,
    gridPrimary: true,
  },
];

const FIELDS = [
  {
    name: 'race_name',
    label: 'Race Name',
    placeholder: 'e.g. Chinese, Malay, Indian',
    validation: Yup.string()
      .min(2)
      .max(100)
      .required('Race name is required'),
  },
];

const RaceMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loggedUser = getLoggedinUser();
  const updatedBy = loggedUser?.user_id ?? loggedUser?.id ?? 1;

  const fetchList = async () => {
    setLoading(true);

    try {
      const res = await getRaceList({
        page: 1,
        limit: 100,
        order: 'race_id:ASC'
      });

      const list =
        res?.data?.data ??
        res?.data ??
        res;

      setData(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(
        'Failed to load races',
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
      await createRace({
        ...values,
        updated_by: updatedBy,
      });

      toast.success(
        'Race added successfully',
        { autoClose: 3000 }
      );

      await fetchList();
    } catch (err) {
      toast.error(
        err || 'Failed to add race',
        { autoClose: 3000 }
      );

      setLoading(false);
    }
  };

  const handleEdit = async (item, values) => {
    const id =
      item.race_id ??
      item.id;

    setLoading(true);

    try {
      await updateRace(id, {
        ...values,
        updated_by: updatedBy,
      });

      toast.success(
        'Race updated successfully',
        { autoClose: 3000 }
      );

      await fetchList();
    } catch (err) {
      toast.error(
        err || 'Failed to update race',
        { autoClose: 3000 }
      );

      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const id =
      item.race_id ??
      item.id;

    setLoading(true);

    try {
      await deleteRace(id);

      toast.success(
        'Race deleted successfully',
        { autoClose: 3000 }
      );

      await fetchList();
    } catch (err) {
      toast.error(
        err || 'Failed to delete race',
        { autoClose: 3000 }
      );

      setLoading(false);
    }
  };

  return (
    <MasterDataView
      title="List Of Races"
      modalTitle="Race"
      listId="raceList"
      columns={COLUMNS}
      fields={FIELDS}
      data={data}
      loading={loading}
      emptyMessage="No races found."
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default RaceMaster;