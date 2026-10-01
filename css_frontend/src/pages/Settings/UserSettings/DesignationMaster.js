import React from 'react';
import { Row, Col, Label, Input, Button, FormFeedback } from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const DesignationMaster = () => {
  const formik = useFormik({
    initialValues: { old_password: '', password: '', confirm_password: '' },
    validationSchema: Yup.object({
      old_password:     Yup.string().required('Required'),
      password:         Yup.string().min(6, 'Min 6 characters').required('Required'),
      confirm_password: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Required'),
    }),
    onSubmit: (values) => {
      console.log(values); // replace with API call
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <Row className="g-3" style={{ maxWidth: 480 }}>
        <Col xs={12}>
          <Label>Current Password</Label>
          <Input type="password" name="old_password"
            value={formik.values.old_password} onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            invalid={formik.touched.old_password && !!formik.errors.old_password} />
          <FormFeedback>{formik.errors.old_password}</FormFeedback>
        </Col>
        <Col xs={12}>
          <Label>New Password</Label>
          <Input type="password" name="password"
            value={formik.values.password} onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            invalid={formik.touched.password && !!formik.errors.password} />
          <FormFeedback>{formik.errors.password}</FormFeedback>
        </Col>
        <Col xs={12}>
          <Label>Confirm New Password</Label>
          <Input type="password" name="confirm_password"
            value={formik.values.confirm_password} onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            invalid={formik.touched.confirm_password && !!formik.errors.confirm_password} />
          <FormFeedback>{formik.errors.confirm_password}</FormFeedback>
        </Col>
        <Col xs={12} className="mt-2">
          <Button type="submit" color="primary">Update Password</Button>
        </Col>
      </Row>
    </form>
  );
};

export default DesignationMaster;