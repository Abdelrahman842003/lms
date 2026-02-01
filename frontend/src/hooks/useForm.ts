/**
 * Form and Validation Hooks
 * 
 * Custom hooks for form handling, validation, and input management
 * with enhanced user experience features.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { sanitizeInput, sanitizePhone, validateEmail } from '@/lib/security';

export interface ValidationRule<T = any> {
  required?: boolean | string;
  min?: number | string;
  max?: number | string;
  pattern?: RegExp | string;
  custom?: (value: T) => string | null;
  email?: boolean | string;
  phone?: boolean | string;
}

export interface FormField<T = any> {
  value: T;
  error: string | null;
  touched: boolean;
  dirty: boolean;
}

export interface UseFormOptions<T extends Record<string, any>> {
  initialValues: T;
  validationRules?: Partial<Record<keyof T, ValidationRule>>;
  onSubmit?: (values: T) => Promise<void> | void;
  sanitize?: boolean;
}

export function useForm<T extends Record<string, any>>(options: UseFormOptions<T>) {
  const { initialValues, validationRules = {}, onSubmit, sanitize = true } = options;
  
  // Form state
  const [fields, setFields] = useState<Record<keyof T, FormField>>(() => {
    const initialFields = {} as Record<keyof T, FormField>;
    Object.keys(initialValues).forEach(key => {
      initialFields[key as keyof T] = {
        value: initialValues[key],
        error: null,
        touched: false,
        dirty: false,
      };
    });
    return initialFields;
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  
  // Validation function
  const validateField = useCallback((name: keyof T, value: any): string | null => {
    const rules = validationRules[name] as ValidationRule | undefined;
    if (!rules) return null;
    
    // Required validation
    if (rules.required) {
      const isEmpty = value === '' || value === null || value === undefined || 
                     (Array.isArray(value) && value.length === 0);
      if (isEmpty) {
        return typeof rules.required === 'string' ? rules.required : 'هذا الحقل مطلوب';
      }
    }
    
    // Skip other validations if field is empty and not required
    if (!value && !rules.required) return null;
    
    // Length validations
    if (rules.min && String(value).length < Number(rules.min)) {
      return typeof rules.min === 'string' ? rules.min : `الحد الأدنى ${rules.min} أحرف`;
    }
    
    if (rules.max && String(value).length > Number(rules.max)) {
      return typeof rules.max === 'string' ? rules.max : `الحد الأقصى ${rules.max} أحرف`;
    }
    
    // Pattern validation
    if (rules.pattern) {
      const regex = typeof rules.pattern === 'string' ? new RegExp(rules.pattern) : rules.pattern;
      if (!regex.test(String(value))) {
        return 'التنسيق غير صحيح';
      }
    }
    
    // Email validation
    if (rules.email && !validateEmail(String(value))) {
      return typeof rules.email === 'string' ? rules.email : 'البريد الإلكتروني غير صحيح';
    }
    
    // Phone validation (Egyptian)
    if (rules.phone) {
      const cleanPhone = sanitizePhone(String(value));
      if (!cleanPhone) {
        return typeof rules.phone === 'string' ? rules.phone : 'رقم الهاتف غير صحيح';
      }
    }
    
    // Custom validation
    if (rules.custom) {
      return rules.custom(value);
    }
    
    return null;
  }, [validationRules]);
  
  // Set field value
  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        value: sanitize ? sanitizeInput(String(value)) : value,
        dirty: true,
        error: validateField(name, value),
      },
    }));
  }, [validateField, sanitize]);
  
  // Set field error
  const setFieldError = useCallback((name: keyof T, error: string | null) => {
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        error,
      },
    }));
  }, []);
  
  // Mark field as touched
  const setFieldTouched = useCallback((name: keyof T, touched = true) => {
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        touched,
      },
    }));
  }, []);
  
  // Get current values
  const values = useMemo(() => {
    const currentValues = {} as T;
    Object.keys(fields).forEach(key => {
      currentValues[key as keyof T] = fields[key as keyof T].value;
    });
    return currentValues;
  }, [fields]);
  
  // Get form errors
  const errors = useMemo(() => {
    const currentErrors = {} as Partial<Record<keyof T, string>>;
    Object.keys(fields).forEach(key => {
      const field = fields[key as keyof T];
      if (field.error && field.touched) {
        currentErrors[key as keyof T] = field.error;
      }
    });
    return currentErrors;
  }, [fields]);
  
  // Check if form is valid
  const isValid = useMemo(() => {
    return Object.values(fields).every(field => !field.error);
  }, [fields]);
  
  // Check if form has any touched fields
  const isTouched = useMemo(() => {
    return Object.values(fields).some(field => field.touched);
  }, [fields]);
  
  // Check if form has any dirty fields
  const isDirty = useMemo(() => {
    return Object.values(fields).some(field => field.dirty);
  }, [fields]);
  
  // Validate all fields
  const validateForm = useCallback(() => {
    let hasErrors = false;
    const newFields = { ...fields };
    
    Object.keys(newFields).forEach(key => {
      const field = newFields[key as keyof T];
      const error = validateField(key as keyof T, field.value);
      newFields[key as keyof T] = {
        ...field,
        error,
        touched: true,
      };
      
      if (error) hasErrors = true;
    });
    
    setFields(newFields);
    return !hasErrors;
  }, [fields, validateField]);
  
  // Reset form
  const resetForm = useCallback(() => {
    setFields(() => {
      const resetFields = {} as Record<keyof T, FormField>;
      Object.keys(initialValues).forEach(key => {
        resetFields[key as keyof T] = {
          value: initialValues[key],
          error: null,
          touched: false,
          dirty: false,
        };
      });
      return resetFields;
    });
    setIsSubmitting(false);
    setSubmitCount(0);
  }, [initialValues]);
  
  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    setSubmitCount(prev => prev + 1);
    
    if (!validateForm() || !onSubmit) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, onSubmit, values]);
  
  // Get field props for easy integration
  const getFieldProps = useCallback((name: keyof T) => {
    const field = fields[name];
    return {
      name: String(name),
      value: field.value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFieldValue(name, e.target.value);
      },
      onBlur: () => setFieldTouched(name),
      error: field.touched ? field.error : null,
      'aria-invalid': field.touched && !!field.error,
    };
  }, [fields, setFieldValue, setFieldTouched]);
  
  return {
    // Values and state
    values,
    errors,
    fields,
    isValid,
    isTouched,
    isDirty,
    isSubmitting,
    submitCount,
    
    // Actions
    setFieldValue,
    setFieldError,
    setFieldTouched,
    validateForm,
    resetForm,
    handleSubmit,
    getFieldProps,
  };
}

// Debounced input hook
export function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// Auto-save hook
export function useAutoSave<T>(
  data: T,
  saveFunction: (data: T) => Promise<void>,
  delay = 2000
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const debouncedData = useDebouncedValue(data, delay);
  
  const save = useCallback(async () => {
    setIsSaving(true);
    try {
      await saveFunction(debouncedData);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [debouncedData, saveFunction]);
  
  useEffect(() => {
    if (debouncedData && lastSaved) {
      save();
    }
  }, [debouncedData, save, lastSaved]);
  
  const forceSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    save();
  }, [save]);
  
  return {
    isSaving,
    lastSaved,
    forceSave,
  };
}

export default {
  useForm,
  useDebouncedValue,
  useAutoSave,
};