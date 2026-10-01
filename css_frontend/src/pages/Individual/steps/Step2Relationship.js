import React, { useState } from 'react';
import { Row, Col, Label, Input } from 'reactstrap';
import SectionBlock from '../../Company/components/SectionBlock';

const Step2Relationship = ({ formData, updateFormData }) => {
  const [rel, setRel] = useState(formData.relationship || {});

  const updateRel = (field, value) => {
    const updated = { ...rel, [field]: value };
    setRel(updated);
    updateFormData({ relationship: updated });
  };

  return (
    <SectionBlock title="Relationship">
      <Row className="g-3">
        <Col md={4}>
          <Label className="form-label fs-12">Father's Name</Label>
          <Input bsSize="sm" placeholder="Father's full name"
            value={rel.fatherName || ''}
            onChange={e => updateRel('fatherName', e.target.value)} />
        </Col>
        <Col md={4}>
          <Label className="form-label fs-12">Mother's Name</Label>
          <Input bsSize="sm" placeholder="Mother's full name"
            value={rel.motherName || ''}
            onChange={e => updateRel('motherName', e.target.value)} />
        </Col>
        <Col md={4}>
          <Label className="form-label fs-12">Spouse's Name</Label>
          <Input bsSize="sm" placeholder="Spouse's full name"
            value={rel.spouseName || ''}
            onChange={e => updateRel('spouseName', e.target.value)} />
        </Col>
      </Row>
    </SectionBlock>
  );
};

export default Step2Relationship;
