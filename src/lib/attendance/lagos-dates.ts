export function timestampToLagosDateKey(timestamp: string): string {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const lagos = new Date(d.getTime() + 1 * 60 * 60 * 1000);
  return lagos.toISOString().split('T')[0];
}

export function lagosDayBoundsFromDateStr(dateStr: string): { startIso: string; endIso: string } {
  const startLoc = new Date(`${dateStr}T00:00:00.000Z`);
  const startUtc = new Date(startLoc.getTime() - 1 * 60 * 60 * 1000);

  const endLoc = new Date(`${dateStr}T23:59:59.999Z`);
  const endUtc = new Date(endLoc.getTime() - 1 * 60 * 60 * 1000);

  return {
    startIso: startUtc.toISOString(),
    endIso: endUtc.toISOString(),
  };
}

export function lagosDateStringsInRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  const curr = new Date(`${startDateStr}T12:00:00.000Z`);
  const end = new Date(`${endDateStr}T12:00:00.000Z`);
  
  while (curr <= end) {
    dates.push(curr.toISOString().split('T')[0]);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

export function resolveLagosReportRange(
  reportType: string,
  dateParam: string
): {
  startDateStr: string;
  endDateStr: string;
  rangeStartIso: string;
  rangeEndIso: string;
} {
  let startDateStr = dateParam;
  let endDateStr = dateParam;

  if (reportType === 'weekly') {
    const date = new Date(`${dateParam}T12:00:00.000Z`);
    const day = date.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    
    const monday = new Date(date);
    monday.setDate(date.getDate() + diffToMonday);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    startDateStr = monday.toISOString().split('T')[0];
    endDateStr = sunday.toISOString().split('T')[0];
  } else if (reportType === 'monthly') {
    const parts = dateParam.split('-').map(Number);
    const yr = parts[0];
    const mo = parts[1];

    const firstDay = new Date(Date.UTC(yr, mo - 1, 1, 12, 0, 0));
    const lastDay = new Date(Date.UTC(yr, mo, 0, 12, 0, 0));

    startDateStr = firstDay.toISOString().split('T')[0];
    endDateStr = lastDay.toISOString().split('T')[0];
  } else if (reportType === 'history' || reportType === 'all') {
    // Start of the calendar year to capture full database history
    startDateStr = `${new Date(dateParam).getFullYear()}-01-01`;
    endDateStr = dateParam;
  }

  const { startIso: rangeStartIso } = lagosDayBoundsFromDateStr(startDateStr);
  const { endIso: rangeEndIso } = lagosDayBoundsFromDateStr(endDateStr);

  return {
    startDateStr,
    endDateStr,
    rangeStartIso,
    rangeEndIso,
  };
}
