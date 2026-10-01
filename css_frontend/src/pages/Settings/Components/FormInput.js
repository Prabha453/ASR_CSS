import React from 'react';
import { Row, Col, Label, Input, FormFeedback, FormGroup } from 'reactstrap';
import DatePickerInput from '../../../Components/Common/DatePickerInput';

const FormInput = ({ config, formik }) => {
  const renderInput = (field) => {
    const {
      name,
      label,
      type = 'text',
      required = false,
      options = [],
      placeholder = '',
      rows = 2,
      readOnly = false,
      disabled = false,
      helpText = '',
      col = { md: 6 },
      min,
      max,
      step,
      accept, // for file inputs
      multiple = false, // for file/select inputs
      autoComplete = 'off',
      maxLength,
      pattern,
      size, // for file size validation display
    } = field;

    const hasError = formik.touched[name] && !!formik.errors[name];

    const commonProps = {
      name,
      bsSize: 'sm', // Add small size globally
      onBlur: formik.handleBlur,
      invalid: hasError,
      readOnly,
      disabled,
      placeholder,
      autoComplete,
      maxLength,
      pattern,
    };

    const renderField = () => {
      switch (type) {
        // TEXT INPUT
        case 'text':
        case 'password':
        case 'email':
        case 'url':
        case 'tel':
          return (
            <Input
              type={type}
              {...commonProps}
              value={formik.values[name] || ''}
              onChange={formik.handleChange}
            />
          );

        // NUMBER INPUT
        case 'number':
          return (
            <Input
              type="number"
              {...commonProps}
              value={formik.values[name] ?? ''}
              onChange={formik.handleChange}
              min={min}
              max={max}
              step={step}
            />
          );

        // DATE INPUT
        case 'date':
          return (
            <DatePickerInput
              {...commonProps}
              value={formik.values[name] || ''}
              onChange={formik.handleChange}
              options={{
                minDate: min || undefined,
                maxDate: max || undefined,
              }}
            />
          );

        // TIME, DATETIME INPUT
        case 'time':
        case 'datetime-local':
        case 'month':
        case 'week':
          return (
            <Input
              type={type}
              {...commonProps}
              value={formik.values[name] || ''}
              onChange={formik.handleChange}
              min={min}
              max={max}
            />
          );

        // TEXTAREA
        case 'textarea':
          return (
            <Input
              type="textarea"
              rows={rows}
              {...commonProps}
              value={formik.values[name] || ''}
              onChange={formik.handleChange}
            />
          );

        // SELECT DROPDOWN
        case 'select':
          return (
            <Input
              type="select"
              {...commonProps}
              value={formik.values[name] || ''}
              onChange={formik.handleChange}
              multiple={multiple}
            >
              {placeholder && <option value="">{placeholder}</option>}
              {options.map((option, index) => (
                <option
                  key={index}
                  value={typeof option === 'object' ? option.value : option}
                  disabled={typeof option === 'object' ? option.disabled : false}
                >
                  {typeof option === 'object' ? option.label : option}
                </option>
              ))}
            </Input>
          );

        // FILE INPUT
        case 'file':
          return (
            <>
              <Input
                type="file"
                bsSize="sm"
                name={name}
                onChange={(event) => {
                  if (multiple) {
                    formik.setFieldValue(name, event.currentTarget.files);
                  } else {
                    formik.setFieldValue(name, event.currentTarget.files[0]);
                  }
                }}
                onBlur={formik.handleBlur}
                invalid={hasError}
                disabled={disabled}
                accept={accept}
                multiple={multiple}
              />
              {formik.values[name] && (
                <small className="text-muted d-block mt-1">
                  Selected: {
                    multiple 
                      ? `${formik.values[name].length} file(s)` 
                      : formik.values[name].name
                  }
                </small>
              )}
            </>
          );

        // CHECKBOX (Single)
        case 'checkbox':
          return (
            <div className="form-check">
              <Input
                type="checkbox"
                id={name}
                name={name}
                checked={formik.values[name] || false}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="form-check-input"
                disabled={disabled}
              />
              <Label className="form-check-label fs-12" htmlFor={name}>
                {label}
              </Label>
            </div>
          );

        // CHECKBOX GROUP (Multiple)
        case 'checkbox-group':
          return (
            <div>
              {options.map((option, index) => {
                const optionValue = typeof option === 'object' ? option.value : option;
                const optionLabel = typeof option === 'object' ? option.label : option;
                const isChecked = (formik.values[name] || []).includes(optionValue);

                return (
                  <div key={index} className="form-check">
                    <Input
                      type="checkbox"
                      id={`${name}_${index}`}
                      name={name}
                      value={optionValue}
                      checked={isChecked}
                      onChange={(e) => {
                        const currentValues = formik.values[name] || [];
                        if (e.target.checked) {
                          formik.setFieldValue(name, [...currentValues, optionValue]);
                        } else {
                          formik.setFieldValue(
                            name,
                            currentValues.filter((v) => v !== optionValue)
                          );
                        }
                      }}
                      onBlur={formik.handleBlur}
                      className="form-check-input"
                      disabled={disabled}
                    />
                    <Label className="form-check-label fs-12" htmlFor={`${name}_${index}`}>
                      {optionLabel}
                    </Label>
                  </div>
                );
              })}
            </div>
          );

        // RADIO BUTTONS
        case 'radio':
          return (
            <div>
              {options.map((option, index) => {
                const optionValue = typeof option === 'object' ? option.value : option;
                const optionLabel = typeof option === 'object' ? option.label : option;

                return (
                  <div key={index} className="form-check">
                    <Input
                      type="radio"
                      name={name}
                      id={`${name}_${index}`}
                      value={optionValue}
                      checked={formik.values[name] === optionValue}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="form-check-input"
                      disabled={disabled}
                    />
                    <Label className="form-check-label fs-12" htmlFor={`${name}_${index}`}>
                      {optionLabel}
                    </Label>
                  </div>
                );
              })}
            </div>
          );

        // SWITCH / TOGGLE
        case 'switch':
          return (
            <div className="form-check form-switch">
              <Input
                type="checkbox"
                role="switch"
                id={name}
                name={name}
                checked={formik.values[name] || false}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="form-check-input"
                disabled={disabled}
              />
              <Label className="form-check-label fs-12" htmlFor={name}>
                {label}
              </Label>
            </div>
          );

        // RANGE SLIDER
        case 'range':
          return (
            <div>
              <Input
                type="range"
                {...commonProps}
                value={formik.values[name] || 0}
                onChange={formik.handleChange}
                min={min || 0}
                max={max || 100}
                step={step || 1}
              />
              <small className="text-muted">Value: {formik.values[name] || 0}</small>
            </div>
          );

        // COLOR PICKER
        case 'color':
          return (
            <Input
              type="color"
              {...commonProps}
              style={{
                height: '31px', // Adjusted for small size
                padding: '2px',
              }}
              value={formik.values[name] || '#000000'}
              onChange={formik.handleChange}
            />
          );

        // HIDDEN INPUT
        case 'hidden':
          return (
            <Input
              type="hidden"
              name={name}
              value={formik.values[name] || ''}
            />
          );

        default:
          return (
            <Input
              type="text"
              {...commonProps}
              value={formik.values[name] || ''}
              onChange={formik.handleChange}
            />
          );
      }
    };

    // For checkbox and switch, we don't need the standard FormGroup wrapper
    if (type === 'checkbox' || type === 'switch') {
      return (
        <Col {...col} key={name}>
          {renderField()}
          {hasError && <FormFeedback className="d-block">{formik.errors[name]}</FormFeedback>}
          {helpText && <small className="text-muted d-block mt-1">{helpText}</small>}
        </Col>
      );
    }

    // For hidden inputs, don't show any wrapper
    if (type === 'hidden') {
      return <React.Fragment key={name}>{renderField()}</React.Fragment>;
    }

    // Standard FormGroup for all other inputs
    return (
      <Col {...col} key={name}>
        <Label className="form-label fs-12">
          {label} {required && <span className="text-danger">*</span>}
        </Label>
        {renderField()}
        {hasError && <FormFeedback className="d-block">{formik.errors[name]}</FormFeedback>}
        {helpText && <small className="text-muted d-block mt-1">{helpText}</small>}
      </Col>
    );
  };

  return (
    <>
      {config.map((field) => renderInput(field))}
    </>
  );
};

export default FormInput;
