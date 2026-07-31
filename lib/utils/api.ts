import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function fail(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
) {
  const body: ApiError = { error: { code, message, details } };
  return NextResponse.json(body, { status });
}

export function unauthorized(message = "Authentication required") {
  return fail("unauthorized", message, 401);
}

export function forbidden(message = "You do not have access to this resource") {
  return fail("forbidden", message, 403);
}

export function notFound(message = "Resource not found") {
  return fail("not_found", message, 404);
}

export function tooManyRequests(message = "Too many requests, slow down") {
  return fail("rate_limited", message, 429);
}

/**
 * Wrap a route handler so thrown ZodErrors and unexpected errors become
 * structured JSON instead of leaking stack traces.
 */
export function handleUnknownError(err: unknown) {
  if (err instanceof ZodError) {
    return fail("validation_error", "Invalid request payload", 422, err.flatten());
  }
  if (err instanceof Error && err.name === "PaperNotFoundError") {
    return notFound(err.message || "Paper not found");
  }
  if (err instanceof Error && err.message === "Paper not found") {
    return notFound("Paper not found");
  }
  if (err instanceof Error) {
    // eslint-disable-next-line no-console
    console.error("[api]", err.message);
    return fail("internal_error", "Something went wrong", 500);
  }
  return fail("internal_error", "Something went wrong", 500);
}
