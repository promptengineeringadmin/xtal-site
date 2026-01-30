export interface DemoRequestData {
  name: string
  email: string
  company: string
  pain?: string
  source?: string
  plan?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export function validateDemoRequest(data: unknown): ValidationResult {
  const errors: Record<string, string> = {}

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: { form: 'Invalid form data' } }
  }

  const formData = data as Record<string, unknown>

  // Name validation
  if (!formData.name || typeof formData.name !== 'string') {
    errors.name = 'Name is required'
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters'
  } else if (formData.name.trim().length > 100) {
    errors.name = 'Name must be less than 100 characters'
  }

  // Email validation
  if (!formData.email || typeof formData.email !== 'string') {
    errors.email = 'Email is required'
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address'
    }
  }

  // Company validation
  if (!formData.company || typeof formData.company !== 'string') {
    errors.company = 'Company is required'
  } else if (formData.company.trim().length < 2) {
    errors.company = 'Company must be at least 2 characters'
  } else if (formData.company.trim().length > 100) {
    errors.company = 'Company must be less than 100 characters'
  }

  // Pain (optional) validation
  if (formData.pain && typeof formData.pain === 'string') {
    if (formData.pain.trim().length > 2000) {
      errors.pain = 'Description must be less than 2000 characters'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '')
}
