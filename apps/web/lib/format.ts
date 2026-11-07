export type FormatValues = Record<string, string | number>;

/**
 * Replaces `{name}` placeholders in a message. Keeps dictionaries plain
 * serializable strings so they can cross the server/client boundary.
 */
export function format(template: string, values: FormatValues): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
