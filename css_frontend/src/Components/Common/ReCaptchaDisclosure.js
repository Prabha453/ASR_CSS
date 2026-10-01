import React from 'react';

/**
 * ReCaptchaDisclosure
 *
 * Renders the mandatory Google reCAPTCHA v3 disclosure text required by
 * Google's Terms of Service when the reCAPTCHA badge is hidden.
 *
 * Usage:
 *   <ReCaptchaDisclosure />
 *   <ReCaptchaDisclosure className="mt-3" style={{ fontSize: 10 }} />
 */
const ReCaptchaDisclosure = ({ className = '', style = {} }) => (
  <p
    className={`text-muted mb-0 ${className}`}
    style={{ fontSize: '11px', lineHeight: 1.5, ...style }}
  >
    This site is protected by reCAPTCHA and the Google{' '}
    <a
      href="https://policies.google.com/privacy"
      target="_blank"
      rel="noopener noreferrer"
    >
      Privacy Policy
    </a>{' '}
    and{' '}
    <a
      href="https://policies.google.com/terms"
      target="_blank"
      rel="noopener noreferrer"
    >
      Terms of Service
    </a>{' '}
    apply.
  </p>
);

export default ReCaptchaDisclosure;