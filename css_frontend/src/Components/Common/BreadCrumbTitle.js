import React from 'react';
import { Link } from 'react-router-dom';
import { Col, Row } from 'reactstrap';

const BreadCrumbTitle = ({ pageTitle }) => {
    return (
        <React.Fragment>
            <h4 className="card-title mb-0 flex-grow-1">{pageTitle}</h4>
        </React.Fragment>
    );
};

export default BreadCrumbTitle;