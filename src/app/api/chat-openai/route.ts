import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { StatusCodes } from "http-status-codes";
import { headers } from "next/headers";
import { chatInputSchema } from "@/app/api/chat-openai/schema";
import { ApiErrorResponse } from "@/lib/types/api-types";
import { API_STATUSES } from "@/lib/types/api-types";
import OpenAI from "openai";
import { serverEnv } from "@/env/server";

export async function POST(
  req: NextRequest,
): Promise<Response | NextResponse<ApiErrorResponse>> {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    return NextResponse.json({
      errorCode: StatusCodes.UNAUTHORIZED,
      errorMessage: "Unauthorized",
      status: API_STATUSES.ERROR,
      timestamp: new Date().toISOString(),
    });
  }

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

  const reqData = parseReqBody.data;

  const openai = new OpenAI();

  try {
    const responseStream = await openai.responses.create({
      model: serverEnv.OPENAI_DEFAULT_MODEL,
      stream: true,
      ...reqData,
    });

    return new Response(responseStream.toReadableStream(), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return NextResponse.json({
      errorCode: StatusCodes.INTERNAL_SERVER_ERROR,
      errorMessage:
        error instanceof Error ? error.message : "Unknown error occurred",
      status: API_STATUSES.ERROR,
      timestamp: new Date().toISOString(),
    });
  }
}
