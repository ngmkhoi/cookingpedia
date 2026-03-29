const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const SERVER_API_BASE_URL =
  process.env.INTERNAL_API_URL ??
  (process.env.NEXT_PUBLIC_API_URL?.startsWith("http")
    ? process.env.NEXT_PUBLIC_API_URL
    : undefined) ??
  "http://localhost:4000/api";

const getApiGetBaseUrl = () =>
  typeof window === "undefined" ? SERVER_API_BASE_URL : API_BASE_URL;

export type ApiIssueDetails = {
  path: Array<string | number>;
  message: string;
};

export type ApiError = Error & {
  status: number;
  fieldErrors?: Record<string, string>;
  issues?: {
    formErrors: string[];
    fieldErrors: Record<string, string[]>;
  };
  issueDetails?: ApiIssueDetails[];
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toFieldErrors = (value: unknown) => {
  if (!isObject(value)) {
    return undefined;
  }

  const entries = Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string");
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const toIssues = (value: unknown) => {
  if (!isObject(value)) {
    return undefined;
  }

  const formErrors = Array.isArray(value.formErrors)
    ? value.formErrors.filter((item): item is string => typeof item === "string")
    : [];
  const fieldErrors =
    isObject(value.fieldErrors)
      ? Object.fromEntries(
          Object.entries(value.fieldErrors)
            .filter((entry) => Array.isArray(entry[1]))
            .map(([key, messages]) => [
              key,
              (messages as unknown[]).filter((message): message is string => typeof message === "string")
            ])
        )
      : {};

  return { formErrors, fieldErrors };
};

const toIssueDetails = (value: unknown) => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const issueDetails = value.filter((item): item is ApiIssueDetails => {
    return (
      isObject(item) &&
      Array.isArray(item.path) &&
      item.path.every((segment) => typeof segment === "string" || typeof segment === "number") &&
      typeof item.message === "string"
    );
  });

  return issueDetails.length > 0 ? issueDetails : undefined;
};

const toApiError = (response: Response, payload: unknown): ApiError => {
  const message =
    isObject(payload) && typeof payload.message === "string"
      ? payload.message
      : `REQUEST_FAILED:${response.status}`;
  const error = new Error(message) as ApiError;

  error.status = response.status;
  error.fieldErrors = isObject(payload) ? toFieldErrors(payload.fieldErrors) : undefined;
  error.issues = isObject(payload) ? toIssues(payload.issues) : undefined;
  error.issueDetails = isObject(payload) ? toIssueDetails(payload.issueDetails) : undefined;

  return error;
};

const readResponsePayload = async (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined;
  }

  try {
    return await response.json();
  } catch {
    return undefined;
  }
};

export const isApiError = (error: unknown): error is ApiError => {
  if (!error || typeof error !== "object") {
    return false;
  }

  return (
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  );
};

export async function apiGet<T>(
  path: string,
  includeCredentials = false
): Promise<T> {
  const response = await fetch(`${getApiGetBaseUrl()}${path}`, {
    cache: "no-store",
    credentials: includeCredentials ? "include" : "same-origin"
  });

  if (!response.ok) {
    throw toApiError(response, await readResponsePayload(response));
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
    throw toApiError(response, await readResponsePayload(response));
  }

  return response.json() as Promise<T>;
}
