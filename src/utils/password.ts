// Reglas de contraseña segura: las mismas que valida el backend (Bart-backend/src/libs/password.js).
// Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo.

const RULES: { test: (p: string) => boolean; message: string }[] = [
  { test: p => p.length >= 8, message: 'mínimo 8 caracteres' },
  { test: p => /[A-Z]/.test(p), message: 'una mayúscula' },
  { test: p => /[a-z]/.test(p), message: 'una minúscula' },
  { test: p => /[0-9]/.test(p), message: 'un número' },
  { test: p => /[!@#$%^&*]/.test(p), message: 'un símbolo (!@#$%^&*)' },
];

/** Lo que le falta a la contraseña ([] = es segura). */
export const passwordIssues = (password: string) =>
  RULES.filter(r => !r.test(password)).map(r => r.message);

export const isStrongPassword = (password: string) => passwordIssues(password).length === 0;

/** Nivel del medidor visual (0-4). */
export const getPasswordScore = (password: string) => {
  if (!password) return 0;
  if (password.length < 8) return 1;
  const checks = [/[A-Z]/, /[a-z]/, /[0-9]/, /[!@#$%^&*]/].filter(r => r.test(password)).length;
  if (checks < 4) return checks <= 2 ? 2 : 3;
  return 4;
};

/** Texto que acompaña al medidor. */
export const getPasswordStrengthLabel = (password: string) => {
  if (password.length < 8) return 'Muy corta (mínimo 8 caracteres)';
  if (!isStrongPassword(password)) return 'Débil: debe incluir mayúscula, minúscula, número y símbolo';
  return 'Segura ✅';
};
