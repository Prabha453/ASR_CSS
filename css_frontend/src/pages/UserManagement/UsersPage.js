import React from 'react';
import { Container, Card, CardBody } from 'reactstrap';
import BreadCrumb from '../../Components/Common/BreadCrumb';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import Users from '../Settings/UserSettings/Users';

const UsersPage = () => {
  useCollapseSidebar();
  document.title = 'Users | ASR CSS';

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Users" pageTitle="User Management" />
        <Card>
          <CardBody>
            <Users />
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default UsersPage;
