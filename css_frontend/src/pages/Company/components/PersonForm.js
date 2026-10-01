import React from 'react';
import { Row, Col, Label, Input, Button } from 'reactstrap';
import DatePickerInput from '../../../Components/Common/DatePickerInput';
import SectionBlock from './SectionBlock';

const EMPTY_PERSON = {
  salutation: '', firstName: '', lastName: '',
  idType: '', idNo: '', nationality: '',
  email: '', phone: '',
  appointmentDate: '', cessationDate: '',
};

const PersonForm = ({ title, persons, setPersons, updateFormData, dataKey }) => {

  const addPerson = () => {
    const updated = [...persons, { ...EMPTY_PERSON, id: Date.now() }];
    setPersons(updated);
    updateFormData({ [dataKey]: updated });
  };

  const removePerson = (index) => {
    const updated = persons.filter((_, i) => i !== index);
    setPersons(updated);
    updateFormData({ [dataKey]: updated });
  };

  const updatePerson = (index, field, value) => {
    const updated = persons.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    );
    setPersons(updated);
    updateFormData({ [dataKey]: updated });
  };

  return (
    <>
      {persons.map((person, index) => (
        <SectionBlock
          key={person.id || index}
          title={`${title} ${persons.length > 1 ? `#${index + 1}` : ''}`}
        >
          <Row className="g-3">
            <Col md={2}>
              <Label className="form-label fs-12">Salutation</Label>
              <Input type="select" bsSize="sm"
                value={person.salutation}
                onChange={e => updatePerson(index, 'salutation', e.target.value)}>
                <option value="">--</option>
                <option>Mr</option><option>Mrs</option>
                <option>Ms</option><option>Dr</option>
              </Input>
            </Col>
            <Col md={4}>
              <Label className="form-label fs-12">First Name <span className="text-danger">*</span></Label>
              <Input bsSize="sm" placeholder="First name"
                value={person.firstName}
                onChange={e => updatePerson(index, 'firstName', e.target.value)} />
            </Col>
            <Col md={4}>
              <Label className="form-label fs-12">Last Name <span className="text-danger">*</span></Label>
              <Input bsSize="sm" placeholder="Last name"
                value={person.lastName}
                onChange={e => updatePerson(index, 'lastName', e.target.value)} />
            </Col>
            <Col md={2}>
              <Label className="form-label fs-12">Nationality</Label>
              <Input bsSize="sm" placeholder="e.g. SG"
                value={person.nationality}
                onChange={e => updatePerson(index, 'nationality', e.target.value)} />
            </Col>
            <Col md={4}>
              <Label className="form-label fs-12">ID Type</Label>
              <Input type="select" bsSize="sm"
                value={person.idType}
                onChange={e => updatePerson(index, 'idType', e.target.value)}>
                <option value="">Select...</option>
                <option>NRIC</option><option>Passport</option>
                <option>FIN</option><option>Work Permit</option>
              </Input>
            </Col>
            <Col md={4}>
              <Label className="form-label fs-12">ID Number</Label>
              <Input bsSize="sm" placeholder="e.g. S1234567A"
                value={person.idNo}
                onChange={e => updatePerson(index, 'idNo', e.target.value)} />
            </Col>
            <Col md={4}>
              <Label className="form-label fs-12">Email</Label>
              <Input bsSize="sm" type="email" placeholder="email@example.com"
                value={person.email}
                onChange={e => updatePerson(index, 'email', e.target.value)} />
            </Col>
            <Col md={4}>
              <Label className="form-label fs-12">Phone</Label>
              <Input bsSize="sm" placeholder="+65 XXXX XXXX"
                value={person.phone}
                onChange={e => updatePerson(index, 'phone', e.target.value)} />
            </Col>
            <Col md={4}>
              <Label className="form-label fs-12">Appointment Date</Label>
              <DatePickerInput
                value={person.appointmentDate}
                onChange={e => updatePerson(index, 'appointmentDate', e.target.value)} />
            </Col>
            <Col md={4}>
              <Label className="form-label fs-12">Cessation Date</Label>
              <DatePickerInput
                value={person.cessationDate}
                onChange={e => updatePerson(index, 'cessationDate', e.target.value)} />
            </Col>
            {persons.length > 1 && (
              <Col md={12} className="text-end">
                <Button color="danger" outline size="sm"
                  onClick={() => removePerson(index)}>
                  <i className="ri-delete-bin-line me-1"></i> Remove {title}
                </Button>
              </Col>
            )}
          </Row>
        </SectionBlock>
      ))}

      <Button color="primary" outline size="sm"
        onClick={addPerson}
        style={{ borderColor: '#405189', color: '#405189' }}>
        <i className="ri-add-line me-1"></i> Add Another {title}
      </Button>
    </>
  );
};

export default PersonForm;
