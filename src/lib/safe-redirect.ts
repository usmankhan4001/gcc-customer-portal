// Client-safe (no Node imports). Accept only same-origin relative paths: "/x", never "//host", "/\host" or a scheme.
export function safeRedirectPath(path: string | null | undefined, fallback = '/dashboard'): string {
  if (!path || !path.startsWith('/') || path.startsWith('//') || /[\\\u0000-\u001f]/.test(path)) return fallback;
  return path;
}
