export interface DeadlineRow {
  requirement: string;
  deadlineLabel: string;
  status: 'Pending' | 'Upcoming' | 'Action Required';
}

/** Adds months in UTC, clamping to the last day of the target month (Jan 31 + 1 = Feb 28/29). Invalid input returns an Invalid Date. */
export function addMonths(d: Date, months: number): Date {
  if (Number.isNaN(d.getTime())) return new Date(NaN);
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d.getUTCDate(), lastDay));
  return target;
}

export function computeDeadlines(formation: Date): DeadlineRow[] {
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const vatRegDeadline = addMonths(formation, 1);
  const ctRegDeadline = addMonths(formation, 3);
  const finYearEnd = addMonths(formation, 12);
  const ctFilingDeadline = addMonths(finYearEnd, 9);
  const esrDeadline = addMonths(finYearEnd, 12);

  return [
    { requirement: 'Mandatory/Voluntary VAT Registration', deadlineLabel: fmt(vatRegDeadline), status: 'Upcoming' },
    { requirement: 'Corporate Tax (EmaraTax) Registration', deadlineLabel: fmt(ctRegDeadline), status: 'Action Required' },
    { requirement: 'First Financial Year End', deadlineLabel: fmt(finYearEnd), status: 'Pending' },
    { requirement: 'First Corporate Tax Return & Payment (9 Months Post-FYE)', deadlineLabel: fmt(ctFilingDeadline), status: 'Pending' },
    { requirement: 'Economic Substance Regulations (ESR) Annual Notification', deadlineLabel: fmt(esrDeadline), status: 'Pending' },
    { requirement: 'Trade License & Establishment Card Annual Renewal', deadlineLabel: fmt(finYearEnd), status: 'Upcoming' },
  ];
}
