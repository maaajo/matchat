import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { StatusCodes } from "http-status-codes";
import { headers } from "next/headers";
import { chatInputSchema, ChatInput } from "@/app/api/chat-openai/schema";
import { ApiResponse } from "@/lib/types/api-types";
import { API_STATUSES } from "@/lib/types/api-types";
import OpenAI from "openai";
import { serverEnv } from "@/env/server";

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<any>>> {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  // if (!session) {
  //   return NextResponse.json({
  //     errorCode: StatusCodes.UNAUTHORIZED,
  //     errorMessage: "Unauthorized",
  //     status: API_STATUSES.ERROR,
  //     timestamp: new Date().toISOString(),
  //   });
  // }

  const reqBody = await req.json();

  if (!reqBody) {
    return NextResponse.json({
      errorCode: StatusCodes.BAD_REQUEST,
      errorMessage: "Missing body",
      status: API_STATUSES.ERROR,
      timestamp: new Date().toISOString(),
    });
  }

  const parseReqBody = await chatInputSchema.safeParseAsync(reqBody);

  if (!parseReqBody.success) {
    return NextResponse.json({
      errorCode: StatusCodes.BAD_REQUEST,
      errorMessage: parseReqBody.error.toString(),
      status: API_STATUSES.ERROR,
      timestamp: new Date().toISOString(),
    });
  }

  // Successfully parsed request body as ChatInput schema
  const reqData = parseReqBody.data;

  const openai = new OpenAI();

  const response = await openai.responses.create({
    model: serverEnv.OPENAI_DEFAULT_MODEL,
    stream: true,
    ...reqData,
  });

  console.log(response);
}
