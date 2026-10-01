import React from 'react';
import { Col, Container, Row } from 'reactstrap';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';

const selectFooterVisibility = createSelector(
    (state) => state.Layout,
    (layout) => layout.footerVisibility
);

const Footer = () => {
    const footerVisibility = useSelector(selectFooterVisibility);

    if (footerVisibility === 'hide') return null;

    return (
        <React.Fragment>
            <footer className="footer">
                <Container fluid>
                    <Row>
                        <Col sm={6}>
                            {new Date().getFullYear()} © CSS.
                        </Col>
                        <Col sm={6}>
                            <div className="text-sm-end d-none d-sm-block">
                                Design & Develop by ASR
                            </div>
                        </Col>
                    </Row>
                </Container>
            </footer>
        </React.Fragment>
    );
};

export default Footer;
