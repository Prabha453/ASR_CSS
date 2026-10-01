import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import MasterDataView from '../../../Components/Common/MasterDataView';
import { getLoggedinUser } from '../../../helpers/api_helper';

import {
  getRelatedIndustryList,
  createRelatedIndustry,
  updateRelatedIndustry,
  deleteRelatedIndustry,
} from '../../../helpers/backend_helper';

const COLUMNS = [
  { key: 'related_industry_name', label: 'Related Industry', sortable: true, gridPrimary: true },
];

const FIELDS = [
  {
    name: 'related_industry_name',
    label: 'Related Industry',
    placeholder: 'e.g. Information Technology',
    validation: Yup.string()
      .min(2)
      .max(200)
      .required('Related industry is required'),
  },
];

const RelatedIndustry = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loggedUser = getLoggedinUser();
  const updatedBy = loggedUser?.user_id ?? loggedUser?.id ?? 1;

  const fetchList = async () => {
    setLoading(true);

    try {
      const res = await getRelatedIndustryList({ page: 1, limit: 100 ,order: 'related_industry_id:ASC'});

      const list =
        res?.data?.data ??
        res?.data ??
        res;

      setData(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Failed to load related industries', { autoClose: 3000 });
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
      await createRelatedIndustry({
        ...values,
        updated_by: updatedBy,
      });

      toast.success('Related industry added successfully', { autoClose: 3000 });

      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to add related industry', { autoClose: 3000 });

      setLoading(false);
    }
  };

  const handleEdit = async (item, values) => {
    const id =
      item.related_industry_id ??
      item.id;

    setLoading(true);

    try {
      await updateRelatedIndustry(id, {
        ...values,
        updated_by: updatedBy,
      });

      toast.success('Related industry updated successfully', { autoClose: 3000 });

      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to update related industry', { autoClose: 3000 });

      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const id =
      item.related_industry_id ??
      item.id;

    setLoading(true);

    try {
      await deleteRelatedIndustry(id);

      toast.success('Related industry deleted successfully', { autoClose: 3000 });

      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to delete related industry', { autoClose: 3000 });

      setLoading(false);
    }
  };

  return (
    <MasterDataView
      title="List Of Related Industries"
      modalTitle="Related Industry"
      listId="relatedIndustryList"
      columns={COLUMNS}
      fields={FIELDS}
      data={data}
      loading={loading}
      emptyMessage="No related industries found."
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default RelatedIndustry;