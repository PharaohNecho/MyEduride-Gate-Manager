export function normalizeArrivalStatus(arrival: any): string | null {
  if (!arrival) return null;
  const status = arrival.status;
  if (status === 'on_time' || status === 'present') return 'on_time';
  if (status === 'late') return 'late';
  return 'on_time';
}
