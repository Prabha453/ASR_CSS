import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import MasterDataView from '../../../Components/Common/MasterDataView';
import { getLoggedinUser } from '../../../helpers/api_helper';

import {
  getSoftwareList,
  createSoftware,
  updateSoftware,
  deleteSoftware,
} from '../../../helpers/backend_helper';

const COLUMNS = [
  { key: 'software_name', label: 'Software Name', sortable: true, gridPrimary: true },
];

const FIELDS = [
  {
    name: 'software_name',
    label: 'Software Name',
    placeholder: 'e.g. Microsoft Office, Tally',
    validation: Yup.string()
      .min(2)
      .max(150)
      .required('Software name is required'),
  },
];

const SoftwareMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loggedUser = getLoggedinUser();
  const updatedBy = loggedUser?.user_id ?? loggedUser?.id ?? 1;

  const fetchList = async () => {
    setLoading(true);

    try {
      const res = await getSoftwareList({ page: 1, limit: 100 ,order: 'software_id:ASC'});

      const list =
        res?.data?.data ??
        res?.data ??
        res;

      setData(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Failed to load softwares', { autoClose: 3000 });
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
      await createSoftware({
        ...values,
        updated_by: updatedBy,
      });

      toast.success('Software added successfully', { autoClose: 3000 });

      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to add software', { autoClose: 3000 });

      setLoading(false);
    }
  };

  const handleEdit = async (item, values) => {
    const id =
      item.software_id ??
      item.id;

    setLoading(true);

    try {
      await updateSoftware(id, {
        ...values,
        updated_by: updatedBy,
      });

      toast.success('Software updated successfully', { autoClose: 3000 });

      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to update software', { autoClose: 3000 });

      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const id =
      item.software_id ??
      item.id;

    setLoading(true);

    try {
      await deleteSoftware(id);

      toast.success('Software deleted successfully', { autoClose: 3000 });

      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to delete software', { autoClose: 3000 });

      setLoading(false);
    }
  };

  return (
    <MasterDataView
      title="List Of Softwares"
      modalTitle="Software"
      listId="softwareList"
      columns={COLUMNS}
      fields={FIELDS}
      data={data}
      loading={loading}
      emptyMessage="No softwares found."
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default SoftwareMaster;