import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import {
  Row, Col, Button, Input, Label, FormFeedback, Spinner,
  Modal, ModalHeader, ModalBody, ModalFooter,
  Table, Badge, Card, CardBody,
} from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import DeleteModal from '../../../Components/Common/DeleteModal';
import Pagination from '../../../Components/Common/Pagination';
import {
  getUserGroupList,
  createUserGroup,
  updateUserGroup,
  deleteUserGroup,
} from '../../../helpers/backend_helper';

// ─── Permission module definitions ────────────────────────────────────────────
const MODULES = [
  { key: 'dashboard',   label: 'Dashboard',   actions: ['view'] },
  { key: 'company',     label: 'Company',     actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'individual',  label: 'Individual',  actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'officials',   label: 'Officials',   actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'users',       label: 'Users',       actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'user_groups', label: 'User Groups', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'settings',   label: 'Settings',    actions: ['view', 'create', 'edit', 'delete'] },
];

const ALL_ACTIONS = ['view', 'create', 'edit', 'delete'];

const ACTION_LABELS = {
  view:   'View',
  create: 'Create',
  edit:   'Edit',
  delete: 'Delete',
};

const EMPTY_PERMISSIONS = () =>
  MODULES.reduce((acc, mod) => {
    acc[mod.key] = mod.actions.reduce((a, act) => { a[act] = false; return a; }, {});
    return acc;
  }, {});

