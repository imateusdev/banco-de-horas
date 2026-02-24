import { timeUtils } from '@/lib/calculations';
import { AccumulatedHours } from '@/types';

export interface ConversionFormData {
  hours: string;
  amount: string;
  type: 'money' | 'time_off';
}

export function validateConversionForm(
  formData: ConversionFormData,
  accumulatedHours: AccumulatedHours | null
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!formData.hours || parseFloat(formData.hours) <= 0) {
    errors.hours = 'Quantidade de horas deve ser maior que zero';
  } else if (accumulatedHours && parseFloat(formData.hours) > accumulatedHours.availableHours) {
    errors.hours = `Máximo disponível: ${timeUtils.formatHours(accumulatedHours.availableHours)}`;
  }

  if (formData.type === 'money' && (!formData.amount || parseFloat(formData.amount) <= 0)) {
    errors.amount = 'Valor em dinheiro deve ser maior que zero';
  }

  return errors;
}
