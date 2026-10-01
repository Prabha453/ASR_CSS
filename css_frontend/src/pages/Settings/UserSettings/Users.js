import React, { useState, useEffect, useCallback } from 'react';
import {
  Row, Col, Button, Input, Label, FormFeedback, Spinner, Badge,
  Modal, ModalHeader, ModalBody, ModalFooter,
  Table, Nav, NavItem, NavLink, TabContent, TabPane,
  Card, CardBody, CardHeader,
} from 'reactstrap';
import classnames from 'classnames';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import Select from 'react-select';

import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import DeleteModal from '../../../Components/Common/DeleteModal';
import Pagination from '../../../Components/Common/Pagination';

const selectDefaultPageSize = createSelector(
  (state) => state.Layout,
  (layout) => Number(layout.defaultPageSize) || 10
);
import {
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  getUserGroupAll,
  getUserPermission,
  saveUserPermission,
  clearUserPermission,
} from '../../../helpers/backend_helper';
import {
  PERMISSION_MODULES,
  ALL_ACTIONS,
  ACTION_LABELS,
  getEffectivePermissions,
  classifyOverrides,
  countGranted,
} from '../../../helpers/permissionHelper';

// ─── Action cell styles — matches il-action-btn pattern ───────────────────────
const ACTION_CELL_STYLE = `
  .il-action-wrap { display: flex; align-items: center; gap: 5px; }
  .il-action-btn {
    width: 30px; height: 30px; border-radius: 7px;
    display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 14px; transition: all 0.15s;
    border: 1.5px solid transparent; flex-shrink: 0; background: transparent;
    outline: none;
  }
  .il-action-btn.perm   { background: rgba(10,179,156,.09);  color: #0ab39c; border-color: rgba(10,179,156,.2); }
  .il-action-btn.edit   { background: rgba(240,178,50,.1);   color: #e6a817; border-color: rgba(240,178,50,.22); }
  .il-action-btn.delete { background: rgba(240,101,72,.08);  color: #f06548; border-color: rgba(240,101,72,.18); }
  .il-action-btn.perm:hover   { background: rgba(10,179,156,.2);  box-shadow: 0 2px 8px rgba(10,179,156,.25); }
  .il-action-btn.edit:hover   { background: rgba(240,178,50,.22); box-shadow: 0 2px 8px rgba(240,178,50,.2);  }
  .il-action-btn.delete:hover { background: rgba(240,101,72,.18); box-shadow: 0 2px 8px rgba(240,101,72,.2);  }
`;

// ─── Shared status / role options ─────────────────────────────────────────────
const USER_STATUS_OPTIONS = [
  { value: 'ACTIVE',    label: 'Active' },
  { value: 'INACTIVE',  label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'PENDING',   label: 'Pending' },
];

const USER_ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN',       label: 'Admin' },
  { value: 'MANAGER',     label: 'Manager' },
  { value: 'STAFF',       label: 'Staff' },
  { value: 'VIEWER',      label: 'Viewer' },
  { value: 'CLIENT',      label: 'Client' },
];

const STATUS_COLORS = {
  ACTIVE:    'success',
  INACTIVE:  'secondary',
  SUSPENDED: 'danger',
  PENDING:   'warning',
};

// ─── Permission Matrix for individual override ─────────────────────────────────
/**
 * Shows effective permissions per cell.
 * Cell colour indicates source:
 *   blue/solid  = inherited from group (no override)
 *   green solid = override GRANTED  (explicitly set true)
 *   red solid   = override REVOKED  (explicitly set false, even if group grants)
 *
 * Clicking a cell cycles: inherit → grant → revoke → inherit
 */
