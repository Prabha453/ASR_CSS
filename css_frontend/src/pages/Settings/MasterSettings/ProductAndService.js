import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import {
  Modal, ModalBody, ModalFooter, ModalHeader,
  Row, Col, Label, Input, FormFeedback, Spinner,
} from 'reactstrap';
import { useFormik } from 'formik';

import MasterDataView from '../../../Components/Common/MasterDataView';
import { getLoggedinUser } from '../../../helpers/api_helper';

import {
  getProductAndServiceList,
  createProductAndService,
  updateProductAndService,
  deleteProductAndService,
  getEntityServiceCategoryList,
  getCountriesList,
} from '../../../helpers/backend_helper';

import {
  PRODUCT_SERVICE_UOM_OPTIONS,
  PRODUCT_SERVICE_TYPE_OPTIONS,
  STATUS_OPTIONS,
  PRODUCT_SERVICE_COMMISSION_TYPE_OPTIONS,
} from '../../../helpers/common_helper';


// ─────────────────────────────────────────────────────────────────────────────
// Initial form values
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_VALUES = {
  item_name:        '',
  currency_code:    '',
  range_low:        '',
  range_high:       '',
  fee_amount:       '',
  quantity:         1,
  service_type:     '',
  uom:              '',
  status:           'ACTIVE',
  commission_type:  'FIXED',
  commission_value: '',
  category_id:      '',
};

// ─────────────────────────────────────────────────────────────────────────────
// Validation schema
// ─────────────────────────────────────────────────────────────────────────────
const VALIDATION_SCHEMA = Yup.object({
  item_name:        Yup.string().max(255).required('Item Name is required'),
  currency_code:    Yup.string().required('Currency is required'),
  fee_amount:       Yup.number().required('Fee Amount is required'),
  quantity:         Yup.number().required('Quantity is required'),
  status:           Yup.string().required('Status is required'),
  category_id:      Yup.number().required('Category is required'),
  range_low:        Yup.number().nullable().transform((v) => (isNaN(v) ? null : v)),
  range_high:       Yup.number().nullable().transform((v) => (isNaN(v) ? null : v)),
  service_type:     Yup.string().nullable(),
  uom:              Yup.string().nullable(),
  commission_type:  Yup.string().nullable(),
  commission_value: Yup.number().nullable().transform((v) => (isNaN(v) ? null : v)),
});

