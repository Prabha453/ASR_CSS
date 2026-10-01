import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setCompanyProfileAction } from '../../../slices/companyProfile/reducer';
import {
  Nav, NavItem, NavLink, TabContent, TabPane,
  Button, Col, Spinner, Alert,
} from 'reactstrap';
import classnames from 'classnames';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import CompanyInformation  from './CompanyInformation';
import ContactInformation  from './ContactInformation';
import EmailConfiguration  from './EmailConfiguration';

import {
  getCompanyProfile,
  updateCompanyProfile,
  getCountriesList,
} from '../../../helpers/backend_helper';

import { getLoggedinUser } from '../../../helpers/api_helper';
import { _applyBranding }               from '../../../hooks/useBranding';

const hasDuplicates = (arr) => {
  const seen = new Set();
  return (arr || []).some((v) => {
    const k = (v || '').trim().toLowerCase();
    if (!k) return false;
    if (seen.has(k)) return true;
    seen.add(k);
    return false;
  });
};

const hasEmailConfigDuplicates = (configs) => {
  if (!configs || configs.length < 2) return false;
  const smtpVals  = configs.map((c) => (c.smtp_email  || '').trim().toLowerCase());
  const replyVals = configs.map((c) => (c.reply_email || '').trim().toLowerCase());
  const smtpDup  = smtpVals.some( (v, i) => v && smtpVals.indexOf(v)  !== i);
  const replyDup = replyVals.some((v, i) => v && replyVals.indexOf(v) !== i);
  return smtpDup || replyDup;
};

const isSuperAdminUser = (user = {}) => {
  const candidates = [
    user?.user_role,
    user?.role,
    user?.role_name,
    user?.user_type,
    user?.roleName,
    user?.user?.user_role,
    user?.user?.role,
    ...(Array.isArray(user?.roles) ? user.roles : []),
  ];

  return candidates
    .filter(Boolean)
    .some(value => String(value?.role_name || value?.name || value).trim().toUpperCase().replace(/[_-]+/g, ' ') === 'SUPER ADMIN');
};

const stripSmtpFieldsForNonSuperAdmin = (values, canManageSmtp) => {
  if (canManageSmtp) return values;

  return {
    ...values,
    cp_email_config: (values.cp_email_config || []).map((config) => {
      const {
        smtp_host,
        smtp_port,
        smtp_user,
        smtp_password,
        smtp_encryption,
        ...publicConfig
      } = config;

      return publicConfig;
    }),
  };
};

const TAB_SCHEMAS = {
  'company-profile': Yup.object({
    cp_company_name:       Yup.string().required('Entity Name is required'),
    cp_registration_no:    Yup.string(),
    cp_registered_address: Yup.string(),
    cp_country:            Yup.string(),
    cp_currency:           Yup.string(),
  }),
  'contact-information': Yup.object({
    cp_email_id: Yup.array().of(
      Yup.string()
        .email('Invalid email format')
        .test('email-unique', 'This email is already added', function (value) {
          if (!value?.trim()) return true;
          const all = this.from?.[1]?.value?.cp_email_id ?? [];
          const idx = Number(this.path.match(/\[(\d+)\]/)?.[1] ?? -1);
          return !all.some((e, i) => i !== idx && (e || '').trim().toLowerCase() === value.trim().toLowerCase());
        })
    ),
    cp_reply_id: Yup.array().of(
      Yup.string()
        .email('Invalid email format')
        .test('reply-unique', 'This reply email is already added', function (value) {
          if (!value?.trim()) return true;
          const all = this.from?.[1]?.value?.cp_reply_id ?? [];
          const idx = Number(this.path.match(/\[(\d+)\]/)?.[1] ?? -1);
          return !all.some((e, i) => i !== idx && (e || '').trim().toLowerCase() === value.trim().toLowerCase());
        })
    ),
    cp_contact_number: Yup.array().of(
      Yup.string()
        .test('phone-unique', 'This phone number is already added', function (value) {
          if (!value?.trim()) return true;
          const all = this.from?.[1]?.value?.cp_contact_number ?? [];
          const idx = Number(this.path.match(/\[(\d+)\]/)?.[1] ?? -1);
          return !all.some((p, i) => i !== idx && (p || '').trim() === value.trim());
        })
    ),
  }),
  'email-configuration': Yup.object({
    cp_email_config: Yup.array()
      .of(
        Yup.object({
          from_name: Yup.string().required('From Name is required').min(2, 'From Name must be at least 2 characters'),
          smtp_host: Yup.string().max(200).nullable(),
          smtp_port: Yup.number().min(1).max(65535).nullable(),
          smtp_user: Yup.string().max(200).nullable(),
          smtp_password: Yup.string().max(500).nullable(),
          smtp_encryption: Yup.string().oneOf(['NONE', 'TLS', 'SSL']).nullable(),
          smtp_email: Yup.string().required('Sending Email is required')
            .test('smtp-unique', 'This sending email is already used in another configuration', function (value) {
              if (!value) return true;
              const all = this.from?.[1]?.value?.cp_email_config ?? [];
              const idx = Number(this.path.match(/\[(\d+)\]/)?.[1] ?? -1);
              return !all.some((c, i) => i !== idx && (c.smtp_email || '').trim().toLowerCase() === value.trim().toLowerCase());
            }),
          reply_email: Yup.string().required('Reply Email is required')
            .test('reply-unique', 'This reply email is already used in another configuration', function (value) {
              if (!value) return true;
              const all = this.from?.[1]?.value?.cp_email_config ?? [];
              const idx = Number(this.path.match(/\[(\d+)\]/)?.[1] ?? -1);
              return !all.some((c, i) => i !== idx && (c.reply_email || '').trim().toLowerCase() === value.trim().toLowerCase());
            }),
          aws_ses:               Yup.boolean(),
          group_to_recipient:    Yup.number().oneOf([0, 1]),
          sending_default_email: Yup.boolean(),
        })
      )
      .min(1, 'At least one email configuration is required')
      .test('one-default', 'Please select one default email configuration', (configs) => {
        if (!configs || configs.length === 0) return true;
        return configs.filter((c) => c.sending_default_email).length === 1;
      }),
  }),
};

