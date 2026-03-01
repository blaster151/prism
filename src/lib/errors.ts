export type ErrorEnvelope = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export class AppError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;
  public readonly details?: Record<string, unknown>;

  constructor(args: {
    code: string;
    message: string;
    httpStatus: number;
    details?: Record<string, unknown>;
  }) {
    super(args.message);
    this.code = args.code;
    this.httpStatus = args.httpStatus;
    this.details = args.details;
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

