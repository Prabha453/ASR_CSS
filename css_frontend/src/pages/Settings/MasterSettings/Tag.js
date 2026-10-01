import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import MasterDataView from '../../../Components/Common/MasterDataView';
import { getLoggedinUser } from '../../../helpers/api_helper';

import {
  getTagList,
  createTag,
  updateTag,
  deleteTag,
} from '../../../helpers/backend_helper';

const COLUMNS = [
  { key: 'tag_name', label: 'Tag Name', sortable: true, gridPrimary: true },
  { key: 'tag_color', label: 'Tag Color', sortable: false, showInGrid: true },
];

const FIELDS = [
  {
    name: 'tag_name',
    label: 'Tag Name',
    placeholder: 'e.g. New, Ongoing',
    col: 8,
    validation: Yup.string()
      .min(2)
      .max(100)
      .required('Tag name is required'),
  },
  {
    name: 'tag_color',
    label: 'Tag Color',
    type: 'color',
    col: 4,
    defaultValue: '#000000',
    validation: Yup.string().required('Tag color is required'),
  },
];

const TagMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loggedUser = getLoggedinUser();
  const updatedBy = loggedUser?.user_id ?? loggedUser?.id ?? 1;

  const fetchList = async () => {
    setLoading(true);

    try {
      const res = await getTagList({ page: 1, limit: 20, order: 'tag_id:ASC' });

      const list = res?.data?.data ?? res?.data ?? res;

      setData(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Failed to load tags', { autoClose: 3000 });
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
      await createTag({
        ...values,
        updated_by: updatedBy,
      });

      toast.success('Tag added successfully', { autoClose: 3000 });

      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to add tag', { autoClose: 3000 });

      setLoading(false);
    }
  };

  const handleEdit = async (item, values) => {
    const id = item.tag_id ?? item.id;

    setLoading(true);

    try {
      await updateTag(id, {
        ...values,
        updated_by: updatedBy,
      });

      toast.success('Tag updated successfully', { autoClose: 3000 });

      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to update tag', { autoClose: 3000 });

      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const id = item.tag_id ?? item.id;

    setLoading(true);

    try {
      await deleteTag(id);

      toast.success('Tag deleted successfully', { autoClose: 3000 });

      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to delete tag', { autoClose: 3000 });

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
            backgroundColor: item.tag_color || '#000000',
            color: 'white',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {item.tag_name?.charAt(0)?.toUpperCase() || 'T'}
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
      <h5 className="fs-14 mb-0 fw-semibold">{item.tag_name ?? '—'}</h5>
      <p className="text-muted fs-11 mb-1 mt-2">
        <span
          className="d-inline-block rounded-pill px-3 py-1"
          style={{
            backgroundColor: item.tag_color || '#000000',
            color: 'white',
            fontSize: '12px',
            fontWeight: '500',
          }}
        >
          {item.tag_color ?? '—'}
        </span>
      </p>
      <p className="text-muted mb-1 fs-12">&nbsp;</p>
    </>
  );

  return (
    <MasterDataView
      title="List Of Tags"
      modalTitle="Tag"
      listId="tagList"
      columns={COLUMNS}
      fields={FIELDS}
      data={data}
      loading={loading}
      emptyMessage="No tags found."
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
      renderGridCard={renderGridCard}
    />
  );
};

export default TagMaster;