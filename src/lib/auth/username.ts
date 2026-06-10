export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  if (!username) return false;
  // Usernames are simple alphanumeric strings with optionally dots, dashes or underscores,
  // or simple emails.
  const regex = /^[a-zA-Z0-9._%+-]+(@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})?$/;
  return regex.test(username);
}

export function authEmailFromUsername(username: string): string {
  if (username.includes('@')) {
    return username.toLowerCase().trim();
  }
  return `${username.toLowerCase().trim()}@myeduride.com`;
}