const OverrideMatrix = ({ groupPerms, overrides, onChange, readOnly = false }) => {
  const classification = classifyOverrides(groupPerms, overrides);

  const cycleCell = (mod, action) => {
    if (readOnly) return;
    const current = classification[mod][action];
    const next = current === 'inherited' ? 'granted'
               : current === 'granted'   ? 'revoked'
               :                           'inherited';

    const updated = JSON.parse(JSON.stringify(overrides));
    if (!updated[mod]) updated[mod] = {};

    if (next === 'inherited') {
      delete updated[mod][action];
      if (Object.keys(updated[mod]).length === 0) delete updated[mod];
    } else {
      updated[mod][action] = next === 'granted';
    }
    onChange(updated);
  };

  const styles = `
    .perm-ov-table th, .perm-ov-table td { vertical-align: middle; text-align: center; font-size: 13px; }
    .perm-ov-table th:first-child, .perm-ov-table td:first-child { text-align: left; }
    .perm-cell {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border-radius: 6px; cursor: pointer;
      border: 2px solid transparent; transition: all 0.15s; user-select: none;
    }
    .perm-cell.inherited-true  { background: #e8f0fe; border-color: #4a73ea; color: #4a73ea; }
    .perm-cell.inherited-false { background: #f3f4f6; border-color: #d1d5db; color: #9ca3af; }
    .perm-cell.granted         { background: #dcfce7; border-color: #16a34a; color: #16a34a; }
    .perm-cell.revoked         { background: #fee2e2; border-color: #dc2626; color: #dc2626; }
    .perm-cell.na              { background: transparent; color: #d1d5db; cursor: default; }
    .perm-cell:hover:not(.na)  { transform: scale(1.15); }
    .perm-legend { display: flex; gap: 12px; flex-wrap: wrap; font-size: 11px; }
    .perm-legend-item { display: flex; align-items: center; gap: 4px; }
    .perm-legend-dot { width: 10px; height: 10px; border-radius: 3px; }
  `;

  const cellClass = (mod, action) => {
    if (!PERMISSION_MODULES.find(m => m.key === mod)?.actions.includes(action)) return 'na';
    const cls = classification[mod]?.[action];
    const groupVal = groupPerms?.[mod]?.[action];
    if (cls === 'granted') return 'granted';
    if (cls === 'revoked') return 'revoked';
    return groupVal ? 'inherited-true' : 'inherited-false';
  };

  const cellIcon = (mod, action) => {
    if (!PERMISSION_MODULES.find(m => m.key === mod)?.actions.includes(action))
      return <span style={{ fontSize: 10 }}>—</span>;
    const cls = cellClass(mod, action);
    if (cls === 'granted')        return <i className="ri-check-line" />;
    if (cls === 'revoked')        return <i className="ri-close-line" />;
    if (cls === 'inherited-true') return <i className="ri-check-line" />;
    return <i className="ri-subtract-line" style={{ fontSize: 10 }} />;
  };

  return (
    <>
      <style>{styles}</style>

      {/* Legend */}
      <div className="perm-legend mb-3">
        <div className="perm-legend-item">
          <div className="perm-legend-dot" style={{ background: '#4a73ea' }} />
          <span>Inherited (Group grants)</span>
        </div>
        <div className="perm-legend-item">
          <div className="perm-legend-dot" style={{ background: '#d1d5db' }} />
          <span>Inherited (Group denies)</span>
        </div>
        <div className="perm-legend-item">
          <div className="perm-legend-dot" style={{ background: '#16a34a' }} />
          <span>Override: Grant</span>
        </div>
        <div className="perm-legend-item">
          <div className="perm-legend-dot" style={{ background: '#dc2626' }} />
          <span>Override: Revoke</span>
        </div>
        {!readOnly && (
          <div className="perm-legend-item ms-auto">
            <i className="ri-information-line text-muted" />
            <span className="text-muted">Click a cell to cycle: Inherit → Grant → Revoke</span>
          </div>
        )}
      </div>

      <div className="table-responsive">
        <Table bordered size="sm" className="perm-ov-table mb-0">
          <thead className="table-light">
            <tr>
              <th style={{ width: '30%' }}>Module</th>
              {ALL_ACTIONS.map(a => (
                <th key={a} style={{ width: `${70 / ALL_ACTIONS.length}%` }}>
                  {ACTION_LABELS[a]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_MODULES.map(mod => (
              <tr key={mod.key}>
                <td><span style={{ fontWeight: 500 }}>{mod.label}</span></td>
                {ALL_ACTIONS.map(action => {
                  const applicable = mod.actions.includes(action);
                  return (
                    <td key={action}>
                      <div className="d-flex justify-content-center">
                        <span
                          className={`perm-cell ${cellClass(mod.key, action)}`}
                          onClick={() => applicable && cycleCell(mod.key, action)}
                          title={applicable
                            ? (readOnly ? '' : 'Click to cycle')
                            : 'N/A for this module'}
                        >
                          {cellIcon(mod.key, action)}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  );
};

// ─── Effective Permissions read-only preview ───────────────────────────────────
const permBadgeStyles = `
  .perm-badge {
    display: inline-flex; align-items: center; justify-content: center;
    width: 26px; height: 26px; border-radius: 50%;
    font-size: 14px; font-weight: 700;
    transition: transform 0.15s;
  }
  .perm-badge:hover { transform: scale(1.18); }
  .perm-badge.granted {
    background: #d1fae5;
    color: #16a34a;
    box-shadow: 0 1px 3px rgba(22,163,74,0.2);
  }
  .perm-badge.denied {
    background: #fee2e2;
    color: #dc2626;
    box-shadow: 0 1px 3px rgba(220,38,38,0.15);
  }
  .perm-eff-table th {
    font-size: 11px; font-weight: 600; letter-spacing: .04em;
    text-transform: uppercase; text-align: center; background: #f8f9fa;
  }
  .perm-eff-table th:first-child { text-align: left; }
  .perm-eff-table td { vertical-align: middle; text-align: center; }
  .perm-eff-table td:first-child { text-align: left; font-size: 13px; font-weight: 500; }
  .perm-eff-table tr:hover td { background: rgba(64,81,137,0.04); }
`;

const EffectiveMatrix = ({ effectivePerms }) => (
  <>
    <style>{permBadgeStyles}</style>
    <div className="table-responsive">
      <Table bordered size="sm" className="mb-0 perm-eff-table">
        <thead>
          <tr>
            <th style={{ width: '30%' }}>Module</th>
            {ALL_ACTIONS.map(a => <th key={a}>{ACTION_LABELS[a]}</th>)}
          </tr>
        </thead>
        <tbody>
          {PERMISSION_MODULES.map(mod => (
            <tr key={mod.key}>
              <td>{mod.label}</td>
              {ALL_ACTIONS.map(action => (
                <td key={action}>
                  {mod.actions.includes(action)
                    ? effectivePerms?.[mod.key]?.[action]
                      ? <span className="perm-badge granted"><i className="ri-check-line" /></span>
                      : <span className="perm-badge denied"><i className="ri-close-line" /></span>
                    : null
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  </>
);

// ─── Permission Edit Modal ─────────────────────────────────────────────────────
const PermissionModal = ({ isOpen, user, onClose, onSaved }) => {
  const [tab, setTab]           = useState('override');
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [groupPerms, setGroupPerms]     = useState({});
  const [overrides, setOverrides]       = useState({});
  const [effectivePerms, setEffective]  = useState({});

  useEffect(() => {
    if (isOpen && user) {
      setLoading(true);
      setTab('override');
      getUserPermission(user.user_id)
        .then(res => {
          if (res.status) {
            const parseIfString = (v) => {
              if (!v) return {};
              if (typeof v === 'string') { try { return JSON.parse(v); } catch { return {}; } }
              return v;
            };
            setGroupPerms(parseIfString(res.data.group_permissions));
            setOverrides(parseIfString(res.data.user_overrides));
            setEffective(parseIfString(res.data.effective_permissions));
          }
        })
        .catch(() => toast.error('Failed to load permissions'))
        .finally(() => setLoading(false));
    }
  }, [isOpen, user]);

  // Recompute effective whenever overrides change
  useEffect(() => {
    setEffective(getEffectivePermissions(groupPerms, overrides));
  }, [groupPerms, overrides]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await saveUserPermission(user.user_id, { permissions_json: overrides });
      if (res.status) {
        toast.success('Permissions saved');
        onSaved && onSaved();
        onClose();
      } else {
        toast.error(res.message || 'Save failed');
      }
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      const res = await clearUserPermission(user.user_id);
      if (res.status) {
        setOverrides({});
        toast.success('Overrides cleared — user now inherits group permissions');
      } else {
        toast.error(res.message || 'Clear failed');
      }
    } catch {
      toast.error('Clear failed');
    } finally {
      setSaving(false);
    }
  };

  const overrideCount = Object.values(overrides).reduce(
    (n, m) => n + Object.keys(m).length, 0
  );

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="xl" scrollable>
      <ModalHeader toggle={onClose}>
        Permissions — <span className="text-primary">{user?.first_name} {user?.last_name}</span>
        {overrideCount > 0 && (
          <Badge color="warning" pill className="ms-2 fs-11">{overrideCount} override{overrideCount !== 1 ? 's' : ''}</Badge>
        )}
      </ModalHeader>

      <ModalBody>
        {loading ? (
          <div className="text-center py-5"><Spinner color="primary" /></div>
        ) : (
          <>
            <Nav tabs className="mb-3">
              <NavItem>
                <NavLink className={classnames({ active: tab === 'override' })} onClick={() => setTab('override')} style={{ cursor: 'pointer' }}>
                  <i className="ri-user-settings-line me-1" />
                  Individual Overrides
                  {overrideCount > 0 && <Badge color="warning" pill className="ms-1">{overrideCount}</Badge>}
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink className={classnames({ active: tab === 'effective' })} onClick={() => setTab('effective')} style={{ cursor: 'pointer' }}>
                  <i className="ri-shield-check-line me-1" />
                  Effective Permissions
                  <Badge color="success" pill className="ms-1">{countGranted(effectivePerms)}</Badge>
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink className={classnames({ active: tab === 'group' })} onClick={() => setTab('group')} style={{ cursor: 'pointer' }}>
                  <i className="ri-group-line me-1" />
                  Group Base
                  <Badge color="primary" pill className="ms-1">{countGranted(groupPerms)}</Badge>
                </NavLink>
              </NavItem>
            </Nav>

            <TabContent activeTab={tab}>
              {/* ── Override tab ────────────────────────────────────────── */}
              <TabPane tabId="override">
                <div className="alert alert-info py-2 mb-3" style={{ fontSize: 12 }}>
                  <i className="ri-information-line me-1" />
                  Override individual permissions for this user. Overrides stack on top of their group.
                  <strong> Blue = inherited from group, Green = you've granted, Red = you've revoked.</strong>
                </div>
                <OverrideMatrix
                  groupPerms={groupPerms}
                  overrides={overrides}
                  onChange={setOverrides}
                />
                {overrideCount > 0 && (
                  <div className="mt-2 text-end">
                    <Button color="link" size="sm" className="text-danger p-0" onClick={handleClear} disabled={saving}>
                      <i className="ri-refresh-line me-1" />
                      Clear all overrides (revert to group)
                    </Button>
                  </div>
                )}
              </TabPane>

              {/* ── Effective tab ────────────────────────────────────────── */}
              <TabPane tabId="effective">
                <div className="alert alert-success py-2 mb-3" style={{ fontSize: 12 }}>
                  <i className="ri-shield-check-line me-1" />
                  This is what the user <strong>actually has access to</strong> — group permissions merged with their individual overrides.
                </div>
                <EffectiveMatrix effectivePerms={effectivePerms} />
              </TabPane>

              {/* ── Group base tab ───────────────────────────────────────── */}
              <TabPane tabId="group">
                <div className="alert alert-primary py-2 mb-3" style={{ fontSize: 12 }}>
                  <i className="ri-group-line me-1" />
                  Base permissions inherited from the user's group. Read-only here — edit these in <strong>User Groups</strong>.
                </div>
                <EffectiveMatrix effectivePerms={groupPerms} />
              </TabPane>
            </TabContent>
          </>
        )}
      </ModalBody>

      <ModalFooter>
        <Button color="light" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button color="primary" onClick={handleSave} disabled={saving || loading}>
          {saving ? <Spinner size="sm" className="me-1" /> : <i className="ri-save-line me-1" />}
          Save Permissions
        </Button>
      </ModalFooter>
    </Modal>
  );
};

// ─── User Form Modal (Add / Edit) ─────────────────────────────────────────────
const UserFormModal = ({ isOpen, editUser, groups, onClose, onSaved }) => {
  const [saving, setSaving] = useState(false);

  const groupOptions = groups.map(g => ({ value: g.user_group_id, label: g.group_name }));

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      first_name:       editUser?.first_name   || '',
      last_name:        editUser?.last_name    || '',
      email:            editUser?.email        || '',
      user_name:        editUser?.user_name    || '',
      user_password:    '',
      confirm_password: '',
      user_role:        editUser?.user_role    || 'STAFF',
      user_group_id:    editUser?.user_group_id || '',
      department:       editUser?.department   || '',
      designation:      editUser?.designation  || '',
      user_status:      editUser?.user_status  || 'ACTIVE',
    },
    validationSchema: Yup.object({
      first_name:    Yup.string().trim().required('Required'),
      last_name:     Yup.string().trim().required('Required'),
      email:         Yup.string().email('Invalid email').required('Required'),
      user_name:     Yup.string().trim().required('Required'),
      user_password: editUser
        ? Yup.string()
        : Yup.string().min(6, 'Min 6 chars').required('Required'),
      confirm_password: editUser
        ? Yup.string().test('match', 'Passwords do not match',
            function (val) { return !this.parent.user_password || val === this.parent.user_password; })
        : Yup.string().required('Required')
            .oneOf([Yup.ref('user_password')], 'Passwords do not match'),
    }),
    onSubmit: async (values) => {
      setSaving(true);
      try {
        const payload = { ...values };
        delete payload.confirm_password;
        if (!payload.user_password) delete payload.user_password;
        if (!payload.user_group_id) delete payload.user_group_id;

        const res = editUser
          ? await updateUser(editUser.user_id, payload)
          : await createUser(payload);

        if (res.status) {
          toast.success(editUser ? 'User updated' : 'User created');
          onSaved();
          onClose();
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

  const f = formik;

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="lg" scrollable>
      <ModalHeader toggle={onClose}>
        {editUser ? 'Edit User' : 'Add User'}
      </ModalHeader>
      <form onSubmit={f.handleSubmit}>
        <ModalBody>
          <Row className="g-3">
            <Col md={6}>
              <Label>First Name <span className="text-danger">*</span></Label>
              <Input name="first_name" value={f.values.first_name} onChange={f.handleChange} onBlur={f.handleBlur}
                invalid={f.touched.first_name && !!f.errors.first_name} />
              <FormFeedback>{f.errors.first_name}</FormFeedback>
            </Col>
            <Col md={6}>
              <Label>Last Name <span className="text-danger">*</span></Label>
              <Input name="last_name" value={f.values.last_name} onChange={f.handleChange} onBlur={f.handleBlur}
                invalid={f.touched.last_name && !!f.errors.last_name} />
              <FormFeedback>{f.errors.last_name}</FormFeedback>
            </Col>
            <Col md={6}>
              <Label>Email <span className="text-danger">*</span></Label>
              <Input name="email" type="email" value={f.values.email} onChange={f.handleChange} onBlur={f.handleBlur}
                invalid={f.touched.email && !!f.errors.email} />
              <FormFeedback>{f.errors.email}</FormFeedback>
            </Col>
            <Col md={6}>
              <Label>Username <span className="text-danger">*</span></Label>
              <Input name="user_name" value={f.values.user_name} onChange={f.handleChange} onBlur={f.handleBlur}
                invalid={f.touched.user_name && !!f.errors.user_name} />
              <FormFeedback>{f.errors.user_name}</FormFeedback>
            </Col>
            <Col md={6}>
              <Label>{editUser ? 'New Password (leave blank to keep)' : 'Password'} {!editUser && <span className="text-danger">*</span>}</Label>
              <Input name="user_password" type="password" value={f.values.user_password} onChange={f.handleChange} onBlur={f.handleBlur}
                invalid={f.touched.user_password && !!f.errors.user_password} />
              <FormFeedback>{f.errors.user_password}</FormFeedback>
            </Col>
            <Col md={6}>
              <Label>{editUser ? 'Confirm New Password' : 'Confirm Password'} {!editUser && <span className="text-danger">*</span>}</Label>
              <Input name="confirm_password" type="password" value={f.values.confirm_password} onChange={f.handleChange} onBlur={f.handleBlur}
                invalid={f.touched.confirm_password && !!f.errors.confirm_password}
                disabled={editUser && !f.values.user_password} />
              <FormFeedback>{f.errors.confirm_password}</FormFeedback>
            </Col>
            <Col md={6}>
              <Label>Role</Label>
              <select className="form-select" name="user_role" value={f.values.user_role} onChange={f.handleChange}>
                {USER_ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Col>
            <Col md={6}>
              <Label>User Group</Label>
              <Select
                options={groupOptions}
                value={groupOptions.find(o => o.value === f.values.user_group_id) || null}
                onChange={opt => f.setFieldValue('user_group_id', opt ? opt.value : '')}
                isClearable
                placeholder="Select group..."
              />
            </Col>
            <Col md={6}>
              <Label>Status</Label>
              <select className="form-select" name="user_status" value={f.values.user_status} onChange={f.handleChange}>
                {USER_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Col>
            <Col md={6}>
              <Label>Department</Label>
              <Input name="department" value={f.values.department} onChange={f.handleChange} />
            </Col>
            <Col md={6}>
              <Label>Designation</Label>
              <Input name="designation" value={f.values.designation} onChange={f.handleChange} />
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color="light" type="button" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button color="success" type="submit" disabled={saving}>
            {saving ? <Spinner size="sm" className="me-1" /> : null}
            Save
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

// ─── Main Users Component ──────────────────────────────────────────────────────
const Users = () => {
  const globalPageSize = useSelector(selectDefaultPageSize);

  const [list, setList]               = useState([]);
  const [totalItems, setTotalItems]   = useState(0);
  const [totalPages, setTotalPages]   = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize]       = useState(globalPageSize);
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(false);
  const [groups, setGroups]           = useState([]);

  const [userModal, setUserModal]           = useState(false);
  const [editUser, setEditUser]             = useState(null);
  const [permModal, setPermModal]           = useState(false);
  const [permUser, setPermUser]             = useState(null);
  const [deleteModal, setDeleteModal]       = useState(false);
  const [deleteId, setDeleteId]             = useState(null);
  const [deleting, setDeleting]             = useState(false);

  // ── Load groups for dropdown ──────────────────────────────────────────────
  useEffect(() => {
    getUserGroupAll()
      .then(res => { if (res.status) setGroups(res.data || []); })
      .catch(() => {});
  }, []);

  // ── Fetch users ───────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (page = 1, searchVal = '', limit = 10) => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (searchVal) params.search = searchVal;
      const res = await getUserList(params);
      if (res.status) {
        setList(res.data.data || []);
        setTotalItems(res.data.totalItems || 0);
        setTotalPages(res.data.totalPages || 0);
        setCurrentPage(res.data.currentPage || 1);
      }
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { setPageSize(globalPageSize); setCurrentPage(1); }, [globalPageSize]);
  useEffect(() => { fetchUsers(1, '', pageSize); }, [fetchUsers, pageSize]);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchUsers(1, val, pageSize);
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await deleteUser({ user_id: deleteId });
      if (res.status) {
        toast.success('User deleted');
        setDeleteModal(false);
        fetchUsers(currentPage, search, pageSize);
      } else {
        toast.error(res.message || 'Delete failed');
      }
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  // ── Group name helper ─────────────────────────────────────────────────────
  const groupName = (groupId) => {
    const g = groups.find(x => x.user_group_id === groupId);
    return g ? g.group_name : '—';
  };

  return (
    <>
      <style>{ACTION_CELL_STYLE}</style>
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <Row className="g-3 mb-3 align-items-center">
        <Col sm={6} md={5}>
          <div className="search-box">
            <Input type="text" placeholder="Search users..." value={search} onChange={handleSearch} />
            <i className="ri-search-line search-icon" />
          </div>
        </Col>
        <Col sm={6} md={7} className="d-flex justify-content-end">
          <Button color="warning" size="sm" onClick={() => { setEditUser(null); setUserModal(true); }}>
            <i className="ri-user-add-line me-1" />
            Add User
          </Button>
        </Col>
      </Row>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="text-center py-4"><Spinner color="primary" /></div>
      ) : list.length === 0 ? (
        <div className="text-center text-muted py-4">No users found.</div>
      ) : (
        <>
          <div className="table-responsive">
            <Table className="table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Group</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((u, idx) => (
                  <tr key={u.user_id}>
                    <td>{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="avatar-xs">
                          <span className="avatar-title rounded-circle bg-soft-primary" style={{ fontSize: 12 }}>
                            {u.first_name?.[0]}{u.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <div className="fw-medium">{u.first_name} {u.last_name}</div>
                          <div className="text-muted" style={{ fontSize: 11 }}>@{u.user_name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{u.email}</td>
                    <td>
                      <Badge color="soft-info" className="text-info fs-11">{u.user_role}</Badge>
                    </td>
                    <td style={{ fontSize: 13 }}>{groupName(u.user_group_id)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <Badge color={`soft-${STATUS_COLORS[u.user_status] || 'secondary'}`}
                             className={`text-${STATUS_COLORS[u.user_status] || 'secondary'} fs-11`}>
                        {u.user_status}
                      </Badge>
                    </td>
                    <td>
                      <div className="il-action-wrap" style={{ justifyContent: 'center' }}>
                        <button className="il-action-btn perm" title="Manage Permissions"
                          onClick={() => { setPermUser(u); setPermModal(true); }}>
                          <i className="ri-shield-keyhole-line" />
                        </button>
                        <button className="il-action-btn edit" title="Edit"
                          onClick={() => { setEditUser(u); setUserModal(true); }}>
                          <i className="ri-pencil-line" />
                        </button>
                        <button className="il-action-btn delete" title="Delete"
                          onClick={() => { setDeleteId(u.user_id); setDeleteModal(true); }}>
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
                onPageChange={(p) => fetchUsers(p, search, pageSize)}
                onPageSizeChange={(s) => { setPageSize(s); fetchUsers(1, search, s); }}
              />
            </div>
          )}
        </>
      )}

      {/* ── User Add/Edit Modal ───────────────────────────────────────────── */}
      <UserFormModal
        isOpen={userModal}
        editUser={editUser}
        groups={groups}
        onClose={() => { setUserModal(false); setEditUser(null); }}
        onSaved={() => fetchUsers(currentPage, search, pageSize)}
      />

      {/* ── Permission Override Modal ─────────────────────────────────────── */}
      {permUser && (
        <PermissionModal
          isOpen={permModal}
          user={permUser}
          onClose={() => { setPermModal(false); setPermUser(null); }}
          onSaved={() => fetchUsers(currentPage, search, pageSize)}
        />
      )}

      {/* ── Delete Modal ─────────────────────────────────────────────────── */}
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDelete}
        onCloseClick={() => { setDeleteModal(false); setDeleteId(null); }}
      />
    </>
  );
};

export default Users;
