
import React, { useEffect, useRef, useState } from 'react';
import Flatpickr from 'react-flatpickr';

const parseInputDate = (input) => {
  if (input instanceof Date) return input;

  const value = String(input || '').trim();
  const dmy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const ymd = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const parts = dmy
    ? { year: Number(dmy[3]), month: Number(dmy[2]), day: Number(dmy[1]) }
    : ymd
      ? { year: Number(ymd[1]), month: Number(ymd[2]), day: Number(ymd[3]) }
      : null;

  if (!parts) return undefined;

  const parsed = new Date(parts.year, parts.month - 1, parts.day);
  const isValid = parsed.getFullYear() === parts.year
    && parsed.getMonth() === parts.month - 1
    && parsed.getDate() === parts.day;

  return isValid ? parsed : undefined;
};

const toStorageDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDisplayDate = (value) => {
  const parsed = parseInputDate(value);
  if (!parsed) return value || '';
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${parsed.getFullYear()}`;
};

const maskDmyInput = (input) => {
  const digits = String(input || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const DatePickerInput = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  bsSize = 'sm',
  placeholder = 'Select date',
  disabled = false,
  readOnly = false,
  invalid = false,
  className = '',
  strictDmyInput = false,
  options = {},
  ...props
}) => {
  const pickerRef = useRef(null);
  const nativeDateRef = useRef(null);
  const strictInputFocused = useRef(false);
  const [strictDraft, setStrictDraft] = useState(() => toDisplayDate(value));
  const controlSizeClass = bsSize === 'sm' ? 'form-control-sm' : bsSize === 'lg' ? 'form-control-lg' : '';

  useEffect(() => {
    if (strictDmyInput && !strictInputFocused.current) {
      setStrictDraft(toDisplayDate(value));
    }
  }, [strictDmyInput, value]);

  const handleChange = (selectedDates, dateStr) => {
    if (strictDmyInput) return;

    if (typeof onChange === 'function') {
      onChange({
        target: {
          id: id || name,
          name,
          value: dateStr || '',
        },
      });
    }
  };

  const handleClose = (selectedDates, dateStr, instance) => {
    if (strictDmyInput) {
      strictInputFocused.current = false;
      const typedValue = instance?.input?.value || dateStr || '';
      const parsed = parseInputDate(typedValue) || selectedDates?.[0];

      if (parsed) {
        const storedValue = toStorageDate(parsed);
        setStrictDraft(toDisplayDate(storedValue));
        onChange?.({
          target: { id: id || name, name, value: storedValue },
        });
      } else if (!typedValue.trim()) {
        setStrictDraft('');
        onChange?.({
          target: { id: id || name, name, value: '' },
        });
      }
    }

    if (typeof onBlur === 'function') {
      onBlur({
        target: {
          id: id || name,
          name,
        },
      });
    }
  };

  const handleClear = (event) => {
    event?.stopPropagation?.();
    if (disabled || readOnly) return;
    pickerRef.current?.flatpickr?.clear();
    if (strictDmyInput) {
      setStrictDraft('');
      onChange?.({ target: { id: id || name, name, value: '' } });
    } else {
      handleChange([], '');
    }
    if (typeof onBlur === 'function') {
      onBlur({
        target: {
          id: id || name,
          name,
        },
      });
    }
  };

  const openPicker = (event) => {
    if (disabled || readOnly || event?.target?.closest?.('.asr-date-picker-clear')) return;
    pickerRef.current?.flatpickr?.open();
  };

  const emitStrictValue = (storedValue) => {
    onChange?.({
      target: { id: id || name, name, value: storedValue },
    });
  };

  const handleStrictTextBlur = (event) => {
    strictInputFocused.current = false;
    const typedValue = event.target.value.trim();
    const parsed = parseInputDate(typedValue);

    if (parsed) {
      const storedValue = toStorageDate(parsed);
      setStrictDraft(toDisplayDate(storedValue));
      emitStrictValue(storedValue);
    } else if (!typedValue) {
      setStrictDraft('');
      emitStrictValue('');
    }

    onBlur?.({ target: { id: id || name, name } });
  };

  const openNativePicker = () => {
    if (disabled || readOnly) return;
    if (typeof nativeDateRef.current?.showPicker === 'function') {
      nativeDateRef.current.showPicker();
    } else {
      nativeDateRef.current?.click();
    }
  };

  if (strictDmyInput) {
    const nativeValue = toStorageDate(parseInputDate(value));

    return (
      <div className={['asr-date-picker-wrap', strictDraft ? 'has-value' : ''].filter(Boolean).join(' ')}>
        <button
          type="button"
          className="asr-date-picker-icon"
          onClick={openNativePicker}
          disabled={disabled || readOnly}
          aria-label="Open calendar"
          style={{ border: 0, background: 'transparent', padding: 0, pointerEvents: 'auto', cursor: 'pointer' }}
        >
          <i className="ri-calendar-2-line" aria-hidden="true" />
        </button>
        <input
          id={id || name}
          name={name}
          type="text"
          inputMode="numeric"
          maxLength={10}
          value={strictDraft}
          disabled={disabled}
          readOnly={readOnly}
          onFocus={() => { strictInputFocused.current = true; }}
          onChange={(event) => setStrictDraft(maskDmyInput(event.target.value))}
          onBlur={handleStrictTextBlur}
          placeholder={placeholder === 'Select date' ? 'DD/MM/YYYY' : placeholder}
          className={[
            'form-control',
            controlSizeClass,
            'asr-date-picker-input',
            invalid ? 'is-invalid' : '',
            className,
          ].filter(Boolean).join(' ')}
          {...props}
          style={{ ...(props.style || {}), cursor: 'text' }}
        />
        <input
          ref={nativeDateRef}
          type="date"
          value={nativeValue}
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            const storedValue = event.target.value || '';
            setStrictDraft(toDisplayDate(storedValue));
            emitStrictValue(storedValue);
          }}
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
        />
        {strictDraft && !disabled && !readOnly && (
          <button
            type="button"
            className="asr-date-picker-clear"
            onClick={() => {
              setStrictDraft('');
              emitStrictValue('');
            }}
            aria-label="Clear date"
            title="Clear date"
          >
            <i className="ri-close-line" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={['asr-date-picker-wrap', value ? 'has-value' : ''].filter(Boolean).join(' ')} onClick={openPicker}>
      <i className="ri-calendar-2-line asr-date-picker-icon" aria-hidden="true" />
      <Flatpickr
        ref={pickerRef}
        id={id || name}
        name={name}
        value={strictDmyInput ? strictDraft : (value || '')}
        disabled={disabled || readOnly}
        onChange={handleChange}
        onFocus={(event) => {
          if (strictDmyInput) strictInputFocused.current = true;
          openPicker(event);
        }}
        onClose={handleClose}
        options={{
          dateFormat: strictDmyInput ? 'd/m/Y' : 'Y-m-d',
          altInput: !strictDmyInput,
          altFormat: 'd/m/Y',
          allowInput: true,
          parseDate: parseInputDate,
          clickOpens: true,
          disableMobile: true,
          altInputClass: [
            'form-control',
            controlSizeClass,
            'asr-date-picker-input',
            invalid ? 'is-invalid' : '',
            className,
          ].filter(Boolean).join(' '),
          ...options,
        }}
        className={[
          'form-control',
          controlSizeClass,
          'asr-date-picker-input',
          invalid ? 'is-invalid' : '',
          className,
        ].filter(Boolean).join(' ')}
        placeholder={placeholder}
        {...props}
      />
      {value && !disabled && !readOnly && (
        <button
          type="button"
          className="asr-date-picker-clear"
          onClick={handleClear}
          aria-label="Clear date"
          title="Clear date"
        >
          <i className="ri-close-line" />
        </button>
      )}
    </div>
  );
};

export default DatePickerInput;
