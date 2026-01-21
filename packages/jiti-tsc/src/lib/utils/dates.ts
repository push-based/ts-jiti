/**
 * Converts a Date object to a Unix timestamp (seconds since epoch)
 * @param date The date to convert
 * @returns Unix timestamp in seconds
 */
export function dateToUnixTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}
