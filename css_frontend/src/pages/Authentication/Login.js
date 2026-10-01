import React, { useEffect, useState } from 'react';
import { Col, Container, Input, Row, Form, FormFeedback, Alert, Spinner } from 'reactstrap';
import ParticlesAuth from "../AuthenticationInner/ParticlesAuth";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import withRouter from "../../Components/Common/withRouter";
import * as Yup from "yup";
import { useFormik } from "formik";

import { loginUser, resetLoginFlag } from "../../slices/thunks";

import logoLight from "../../assets/images/logo-light.png";
import { createSelector } from 'reselect';

const Login = (props) => {
    const dispatch = useDispatch();

    const loginpageData = createSelector(
        (state) => state.Login,
        (login) => ({
            error:    login.error,
            loading:  login.loading,
            errorMsg: login.errorMsg,
        })
    );

    const { error, loading, errorMsg } = useSelector(loginpageData);
    const [passwordShow, setPasswordShow] = useState(false);

    useEffect(() => {
        if (errorMsg) {
            const timer = setTimeout(() => dispatch(resetLoginFlag()), 3000);
            return () => clearTimeout(timer);
        }
    }, [dispatch, errorMsg]);

    const validation = useFormik({
        enableReinitialize: true,
        initialValues: { port_number: '', email: '', password: '' },
        validationSchema: Yup.object({
            port_number: Yup.string().required("Please enter your port number"),
            email:       Yup.string().email("Please enter a valid email").required("Please enter your email"),
            password:    Yup.string().min(6, "Minimum 6 characters").required("Please enter your password"),
        }),
        onSubmit: (values) => dispatch(loginUser(values, props.router.navigate)),
    });

    document.title = "Sign In | ASR CSS";

    const inputStyle = (touched, err) => ({
        paddingLeft: 40,
        borderRadius: 10,
        border: touched && err ? '1.5px solid #f06548' : '1.5px solid #e9ebec',
        height: 44,
        fontSize: 13.5,
        background: '#f8f9fa',
        boxShadow: 'none',
    });

    return (
        <React.Fragment>
            <style>{`
                .login-card {
                    border-radius: 20px;
                    border: none;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 4px 20px rgba(0,0,0,0.1);
                    overflow: hidden;
                    background: #fff;
                }
                .login-card-top {
                    background: linear-gradient(135deg, #405189 0%, #0ab39c 100%);
                    padding: 32px 32px 28px;
                    text-align: center;
                    position: relative;
                }
                .login-card-top::after {
                    content: '';
                    position: absolute;
                    bottom: -1px; left: 0; right: 0;
                    height: 28px;
                    background: #fff;
                    border-radius: 24px 24px 0 0;
                }
                .login-logo-ring {
                    width: 68px; height: 68px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.18);
                    border: 2px solid rgba(255,255,255,0.35);
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 14px;
                    backdrop-filter: blur(6px);
                }
                .login-card-body { padding: 10px 32px 32px; }
                .login-title { font-size: 20px; font-weight: 700; color: #fff; margin: 0 0 4px; }
                .login-sub   { font-size: 12.5px; color: rgba(255,255,255,0.75); margin: 0; }

                .login-field { position: relative; margin-bottom: 18px; }
                .login-field-icon {
                    position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
                    font-size: 16px; color: #878a99; pointer-events: none; z-index: 5;
                    transition: color 0.15s;
                }
                .login-field input:focus ~ .login-field-icon,
                .login-field input:focus + .login-field-icon { color: #405189; }
                .login-field input:focus {
                    border-color: #405189 !important;
                    background: #fff !important;
                    box-shadow: 0 0 0 3px rgba(64,81,137,0.1) !important;
                }
                .login-label {
                    font-size: 12px; font-weight: 600; color: #495057;
                    margin-bottom: 6px; display: block;
                }
                .login-btn {
                    width: 100%; height: 46px; border: none; border-radius: 12px;
                    background: linear-gradient(135deg, #405189 0%, #0ab39c 100%);
                    color: #fff; font-size: 14px; font-weight: 700;
                    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
                    transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;
                    box-shadow: 0 4px 16px rgba(64,81,137,0.35);
                    letter-spacing: 0.03em;
                }
                .login-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 6px 22px rgba(64,81,137,0.4); }
                .login-btn:active:not(:disabled) { transform: translateY(0); }
                .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }

                .login-divider {
                    display: flex; align-items: center; gap: 10px;
                    margin: 20px 0 16px; color: #adb5bd; font-size: 11px;
                }
                .login-divider::before, .login-divider::after {
                    content: ''; flex: 1; height: 1px; background: #e9ebec;
                }
                .login-remember { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
                .login-remember input { width: 15px; height: 15px; border-radius: 4px; accent-color: #405189; cursor: pointer; }
                .login-remember label { font-size: 12.5px; color: #6c757d; cursor: pointer; margin: 0; }
                .login-forgot { font-size: 12px; color: #405189; text-decoration: none; font-weight: 500; }
                .login-forgot:hover { text-decoration: underline; }
            `}</style>

            <ParticlesAuth>
                <div className="auth-page-content mt-lg-5">
                    <Container>
                        <Row>
                            <Col lg={12}>
                                <div className="text-center mt-sm-5 mb-4 text-white-50">
                                    <p className="mt-3 fs-15 fw-medium">ASR CSS Management System</p>
                                </div>
                            </Col>
                        </Row>

                        <Row className="justify-content-center">
                            <Col md={8} lg={6} xl={5}>
                                <div className="login-card">

                                    {/* Gradient header */}
                                    <div className="login-card-top">
                                        <div className="login-logo-ring">
                                            <img src={logoLight} alt="ASR CSS" height="28" />
                                        </div>
                                        <h4 className="login-title">Welcome Back</h4>
                                        <p className="login-sub">Sign in to ASR CSS Management System</p>
                                    </div>

                                    {/* Form body */}
                                    <div className="login-card-body">

                                        {error && (
                                            <Alert color="danger" className="d-flex align-items-center gap-2 mb-4 rounded-3" style={{ fontSize: 13 }}>
                                                <i className="ri-error-warning-line fs-16"></i>
                                                {error}
                                            </Alert>
                                        )}

                                        <Form onSubmit={(e) => { e.preventDefault(); validation.handleSubmit(); }}>

                                            {/* Port Number */}
                                            <div>
                                                <label className="login-label">Port Number</label>
                                                <div className="login-field">
                                                    <Input
                                                        name="port_number"
                                                        type="text"
                                                        placeholder="Enter port number"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.port_number}
                                                        invalid={validation.touched.port_number && !!validation.errors.port_number}
                                                        style={inputStyle(validation.touched.port_number, validation.errors.port_number)}
                                                    />
                                                    <i className="ri-building-line login-field-icon"></i>
                                                    {validation.touched.port_number && validation.errors.port_number && (
                                                        <FormFeedback>{validation.errors.port_number}</FormFeedback>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Email */}
                                            <div>
                                                <label className="login-label">Email Address</label>
                                                <div className="login-field">
                                                    <Input
                                                        name="email"
                                                        type="email"
                                                        placeholder="Enter email address"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.email}
                                                        invalid={validation.touched.email && !!validation.errors.email}
                                                        style={inputStyle(validation.touched.email, validation.errors.email)}
                                                    />
                                                    <i className="ri-mail-line login-field-icon"></i>
                                                    {validation.touched.email && validation.errors.email && (
                                                        <FormFeedback>{validation.errors.email}</FormFeedback>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Password */}
                                            <div>
                                                <div className="d-flex align-items-center justify-content-between mb-1">
                                                    <label className="login-label mb-0">Password</label>
                                                    <Link to="/forgot-password" className="login-forgot">Forgot password?</Link>
                                                </div>
                                                <div className="login-field">
                                                    <Input
                                                        name="password"
                                                        type={passwordShow ? "text" : "password"}
                                                        placeholder="Enter password"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.password}
                                                        invalid={validation.touched.password && !!validation.errors.password}
                                                        style={{ ...inputStyle(validation.touched.password, validation.errors.password), paddingRight: 44 }}
                                                    />
                                                    <i className="ri-lock-line login-field-icon"></i>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPasswordShow(!passwordShow)}
                                                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#878a99', fontSize: 16, padding: 0, lineHeight: 1 }}
                                                    >
                                                        <i className={`ri-${passwordShow ? 'eye-off' : 'eye'}-line`}></i>
                                                    </button>
                                                    {validation.touched.password && validation.errors.password && (
                                                        <FormFeedback>{validation.errors.password}</FormFeedback>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Remember me */}
                                            <div className="login-remember">
                                                <input type="checkbox" id="remember-check" />
                                                <label htmlFor="remember-check">Keep me signed in</label>
                                            </div>

                                            {/* Submit */}
                                            <button type="submit" className="login-btn" disabled={loading}>
                                                {loading
                                                    ? <><Spinner size="sm" /> Signing in…</>
                                                    : <><i className="ri-login-box-line"></i> Sign In</>
                                                }
                                            </button>

                                        </Form>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </div>
            </ParticlesAuth>
        </React.Fragment>
    );
};

export default withRouter(Login);
