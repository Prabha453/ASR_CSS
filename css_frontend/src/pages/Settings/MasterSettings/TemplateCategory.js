import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import MasterDataView from '../../../Components/Common/MasterDataView';
import { getLoggedinUser } from '../../../helpers/api_helper';
import {
  getTemplateCategoryList,
  createTemplateCategory,
  updateTemplateCategory,
  deleteTemplateCategory,
} from '../../../helpers/backend_helper';

const COLUMNS = [
  { key: 'tc_name', label: 'Template Category', sortable: true, gridPrimary: true },
];

const FIELDS = [
  {
    name: 'tc_name',
    label: 'Template Category',
    placeholder: 'e.g. Corporate, Legal',
    validation: Yup.string().min(2).max(150).required('Template category is required'),
  }
];

const TemplateCategory = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loggedUser = getLoggedinUser();
  const updatedBy = loggedUser?.user_id ?? loggedUser?.id ?? 1;

  document.title = 'ASR::CSS | Template Category';

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await getTemplateCategoryList({ page: 1, limit: 100 ,order: 'tc_id:ASC'});
      const list = res?.data?.data ?? res?.data ?? res;
      setData(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Failed to load template categories', { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const handleAdd = async (values) => {
    setLoading(true);
    try {
      await createTemplateCategory({ ...values, updated_by: updatedBy });
      toast.success('Template category added successfully', { autoClose: 3000 });
      await fetchList();
    } catch (err) {
      toast.error(err?.message || 'Failed to add template category', { autoClose: 3000 });
      setLoading(false);
    }
  };

  const handleEdit = async (item, values) => {
    const id = item.tc_id ?? item.id;
    setLoading(true);
    try {
      await updateTemplateCategory(id, { ...values, updated_by: updatedBy });
      toast.success('Template category updated successfully', { autoClose: 3000 });
      await fetchList();
    } catch (err) {
      toast.error(err?.message || 'Failed to update template category', { autoClose: 3000 });
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const id = item.tc_id ?? item.id;
    setLoading(true);
    try {
      await deleteTemplateCategory(id);
      toast.success('Template category deleted successfully', { autoClose: 3000 });
      await fetchList();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete template category', { autoClose: 3000 });
      setLoading(false);
    }
  };

  return (
    <MasterDataView
      title="List Of Template Categories"
      modalTitle="Template Category"
      listId="templateCategoryList"
      columns={COLUMNS}
      fields={FIELDS}
      data={data}
      loading={loading}
      emptyMessage="No template categories found."
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default TemplateCategory;