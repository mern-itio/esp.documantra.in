/** Keep in sync with Backend/packages/validators PASSWORD pattern. */
export const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character'

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,128}$/

export function getPasswordPolicyError(password: string): string | null {
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters long'
  if (password.length > 128) return 'Password must be at most 128 characters'
  if (/\s/.test(password)) return 'Password cannot contain spaces'
  if (!PASSWORD_PATTERN.test(password)) return PASSWORD_POLICY_MESSAGE
  return null
}

export function getPasswordChecks(password: string) {
  return {
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z\d\s]/.test(password),
    length: password.length >= 8,
  }
}
