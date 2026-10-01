import React, { useState } from 'react';
import PersonForm from '../components/PersonForm';

const Step3Director = ({ formData, updateFormData }) => {
  const [directors, setDirectors] = useState(
    formData.directors?.length ? formData.directors : [{ id: Date.now() }]
  );
  return (
    <PersonForm
      title="Director"
      dataKey="directors"
      persons={directors}
      setPersons={setDirectors}
      updateFormData={updateFormData}
    />
  );
};
export default Step3Director;