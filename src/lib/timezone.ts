export function todayInLagos(): string {
  // Lagos is in West Africa Time (UTC+1). Shift UTC time by 1 hour to get local Lagos date.
  const d = new Date();
  const lagosTime = new Date(d.getTime() + 1 * 60 * 60 * 1000);
  return lagosTime.toISOString().split('T')[0];
}

export function lagosDayBounds(): { startIso: string; endIso: string } {
  // Get today's local date in Lagos
  const dateStr = todayInLagos();
  
  // 00:00:00 WAT is 23:00:00 UTC of previous day.
  const startLocal = new Date(`${dateStr}T00:00:00.000Z`);
  const startUtc = new Date(startLocal.getTime() - 1 * 60 * 60 * 1000);
  
  // 23:59:59.999 WAT is 22:59:59.999 UTC.
  const endLocal = new Date(`${dateStr}T23:59:59.999Z`);
  const endUtc = new Date(endLocal.getTime() - 1 * 60 * 60 * 1000);

  return {
    startIso: startUtc.toISOString(),
    endIso: endUtc.toISOString(),
  };
}

export function formatTimeLagos(isoOrTimestamp: string): string {
  if (!isoOrTimestamp) return '';
  const d = new Date(isoOrTimestamp);
  const lagos = new Date(d.getTime() + 1 * 60 * 60 * 1000);
  const hours = String(lagos.getUTCHours()).padStart(2, '0');
  const minutes = String(lagos.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDateLagos(isoOrTimestamp: string): string {
  if (!isoOrTimestamp) return '';
  const d = new Date(isoOrTimestamp);
  const lagos = new Date(d.getTime() + 1 * 60 * 60 * 1000);
  return lagos.toISOString().split('T')[0];
}
