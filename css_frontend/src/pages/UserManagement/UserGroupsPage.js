import React from 'react';
import { Container, Card, CardBody } from 'reactstrap';
import BreadCrumb from '../../Components/Common/BreadCrumb';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import UserGroup from '../Settings/UserSettings/UserGroup';

const UserGroupsPage = () => {
  useCollapseSidebar();
  document.title = 'User Groups | ASR CSS';

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="User Groups" pageTitle="User Management" />
        <Card>
          <CardBody>
            <UserGroup />
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default UserGroupsPage;
