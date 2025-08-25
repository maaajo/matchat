import { StatusCodes } from "http-status-codes";

export const API_STATUSES = {
  SUCCESS: "success",
  ERROR: "error",
} as const;

type ApiSuccessResponse<T> = {
  status: typeof API_STATUSES.SUCCESS;
  response: T;
  timestamp?: string;
};

type ApiErrorResponse = {
  status: typeof API_STATUSES.ERROR;
  errorCode: StatusCodes;
  errorMessage: string;
  timestamp?: string;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
