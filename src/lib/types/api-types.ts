import { StatusCodes } from "http-status-codes";

type ApiStatus = {
  SUCCESS: "success";
  ERROR: "error";
};

type ApiSuccessResponse<T> = {
  status: ApiStatus["SUCCESS"];
  response: T;
  timestamp?: string;
};

type ApiErrorResponse = {
  status: ApiStatus["ERROR"];
  errorCode: StatusCodes;
  errorMessage: string;
  timestamp?: string;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
