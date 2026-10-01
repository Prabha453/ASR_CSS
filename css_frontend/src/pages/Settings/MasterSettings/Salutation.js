import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import MasterDataView from '../../../Components/Common/MasterDataView';
import { getLoggedinUser } from '../../../helpers/api_helper';
import {
  getSalutationList,
  createSalutation,
  updateSalutation,
  deleteSalutation,
} from '../../../helpers/backend_helper';

const COLUMNS = [
  { key: 'salutation_name', label: 'Salutation', sortable: true, gridPrimary: true },
];

const FIELDS = [
  {
    name: 'salutation_name', label: 'Salutation',
    placeholder: 'e.g. Mr., Mrs., Dr.',
    validation: Yup.string().min(2).max(50).required('Salutation is required'),
  },
];

const Salutation = () => {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(false);

  const loggedUser = getLoggedinUser();
  const updatedBy  = loggedUser?.user_id ?? loggedUser?.id ?? 1;

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await getSalutationList({ page: 1, limit: 100, order: 'salutation_id:ASC'});
      const list = res?.data?.data ?? res?.data ?? res;
      setData(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Failed to load salutations', { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const handleAdd = async (values) => {
    setLoading(true);
    try {
      await createSalutation({ ...values, updated_by: updatedBy });
      toast.success('Salutation added successfully', { autoClose: 3000 });
      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to add salutation', { autoClose: 3000 });
      setLoading(false);
    }
  };

  const handleEdit = async (item, values) => {
    const id = item.salutation_id ?? item.id;
    setLoading(true);
    try {
      await updateSalutation(id, { ...values, updated_by: updatedBy });
      toast.success('Salutation updated successfully', { autoClose: 3000 });
      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to update salutation', { autoClose: 3000 });
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const id = item.salutation_id ?? item.id;
    setLoading(true);
    try {
      await deleteSalutation(id);
      toast.success('Salutation deleted successfully', { autoClose: 3000 });
      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to delete salutation', { autoClose: 3000 });
      setLoading(false);
    }
  };

  return (
    <MasterDataView
      title="List Of Salutations"   modalTitle="Salutation"
      listId="salutationList"       columns={COLUMNS}
      fields={FIELDS}               data={data}
      loading={loading}
      emptyMessage="No salutations found."
      onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete}
    />
  );
};

export default Salutation;
