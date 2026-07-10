"use client";

import type { ApiEnvelope } from "./response";

export class ApiError extends Error {
  code: string;
  details?: unknown;
  status: number;
  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  });

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await res.json()) as ApiEnvelope<T>;
  } catch {
    // non-JSON response
  }

  if (!res.ok || payload?.error) {
    const err = payload?.error;
    throw new ApiError(err?.message ?? `Request failed (${res.status})`, err?.code ?? "internal_error", res.status, err?.details);
  }
  return (payload?.data as T) ?? (null as T);
}

export const api = {
  get: <T>(url: string) => request<T>("GET", url),
  post: <T>(url: string, body?: unknown) => request<T>("POST", url, body),
  put: <T>(url: string, body?: unknown) => request<T>("PUT", url, body),
  patch: <T>(url: string, body?: unknown) => request<T>("PATCH", url, body),
  del: <T>(url: string, body?: unknown) => request<T>("DELETE", url, body),
};
