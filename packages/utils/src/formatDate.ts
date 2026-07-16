/** Format a date using the Intl API (defaults to en-US). */
export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, options).format(date);
}
