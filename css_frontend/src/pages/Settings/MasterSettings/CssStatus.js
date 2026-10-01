import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import MasterDataView from '../../../Components/Common/MasterDataView';
import { getLoggedinUser } from '../../../helpers/api_helper';

import {
  getCssStatusList,
  createCssStatus,
  updateCssStatus,
  deleteCssStatus,
} from '../../../helpers/backend_helper';

const COLUMNS = [
  { key: 'css_status_name', label: 'CSS Status', sortable: true, gridPrimary: true },
  { key: 'css_status_color', label: 'Color', sortable: false, showInGrid: true },
];

const FIELDS = [
  {
    name: 'css_status_name',
    label: 'CSS Status Name',
    placeholder: 'e.g. Active, Pending',
    col: 8,
    validation: Yup.string()
      .min(2)
      .max(100)
      .required('CSS status name is required'),
  },
  {
    name: 'css_status_color',
    label: 'Status Color',
    type: 'color',
    defaultValue: '#6C757D',
    col: 4,
    validation: Yup.string()
      .max(10),
  },
];

const CssStatusMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loggedUser = getLoggedinUser();
  const updatedBy = loggedUser?.user_id ?? loggedUser?.id ?? 1;

  const fetchList = async () => {
    setLoading(true);

    try {
      const res = await getCssStatusList({ page: 1, limit: 100 ,order: 'css_status_id:ASC'});

      const list =
        res?.data?.data ??
        res?.data ??
        res;

      setData(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Failed to load CSS statuses', { autoClose: 3000 });
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
      await createCssStatus({
        ...values,
        updated_by: updatedBy,
      });

      toast.success('CSS status added successfully', { autoClose: 3000 });

      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to add CSS status', { autoClose: 3000 });

      setLoading(false);
    }
  };

  const handleEdit = async (item, values) => {
    const id =
      item.css_status_id ??
      item.id;

    setLoading(true);

    try {
      await updateCssStatus(id, {
        ...values,
        updated_by: updatedBy,
      });

      toast.success('CSS status updated successfully', { autoClose: 3000 });

      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to update CSS status', { autoClose: 3000 });

      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const id =
      item.css_status_id ??
      item.id;

    setLoading(true);

    try {
      await deleteCssStatus(id);

      toast.success('CSS status deleted successfully', { autoClose: 3000 });

      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to delete CSS status', { autoClose: 3000 });

      setLoading(false);
    }
  };

    // ✅ Custom grid card to show color with badge
  const renderGridCard = (item, index) => (
    <>
      <div className="avatar-sm mb-3" style={{ position: 'relative' }}>
        <div
          className="avatar-title rounded-circle fs-22"
          style={{
            backgroundColor: item.css_status_color || '#6C757D',
            color: 'white',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {item.css_status_name?.charAt(0)?.toUpperCase() || 'T'}
        </div>
        <span
          className="badge bg-success rounded-pill"
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            fontSize: '10px',
            minWidth: '18px',
            height: '18px',
            lineHeight: '18px',
            padding: '0 5px',
          }}
        >
          {index + 1}
        </span>
      </div>
      <h5 className="fs-14 mb-0 fw-semibold">{item.css_status_name ?? '—'}</h5>
      <p className="text-muted fs-11 mb-1 mt-2">
        <span
          className="d-inline-block rounded-pill px-3 py-1"
          style={{
            backgroundColor: item.css_status_color || '#000000',
            color: 'white',
            fontSize: '12px',
            fontWeight: '500',
          }}
        >
          {item.css_status_color ?? '—'}
        </span>
      </p>
      <p className="text-muted mb-1 fs-12">&nbsp;</p>
    </>
  );

  return (
    <MasterDataView
      title="List Of CSS Statuses"
      modalTitle="CSS Status"
      listId="cssStatusList"
      columns={COLUMNS}
      fields={FIELDS}
      data={data}
      loading={loading}
      emptyMessage="No CSS statuses found."
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
      renderGridCard={renderGridCard}
    />
  );
};

export default CssStatusMaster;