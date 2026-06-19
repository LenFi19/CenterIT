import { NextResponse } from "next/server";

type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
};

export function createErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, string>,
) {
  const payload: ApiErrorPayload = {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };

  return NextResponse.json(payload, { status });
}
