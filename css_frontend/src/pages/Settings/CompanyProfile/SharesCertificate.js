import React from 'react';
import { Row } from 'reactstrap';

import FormInput from '../Components/FormInput';

const selectConfig = [

  {
    name: 'cp_share_certificate_payment',
    label: 'Generate share certificate without full payment',
    type: 'select',
    col: { md: 6 },
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Yes' },
    ],
  },

  {
    name: 'cp_allotment_partial_payment_share_cert',
    label: 'Allotment Share Cert No.',
    type: 'select',
    col: { md: 6 },
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Yes' },
    ],
  },

  {
    name: 'cp_transfer_partial_payment_share_cert',
    label: 'Transfer Share Cert No.',
    type: 'select',
    col: { md: 6 },
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Yes' },
    ],
  },

  {
    name: 'cp_each_partial_payment_share_cert',
    label: 'Each Partial Payment Share Cert No.',
    type: 'select',
    col: { md: 6 },
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Yes' },
    ],
  },

];

const ShareCertificateSettings = ({ formik }) => {

  return (

    <div>

      <Row className="g-3 mb-4">

        <FormInput
          config={selectConfig}
          formik={formik}
        />

      </Row>

    </div>

  );

};

export default ShareCertificateSettings;