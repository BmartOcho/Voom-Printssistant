export function getQueryParam(name: string): string | null {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

export function getQueryParamOr(name: string, fallback: string): string {
  return getQueryParam(name) ?? fallback;
}
