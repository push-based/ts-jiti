/**
 * Formats a duration in milliseconds to a human-readable string
 * @param durationMs Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return `${Math.round(durationMs)}ms`;
  }

  const seconds = durationMs / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
}

/**
 * Indents each line of a string by a specified number of spaces
 * @param text The text to indent
 * @param spaces Number of spaces to indent
 * @returns Indented text
 */
export function indentLines(text: string, spaces: number): string {
  const indent = ' '.repeat(spaces);
  return text
    .split('\n')
    .map(line => (line ? indent + line : line))
    .join('\n');
}

/**
 * Transforms each line of a string using a provided function
 * @param text The text to transform
 * @param transformFn Function to apply to each line
 * @returns Transformed text
 */
export function transformLines(
  text: string,
  transformFn: (line: string) => string,
): string {
  return text.split('\n').map(transformFn).join('\n');
}

/**
 * Unicode ellipsis character
 */
export const UNICODE_ELLIPSIS = '…';

/**
 * Truncates multiline text to a single line with ellipsis
 * @param text The multiline text to truncate
 * @returns Single line truncated text
 */
export function truncateMultilineText(text: string): string {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    return '';
  }
  if (lines.length === 1) {
    return lines[0];
  }
  return `${lines[0]} ${UNICODE_ELLIPSIS}`;
}
