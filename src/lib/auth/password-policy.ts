export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters long';
  return null;
}

export function validatePasswordPair(password: string, confirmPassword: string): string | null {
  const err = validatePassword(password);
  if (err) return err;
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
}
