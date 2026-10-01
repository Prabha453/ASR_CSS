import React, { useState } from 'react';
import PersonForm from '../components/PersonForm';

const Step5Secretary = ({ formData, updateFormData }) => {
  const [secretaries, setSecretaries] = useState(
    formData.secretaries?.length ? formData.secretaries : [{ id: Date.now() }]
  );
  return (
    <PersonForm
      title="Secretary"
      dataKey="secretaries"
      persons={secretaries}
      setPersons={setSecretaries}
      updateFormData={updateFormData}
    />
  );
};
export default Step5Secretary;