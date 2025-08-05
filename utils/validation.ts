/**
 * Form validation utilities
 */

export interface ValidationRule {
  required?: boolean;
  email?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Validates a single field value against rules
 */
export const validateField = (
  value: string,
  rules: ValidationRule,
  fieldName: string = 'Field'
): string | null => {
  // Required validation
  if (rules.required && (!value || value.trim() === '')) {
    return `${fieldName} is required`;
  }

  // Skip other validations if field is empty and not required
  if (!value || value.trim() === '') {
    return null;
  }

  // Email validation
  if (rules.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Invalid email format';
    }
  }

  // Min length validation
  if (rules.minLength && value.length < rules.minLength) {
    return `${fieldName} must be at least ${rules.minLength} characters`;
  }

  // Max length validation
  if (rules.maxLength && value.length > rules.maxLength) {
    return `${fieldName} must be no more than ${rules.maxLength} characters`;
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(value)) {
    return `${fieldName} format is invalid`;
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
};

/**
 * Validates multiple fields at once
 */
export const validateForm = (
  values: { [key: string]: string },
  rules: { [key: string]: ValidationRule }
): ValidationErrors => {
  const errors: ValidationErrors = {};

  Object.keys(rules).forEach(fieldName => {
    const value = values[fieldName] || '';
    const fieldRules = rules[fieldName];
    const error = validateField(value, fieldRules, fieldName);
    
    if (error) {
      errors[fieldName] = error;
    }
  });

  return errors;
};

/**
 * Common validation rules
 */
export const ValidationRules = {
  email: {
    required: true,
    email: true,
  },
  password: {
    required: true,
    minLength: 6,
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
  },
  phone: {
    pattern: /^[+]?[\d\s\-()]+$/,
  },
} as const;

/**
 * Parse API validation errors into our format
 */
export const parseApiValidationErrors = (apiErrors: any): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!apiErrors) return errors;

  // Handle different API error formats
  if (typeof apiErrors === 'object') {
    Object.keys(apiErrors).forEach(field => {
      const fieldError = apiErrors[field];
      
      if (typeof fieldError === 'string') {
        errors[field] = fieldError;
      } else if (fieldError && typeof fieldError === 'object') {
        // Handle nested error objects like { type: 'validation', message: 'Invalid Email format' }
        if (fieldError.message) {
          errors[field] = fieldError.message;
        } else if (Array.isArray(fieldError) && fieldError.length > 0) {
          // Handle array of errors, take the first one
          errors[field] = typeof fieldError[0] === 'string' ? fieldError[0] : fieldError[0].message;
        }
      }
    });
  }

  return errors;
};
