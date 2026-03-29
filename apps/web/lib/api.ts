const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const SERVER_API_BASE_URL =
  process.env.INTERNAL_API_URL ??
  (process.env.NEXT_PUBLIC_API_URL?.startsWith("http")
    ? process.env.NEXT_PUBLIC_API_URL
    : undefined) ??
  "http://localhost:4000/api";

const getApiGetBaseUrl = () =>
  typeof window === "undefined" ? SERVER_API_BASE_URL : API_BASE_URL;

export async function apiGet<T>(
  path: string,
  includeCredentials = false
): Promise<T> {
  const response = await fetch(`${getApiGetBaseUrl()}${path}`, {
    cache: "no-store",
    credentials: includeCredentials ? "include" : "same-origin"
  });

  if (!response.ok) {
    throw new Error(`API_GET_FAILED:${path}`);
  }

  return response.json() as Promise<T>;
}

export async function apiWrite<T = any>(
  path: string,
  options: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`API_WRITE_FAILED:${path}`);
  }

  return response.json() as Promise<T>;
}
