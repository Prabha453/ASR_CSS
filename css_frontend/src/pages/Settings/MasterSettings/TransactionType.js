import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import MasterDataView from '../../../Components/Common/MasterDataView';
import { getLoggedinUser } from '../../../helpers/api_helper';
import {
  getTransactionTypeList,
  createTransactionType,
  updateTransactionType,
  deleteTransactionType,
} from '../../../helpers/backend_helper';

const TransactionType = () => {
  const [data,      setData]      = useState([]);
  const [autoOrder, setAutoOrder] = useState(0);
  const [loading,   setLoading]   = useState(false);

  const loggedUser = getLoggedinUser();
  const updatedBy  = loggedUser?.user_id ?? loggedUser?.id ?? 1;

  const COLUMNS = [
    { key: 't_name',          label: 'Transaction Name', width: '250px', maxWidth: '250px',sortable: true, gridPrimary: true },
    { key: 't_type_name',     label: 'Transaction Type',width: '100px', maxWidth: '100px', sortable: true, showInGrid: true },
    { key: 't_order',         label: 'Order',  width: '100px', maxWidth: '100px',          sortable: true, showInGrid: true },
    { key: 't_type_no',  label: 'Transaction No', width: '100px', maxWidth: '100px',  sortable: false, showInGrid: true },
    {
      key:         't_type_color',
      label:       'Color',
      sortable:    false,
      showInGrid:  true,
      width: '100px',
      maxWidth: '100px',
      type:        'color',   // MasterDataView renders color swatch for type:'color'
    },
  ];

  const FIELDS = [
    {
      name:        't_type',
      label:       'Transaction Type',
      placeholder: 'Select transaction type',
      type:        'select',
      options:     [
        { label: 'Company',      value: 1 },
        { label: 'Shareholder',  value: 2 },
      ],
      validation: Yup.number().required('Transaction type is required'),
    },
    {
      name:        't_name',
      label:       'Transaction Name',
      placeholder: 'Enter transaction name',
      validation:  Yup.string().min(2).max(150).required('Transaction name is required'),
    },
    {
      name:         't_order',
      label:        'Order',
      placeholder:  'Enter order number',
      type:         'number',
      defaultValue: autoOrder,
      validation:   Yup.number().required('Transaction order is required'),
    },
    {
      name:        't_type_no',
      label:       'Transaction No',
      required:     false,
      placeholder: 'Enter default transaction number',
      validation:  Yup.string().max(100).nullable(),
    },
    {
      name:         't_type_color',
      label:        'Color',
      type:         'color',
      required:     false,
      defaultValue: '#30a16c',
      validation:   Yup.string().nullable(),
    },
  ];

  document.title = 'ASR::CSS | Transaction Type';

  const fetchList = async () => {
    setLoading(true);
    try {
      const res  = await getTransactionTypeList({ page: 1, limit: 100, order: 't_order:ASC' });
      const list = res?.data?.data ?? res?.data ?? res;
      setData(Array.isArray(list) ? list : []);
      setAutoOrder(res?.data?.auto_order_number || 0);
    } catch (err) {
      toast.error('Failed to load transaction types', { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const handleAdd = async (values) => {
    setLoading(true);
    try {
      await createTransactionType({ ...values, updated_by: updatedBy });
      toast.success('Transaction type added successfully', { autoClose: 3000 });
      await fetchList();
    } catch (err) {
      toast.error(err?.message || 'Failed to add transaction type', { autoClose: 3000 });
      setLoading(false);
    }
  };

  const handleEdit = async (item, values) => {
    const id = item.t_id ?? item.id;
    setLoading(true);
    try {
      await updateTransactionType(id, { ...values, updated_by: updatedBy });
      toast.success('Transaction type updated successfully', { autoClose: 3000 });
      await fetchList();
    } catch (err) {
      toast.error(err?.message || 'Failed to update transaction type', { autoClose: 3000 });
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const id = item.t_id ?? item.id;
    setLoading(true);
    try {
      await deleteTransactionType(id);
      toast.success('Transaction type deleted successfully', { autoClose: 3000 });
      await fetchList();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete transaction type', { autoClose: 3000 });
      setLoading(false);
    }
  };

  return (
    <MasterDataView
      title="List Of Transaction Types"
      modalTitle="Transaction Type"
      listId="transactionTypeList"
      columns={COLUMNS}
      fields={FIELDS}
      data={data}
      loading={loading}
      emptyMessage="No transaction types found."
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default TransactionType;