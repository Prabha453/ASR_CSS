import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import MasterDataView from '../../../Components/Common/MasterDataView';
import { getLoggedinUser } from '../../../helpers/api_helper';
import {
  getRegisterFooterList,
  createRegisterFooter,
  updateRegisterFooter,
  deleteRegisterFooter,
} from '../../../helpers/backend_helper';

// ✅ Updated COLUMNS with proper width configuration
const COLUMNS = [
  { 
    key: 're_type', 
    label: 'Register Type', 
    sortable: true, 
    gridPrimary: true,
    width: '200px',      // ✅ Set width for type
    maxWidth: '200px',
  },
  { 
    key: 're_text', 
    label: 'Footer Text', 
    sortable: false, 
    showInGrid: true,
    width: '400px',      // ✅ Wider width for long text to wrap
    maxWidth: '400px',
    type: 'text-wrap',   // ✅ Mark for text wrapping
  },
];

const FIELDS = [
  {
    name: 're_type',
    label: 'Register Type',
    placeholder: 'e.g. MEMBER, COMPANY',
    col: 6,
    validation: Yup.string().min(2).max(50).required('Register type is required'),
  },
  {
    name: 're_text',
    label: 'Footer Text',
    type: 'textarea',
    rows: 5,
    col: 12,
    placeholder: 'Enter footer text...',
    validation: Yup.string().required('Footer text is required'),
  },
];

const RegisterFooter = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loggedUser = getLoggedinUser();
  const updatedBy = loggedUser?.user_id ?? loggedUser?.id ?? 1;

  document.title = 'ASR::CSS | Register Footer';

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await getRegisterFooterList({ page: 1, limit: 100, order: 'rf_id:ASC' });
      const list = res?.data?.data ?? res?.data ?? res;
      setData(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Failed to load register footers', { autoClose: 3000 });
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
      await createRegisterFooter(values);
      toast.success('Register footer added successfully', { autoClose: 3000 });
      await fetchList();
    } catch (err) {
      toast.error(err?.message || 'Failed to add register footer', { autoClose: 3000 });
      setLoading(false);
    }
  };

  const handleEdit = async (item, values) => {
    const id = item.rf_id ?? item.id;
    setLoading(true);
    try {
      await updateRegisterFooter(id, values);
      toast.success('Register footer updated successfully', { autoClose: 3000 });
      await fetchList();
    } catch (err) {
      toast.error(err?.message || 'Failed to update register footer', { autoClose: 3000 });
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const id = item.rf_id ?? item.id;
    setLoading(true);
    try {
      await deleteRegisterFooter(id);
      toast.success('Register footer deleted successfully', { autoClose: 3000 });
      await fetchList();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete register footer', { autoClose: 3000 });
      setLoading(false);
    }
  };

  return (
    <MasterDataView
      title="List Of Register Footers"
      modalTitle="Register Footer"
      listId="registerFooterList"
      columns={COLUMNS}
      fields={FIELDS}
      data={data}
      loading={loading}
      emptyMessage="No register footers found."
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default RegisterFooter;