const TABS = [
  { id: 'company-profile',     label: 'Company Profile',     component: CompanyInformation },
  { id: 'contact-information', label: 'Contact Information', component: ContactInformation },
  { id: 'email-configuration', label: 'Email Configuration', component: EmailConfiguration },
];

const EMPTY_VALUES = {
  cp_company_name:                '',
  cp_registration_no:             '',
  cp_country:                     '',
  cp_registered_client:           0,
  cp_mailling_address:            0,
  cp_reg_add_block:               '',
  cp_registered_address:          '',
  cp_reg_add_building:            '',
  cp_reg_add_level:               '',
  cp_reg_add_unit:                '',
  cp_reg_add_pcode:               '',
  cp_profile_image:               null,
  cp_profile_image_url:           '',
  cp_currency:                    'SGD',
  cp_gst:                         '0',
  cp_default_level_held_time:     '',
  cp_theme_style:                 'custom',
  cp_caps_proper:                 0,
  cp_no_of_share_decimal_place:   0,
  cp_paid_up_share_decimal_place: 0,
  cp_issued_share_decimal_place:  0,
  cp_email_id:                    [''],
  cp_reply_id:                    [''],
  cp_contact_number:              [''],
  cp_email_config: [{
    email_config_id:       '',
    from_name:             '',
    smtp_host:             '',
    smtp_port:             587,
    smtp_user:             '',
    smtp_password:         '',
    smtp_encryption:       'TLS',
    smtp_email:            '',
    reply_email:           '',
    aws_ses:               false,
    sending_default_email: false,
    group_to_recipient:    0,
  }],
  cp_timezone_user: 'Asia/Singapore',
  cp_port_title:    '',
  cp_company_logo:     null,
  cp_port_logo:        null,
  cp_port_fav_icon:    null,
  cp_login_bg_image:   null,
  documents: [],
  cp_share_certificate_payment:            0,  
  cp_allotment_partial_payment_share_cert: 0,  
  cp_transfer_partial_payment_share_cert:  0,
  cp_each_partial_payment_share_cert:      0,
};

