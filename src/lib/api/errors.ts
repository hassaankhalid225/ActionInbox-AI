// Typed application errors mapped to HTTP status codes.

export type ErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation_error"
  | "conflict"
  | "rate_limited"
  | "usage_limit"
  | "bad_request"
  | "internal_error";

const STATUS: Record<ErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  validation_error: 422,
  conflict: 409,
  rate_limited: 429,
  usage_limit: 402,
  bad_request: 400,
  internal_error: 500,
};

export class AppError extends Error {
  code: ErrorCode;
  status: number;
  details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS[code];
    this.details = details;
  }
}

export const Errors = {
  unauthorized: (m = "You must be signed in.") => new AppError("unauthorized", m),
  forbidden: (m = "You do not have permission to do that.") => new AppError("forbidden", m),
  notFound: (m = "Resource not found.") => new AppError("not_found", m),
  validation: (m = "Validation failed.", details?: unknown) => new AppError("validation_error", m, details),
  conflict: (m = "This conflicts with an existing record.") => new AppError("conflict", m),
  rateLimited: (m = "Too many requests. Please slow down.") => new AppError("rate_limited", m),
  usageLimit: (m = "Your plan limit has been reached.") => new AppError("usage_limit", m),
  badRequest: (m = "Bad request.") => new AppError("bad_request", m),
  internal: (m = "Something went wrong.") => new AppError("internal_error", m),
};
