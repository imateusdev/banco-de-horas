export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const WEEKDAY_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  return `${MONTH_NAMES[parseInt(month) - 1]} ${year}`;
}

export function getWeekdayName(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return WEEKDAY_NAMES[date.getDay()];
}

export function formatDateWithWeekday(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return `${date.toLocaleDateString('pt-BR')} - ${WEEKDAY_NAMES[date.getDay()]}`;
}
