import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  Nav, NavItem, NavLink, TabContent, TabPane,
  Button, Col, Spinner, Alert,
} from 'reactstrap';
import classnames from 'classnames';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import DecimalSettings           from '../CompanyProfile/DecimalSettings';
import ShareCertificateSettings  from '../CompanyProfile/SharesCertificate';
import AuthorizedCapital         from './AuthorizedCapital';
import { getCompanyProfile, updateCompanyProfile } from '../../../helpers/backend_helper';
import { setCompanyProfileAction } from '../../../slices/companyProfile/reducer';

const TABS = [
  { id: 'decimal-settings',     label: 'Decimal Settings',    component: DecimalSettings },
  { id: 'share-certificate',    label: 'Share Certificate',   component: ShareCertificateSettings },
  { id: 'authorized-capital',   label: 'Authorized Capital',  component: AuthorizedCapital },
];

const TAB_SCHEMAS = {
  'decimal-settings': Yup.object({
    cp_no_of_share_decimal_place:   Yup.number().min(0).max(12).required('Required'),
    cp_paid_up_share_decimal_place: Yup.number().min(0).max(12).required('Required'),
    cp_issued_share_decimal_place:  Yup.number().min(0).max(12).required('Required'),
  }),
  'share-certificate': Yup.object({
    cp_share_certificate_payment:            Yup.number().required('Required').oneOf([0, 1]),
    cp_allotment_partial_payment_share_cert: Yup.number().required('Required').oneOf([0, 1]),
    cp_transfer_partial_payment_share_cert:  Yup.number().required('Required').oneOf([0, 1]),
    cp_each_partial_payment_share_cert:      Yup.number().required('Required').oneOf([0, 1]),
  }),
  'authorized-capital': Yup.object({
    cp_authorized_captial_countries: Yup.array().of(Yup.string()),
  }),
};

const EMPTY_VALUES = {
  // carry-over — required by backend, not shown in UI
  cp_company_name: '',
  cp_currency:     'SGD',
  // share settings fields
  cp_no_of_share_decimal_place:            0,
  cp_paid_up_share_decimal_place:          0,
  cp_issued_share_decimal_place:           0,
  cp_share_certificate_payment:            0,
  cp_allotment_partial_payment_share_cert: 0,
  cp_transfer_partial_payment_share_cert:  0,
  cp_each_partial_payment_share_cert:      0,
  cp_authorized_captial_countries:         [],
};

const ShareSettings = () => {
  const dispatch = useDispatch();

  const [activeTab,       setActiveTab]       = useState('decimal-settings');
  const [isSaving,        setIsSaving]        = useState(false);
  const [isLoading,       setIsLoading]       = useState(true);
  const [validationError, setValidationError] = useState('');

  const formik = useFormik({
    initialValues:      EMPTY_VALUES,
    enableReinitialize: true,
    validateOnChange:   true,
    validateOnBlur:     true,
    validationSchema:   TAB_SCHEMAS[activeTab],

    onSubmit: async (values) => {
      setValidationError('');
      setIsSaving(true);
      try {
        await updateCompanyProfile(1, values);
        toast.success('Share settings saved successfully', { autoClose: 3000 });
        const res     = await getCompanyProfile(1);
        const payload = res?.data ?? res;
        const profile = payload?.profile ?? payload ?? {};
        dispatch(setCompanyProfileAction(profile));
        formik.resetForm({ values: {
          cp_company_name:                         profile.cp_company_name                         ?? '',
          cp_currency:                             profile.cp_currency                             ?? 'SGD',
          cp_no_of_share_decimal_place:            profile.cp_no_of_share_decimal_place            ?? 0,
          cp_paid_up_share_decimal_place:          profile.cp_paid_up_share_decimal_place          ?? 0,
          cp_issued_share_decimal_place:           profile.cp_issued_share_decimal_place           ?? 0,
          cp_share_certificate_payment:            profile.cp_share_certificate_payment            ?? 0,
          cp_allotment_partial_payment_share_cert: profile.cp_allotment_partial_payment_share_cert ?? 0,
          cp_transfer_partial_payment_share_cert:  profile.cp_transfer_partial_payment_share_cert  ?? 0,
          cp_each_partial_payment_share_cert:      profile.cp_each_partial_payment_share_cert      ?? 0,
          cp_authorized_captial_countries:         Array.isArray(profile.cp_authorized_captial_countries) ? profile.cp_authorized_captial_countries : [],
        }});
      } catch (err) {
        const msg = err?.message ?? err ?? 'An error occurred while saving.';
        toast.error(msg, { autoClose: 4000 });
        setValidationError(msg);
      } finally {
        setIsSaving(false);
      }
    },
  });

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const res     = await getCompanyProfile(1);
      const payload = res?.data ?? res;
      const profile = payload?.profile ?? payload ?? {};
      formik.resetForm({ values: {
        cp_company_name:                         profile.cp_company_name                         ?? '',
        cp_currency:                             profile.cp_currency                             ?? 'SGD',
        cp_no_of_share_decimal_place:            profile.cp_no_of_share_decimal_place            ?? 0,
        cp_paid_up_share_decimal_place:          profile.cp_paid_up_share_decimal_place          ?? 0,
        cp_issued_share_decimal_place:           profile.cp_issued_share_decimal_place           ?? 0,
        cp_share_certificate_payment:            profile.cp_share_certificate_payment            ?? 0,
        cp_allotment_partial_payment_share_cert: profile.cp_allotment_partial_payment_share_cert ?? 0,
        cp_transfer_partial_payment_share_cert:  profile.cp_transfer_partial_payment_share_cert  ?? 0,
        cp_each_partial_payment_share_cert:      profile.cp_each_partial_payment_share_cert      ?? 0,
        cp_authorized_captial_countries:         Array.isArray(profile.cp_authorized_captial_countries) ? profile.cp_authorized_captial_countries : [],
      }});
    } catch {
      toast.error('Failed to load share settings', { autoClose: 3000 });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    formik.setErrors({});
    formik.setTouched({});
    setValidationError('');
  }, [activeTab]);

  return (
    <form onSubmit={formik.handleSubmit}>

      {validationError && (
        <Alert color="danger" className="mb-3 d-flex align-items-center gap-2">
          <i className="ri-error-warning-line fs-16" />
          <span>{validationError}</span>
        </Alert>
      )}

      <Nav pills className="nav-customs nav-danger mb-3">
        {TABS.map(tab => (
          <NavItem key={tab.id}>
            <NavLink
              style={{ cursor: 'pointer' }}
              className={classnames({ active: activeTab === tab.id })}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </NavLink>
          </NavItem>
        ))}
      </Nav>

      <TabContent activeTab={activeTab}>
        {TABS.map(tab => {
          const Component = tab.component;
          return (
            <TabPane key={tab.id} tabId={tab.id} style={{ position: 'relative' }}>
              {isLoading && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(2px)',
                  zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8,
                }}>
                  <Spinner color="success" style={{ width: '2rem', height: '2rem' }} />
                </div>
              )}
              {activeTab === tab.id && <Component formik={formik} />}
            </TabPane>
          );
        })}
      </TabContent>

      <Col xs={12} className="mt-3">
        <Button
          type="submit"
          color="success"
          size="sm"
          disabled={isSaving || formik.isSubmitting}
          className="bg-gradient waves-effect waves-light"
        >
          {isSaving
            ? <><Spinner size="sm" className="me-2" />Saving…</>
            : <><i className="ri-save-line me-1" />Save Changes</>
          }
        </Button>
      </Col>

    </form>
  );
};

export default ShareSettings;
