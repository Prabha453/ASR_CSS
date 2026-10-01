/**
 * ID Validation Utilities
 * Complete validation matching PHP backend
 */

// ============================================================
// 1. NRIC (Singapore) Validation
// ============================================================
export const validateNRIC = (nric) => {
  if (!nric || nric === '') {
    return { valid: false, message: 'NRIC is required' };
  }

  // Remove whitespace and convert to uppercase
  const clean = nric.trim().toUpperCase();

  if (clean.length !== 9) {
    return { valid: false, message: 'NRIC must be exactly 9 characters' };
  }

  const first = clean[0];
  const last = clean[clean.length - 1];

  // Must start with S or T
  if (first !== 'S' && first !== 'T') {
    return { valid: false, message: 'NRIC must start with S or T' };
  }

  // Extract numeric part
  const numericNric = clean.substring(1, clean.length - 1);
  if (!/^\d{7}$/.test(numericNric)) {
    return { valid: false, message: 'NRIC must have 7 digits after the prefix' };
  }

  // Calculate checksum
  const multiples = [2, 7, 6, 5, 4, 3, 2];
  let total = 0;
  let numeric = parseInt(numericNric, 10);

  for (let i = 6; i >= 0; i--) {
    total += (numeric % 10) * multiples[i];
    numeric = Math.floor(numeric / 10);
  }

  const outputs = first === 'S'
    ? ['J', 'Z', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A']
    : ['G', 'F', 'E', 'D', 'C', 'B', 'A', 'J', 'Z', 'I', 'H'];

  const isValid = last === outputs[total % 11];

  return {
    valid: isValid,
    message: isValid ? '' : 'Invalid NRIC checksum. Please check the number.',
  };
};

// ============================================================
// 2. FIN (Singapore) Validation
// ============================================================
export const validateFIN = (fin) => {
  if (!fin || fin === '') {
    return { valid: false, message: 'FIN is required' };
  }

  const clean = fin.trim().toUpperCase();

  if (clean.length !== 9) {
    return { valid: false, message: 'FIN must be exactly 9 characters' };
  }

  const first = clean[0];
  const last = clean[clean.length - 1];

  // Must start with F, G, or M
  if (first !== 'F' && first !== 'G' && first !== 'M') {
    return { valid: false, message: 'FIN must start with F, G, or M' };
  }

  // Extract numeric part
  const numericFin = clean.substring(1, clean.length - 1);
  if (!/^\d{7}$/.test(numericFin)) {
    return { valid: false, message: 'FIN must have 7 digits after the prefix' };
  }

  // Calculate checksum
  const multiples = [2, 7, 6, 5, 4, 3, 2];
  let total = 0;
  let numeric = parseInt(numericFin, 10);

  for (let i = 6; i >= 0; i--) {
    total += (numeric % 10) * multiples[i];
    numeric = Math.floor(numeric / 10);
  }

  let outputs = [];
  if (first === 'F') {
    outputs = ['X', 'W', 'U', 'T', 'R', 'Q', 'P', 'N', 'M', 'L', 'K'];
  } else if (first === 'G') {
    outputs = ['R', 'Q', 'P', 'N', 'M', 'L', 'K', 'X', 'W', 'U', 'T'];
  } else if (first === 'M') {
    outputs = ['T', 'R', 'Q', 'P', 'N', 'J', 'L', 'K', 'X', 'W', 'U'];
  }

  const isValid = last === outputs[total % 11];

  return {
    valid: isValid,
    message: isValid ? '' : 'Invalid FIN checksum. Please check the number.',
  };
};

// ============================================================
// 3. MyKad (Malaysia) Validation
// ============================================================
export const validateMyKad = (mykad) => {
  if (!mykad || mykad === '') {
    return { valid: false, message: 'MyKad is required' };
  }

  const clean = mykad.trim();

  // Check for alphabets (no letters allowed)
  if (/[a-zA-Z]/.test(clean)) {
    return { valid: false, message: 'No alphabets allowed in MyKad' };
  }

  // Check if partially filled (only YYMMDD-)
  if (/^\d{6}-$/.test(clean)) {
    return { valid: false, message: 'Please fill entire MyKad number' };
  }

  // Remove any non-numeric characters for validation
  const numericOnly = clean.replace(/[^0-9]/g, '');
  
  // Check if we have exactly 12 digits after removing dashes
  if (numericOnly.length !== 12) {
    return { 
      valid: false, 
      message: 'MyKad must have exactly 12 digits (Format: YYMMDD-PB-###G)' 
    };
  }

  // Check format: YYMMDD-PB-###G (with dashes in correct positions)
  const regex = /^\d{6}-\d{2}-\d{4}$/;
  const isValid = regex.test(clean);

  return {
    valid: isValid,
    message: isValid ? '' : 'Invalid MyKad Format! Expected: YYMMDD-PB-###G',
  };
};

// ============================================================
// 4. Aadhar (India) Validation
// ============================================================
export const validateAadhar = (aadhar) => {
  if (!aadhar || aadhar === '') {
    return { valid: false, message: 'Aadhar number is required' };
  }

  const clean = aadhar.trim();

  // Check for alphabets
  if (/[a-zA-Z]/.test(clean)) {
    return { valid: false, message: 'No alphabets allowed in Aadhar Number' };
  }

  // Check format: exactly 12 digits
  const regex = /^\d{12}$/;
  const isValid = regex.test(clean);

  return {
    valid: isValid,
    message: isValid ? '' : 'Invalid Aadhar Number! Must be exactly 12 numeric digits',
  };
};

// ============================================================
// 5. PAN (India) Validation
// ============================================================
export const validatePAN = (pan) => {
  if (!pan || pan === '') {
    return { valid: false, message: 'PAN is required' };
  }

  // Convert to uppercase for validation
  const clean = pan.trim().toUpperCase();

  // Check format: 5 letters, 4 digits, 1 letter
  const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const isValid = regex.test(clean);

  if (!isValid) {
    return { 
      valid: false, 
      message: 'Invalid PAN Format! Expected: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)' 
    };
  }

  // Additional check: 5th character indicates PAN type
  const panType = clean.charAt(4);
  const validTypes = ['A', 'B', 'C', 'F', 'G', 'H', 'J', 'L', 'P', 'T'];
  if (!validTypes.includes(panType)) {
    return { 
      valid: false, 
      message: 'Invalid PAN type code. 5th character must be A, B, C, F, G, H, J, L, P, or T' 
    };
  }

  return { valid: true, message: '' };
};

// ============================================================
// 6. Master Validator - Routes to appropriate validation
// ============================================================
export const validateIDBySlug = (slug, value) => {
  if (!value || value.trim() === '') {
    return { valid: false, message: 'ID number is required' };
  }

  const trimmed = value.trim();

  // Map slugs to validation functions
  const validators = {
    'nric': validateNRIC,
    'nric-singapore-citizen': validateNRIC,
    'nric-permanent-resident': validateNRIC,
    'fin': validateFIN,
    'mykad': validateMyKad,
    'aadhar': validateAadhar,
    'aadhar-card': validateAadhar,
    'pan': validatePAN,
  };

  const validator = validators[slug];
  if (validator) {
    return validator(trimmed);
  }

  // For other ID types, just check if not empty
  return { valid: true, message: '' };
};

// ============================================================
// 7. Get Format Hint for UI
// ============================================================
export const getFormatHint = (slug) => {
  const hints = {
    'nric': 'S/T + 7 digits + 1 letter',
    'nric-singapore-citizen': 'S + 7 digits + 1 letter',
    'nric-permanent-resident': 'S/T + 7 digits + 1 letter',
    'fin': 'F/G/M + 7 digits + 1 letter',
    'mykad': 'YYMMDD-PB-###G',
    'aadhar': '12 numeric digits only',
    'aadhar-card': '12 numeric digits only',
    'pan': '5 letters + 4 digits + 1 letter',
  };
  return hints[slug] || '';
};

// ============================================================
// 8. Get Example for UI
// ============================================================
export const getExample = (slug) => {
  const examples = {
    'nric': 'S1234567A',
    'nric-singapore-citizen': 'S1234567A',
    'nric-permanent-resident': 'S1234567A',
    'fin': 'F1234567A',
    'mykad': '900101-01-1234',
    'aadhar': '123456789012',
    'aadhar-card': '123456789012',
    'pan': 'ABCDE1234F',
  };
  return examples[slug] || '';
};

// ============================================================
// 9. Format ID Number (auto-format for MyKad)
// ============================================================
export const formatIDNumber = (slug, value) => {
  if (slug === 'mykad' && value) {
    // Remove all non-numeric characters
    const clean = value.replace(/[^0-9]/g, '');
    
    // Auto-format: YYMMDD-PB-###G
    if (clean.length <= 6) {
      return clean;
    } else if (clean.length <= 8) {
      return `${clean.substring(0, 6)}-${clean.substring(6)}`;
    } else {
      return `${clean.substring(0, 6)}-${clean.substring(6, 8)}-${clean.substring(8, 12)}`;
    }
  }
  
  // For PAN, convert to uppercase
  if (slug === 'pan' && value) {
    return value.toUpperCase();
  }
  
  return value;
};

// ============================================================
// 10. Check if ID type has format validation
// ============================================================
export const hasFormatValidation = (slug) => {
  const validatedSlugs = [
    'nric', 'nric-singapore-citizen', 'nric-permanent-resident',
    'fin', 'mykad', 'aadhar', 'aadhar-card', 'pan'
  ];
  return validatedSlugs.includes(slug);
};

// ============================================================
// 11. Get Validation Function for a slug
// ============================================================
export const getValidationFunction = (slug) => {
  const validators = {
    'nric': validateNRIC,
    'nric-singapore-citizen': validateNRIC,
    'nric-permanent-resident': validateNRIC,
    'fin': validateFIN,
    'mykad': validateMyKad,
    'aadhar': validateAadhar,
    'aadhar-card': validateAadhar,
    'pan': validatePAN,
  };
  return validators[slug] || null;
};

// ============================================================
// 12. Check if ID type should hide expiry date
// ============================================================
export const shouldHideExpiry = (slug) => {
  const hideExpirySlugs = ['nric', 'nric-singapore-citizen', 'nric-permanent-resident', 'fin'];
  return hideExpirySlugs.includes(slug);
};