// ─────────────────────────────────────────────────────────────────────────────
// ProductAndService
// ─────────────────────────────────────────────────────────────────────────────
const ProductAndService = () => {

  const [data,            setData]            = useState([]);
  const [categories,      setCategories]      = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [currencyListData,setCurrencyListData] = useState([]);

  // custom modal state
  const [modal,    setModal]    = useState(false);
  const [editItem, setEditItem] = useState(null);

  // delete modal state
  const [deleteModal,   setDeleteModal]   = useState(false);
  const [deleteItem,    setDeleteItem]    = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false); // ✅ separate loading for delete

  const loggedUser = getLoggedinUser();
  const updatedBy  = loggedUser?.user_id ?? loggedUser?.id ?? 1;

  document.title = 'ASR::CSS | Products & Services';

  // ── Columns ───────────────────────────────────────────────────────────────
  const COLUMNS = [
    {
      key:         'item_name',
      label:       'Item Name',
      sortable:    true,
      width:       '40px',
      gridPrimary: true,
    },
    {
      key:        'category_name',
      label:      'Category',
      sortable:   true,
      width:      '40px',
      showInGrid: true,
    },
    {
      key:        'type_label',
      label:      'Type',
      sortable:   false,
      width:      '40px',
      showInGrid: true,
    },
    {
      key:        'quantity',
      label:      'Quantity',
      sortable:   false,
      width:      '40px',
      showInGrid: true,
    },
    {
      key:        'fee_amount',
      label:      'Fee Amount',
      sortable:   true,
      width:      '40px',
      showInGrid: true,
    },
    {
      key:        'status',
      label:      'Status',
      sortable:   true,
      showInGrid: true,
      width:      '40px',
      badge:      true,
      badgeMap:   { ACTIVE: 'success', INACTIVE: 'danger' },
    },
  ];

  // ── Fetch categories ──────────────────────────────────────────────────────
  const fetchCategories = async () => {
    try {
      const res  = await getEntityServiceCategoryList({
        page: 1, limit: 1000, order: 'service_name:ASC',
      });
      const list = res?.data?.data ?? res?.data ?? [];
      setCategories(
        list.map((item) => ({
          value: item.service_id,
          label: item.service_name,
        }))
      );
    } catch {
      toast.error('Failed to load categories');
    }
  };

  // ── Fetch currencies ──────────────────────────────────────────────────────
  const fetchCountries = async () => {
    try {
      const res  = await getCountriesList({
        page: 1, limit: 1000, order: 'id:ASC',
      });
      const list = res?.data?.data ?? res?.data ?? [];
      setCurrencyListData(
        Array.isArray(list)
          ? list
              .filter((item) => item.currency_code)
              .map((item) => ({ label: item.currency_code, value: item.currency_code }))
          : []
      );
    } catch {
      toast.error('Failed to load countries');
    }
  };

  // ── Fetch list ────────────────────────────────────────────────────────────
  const fetchList = async () => {
    setLoading(true);
    try {
      const res  = await getProductAndServiceList({
        page: 1, limit: 100, order: 'product_service_id:DESC',
      });
      const list = res?.data?.data ?? res?.data ?? res;

      const annotated = (Array.isArray(list) ? list : []).map((row) => {
        const typeOption = PRODUCT_SERVICE_TYPE_OPTIONS.find((o) => String(o.value) === String(row.service_type));
        const type_label = typeOption?.label ?? (row.service_type ? row.service_type : '—');
        return { ...row, type_label };
      });

      setData(annotated);
    } catch {
      toast.error('Failed to load products/services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    fetchCategories();
    fetchCountries();
  }, []);

  // ── Formik ────────────────────────────────────────────────────────────────
  const formik = useFormik({
    initialValues:      INITIAL_VALUES,
    validationSchema:   VALIDATION_SCHEMA,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      try {
        if (editItem) {
          const id = editItem.product_service_id ?? editItem.id;
          await updateProductAndService(id, { ...values, updated_by: updatedBy });
          toast.success('Product / Service updated successfully');
        } else {
          await createProductAndService({ ...values, updated_by: updatedBy });
          toast.success('Product / Service added successfully');
        }
        resetForm();
        setModal(false);
        setEditItem(null);
        await fetchList();
      } catch (err) {
        toast.error(err || 'Failed to save Product / Service');
      } finally {
        // ✅ always reset loading after submit (success or error)
        setLoading(false);
      }
    },
  });

  // ── Open add modal ────────────────────────────────────────────────────────
  const openAddModal = () => {
    setEditItem(null);
    formik.resetForm({ values: INITIAL_VALUES });
    setModal(true);
  };

  // ── Open edit modal ───────────────────────────────────────────────────────
  const openEditModal = (item) => {
    setEditItem(item);
    formik.resetForm({
      values: {
        item_name:        item.item_name        ?? '',
        currency_code:    item.currency_code    ?? '',
        range_low:        item.range_low        ?? '',
        range_high:       item.range_high       ?? '',
        fee_amount:       item.fee_amount       ?? '',
        quantity:         item.quantity         ?? 1,
        service_type:     String(item.service_type ?? ''),
        uom:              String(item.uom ?? ''),
        status:           item.status           ?? 'ACTIVE',
        commission_type:  item.commission_type  ?? 'FIXED',
        commission_value: item.commission_value ?? '',
        category_id:      item.category_id      ?? '',
      },
    });
    setModal(true);
  };

  // ── Delete handlers ───────────────────────────────────────────────────────
  // ✅ This is passed as onDeleteClick to MasterDataView so it fires INSTEAD
  //    of MasterDataView's internal delete modal.
  const handleDeleteClick   = (item) => { setDeleteItem(item); setDeleteModal(true); };
  const handleDeleteClose   = ()     => { setDeleteItem(null); setDeleteModal(false); };
  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;
    const id = deleteItem.product_service_id ?? deleteItem.id;
    setDeleteLoading(true);
    try {
      await deleteProductAndService(id);
      toast.success('Product / Service deleted successfully');
      handleDeleteClose();
      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to delete Product / Service');
    } finally {
      // ✅ always reset delete loading (was missing before)
      setDeleteLoading(false);
    }
  };

  // ── Field prop helper ─────────────────────────────────────────────────────
  const fi = (name) => ({
    name,
    value:    formik.values[name],
    onChange: formik.handleChange,
    onBlur:   formik.handleBlur,
    invalid:  formik.touched[name] && !!formik.errors[name],
  });

  const commissionSymbol = formik.values.commission_type === 'PERCENTAGE' ? '%' : '$';

  return (
    <>
      {/* ── Main list view ── */}
      {/*
        ✅ Key changes vs original:
          - fields={[]}        → bypasses MasterDataView's add/edit modal
          - onAdd={openAddModal}  → opens our custom modal
          - onEdit={openEditModal}→ opens our custom modal
          - onDeleteClick={handleDeleteClick}  ← NEW prop (see MasterDataView fix below)
            This replaces MasterDataView's internal handleDeleteClick so our
            custom delete modal opens instead of the built-in one.
          - onDelete is still required by PropTypes; pass a no-op or the confirm handler.
            With onDeleteClick present, MasterDataView skips its own modal entirely.
      */}
      <MasterDataView
        title="List Of Products & Services"
        modalTitle="Product & Service"
        listId="productAndServiceList"
        columns={COLUMNS}
        fields={[]}
        data={data}
        loading={loading}
        emptyMessage="No Products & Services found."
        onAdd={openAddModal}
        onEdit={openEditModal}
        onDelete={handleDeleteClick}         // ✅ called by MasterDataView on confirm — kept for compat
        onDeleteClick={handleDeleteClick}    // ✅ NEW: replaces MasterDataView's internal delete trigger
      />

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={modal} toggle={() => setModal(false)} centered size="lg">
        <ModalHeader className="bg-light p-3" toggle={() => setModal(false)}>
          <i className="ri-shopping-bag-line me-2 text-success"></i>
          {editItem ? 'Edit Product & Service' : 'Add Product & Service'}
        </ModalHeader>

        <form onSubmit={formik.handleSubmit}>
          <ModalBody>
            <Row className="g-3">

              {/* Item Name */}
              <Col md={6}>
                <Label htmlFor="item_name">Item Name <span className="text-danger">*</span></Label>
                <Input {...fi('item_name')} placeholder="Enter Item Name" />
                {formik.touched.item_name && formik.errors.item_name && (
                  <FormFeedback>{formik.errors.item_name}</FormFeedback>
                )}
              </Col>

              {/* Category */}
              <Col md={6}>
                <Label htmlFor="category_id">Category <span className="text-danger">*</span></Label>
                <Input type="select" {...fi('category_id')}>
                  <option value="">Choose Category...</option>
                  {categories.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Input>
                {formik.touched.category_id && formik.errors.category_id && (
                  <FormFeedback>{formik.errors.category_id}</FormFeedback>
                )}
              </Col>

              {/* Fee Amount */}
              <Col md={3}>
                <Label htmlFor="fee_amount">Fee Amount <span className="text-danger">*</span></Label>
                <Input type="number" {...fi('fee_amount')} placeholder="0.00" />
                {formik.touched.fee_amount && formik.errors.fee_amount && (
                  <FormFeedback>{formik.errors.fee_amount}</FormFeedback>
                )}
              </Col>

              {/* Quantity */}
              <Col md={3}>
                <Label htmlFor="quantity">Quantity <span className="text-danger">*</span></Label>
                <Input type="number" {...fi('quantity')} placeholder="1" />
                {formik.touched.quantity && formik.errors.quantity && (
                  <FormFeedback>{formik.errors.quantity}</FormFeedback>
                )}
              </Col>

              {/* Range Low */}
              <Col md={3}>
                <Label htmlFor="range_low">Range Low</Label>
                <Input type="number" {...fi('range_low')} placeholder="0" />
              </Col>

              {/* Range High */}
              <Col md={3}>
                <Label htmlFor="range_high">Range High</Label>
                <Input type="number" {...fi('range_high')} placeholder="0" />
              </Col>

              {/* Type (service_type) */}
              <Col md={4}>
                <Label htmlFor="service_type">Type</Label>
                <Input type="select" {...fi('service_type')}>
                  <option value="">Choose Type</option>
                  {PRODUCT_SERVICE_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Input>
              </Col>

              {/* Currency */}
              <Col md={4}>
                <Label htmlFor="currency_code">Currency <span className="text-danger">*</span></Label>
                <Input type="select" {...fi('currency_code')}>
                  <option value="">Choose Currency...</option>
                  {currencyListData.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Input>
                {formik.touched.currency_code && formik.errors.currency_code && (
                  <FormFeedback>{formik.errors.currency_code}</FormFeedback>
                )}
              </Col>

              {/* UOM */}
              <Col md={4}>
                <Label htmlFor="uom">UOM</Label>
                <Input type="select" {...fi('uom')}>
                  <option value="">Choose UOM</option>
                  {PRODUCT_SERVICE_UOM_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Input>
              </Col>


              {/* ── Commission ────────────────────────────────────────────── */}
              <Col md={6}>
                <Label>Commission</Label>
                <div className="input-group">

                  {/* $ / % toggle buttons */}
                  <div className="input-group-prepend" style={{ display: 'flex' }}>
                    {PRODUCT_SERVICE_COMMISSION_TYPE_OPTIONS.map((opt) => {
                      const isActive = formik.values.commission_type === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => formik.setFieldValue('commission_type', opt.value)}
                          style={{
                            width:          '44px',
                            height:         '38px',
                            border:         `1px solid ${isActive ? '#405189' : '#ced4da'}`,
                            borderRight:    'none',
                            background:     isActive ? '#405189' : '#f8f9fa',
                            color:          isActive ? '#fff' : '#495057',
                            fontWeight:     '700',
                            fontSize:       '16px',
                            cursor:         'pointer',
                            borderRadius:   opt.value === 'FIXED' ? '4px 0 0 4px' : '0',
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'center',
                            transition:     'all 0.15s',
                          }}
                        >
                          {opt.symbol}
                        </button>
                      );
                    })}
                  </div>

                  {/* Commission value input */}
                  <Input
                    type="number"
                    id="commission_value"
                    name="commission_value"
                    value={formik.values.commission_value}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder={
                      formik.values.commission_type === 'PERCENTAGE'
                        ? 'Enter % (e.g. 10)'
                        : 'Enter amount (e.g. 50)'
                    }
                    style={{ borderRadius: '0 4px 4px 0' }}
                    invalid={formik.touched.commission_value && !!formik.errors.commission_value}
                  />

                  {/* Trailing symbol label */}
                  <div
                    className="input-group-append"
                    style={{
                      display:        'flex',
                      alignItems:     'center',
                      padding:        '0 12px',
                      border:         '1px solid #ced4da',
                      borderLeft:     'none',
                      borderRadius:   '0 4px 4px 0',
                      background:     '#f8f9fa',
                      color:          '#405189',
                      fontWeight:     '700',
                      fontSize:       '15px',
                      minWidth:       '36px',
                      justifyContent: 'center',
                    }}
                  >
                    {formik.values.commission_type
                      ? commissionSymbol
                      : <span style={{ color: '#adb5bd', fontSize: '12px' }}>—</span>
                    }
                  </div>

                </div>
              </Col>

              
              {/* Status */}
              <Col md={6}>
                <Label htmlFor="status">Status <span className="text-danger">*</span></Label>
                <Input type="select" {...fi('status')}>
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Input>
                {formik.touched.status && formik.errors.status && (
                  <FormFeedback>{formik.errors.status}</FormFeedback>
                )}
              </Col>

            </Row>
          </ModalBody>

          <ModalFooter>
            <div className="hstack gap-2 justify-content-end">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => { setModal(false); setEditItem(null); formik.resetForm(); }}
                disabled={formik.isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-success"
                disabled={formik.isSubmitting || loading}
              >
                {formik.isSubmitting
                  ? <><Spinner size="sm" className="me-1" />Saving…</>
                  : <><i className="ri-save-line me-1" />{editItem ? 'Update' : 'Save'}</>
                }
              </button>
            </div>
          </ModalFooter>
        </form>
      </Modal>

      {/* ── Delete Confirm Modal ──────────────────────────────────────────── */}
      <Modal isOpen={deleteModal} toggle={handleDeleteClose} fade centered modalClassName="zoomIn">
        <ModalBody className="py-3 px-5 position-relative">
          <button
            type="button"
            className="btn-close position-absolute top-0 end-0 m-2"
            onClick={handleDeleteClose}
            aria-label="Close"
          />
          <div className="mt-2 text-center">
            <lord-icon
              src="https://cdn.lordicon.com/gsqxdxog.json"
              trigger="loop"
              colors="primary:#f7b84b,secondary:#f06548"
              style={{ width: '100px', height: '100px' }}
            />
            <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
              <h4>Are you sure?</h4>
              <p className="text-muted mx-4 mb-0">
                Are you sure you want to delete{' '}
                <strong>{deleteItem?.item_name ?? ''}</strong>?
              </p>
            </div>
          </div>
          <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
            <button
              type="button"
              className="btn w-sm btn-light"
              onClick={handleDeleteClose}
              disabled={deleteLoading}
            >
              Close
            </button>
            <button
              type="button"
              className="btn w-sm btn-danger"
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
            >
              {deleteLoading
                ? <><span className="spinner-border spinner-border-sm me-1" />Deleting…</>
                : 'Yes, Delete It!'
              }
            </button>
          </div>
        </ModalBody>
      </Modal>
    </>
  );
};

export default ProductAndService;