// ─── Permission Matrix component ──────────────────────────────────────────────
const PermissionMatrix = ({ permissions, onChange }) => {
  const toggle = (moduleKey, action) => {
    const updated = {
      ...permissions,
      [moduleKey]: {
        ...permissions[moduleKey],
        [action]: !permissions[moduleKey]?.[action],
      },
    };
    onChange(updated);
  };

  const toggleModule = (moduleKey, actions) => {
    const allOn = actions.every(a => permissions[moduleKey]?.[a]);
    const updated = {
      ...permissions,
      [moduleKey]: actions.reduce((acc, a) => { acc[a] = !allOn; return acc; }, {}),
    };
    onChange(updated);
  };

  const toggleAction = (action) => {
    const applicableMods = MODULES.filter(m => m.actions.includes(action));
    const allOn = applicableMods.every(m => permissions[m.key]?.[action]);
    const updated = { ...permissions };
    applicableMods.forEach(m => {
      updated[m.key] = { ...updated[m.key], [action]: !allOn };
    });
    onChange(updated);
  };

  const toggleAll = () => {
    const allOn = MODULES.every(m =>
      m.actions.every(a => permissions[m.key]?.[a])
    );
    onChange(MODULES.reduce((acc, mod) => {
      acc[mod.key] = mod.actions.reduce((a, act) => { a[act] = !allOn; return a; }, {});
      return acc;
    }, {}));
  };

  const matrixStyles = `
    .perm-matrix th, .perm-matrix td { vertical-align: middle; text-align: center; }
    .perm-matrix th:first-child, .perm-matrix td:first-child { text-align: left; }
    .perm-matrix .check-cell input[type=checkbox] { width: 16px; height: 16px; cursor: pointer; }
    .perm-matrix .mod-label { font-weight: 500; font-size: 13px; }
    .perm-matrix .col-toggle { cursor: pointer; color: #405189; font-size: 12px; display: block; margin-top: 2px; }
  `;

  return (
    <>
      <style>{matrixStyles}</style>
      <div className="table-responsive">
        <Table bordered size="sm" className="perm-matrix mb-0">
          <thead className="table-light">
            <tr>
              <th style={{ width: '30%' }}>
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="checkbox"
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                    checked={MODULES.every(m => m.actions.every(a => permissions[m.key]?.[a]))}
                    onChange={toggleAll}
                    id="chk-all"
                  />
                  <label htmlFor="chk-all" style={{ cursor: 'pointer', margin: 0, fontSize: 13, fontWeight: 600 }}>
                    Module
                  </label>
                </div>
              </th>
              {ALL_ACTIONS.map(action => (
                <th key={action} style={{ width: `${70 / ALL_ACTIONS.length}%` }}>
                  {ACTION_LABELS[action]}
                  <span
                    className="col-toggle"
                    onClick={() => toggleAction(action)}
                    title={`Toggle all ${action}`}
                  >
                    toggle all
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES.map(mod => {
              const modAllOn = mod.actions.every(a => permissions[mod.key]?.[a]);
              return (
                <tr key={mod.key}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="checkbox"
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                        checked={modAllOn}
                        onChange={() => toggleModule(mod.key, mod.actions)}
                        id={`chk-mod-${mod.key}`}
                      />
                      <label htmlFor={`chk-mod-${mod.key}`} className="mod-label mb-0" style={{ cursor: 'pointer' }}>
                        {mod.label}
                      </label>
                    </div>
                  </td>
                  {ALL_ACTIONS.map(action => (
                    <td key={action} className="check-cell">
                      {mod.actions.includes(action) ? (
                        <input
                          type="checkbox"
                          checked={!!permissions[mod.key]?.[action]}
                          onChange={() => toggle(mod.key, action)}
                        />
                      ) : (
                        <span className="text-muted" style={{ fontSize: 12 }}>—</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </>
  );
};

const parsePermissions = (perm) => {
  if (!perm) return {};
  let val = perm;
  while (typeof val === 'string') {
    try { val = JSON.parse(val); } catch { return {}; }
  }
  return val || {};
};

const selectDefaultPageSize = createSelector(
  (state) => state.Layout,
  (layout) => Number(layout.defaultPageSize) || 10
);

// ─── Main Component ───────────────────────────────────────────────────────────
const UserGroup = () => {
  const globalPageSize = useSelector(selectDefaultPageSize);

  const [list, setList]               = useState([]);
  const [totalItems, setTotalItems]   = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize]       = useState(globalPageSize);
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);

  const [modalOpen, setModalOpen]   = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [permissions, setPermissions] = useState(EMPTY_PERMISSIONS());

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteId, setDeleteId]       = useState(null);
  const [deleting, setDeleting]       = useState(false);

  // ── Fetch list ──────────────────────────────────────────────────────────────
  const fetchList = useCallback(async (page = 1, searchVal = '', limit = pageSize) => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (searchVal) params.search = searchVal;
      const res = await getUserGroupList(params);
      if (res.status) {
        setList(res.data.data || []);
        setTotalItems(res.data.totalItems || 0);
        setCurrentPage(res.data.currentPage || 1);
      }
    } catch {
      toast.error('Failed to load user groups');
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => { setPageSize(globalPageSize); setCurrentPage(1); }, [globalPageSize]);
  useEffect(() => { fetchList(1, '', pageSize); }, [fetchList, pageSize]);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchList(1, val, pageSize);
  };

  const handlePageChange = (page) => fetchList(page, search, pageSize);

  // ── Formik ──────────────────────────────────────────────────────────────────
  const formik = useFormik({
    initialValues: { group_name: '', group_description: '' },
    validationSchema: Yup.object({
      group_name: Yup.string().trim().required('Group name is required').max(150),
      group_description: Yup.string().max(500),
    }),
    onSubmit: async (values) => {
      setSaving(true);
      try {
        const payload = {
          group_name: values.group_name.trim(),
          group_description: values.group_description.trim(),
          permissions_json: permissions,
        };

        let res;
        if (editItem) {
          res = await updateUserGroup(editItem.user_group_id, payload);
        } else {
          res = await createUserGroup(payload);
        }

        if (res.status) {
          toast.success(editItem ? 'User group updated' : 'User group created');
          closeModal();
          fetchList(currentPage, search, pageSize);
        } else {
          toast.error(res.message || 'Operation failed');
        }
      } catch (err) {
        toast.error(typeof err === 'string' ? err : 'Something went wrong');
      } finally {
        setSaving(false);
      }
    },
  });

  // ── Modal helpers ───────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditItem(null);
    formik.resetForm();
    setPermissions(EMPTY_PERMISSIONS());
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    formik.setValues({
      group_name: item.group_name || '',
      group_description: item.group_description || '',
    });
    const base = EMPTY_PERMISSIONS();
    const stored = parsePermissions(item.permissions_json);
    Object.keys(stored).forEach(mod => {
      if (base[mod]) base[mod] = { ...base[mod], ...stored[mod] };
    });
    setPermissions(base);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditItem(null);
    formik.resetForm();
    setPermissions(EMPTY_PERMISSIONS());
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const confirmDelete = (id) => {
    setDeleteId(id);
    setDeleteModal(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await deleteUserGroup(deleteId);
      if (res.status) {
        toast.success('User group deleted');
        setDeleteModal(false);
        setDeleteId(null);
        fetchList(currentPage, search);
      } else {
        toast.error(res.message || 'Delete failed');
      }
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  // ── Permission summary badge ────────────────────────────────────────────────
  const TOTAL_PERMISSIONS = MODULES.reduce((sum, m) => sum + m.actions.length, 0);

  const permissionCount = (perm) => {
    const obj = parsePermissions(perm);
    return MODULES.reduce((total, mod) => {
      const actions = obj[mod.key] || {};
      return total + mod.actions.filter(a => !!actions[a]).length;
    }, 0);
  };

  const ACTION_CELL_STYLE = `
    .il-action-wrap { display: flex; align-items: center; gap: 5px; }
    .il-action-btn {
      width: 30px; height: 30px; border-radius: 7px;
      display: inline-flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 14px; transition: all 0.15s;
      border: 1.5px solid transparent; flex-shrink: 0;
      background: transparent; outline: none;
    }
    .il-action-btn.edit   { background: rgba(240,178,50,.1);  color: #e6a817; border-color: rgba(240,178,50,.22); }
    .il-action-btn.delete { background: rgba(240,101,72,.08); color: #f06548; border-color: rgba(240,101,72,.18); }
    .il-action-btn.edit:hover   { background: rgba(240,178,50,.22); box-shadow: 0 2px 8px rgba(240,178,50,.2);  }
    .il-action-btn.delete:hover { background: rgba(240,101,72,.18); box-shadow: 0 2px 8px rgba(240,101,72,.2);  }
  `;

  return (
    <>
      <style>{ACTION_CELL_STYLE}</style>
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <Row className="g-3 mb-3 align-items-center">
        <Col sm={6} md={5}>
          <div className="search-box">
            <Input
              type="text"
              placeholder="Search groups..."
              value={search}
              onChange={handleSearch}
              className="form-control"
            />
            <i className="ri-search-line search-icon" />
          </div>
        </Col>
        <Col sm={6} md={7} className="d-flex justify-content-end">
          <Button color="warning" size="sm" onClick={openAdd}>
            <i className="ri-add-line me-1" />
            Add Group
          </Button>
        </Col>
      </Row>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="text-center py-4"><Spinner color="primary" /></div>
      ) : list.length === 0 ? (
        <div className="text-center text-muted py-4">No user groups found.</div>
      ) : (
        <>
          <div className="table-responsive">
            <Table className="table-hover table-nowrap align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Group Name</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'center' }}>Permissions</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item, idx) => (
                  <tr key={item.user_group_id}>
                    <td>{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td>
                      <span className="fw-medium">{item.group_name}</span>
                    </td>
                    <td>
                      <span className="text-muted" style={{ fontSize: 13 }}>
                        {item.group_description || '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Badge color="soft-primary" className="text-primary fs-12" pill>
                        {permissionCount(item.permissions_json)} / {TOTAL_PERMISSIONS}
                      </Badge>
                    </td>
                    <td>
                      <div className="il-action-wrap" style={{ justifyContent: 'center' }}>
                        <button className="il-action-btn edit" title="Edit"
                          onClick={() => openEdit(item)}>
                          <i className="ri-pencil-line" />
                        </button>
                        <button className="il-action-btn delete" title="Delete"
                          onClick={() => confirmDelete(item.user_group_id)}>
                          <i className="ri-delete-bin-line" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {totalItems > 0 && (
            <div className="mt-3" style={{ borderTop: '1px solid var(--vz-border-color)', paddingTop: 8 }}>
              <Pagination
                total={totalItems}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={(s) => { setPageSize(s); fetchList(1, search, s); }}
              />
            </div>
          )}
        </>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      <Modal isOpen={modalOpen} toggle={closeModal} size="lg" scrollable>
        <ModalHeader toggle={closeModal}>
          {editItem ? 'Edit User Group' : 'Add User Group'}
        </ModalHeader>
        <form onSubmit={formik.handleSubmit}>
          <ModalBody>
            <Row className="g-3 mb-4">
              <Col md={6}>
                <Label>Group Name <span className="text-danger">*</span></Label>
                <Input
                  name="group_name"
                  placeholder="e.g. Manager Group"
                  value={formik.values.group_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  invalid={formik.touched.group_name && !!formik.errors.group_name}
                />
                <FormFeedback>{formik.errors.group_name}</FormFeedback>
              </Col>
              <Col md={6}>
                <Label>Description</Label>
                <Input
                  name="group_description"
                  placeholder="Brief description..."
                  value={formik.values.group_description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  invalid={formik.touched.group_description && !!formik.errors.group_description}
                />
                <FormFeedback>{formik.errors.group_description}</FormFeedback>
              </Col>
            </Row>

            <Card className="border">
              <CardBody className="p-3">
                <h6 className="mb-3 text-muted text-uppercase" style={{ fontSize: 11, letterSpacing: '.06em' }}>
                  <i className="ri-shield-keyhole-line me-1" />
                  Page & Action Permissions
                </h6>
                <PermissionMatrix
                  permissions={permissions}
                  onChange={setPermissions}
                />
              </CardBody>
            </Card>
          </ModalBody>

          <ModalFooter>
            <Button type="button" color="light" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" color="success" disabled={saving}>
              {saving ? <Spinner size="sm" className="me-1" /> : null}
              Save
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* ── Delete Confirmation ──────────────────────────────────────────────── */}
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDelete}
        onCloseClick={() => { setDeleteModal(false); setDeleteId(null); }}
      />
    </>
  );
};

export default UserGroup;
