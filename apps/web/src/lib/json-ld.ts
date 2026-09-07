const SCRIPT_UNSAFE_CHARACTERS = /[<>&\u2028\u2029]/g
const JSON_ESCAPE_MAP: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
}

/** Serializes JSON for an inline script without allowing data to terminate the script. */
export function serializeJsonLd(value: unknown): string {
  const json = JSON.stringify(value) ?? 'null'
  return json.replace(SCRIPT_UNSAFE_CHARACTERS, (character) => JSON_ESCAPE_MAP[character])
}
