/**
 * Validação e sanitização de dados de entrada
 */

export function validateDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

export function validateTime(timeStr: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr);
}

export function validateRecordType(type: string): type is 'work' | 'overtime' {
  return type === 'work' || type === 'overtime';
}

export function sanitizeString(str: any, maxLength: number = 255): string {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
}

export function validateNumber(num: any, min: number = 0, max: number = 24): number {
  const parsed = Number(num);
  if (isNaN(parsed)) return 0;
  return Math.max(min, Math.min(max, parsed));
}

export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function validateRole(role: string): role is 'admin' | 'collaborator' {
  return role === 'admin' || role === 'collaborator';
}

export function validateConversionType(type: string): type is 'money' | 'time_off' {
  return type === 'money' || type === 'time_off';
}

export function validateMonth(month: string): boolean {
  const regex = /^\d{4}-\d{2}$/;
  return regex.test(month);
}

export function validateWorkingDays(
  workingDays: string
): workingDays is 'weekdays' | 'all' | 'weekends' {
  return workingDays === 'weekdays' || workingDays === 'all' || workingDays === 'weekends';
}
