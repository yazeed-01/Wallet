// Form Validation Utilities

// Email validation
export function validateEmail(email: string): string | null {
  if (!email) {
    return 'Email is required';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }

  return null;
}

// Password validation
export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }

  return null;
}

// Name validation
export function validateName(name: string): string | null {
  if (!name) {
    return 'Name is required';
  }

  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters';
  }

  return null;
}

// Amount validation
export function validateAmount(amount: string): string | null {
  if (!amount) {
    return 'Amount is required';
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) {
    return 'Please enter a valid amount';
  }

  if (numAmount <= 0) {
    return 'Amount must be greater than 0';
  }

  return null;
}

// Generic required field validation
export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`;
  }
  return null;
}