// ─────────────────────────────────────────────────────────────────────────────
// API → Formik mapper
// ─────────────────────────────────────────────────────────────────────────────
const mapApiToFormik = ({ profile, contacts, emailConfigs }) => {
  const cp_email_id       = contacts.map((c) => c.email_id || '').filter(Boolean);
  const cp_reply_id       = contacts.map((c) => c.reply_id || '').filter(Boolean);
  const cp_contact_number = contacts.map((c) => c.phone_no  || '').filter(Boolean);

  const cp_email_config = emailConfigs.length
    ? emailConfigs.map((ec) => ({
        email_config_id:       String(ec.email_config_id ?? '0'),
        from_name:             ec.from_name     ?? '',
        smtp_host:             ec.smtp_host     ?? '',
        smtp_port:             ec.smtp_port     || 587,
        smtp_user:             ec.smtp_user     ?? '',
        smtp_password:         ec.smtp_password ?? '',
        smtp_encryption:       ec.smtp_encryption || 'TLS',
        smtp_email:            ec.sending_email ?? '',
        reply_email:           ec.reply_email   ?? '',
        aws_ses:               Boolean(ec.aws_ses),
        sending_default_email: Boolean(ec.is_default),
        group_to_recipient:    ec.group_to_recipient ?? 0,
      }))
    : EMPTY_VALUES.cp_email_config;

  return {
    ...EMPTY_VALUES,
    cp_company_name:                profile.cp_company_name                ?? '',
    cp_registration_no:             profile.cp_registration_no             ?? '',
    cp_country:                     profile.cp_country                     ?? '',
    cp_registered_client:           profile.cp_registered_client           ?? 0,
    cp_mailling_address:            profile.cp_mailling_address            ?? 0,
    cp_reg_add_block:               profile.cp_reg_add_block               ?? '',
    cp_registered_address:          profile.cp_registered_address          ?? '',
    cp_reg_add_building:            profile.cp_reg_add_building            ?? '',
    cp_reg_add_level:               profile.cp_reg_add_level               ?? '',
    cp_reg_add_unit:                profile.cp_reg_add_unit                ?? '',
    cp_reg_add_pcode:               profile.cp_reg_add_pcode               ?? '',
    cp_profile_image:               null,
    cp_profile_image_url:           profile.cp_profile_image_url           ?? '',
    cp_currency:                    profile.cp_currency                    ?? 'SGD',
    cp_gst:                         String(profile.cp_gst ?? '0'),
    cp_default_level_held_time:     profile.cp_default_level_held_time     ?? '',
    cp_theme_style:                 profile.cp_theme_style                 ?? 'custom',
    cp_caps_proper:                 profile.cp_caps_proper                 ?? 0,
    cp_no_of_share_decimal_place:   profile.cp_no_of_share_decimal_place   ?? '',
    cp_paid_up_share_decimal_place: profile.cp_paid_up_share_decimal_place ?? '',
    cp_issued_share_decimal_place:  profile.cp_issued_share_decimal_place  ?? '',
    cp_timezone_user:               profile.cp_timezone_user               ?? 'Asia/Singapore',
    cp_port_title:                  profile.cp_port_title                  ?? '',
    cp_company_logo:     null,
    cp_port_logo:        null,
    cp_port_fav_icon:    null,
    cp_login_bg_image:   null,
    documents: Array.isArray(profile.documents) ? profile.documents : [],
    cp_email_id:       cp_email_id.length       ? cp_email_id       : [''],
    cp_reply_id:       cp_reply_id.length       ? cp_reply_id       : [''],
    cp_contact_number: cp_contact_number.length ? cp_contact_number : [''],
    cp_email_config,
    cp_share_certificate_payment:            profile.cp_share_certificate_payment            ?? 0,
    cp_allotment_partial_payment_share_cert: profile.cp_allotment_partial_payment_share_cert ?? 0,
    cp_transfer_partial_payment_share_cert:  profile.cp_transfer_partial_payment_share_cert  ?? 0,
    cp_each_partial_payment_share_cert:      profile.cp_each_partial_payment_share_cert      ?? 0,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// updateLocalStorageBranding
//
// ─────────────────────────────────────────────────────────────────────────────
const updateLocalStorageBranding = (freshProfile = {}) => {
  try {
    const raw      = localStorage.getItem('authUser');
    if (!raw) return;

    const authUser = JSON.parse(raw);

    // Merge only the branding-relevant fields so we don't clobber
    // token, portName, user_id, roles, etc.
    const updatedAuthUser = {
      ...authUser,
      company_profile: {
        ...(authUser.company_profile ?? {}),
        cp_company_name:       freshProfile.cp_company_name       ?? authUser.company_profile?.cp_company_name,
        cp_port_title:         freshProfile.cp_port_title         ?? authUser.company_profile?.cp_port_title,
        cp_port_fav_icon_url:  freshProfile.cp_port_fav_icon_url  ?? authUser.company_profile?.cp_port_fav_icon_url,
        cp_port_logo_url:      freshProfile.cp_port_logo_url      ?? authUser.company_profile?.cp_port_logo_url,
        cp_company_logo_url:   freshProfile.cp_company_logo_url   ?? authUser.company_profile?.cp_company_logo_url,
        cp_login_bg_image_url: freshProfile.cp_login_bg_image_url ?? authUser.company_profile?.cp_login_bg_image_url,
        cp_theme_style:        freshProfile.cp_theme_style        ?? authUser.company_profile?.cp_theme_style,
      },
    };

    localStorage.setItem('authUser', JSON.stringify(updatedAuthUser));

    // Apply branding immediately — no need to wait for a storage event
    _applyBranding(updatedAuthUser.company_profile);

    // Notify any other tabs / useBranding listeners
    window.dispatchEvent(new Event('branding-updated'));

  } catch (err) {
    console.error('[updateLocalStorageBranding] Failed:', err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const CompanyProfile = () => {
  const dispatch = useDispatch();

  const [activeTab,       setActiveTab]       = useState('company-profile');
  const [isSaving,        setIsSaving]        = useState(false);
  const [isLoading,       setIsLoading]       = useState(true);
  const [validationError, setValidationError] = useState('');
  const [countryListData, setCountryListData] = useState([]);
  const [currencyListData,setCurrencyListData] = useState([]);

  const loggedUser = getLoggedinUser();
  const portName   = loggedUser?.portName ?? null;
  const canManageSmtp = isSuperAdminUser(loggedUser);

  const formik = useFormik({
    initialValues:      EMPTY_VALUES,
    enableReinitialize: true,
    validateOnChange:   true,
    validateOnBlur:     true,
    validationSchema:   TAB_SCHEMAS[activeTab],

    onSubmit: async (values) => {
      setValidationError('');

      if (activeTab === 'contact-information') {
        const emailDup = hasDuplicates(values.cp_email_id);
        const replyDup = hasDuplicates(values.cp_reply_id);
        const phoneDup = hasDuplicates(values.cp_contact_number);
        if (emailDup || replyDup || phoneDup) {
          const dupFields = [emailDup && 'Sending Email', replyDup && 'Reply Email', phoneDup && 'Phone Number']
            .filter(Boolean).join(', ');
          setValidationError(`Duplicate values found in: ${dupFields}. Please remove duplicates before saving.`);
          values.cp_email_id.forEach((_, i)      => formik.setFieldTouched(`cp_email_id[${i}]`, true, false));
          values.cp_reply_id.forEach((_, i)      => formik.setFieldTouched(`cp_reply_id[${i}]`, true, false));
          values.cp_contact_number.forEach((_, i) => formik.setFieldTouched(`cp_contact_number[${i}]`, true, false));
          return;
        }
      }

      if (activeTab === 'email-configuration') {
        if (hasEmailConfigDuplicates(values.cp_email_config)) {
          setValidationError('Duplicate sending or reply emails found across configurations. Each must be unique.');
          values.cp_email_config.forEach((_, i) => {
            formik.setFieldTouched(`cp_email_config[${i}].smtp_email`,  true, false);
            formik.setFieldTouched(`cp_email_config[${i}].reply_email`, true, false);
          });
          return;
        }
      }

      try {
        await TAB_SCHEMAS[activeTab].validate(values, { abortEarly: false });
      } catch (err) {
        if (err.inner) {
          const errors  = {};
          const touched = {};
          err.inner.forEach((e) => { if (e.path) { errors[e.path] = e.message; touched[e.path] = true; } });
          formik.setErrors(errors);
          formik.setTouched(touched, false);
          setValidationError('Please fix the validation errors before saving.');
          setTimeout(() => {
            const first = document.querySelector('.is-invalid');
            if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); first.focus(); }
          }, 100);
        }
        return;
      }

      setIsSaving(true);
      try {
        const payload = stripSmtpFieldsForNonSuperAdmin(values, canManageSmtp);
        payload.port_name = portName;
        await updateCompanyProfile(1, payload);
        toast.success('Company profile saved successfully', { autoClose: 3000 });
        await fetchProfile();
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
      const res          = await getCompanyProfile(1);
      const payload      = res?.data ?? res;
      const profile      = payload?.profile      ?? {};
      const contacts     = payload?.contacts      ?? [];
      const emailConfigs = payload?.emailConfigs  ?? [];
      formik.resetForm({ values: mapApiToFormik({ profile, contacts, emailConfigs }) });
      updateLocalStorageBranding(profile);
      dispatch(setCompanyProfileAction(profile));
    } catch (err) {
      toast.error(err || 'Failed to load company profile', { autoClose: 3000 });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCountryList = useCallback(async () => {
    setIsLoading(true);
    try {
      const res  = await getCountriesList({ page: 1, limit: 300 });
      const list = res?.data?.data ?? res?.data ?? res;
      setCountryListData(
        Array.isArray(list) ? list.map((item) => ({ label: item.name, value: item.id })) : []
      );
      setCurrencyListData(
        Array.isArray(list)
          ? list.filter((item) => item.currency_code).map((item) => ({ label: item.currency_code, value: item.currency_code }))
          : []
      );
    } catch {
      toast.error('Failed to load countries', { autoClose: 3000 });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchCountryList();
  }, [fetchProfile, fetchCountryList]);

  useEffect(() => {
    formik.setErrors({});
    formik.setTouched({});
    setValidationError('');
  }, [activeTab]);

  const contactHasDup =
    hasDuplicates(formik.values.cp_email_id)    ||
    hasDuplicates(formik.values.cp_reply_id)    ||
    hasDuplicates(formik.values.cp_contact_number);

  const emailConfigHasDup = hasEmailConfigDuplicates(formik.values.cp_email_config);

  return (
    <form onSubmit={formik.handleSubmit}>

      {validationError && (
        <Alert color="danger" className="mb-3 d-flex align-items-center gap-2">
          <i className="ri-error-warning-line fs-16" />
          <span>{validationError}</span>
        </Alert>
      )}

      <Nav pills className="nav-customs nav-danger mb-3" style={{ flexWrap: 'wrap' }}>
        {TABS.map((tab) => {
          const hasDupIndicator =
            (tab.id === 'contact-information' && contactHasDup) ||
            (tab.id === 'email-configuration' && emailConfigHasDup);
          return (
            <NavItem key={tab.id}>
              <NavLink
                style={{ cursor: 'pointer', position: 'relative' }}
                className={classnames({ active: activeTab === tab.id })}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {hasDupIndicator && (
                  <span title="Duplicate values detected" style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 7, height: 7, borderRadius: '50%',
                    background: '#f06548', display: 'inline-block',
                  }} />
                )}
              </NavLink>
            </NavItem>
          );
        })}
      </Nav>

      <TabContent activeTab={activeTab}>
        {TABS.map((tab) => {
          const Component = tab.component;
          return (
            <TabPane key={tab.id} tabId={tab.id} style={{ position: 'relative' }}>
              {isLoading && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(2px)',
                  zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px',
                }}>
                  <Spinner color="success" style={{ width: '2rem', height: '2rem' }} />
                </div>
              )}
              {activeTab === tab.id && (
                <Component
                  formik={formik}
                  currencyData={currencyListData}
                  countriesData={countryListData}
                  fetchProfile={fetchProfile}
                />
              )}
            </TabPane>
          );
        })}
      </TabContent>

      <Col xs={12} className="mt-3">
        <Button
          type="submit"
          color="success"
          size="sm"
          disabled={isSaving || formik.isSubmitting || contactHasDup || emailConfigHasDup}
          className="bg-gradient waves-effect waves-light"
          title={contactHasDup || emailConfigHasDup ? 'Fix duplicate values before saving' : ''}
        >
          {isSaving ? (
            <><Spinner size="sm" className="me-2" />Saving…</>
          ) : (
            <><i className="ri-save-line me-1" />Save Changes</>
          )}
        </Button>

        {(contactHasDup || emailConfigHasDup) && (
          <span className="ms-3 text-danger fs-12">
            <i className="ri-error-warning-line me-1" />
            Fix duplicate values in{' '}
            {[contactHasDup && 'Contact Information', emailConfigHasDup && 'Email Configuration']
              .filter(Boolean).join(' and ')}{' '}
            to enable saving.
          </span>
        )}
      </Col>

    </form>
  );
};

export default CompanyProfile;
