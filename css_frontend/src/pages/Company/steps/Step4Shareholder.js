import React, { useState } from 'react';
import PersonForm from '../components/PersonForm';

const Step4Shareholder = ({ formData, updateFormData }) => {
  const [shareholders, setShareholders] = useState(
    formData.shareholders?.length ? formData.shareholders : [{ id: Date.now() }]
  );
  return (
    <PersonForm
      title="Shareholder"
      dataKey="shareholders"
      persons={shareholders}
      setPersons={setShareholders}
      updateFormData={updateFormData}
    />
  );
};
export default Step4Shareholder;