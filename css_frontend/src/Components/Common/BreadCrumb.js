import React from 'react';
import { Link } from 'react-router-dom';
import { Col, Row } from 'reactstrap';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';

const selectBreadcrumbsVisibility = createSelector(
    (state) => state.Layout,
    (layout) => layout.breadcrumbsVisibility
);

const BreadCrumb = ({ title, pageTitle, pageTitleLink, infoLink, infoLabel = 'Open compliance system guide' }) => {
    const breadcrumbsVisibility = useSelector(selectBreadcrumbsVisibility);

    if (breadcrumbsVisibility === 'hide') return null;

    return (
        <React.Fragment>
            <Row>
                <Col xs={12}>
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0 d-flex align-items-center gap-2">
                            {title}
                            {infoLink && (
                                <Link
                                    to={infoLink}
                                    className="btn btn-sm btn-soft-info rounded-circle d-inline-flex align-items-center justify-content-center"
                                    style={{ width: 28, height: 28, padding: 0 }}
                                    title={infoLabel}
                                    aria-label={infoLabel}
                                >
                                    <i className="ri-information-line fs-16" />
                                </Link>
                            )}
                        </h4>

                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item">
                                    {pageTitleLink
                                        ? <Link to={pageTitleLink}>{pageTitle}</Link>
                                        : <span style={{ cursor: 'default' }}>{pageTitle}</span>
                                    }
                                </li>
                                <li className="breadcrumb-item active">{title}</li>
                            </ol>
                        </div>

                    </div>
                </Col>
            </Row>
        </React.Fragment>
    );
};

export default BreadCrumb;
