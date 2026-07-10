import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, type ErrorCode } from "./errors";
import { logger } from "@/lib/logger";

// Consistent API envelope (TRD §7.1): { data | error, meta: { requestId, pagination } }

export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ApiEnvelope<T> = {
  data: T | null;
  error: { code: ErrorCode; message: string; details?: unknown } | null;
  meta: { requestId: string; pagination?: Pagination };
};

function requestId(): string {
  return `req_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function ok<T>(data: T, init?: { status?: number; pagination?: Pagination }) {
  const body: ApiEnvelope<T> = {
    data,
    error: null,
    meta: { requestId: requestId(), pagination: init?.pagination },
  };
  return NextResponse.json(body, { status: init?.status ?? 200 });
}

export function fail(error: unknown) {
  const rid = requestId();

  if (error instanceof ZodError) {
    const details = error.flatten();
    return NextResponse.json(
      { data: null, error: { code: "validation_error", message: "Validation failed.", details }, meta: { requestId: rid } },
      { status: 422 },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      { data: null, error: { code: error.code, message: error.message, details: error.details }, meta: { requestId: rid } },
      { status: error.status },
    );
  }

  logger.error("Unhandled API error", { requestId: rid, error: String(error) });
  return NextResponse.json(
    { data: null, error: { code: "internal_error", message: "Something went wrong." }, meta: { requestId: rid } },
    { status: 500 },
  );
}

/** Wrap a route handler with unified error handling. */
export function handler<Args extends unknown[]>(
  fn: (...args: Args) => Promise<NextResponse>,
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (err) {
      return fail(err);
    }
  };
}

export function paginate(total: number, page: number, pageSize: number): Pagination {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function pageParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "25", 10) || 25));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
