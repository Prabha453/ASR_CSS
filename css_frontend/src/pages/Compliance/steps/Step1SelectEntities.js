// steps/Step1SelectEntities.jsx
import React, { useState, useMemo } from 'react';
import { 
  Row, 
  Col, 
  Input, 
  Button, 
  Modal, 
  ModalBody, 
  ModalHeader,
  ModalFooter,
  Table, 
  Card, 
  CardBody, 
  Badge 
} from 'reactstrap';
import { toast } from 'react-toastify';
import { getEntityId } from '../multiEventHelpers';

const initialsOf = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

const Step1SelectEntities = ({ formData, updateFormData, companies = [], errors }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const selectedEntities = formData.selected_entities || [];
  const [selectedIds, setSelectedIds] = useState(() =>
    new Set(selectedEntities.map(e => getEntityId(e)))
  );

  const handleOpenModal = () => {
    setSelectedIds(new Set(selectedEntities.map(e => getEntityId(e))));
    setModalOpen(true);
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      const name = c.name || c.company_name || '';
      const regNum = c.identifications?.[0]?.uen_no || 
                     c.identifications?.[0]?.fbrn_reg_no || 
                     c.company_registration_Num || '';
      const clientNo = c.client_no || '';
      
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(regNum).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(clientNo).toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesStatus = !statusFilter || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [companies, searchTerm, statusFilter]);

  const toggleEntity = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (filteredCompanies.length > 0 && filteredCompanies.every(c => selectedIds.has(getEntityId(c)))) {
      const newSet = new Set(selectedIds);
      filteredCompanies.forEach(c => newSet.delete(getEntityId(c)));
      setSelectedIds(newSet);
    } else {
      const newSet = new Set(selectedIds);
      filteredCompanies.forEach(c => newSet.add(getEntityId(c)));
      setSelectedIds(newSet);
    }
  };

  const confirmSelection = () => {
    const selected = companies.filter(c => selectedIds.has(getEntityId(c)));
    if (selected.length === 0) {
      toast.warning('Please select at least one entity.');
      return;
    }
    updateFormData({ selected_entities: selected });
    setModalOpen(false);
  };

  const removeEntity = (id) => {
    const updated = selectedEntities.filter(e => getEntityId(e) !== id);
    updateFormData({ selected_entities: updated });
    setSelectedIds(new Set(updated.map(e => getEntityId(e))));
  };

  const clearAll = () => {
    updateFormData({ selected_entities: [] });
    setSelectedIds(new Set());
  };

  const getCompanyCardDetails = (entity) => {
    const ident = entity.identifications?.[0] || {};
    const contact = entity.contacts?.[0] || {};
    
    const regNum = ident.uen_no || ident.fbrn_reg_no || entity.company_registration_Num || '-';
    const status = entity.status || 'ACTIVE';
    const statusColor = status === 'ACTIVE' ? 'success' : 
                        status === 'INACTIVE' ? 'danger' : 
                        status === 'PENDING' ? 'warning' : 'secondary';
    
    const contactEmail = contact.contact_value || '-';
    const officialRoles = entity.official_roles || {};
    const roleNames = Object.keys(officialRoles).filter(key => officialRoles[key]?.length > 0);
    
    return { regNum, status, statusColor, contactEmail, roleNames };
  };

  return (
    <div>
      {/* Top Banner Control Panel */}
      <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded mb-4 border">
        <div>
          <h6 className="mb-1 fw-bold text-dark">Select Entities</h6>
          <p className="text-muted small mb-0 d-flex align-items-center gap-2">
            <Badge color="primary" pill>{selectedEntities.length}</Badge>
            {selectedEntities.length !== 1 ? 'entities' : 'entity'} selected
          </p>
        </div>
        <div className="d-flex gap-2">
          {selectedEntities.length > 0 && (
            <Button size="sm" color="danger" outline onClick={clearAll} className="d-flex align-items-center gap-1">
              <i className="ri-delete-bin-line"></i> Clear All
            </Button>
          )}
          <Button size="sm" color="primary" onClick={handleOpenModal} className="d-flex align-items-center gap-1">
            <i className="ri-add-line"></i> Add Entities
          </Button>
        </div>
      </div>

      {/* Main Grid Section */}
      {selectedEntities.length > 0 ? (
        <Row className="g-3">
          {selectedEntities.map(entity => {
            const name = entity.name || entity.company_name || '';
            const details = getCompanyCardDetails(entity);
            const entityId = getEntityId(entity);
            
            return (
              <Col key={entityId} sm={12} md={6} lg={4}>
                <Card className="h-80 shadow-sm border">
                  <CardBody className="d-flex flex-column justify-content-between p-3">
                    <div>
                      {/* Card Header row */}
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                        <div className="d-flex align-items-center gap-2 overflow-hidden">
                          <div 
                            className="bg-primary text-white d-flex align-items-center justify-content-center rounded-circle fw-bold text-center flex-shrink-0" 
                            style={{ width: '32px', height: '32px', fontSize: '11px' }}
                          >
                            {initialsOf(name)}
                          </div>
                          <div className="overflow-hidden">
                            <h6 className="text-truncate mb-0 fw-semibold text-dark" title={name}>{name}</h6>
                            <small className="text-muted font-monospace">{details.regNum}</small>
                          </div>
                        </div>
                        <Button 
                          close 
                          className="text-danger bg-danger-subtle p-1 rounded" 
                          style={{ fontSize: '12px' }}
                          onClick={() => removeEntity(entityId)} 
                        />
                      </div>
                      
                      {/* Email Row */}
                      {details.contactEmail !== '-' && (
                        <div className="d-flex align-items-center gap-2 small mb-2">
                          <i className="ri-mail-line text-primary"></i>
                          <span className="text-truncate">{details.contactEmail}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Foot Tag section */}
                    <div className="pt-2 mt-2 border-top d-flex align-items-center justify-content-between gap-2 flex-wrap">
                      <Badge color={`${details.statusColor}`} className="text-uppercase">
                        {details.status}
                      </Badge>
                      
                      <div className="d-flex gap-1 flex-wrap align-items-center">
                        {details.roleNames.slice(0, 2).map(role => (
                          <Badge key={role} color="info" className="border fw-normal">{role}</Badge>
                        ))}
                        {details.roleNames.length > 2 && (
                          <Badge color="info" className="border fw-normal">+{details.roleNames.length - 2}</Badge>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        /* Empty State Box */
        <div className="text-center p-5 bg-light rounded border border-dashed">
          <i className="ri-building-4-line text-muted display-5 mb-2"></i>
          <h6 className="fw-semibold text-dark">No Entities Selected</h6>
          <p className="text-muted small mb-0">Click "Add Entities" to choose companies for event generation.</p>
        </div>
      )}

      {/* Errors Alert Block */}
      {errors && errors.length > 0 && (
        <div className="mt-3 alert alert-danger border-0 shadow-sm d-flex flex-column gap-1">
          {errors.map((err, i) => (
            <div key={i} className="small d-flex align-items-center gap-2">
              <i className="ri-error-warning-line fs-5"></i> {err}
            </div>
          ))}
        </div>
      )}

      {/* Selection Modal Window */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size="lg" centered>
        <ModalHeader toggle={() => setModalOpen(false)} className="border-bottom-0 pb-0">
          <span className="fw-bold text-dark d-flex align-items-center gap-2">
            <i className="ri-building-2-line text-primary"></i> Choose Entities
          </span>
        </ModalHeader>
        
        <ModalBody>
          {/* Filters Row */}
          <Row className="g-2 mb-3">
            <Col md={8}>
              <Input 
                type="text"
                placeholder="Search by name, UEN, or client ID..."
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </Col>
            <Col md={4}>
              <Input 
                type="select" 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PENDING">Pending</option>
              </Input>
            </Col>
          </Row>

          {/* Table Container Scrollbox */}
          <div className="border rounded overflow-auto" style={{ maxHeight: '350px' }}>
            <Table hover striped={false} responsive className="align-middle mb-0 small">
              <thead className="table-light sticky-top">
                <tr>
                  <th width="40" className="ps-3">
                    <Input 
                      type="checkbox" 
                      className="form-check-input"
                      checked={filteredCompanies.length > 0 && filteredCompanies.every(c => selectedIds.has(getEntityId(c)))}
                      onChange={toggleAll} 
                    />
                  </th>
                  <th>Entity Name</th>
                  <th>UEN / FBRN</th>
                  <th className="pe-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map(c => {
                  const id = getEntityId(c);
                  const ident = c.identifications?.[0] || {};
                  const regNum = ident.uen_no || ident.fbrn_reg_no || c.company_registration_Num || '-';
                  const statusColor = c.status === 'ACTIVE' ? 'success' : 
                                      c.status === 'INACTIVE' ? 'danger' : 
                                      c.status === 'PENDING' ? 'warning' : 'secondary';
                  
                  return (
                    <tr key={id} style={{ cursor: 'pointer' }} onClick={() => toggleEntity(id)}>
                      <td className="ps-3" onClick={(e) => e.stopPropagation()}>
                        <Input 
                          type="checkbox" 
                          className="form-check-input"
                          checked={selectedIds.has(id)} 
                          onChange={() => toggleEntity(id)} 
                        />
                      </td>
                      <td className="fw-medium text-dark">
                        <div className="d-flex align-items-center gap-2">
                          <div 
                            className="bg-light text-primary d-flex align-items-center justify-content-center rounded-circle fw-bold text-center border" 
                            style={{ width: '24px', height: '24px', fontSize: '9px' }}
                          >
                            {initialsOf(c.name || c.company_name || '')}
                          </div>
                          <span>{c.name || c.company_name}</span>
                        </div>
                      </td>
                      <td className="font-monospace">{regNum}</td>
                      <td className="pe-3">
                        <Badge color={`${statusColor}`}>
                          {c.status || 'UNKNOWN'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {filteredCompanies.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">No companies found</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </ModalBody>

        <ModalFooter className="border-top-0 pt-0 d-flex justify-content-between align-items-center">
          <div className="text-muted small">
            <strong>{selectedIds.size}</strong> profile{selectedIds.size !== 1 ? 's' : ''} highlighted
          </div>
          <div className="d-flex gap-2">
            <Button color="light" size="sm" className="border" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button color="success" size="sm" onClick={confirmSelection}>
              Apply Selection
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default Step1SelectEntities;