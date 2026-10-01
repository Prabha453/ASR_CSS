import React, { useState } from 'react';
import { Row, Col, Label, Input } from 'reactstrap';
import DatePickerInput from '../../../Components/Common/DatePickerInput';
import SectionBlock from '../components/SectionBlock';

const Step2ContactPerson = ({ formData, updateFormData }) => {
  const [contact, setContact]         = useState(formData.contact        || {});
  const [dates, setDates]             = useState(formData.dates          || {});
  const [companyContact, setCompany]  = useState(formData.companyContact || {});

  const upd = (getter, setter, storeKey, field, value) => {
    const updated = { ...getter, [field]: value };
    setter(updated);
    updateFormData({ [storeKey]: updated });
  };

  return (
    <>
      <SectionBlock title="Contact Person">
        <Row className="g-3">
          <Col md={2}>
            <Label className="form-label fs-12">Salutation</Label>
            <Input type="select" bsSize="sm" value={contact.salutation || ''}
              onChange={e => upd(contact, setContact, 'contact', 'salutation', e.target.value)}>
              <option value="">--</option>
              <option>Mr</option><option>Mrs</option><option>Ms</option><option>Dr</option>
            </Input>
          </Col>
          <Col md={4}>
            <Label className="form-label fs-12">First Name <span className="text-danger">*</span></Label>
            <Input bsSize="sm" placeholder="First name" value={contact.firstName || ''}
              onChange={e => upd(contact, setContact, 'contact', 'firstName', e.target.value)} />
          </Col>
          <Col md={3}>
            <Label className="form-label fs-12">Last Name <span className="text-danger">*</span></Label>
            <Input bsSize="sm" placeholder="Last name" value={contact.lastName || ''}
              onChange={e => upd(contact, setContact, 'contact', 'lastName', e.target.value)} />
          </Col>
          <Col md={3}>
            <Label className="form-label fs-12">Designation</Label>
            <Input bsSize="sm" placeholder="e.g. Director" value={contact.designation || ''}
              onChange={e => upd(contact, setContact, 'contact', 'designation', e.target.value)} />
          </Col>
          <Col md={4}>
            <Label className="form-label fs-12">Identification Type</Label>
            <Input type="select" bsSize="sm" value={contact.idType || ''}
              onChange={e => upd(contact, setContact, 'contact', 'idType', e.target.value)}>
              <option value="">Select...</option>
              <option>NRIC</option><option>Passport</option>
              <option>FIN</option><option>Work Permit</option><option>Driving License</option>
            </Input>
          </Col>
          <Col md={4}>
            <Label className="form-label fs-12">Identification No.</Label>
            <Input bsSize="sm" placeholder="e.g. S1234567A" value={contact.idNo || ''}
              onChange={e => upd(contact, setContact, 'contact', 'idNo', e.target.value)} />
          </Col>
          <Col md={4}>
            <Label className="form-label fs-12">Nationality</Label>
            <Input bsSize="sm" placeholder="e.g. Singaporean" value={contact.nationality || ''}
              onChange={e => upd(contact, setContact, 'contact', 'nationality', e.target.value)} />
          </Col>
        </Row>
      </SectionBlock>

      <SectionBlock title="Appointment / Cessation Date">
        <Row className="g-3">
          <Col md={4}>
            <Label className="form-label fs-12">Appointment Date</Label>
            <DatePickerInput value={dates.appointmentDate || ''}
              onChange={e => upd(dates, setDates, 'dates', 'appointmentDate', e.target.value)} />
          </Col>
          <Col md={4}>
            <Label className="form-label fs-12">Cessation Date</Label>
            <DatePickerInput value={dates.cessationDate || ''}
              onChange={e => upd(dates, setDates, 'dates', 'cessationDate', e.target.value)} />
          </Col>
          <Col md={4}>
            <Label className="form-label fs-12">Effective Date</Label>
            <DatePickerInput value={dates.effectiveDate || ''}
              onChange={e => upd(dates, setDates, 'dates', 'effectiveDate', e.target.value)} />
          </Col>
        </Row>
      </SectionBlock>

      <SectionBlock title="Company Contact Details">
        <Row className="g-3">
          <Col md={4}>
            <Label className="form-label fs-12">Email Address</Label>
            <Input bsSize="sm" type="email" placeholder="company@example.com"
              value={companyContact.email || ''}
              onChange={e => upd(companyContact, setCompany, 'companyContact', 'email', e.target.value)} />
          </Col>
          <Col md={4}>
            <Label className="form-label fs-12">Office Phone</Label>
            <Input bsSize="sm" placeholder="+65 XXXX XXXX"
              value={companyContact.phone || ''}
              onChange={e => upd(companyContact, setCompany, 'companyContact', 'phone', e.target.value)} />
          </Col>
          <Col md={4}>
            <Label className="form-label fs-12">Fax</Label>
            <Input bsSize="sm" placeholder="+65 XXXX XXXX"
              value={companyContact.fax || ''}
              onChange={e => upd(companyContact, setCompany, 'companyContact', 'fax', e.target.value)} />
          </Col>
          <Col md={12}>
            <Label className="form-label fs-12">Registered Address</Label>
            <Input bsSize="sm" type="textarea" rows={2}
              placeholder="Enter full registered address"
              value={companyContact.address || ''}
              onChange={e => upd(companyContact, setCompany, 'companyContact', 'address', e.target.value)} />
          </Col>
        </Row>
      </SectionBlock>
    </>
  );
};

export default Step2ContactPerson;
